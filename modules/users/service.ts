// modules/users/service.ts
import { getUserWithPosts } from './repository';
import { Memory } from '@/lib/types';
import prisma from '@/lib/prisma';
import { getUserMemories } from '@/modules/memories/repository';

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
    // Note: With bidirectional friend relationships, each friendship has two records:
    // - userId: friendId, sourceUserId: currentUserId (current user can see friend)
    // - userId: currentUserId, sourceUserId: friendId (friend can see current user)
    // We only count records where sourceUserId = currentUserId to get the current user's friend list
    prisma.friend.count({
      where: { sourceUserId: userId },
    }),
    prisma.focusSession.count({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
      },
    }),
    prisma.focusSession.aggregate({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
      },
      _sum: { minutes: true },
    }),
    prisma.focusSession.aggregate({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: { minutes: true },
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

  // Get user's memories for vault display
  const memories = await getUserMemories(userId, 50);
  
  // Transform memories to format suitable for vault display
  // Each memory uses its first photo as the display image
  const vaultMemories: Memory[] = memories.map((m: any) => ({
    id: m.id,
    type: m.type,
    content: m.content || '',
    timestamp: m.timestamp,
    focusSessionId: m.focusSessionId,
    photos: m.photos || [],
    location: m.location,
    happyIndex: m.happyIndex,
  }));

  return {
    ...user,
    memories: vaultMemories,
    stats: {
      totalFriends,
      totalHours: Math.floor(totalFocusHours._sum.totalHours || 0),
      totalMinutes: totalMinutes._sum.minutes || 0,
      todayMinutes: todayMinutes._sum.minutes || 0,
      topBuddy: topFriend,
    },
  };
};

