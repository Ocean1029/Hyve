// modules/search/service.ts
import prisma from '@/lib/prisma';
import { getUserFriendCount } from '@/modules/friends/repository';

export async function searchUsersService(currentUserId: string | undefined, query: string) {
  if (!query || query.trim().length === 0) {
    return { success: true, users: [] };
  }
  const searchQuery = query.trim();
  const users = await prisma.user.findMany({
    where: {
      ...(currentUserId && { id: { not: currentUserId } }),
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' } },
        { userId: { contains: searchQuery, mode: 'insensitive' } },
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: { select: { focusSessionsAsUser: true } },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
  type UserRow = (typeof users)[number];
  const usersWithFriendCount = await Promise.all(
    users.map(async (u: UserRow) => ({
      ...u,
      friendCount: await getUserFriendCount(u.id),
    }))
  );
  return { success: true, users: usersWithFriendCount };
}

export async function searchFriendsService(query: string) {
  if (!query || query.trim().length === 0) {
    return { success: true, friends: [] };
  }
  const searchQuery = query.trim();
  const friends = await prisma.friend.findMany({
    where: {
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' } },
        { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
      ],
    },
    include: {
      user: {
        select: { id: true, userId: true, name: true, email: true, image: true },
      },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
  return { success: true, friends };
}

export async function getRecommendedUsersService(currentUserId: string) {
  const existingFriends = await prisma.friend.findMany({
    where: { sourceUserId: currentUserId },
    select: { userId: true },
  });
  const existingFriendIds = existingFriends.map((f: { userId: string }) => f.userId);
  const excludedUserIds = [...existingFriendIds, currentUserId];

  type UserWithCounts = {
    id: string;
    userId: string | null;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: Date;
    _count: { focusSessionsAsUser: number };
  };

  const allUsers = await prisma.user.findMany({
    where: { id: { notIn: excludedUserIds } },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: { select: { focusSessionsAsUser: true } },
    },
  }) as UserWithCounts[];

  type UserWithScore = UserWithCounts & { activityScore: number };
  const usersWithScore: UserWithScore[] = allUsers.map((u) => ({
    ...u,
    activityScore: u._count.focusSessionsAsUser || 0,
  }));
  usersWithScore.sort((a, b) => {
    if (b.activityScore !== a.activityScore) return b.activityScore - a.activityScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activeUsers = usersWithScore.slice(0, 12).map(({ activityScore, ...user }) => user);
  const remaining = usersWithScore.slice(12).sort(() => Math.random() - 0.5);
  const randomUsers = remaining
    .slice(0, Math.max(0, 15 - activeUsers.length))
    .map(({ activityScore, ...user }) => user);
  const combined = [...activeUsers, ...randomUsers].slice(0, 15);

  const withFriendCount = await Promise.all(
    combined.map(async (u) => ({
      ...u,
      friendCount: await getUserFriendCount(u.id),
    }))
  );
  return { success: true, users: withFriendCount };
}
