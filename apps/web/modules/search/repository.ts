import prisma from '@/lib/prisma';

/**
 * Search users by query (id, userId, name, email)
 * Excludes specified user IDs from results
 */
export async function searchUsersByQuery(
  query: string,
  excludeUserIds: string[] = []
) {
  const searchQuery = query.trim();
  if (!searchQuery) return [];

  return prisma.user.findMany({
    where: {
      ...(excludeUserIds.length > 0 && {
        id: { notIn: excludeUserIds },
      }),
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
}

/**
 * Search friends by query (friend id or user name)
 * Only returns friends where sourceUserId matches (current user's friends)
 */
export async function searchFriendsByQuery(
  query: string,
  sourceUserId: string
) {
  const searchQuery = query.trim();
  if (!searchQuery) return [];

  return prisma.friend.findMany({
    where: {
      sourceUserId,
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' } },
        {
          user: {
            name: { contains: searchQuery, mode: 'insensitive' },
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get user IDs that sourceUserId has added as friends
 */
export async function getFriendUserIds(sourceUserId: string): Promise<string[]> {
  const friends = await prisma.friend.findMany({
    where: { sourceUserId },
    select: { userId: true },
  });
  return friends.map((f: { userId: string }) => f.userId);
}

/**
 * Get users excluding specified IDs, with activity counts
 */
export async function getUsersExcluding(excludeUserIds: string[]) {
  return prisma.user.findMany({
    where: { id: { notIn: excludeUserIds } },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: { select: { focusSessionsAsUser: true } },
    },
  });
}
