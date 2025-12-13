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
  const [totalFriends, totalSessions, totalMinutes, todayMinutes, topFriend] = await Promise.all([
    prisma.friend.count(),
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
    prisma.focusSession.groupBy({
      by: ['friendId'],
      where: { userId },
      _count: { friendId: true },
      orderBy: { _count: { friendId: 'desc' } },
      take: 1,
    }).then(async (result: Array<{ friendId: string | null; _count: { friendId: number } }>) => {
      if (result.length > 0 && result[0].friendId) {
        const friend = await prisma.friend.findUnique({
          where: { id: result[0].friendId },
        });
        return friend?.name || null;
      }
      return null;
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
      totalHours: Math.floor((totalMinutes._sum.durationMinutes || 0) / 60),
      totalMinutes: totalMinutes._sum.durationMinutes || 0,
      todayMinutes: todayMinutes._sum.durationMinutes || 0,
      topBuddy: topFriend,
    },
  };
};

