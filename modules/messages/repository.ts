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
 */
export const getFocusSessionsByFriendId = async (friendId: string) => {
  return await prisma.focusSessionFriend.findMany({
    where: {
      friendId,
    },
    include: {
      focusSession: {
        include: {
          memories: {
            include: {
              photos: true,
            },
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};



