// modules/sessions/repository.ts
import prisma from '@/lib/prisma';

export const getRecentFocusSessions = async (userId: string, startDate: Date) => {
  return await prisma.focusSession.findMany({
    where: {
      userId: userId,
      startTime: {
        gte: startDate,
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });
};

