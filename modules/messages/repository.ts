import prisma from '@/lib/prisma';

export const getMessages = async (friendId: string, limit = 50) => {
  return await prisma.message.findMany({
    where: { friendId },
    orderBy: { timestamp: 'asc' },
    take: limit,
  });
};

export const createMessage = async (
  friendId: string,
  senderId: string,
  content: string
) => {
  return await prisma.message.create({
    data: {
      friendId,
      senderId,
      content,
      timestamp: new Date(),
    },
  });
};

export const getRecentMessages = async (limit = 10) => {
  return await prisma.message.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      friend: true,
    },
  });
};

/**
 * Get all FocusSessions for a specific friend relationship
 * Includes memories and photos for each session
 * Note: friendId is the Friend record ID, we need to get the userId from Friend table
 */
export const getFocusSessionsByFriendId = async (friendId: string) => {
  // First get the friend record to find the userId
  const friend = await prisma.friend.findUnique({
    where: { id: friendId },
    select: { userId: true },
  });

  if (!friend) {
    return [];
  }

  // Get focus sessions where this user participated
  return await prisma.focusSession.findMany({
    where: {
      users: {
        some: {
          userId: friend.userId,
        },
      },
    },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      memories: {
        include: {
          photos: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};



