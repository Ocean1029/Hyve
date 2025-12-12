// modules/sessions/repository.ts
import prisma from '@/lib/prisma';

export const getRecentFocusSessions = async (userId: string, startDate: Date) => {
  return await prisma.focusSession.findMany({
    where: {
      userId: userId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
};

