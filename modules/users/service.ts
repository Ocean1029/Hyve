// modules/users/service.ts
import { getUserWithPosts } from './repository';
import { Post } from '@/lib/types';
import prisma from '@/lib/prisma';

export const getMyProfileService = async (userId: string) => {
  const user = await getUserWithPosts(userId);
  
  if (!user) return null;

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get statistics
  const [totalFriends, totalSessions, totalMinutes, todayMinutes, totalFocusHours, topFriend] = await Promise.all([
    // Count friends for the current user
    prisma.friend.count({
      where: { sourceUserId: userId },
    }),
    prisma.focusSession.count({
      where: { userId },
    }),
    prisma.focusSession.aggregate({
      where: { userId },
      _sum: { durationMinutes: true },
    }),
    prisma.focusSession.aggregate({
      where: {
        userId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: { durationMinutes: true },
    }),
    // Calculate total focus hours by summing all friends' totalHours
    prisma.friend.aggregate({
      where: { sourceUserId: userId },
      _sum: { totalHours: true },
    }),
    // Find best buddy based on totalHours from Friend model
    prisma.friend.findFirst({
      where: { sourceUserId: userId },
      orderBy: { totalHours: 'desc' },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    }).then((friend: { user: { name: string | null } } | null) => {
      // Return the friend's name from the related user
      return friend?.user?.name || null;
    }),
  ]);

  const posts: Post[] = user.posts.map((p: any) => ({
    id: p.id,
    imageUrl: p.photoUrl || p.imageUrl || '',
    caption: p.caption || '',
  }));

  return {
    ...user,
    posts,
    stats: {
      totalFriends,
      totalHours: Math.floor(totalFocusHours._sum.totalHours || 0),
      totalMinutes: totalMinutes._sum.durationMinutes || 0,
      todayMinutes: todayMinutes._sum.durationMinutes || 0,
      topBuddy: topFriend,
    },
  };
};

