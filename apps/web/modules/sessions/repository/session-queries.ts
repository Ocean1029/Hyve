// modules/sessions/repository/session-queries.ts
import prisma from '@/lib/prisma';
import type { GetUserSessionsOptions } from '@hyve/types';

export type { GetUserSessionsOptions };

/**
 * Unified function to get focus sessions for a user with various filtering options
 */
export const getUserSessions = async (options: GetUserSessionsOptions) => {
  const {
    userId,
    userIds,
    userMatchMode = 'some',
    startDate,
    endDate,
    endTimeMin,
    limit,
    orderBy = 'desc',
    includeMemories = false,
    status,
  } = options;

  // Build where clause
  const where: any = {};
  
  // Handle user filtering
  if (userIds && userIds.length > 0) {
    // Multiple user IDs with match mode
    if (userMatchMode === 'every') {
      where.users = {
        every: {
          userId: {
            in: userIds,
          },
        },
      };
    } else {
      where.users = {
        some: {
          userId: {
            in: userIds,
          },
        },
      };
    }
  } else {
    // Single user ID (default behavior)
    where.users = {
      some: {
        userId: userId,
      },
    };
  }

  // Add status filter if provided
  if (status) {
    where.status = status;
  }

  // Add date range filters if provided
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) {
      where.startTime.gte = startDate;
    }
    if (endDate) {
      where.startTime.lt = endDate;
    }
  }

  // Add endTime filter if provided (for filtering completed sessions)
  if (endTimeMin) {
    where.endTime = {
      gte: endTimeMin,
    };
  }

  // Build include clause
  const include: any = {
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
  };

  // Conditionally include memories
  if (includeMemories) {
    include.memories = {
      include: {
        photos: true,
      },
    };
  }

  // Build query options
  const queryOptions: any = {
    where,
    orderBy: { startTime: orderBy },
    include,
  };

  // Add limit if provided
  if (limit !== undefined) {
    queryOptions.take = limit;
  }

  return await prisma.focusSession.findMany(queryOptions);
};


/**
 * Get active focus sessions for a user
 */
export const getActiveSessions = async (userId: string) => {
  return await getUserSessions({
    userId,
    status: 'active',
    orderBy: 'desc',
    includeMemories: true,
  });
};

/**
 * Get session by ID
 */
export const getSessionById = async (sessionId: string) => {
  return await prisma.focusSession.findUnique({
    where: { id: sessionId },
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
 * Get active sessions for stream (includes recently completed sessions)
 */
export const getActiveSessionsForStream = async (userId: string) => {
  // Get active sessions
  const activeSessions = await getUserSessions({
    userId,
    status: 'active',
    includeMemories: false,
  });

  // Get recently completed sessions (within last minute)
  const recentlyCompletedSessions = await getUserSessions({
    userId,
    status: 'completed',
    endTimeMin: new Date(Date.now() - 60000), // Last minute
    limit: 5,
    includeMemories: false,
  });

  return [...activeSessions, ...recentlyCompletedSessions];
};

/**
 * Find an active focus session that contains specific users
 * Used to prevent duplicate session creation
 */
export const getActiveSessionsByUsers = async (userIds: string[]): Promise<any | null> => {
  if (userIds.length === 0) {
    return null;
  }

  // Find sessions where all specified users are participants
  const sessions = await getUserSessions({
    userId: userIds[0], // Required but not used when userIds is provided
    userIds,
    userMatchMode: 'every',
    status: 'active',
    includeMemories: false,
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
