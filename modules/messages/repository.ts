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


