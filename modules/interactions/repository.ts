import prisma from '@/lib/prisma';

export const createInteraction = async (
  friendId: string,
  type: string,
  content?: string
) => {
  return await prisma.interaction.create({
    data: {
      friendId,
      type,
      content,
      timestamp: new Date(),
    },
  });
};

export const getFriendInteractions = async (
  friendId: string,
  limit = 50
) => {
  return await prisma.interaction.findMany({
    where: { friendId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
};

export const getRecentInteractions = async (limit = 20) => {
  return await prisma.interaction.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      friend: true,
    },
  });
};



