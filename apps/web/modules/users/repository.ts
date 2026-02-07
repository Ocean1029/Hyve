// modules/users/repository.ts
import prisma from '@/lib/prisma';

export const getUserWithPosts = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
};



