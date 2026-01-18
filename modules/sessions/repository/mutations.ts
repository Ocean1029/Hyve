// modules/sessions/repository/mutations.ts
import prisma from '@/lib/prisma';

/**
 * Update session status
 */
export const updateSessionStatus = async (
  sessionId: string,
  status: string,
  endTime?: Date,
  minutes?: number
) => {
  const updateData: any = {
    status,
  };
  
  if (endTime !== undefined) {
    updateData.endTime = endTime;
  }
  
  if (minutes !== undefined) {
    updateData.minutes = minutes;
  }

  return await prisma.focusSession.update({
    where: { id: sessionId },
    data: updateData,
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
        },
      },
    },
  });
};

/**
 * Update session user pause status
 */
export const updateSessionUserPauseStatus = async (
  sessionUserId: string,
  isPaused: boolean
) => {
  return await prisma.focusSessionUser.update({
    where: {
      id: sessionUserId,
    },
    data: {
      isPaused,
      updatedAt: new Date(),
    },
  });
};

/**
 * Create a focus session with multiple users
 */
export const createSession = async (
  userIds: string[],
  startTime: Date,
  endTime: Date,
  minutes: number,
  status: string = 'active'
) => {
  return await prisma.$transaction(async (tx: any) => {
    // Create the focus session
    const focusSession = await tx.focusSession.create({
      data: {
        startTime,
        endTime,
        minutes,
        status,
      },
    });

    // Create FocusSessionUser records for each user
    if (userIds.length > 0) {
      await tx.focusSessionUser.createMany({
        data: userIds.map((userId) => ({
          focusSessionId: focusSession.id,
          userId,
        })),
      });
    }

    // Return session with users included
    return await tx.focusSession.findUnique({
      where: { id: focusSession.id },
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
      },
    });
  });
};
