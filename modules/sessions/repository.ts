// modules/sessions/repository.ts
import prisma from '@/lib/prisma';

/**
 * Get recent focus sessions that a user participated in
 */
export const getRecentFocusSessions = async (userId: string, startDate: Date) => {
  return await prisma.focusSession.findMany({
    where: {
      users: {
        some: {
          userId: userId,
        },
      },
      startTime: {
        gte: startDate,
      },
    },
    orderBy: {
      startTime: 'asc',
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
    },
  });
};

/**
 * Find an active focus session that contains specific users
 * Used to prevent duplicate session creation
 */
export const findActiveSessionByUsers = async (userIds: string[]): Promise<any | null> => {
  if (userIds.length === 0) {
    return null;
  }

  // Find sessions where all specified users are participants
  const sessions = await prisma.focusSession.findMany({
    where: {
      status: 'active',
      users: {
        every: {
          userId: {
            in: userIds,
          },
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
    },
  });

  // Filter to find sessions that contain exactly the same set of users
  for (const session of sessions) {
    const sessionUserIds = session.users.map((u: any) => u.userId).sort();
    const targetUserIds = [...userIds].sort();
    
    if (
      sessionUserIds.length === targetUserIds.length &&
      sessionUserIds.every((id: string, index: number) => id === targetUserIds[index])
    ) {
      return session;
    }
  }

  return null;
};

/**
 * Create a focus session with multiple users
 */
export const createFocusSessionWithUsers = async (
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

