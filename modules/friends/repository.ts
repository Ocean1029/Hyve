// modules/friends/repository.ts
import prisma from '@/lib/prisma';

export const getFriendsWithDetails = async () => {
  return await prisma.friend.findMany({
    include: {
      interactions: true,
      posts: true,
    },
  });
};

