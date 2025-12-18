// modules/presence/repository.ts
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Update user's last seen timestamp and record heartbeat
 */
export const updateLastSeen = async (userId: string) => {
  const now = new Date();
  
  // Use transaction to ensure both operations succeed
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Update user's lastSeenAt
    await tx.user.update({
      where: { id: userId },
      data: { lastSeenAt: now },
    });
    
    // Record heartbeat in Heartbeat table
    await tx.heartbeat.create({
      data: {
        userId: userId,
        timestamp: now,
      },
    });
  });
};

/**
 * Get user's last seen timestamp
 */
export const getLastSeen = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastSeenAt: true },
  });
  return user?.lastSeenAt || null;
};

/**
 * Get online status for multiple users
 */
export const getUsersOnlineStatus = async (userIds: string[]) => {
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      lastSeenAt: true,
    },
  });

  return users.map((user: { id: string; lastSeenAt: Date | null }) => ({
    userId: user.id,
    lastSeenAt: user.lastSeenAt,
    isOnline: user.lastSeenAt 
      ? isUserOnline(user.lastSeenAt)
      : false,
  }));
};

/**
 * Get all friends' online status for a user
 */
export const getFriendsOnlineStatus = async (sourceUserId: string) => {
  // Get all friends of the user
  const friends = await prisma.friend.findMany({
    where: {
      sourceUserId: sourceUserId,
    },
    include: {
      user: {
        select: {
          id: true,
          lastSeenAt: true,
        },
      },
    },
  });

  return friends.map((friend: {
    id: string;
    userId: string;
    user: {
      id: string;
      lastSeenAt: Date | null;
    };
  }) => ({
    friendId: friend.id,
    userId: friend.userId,
    lastSeenAt: friend.user.lastSeenAt,
    isOnline: friend.user.lastSeenAt 
      ? isUserOnline(friend.user.lastSeenAt)
      : false,
  }));
};

/**
 * Get heartbeat history for a user
 */
export const getUserHeartbeats = async (
  userId: string,
  limit: number = 100,
  startDate?: Date,
  endDate?: Date
) => {
  const where: any = { userId };
  
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }
  
  return await prisma.heartbeat.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
};

/**
 * Get recent heartbeats for multiple users
 */
export const getUsersRecentHeartbeats = async (
  userIds: string[],
  since?: Date
) => {
  const where: any = {
    userId: { in: userIds },
  };
  
  if (since) {
    where.timestamp = { gte: since };
  }
  
  return await prisma.heartbeat.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  });
};

/**
 * Get heartbeat statistics for a user (count, first, last)
 */
export const getUserHeartbeatStats = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const where: any = { userId };
  
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }
  
  const [count, first, last] = await Promise.all([
    prisma.heartbeat.count({ where }),
    prisma.heartbeat.findFirst({
      where,
      orderBy: { timestamp: 'asc' },
    }),
    prisma.heartbeat.findFirst({
      where,
      orderBy: { timestamp: 'desc' },
    }),
  ]);
  
  return {
    count,
    first: first?.timestamp || null,
    last: last?.timestamp || null,
  };
};

/**
 * Check if user is online based on last seen time
 * User is considered online if last seen within 5 minutes
 * Returns false if lastSeenAt is null (user has never been seen)
 */
const ONLINE_THRESHOLD_MINUTES = 5;

export const isUserOnline = (lastSeenAt: Date | null): boolean => {
  // If lastSeenAt is null, user is considered offline
  if (!lastSeenAt) {
    return false;
  }
  
  const now = new Date();
  const diffMs = now.getTime() - lastSeenAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes <= ONLINE_THRESHOLD_MINUTES;
};


