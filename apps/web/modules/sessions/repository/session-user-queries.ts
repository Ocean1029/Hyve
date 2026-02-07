// modules/sessions/repository/session-user-queries.ts
import prisma from '@/lib/prisma';

/**
 * Get session user record (user's participation in a session)
 */
export const getSessionUser = async (sessionId: string, userId: string) => {
  return await prisma.focusSessionUser.findUnique({
    where: {
      focusSessionId_userId: {
        focusSessionId: sessionId,
        userId: userId,
      },
    },
    include: {
      focusSession: true,
    },
  });
};

/**
 * Get all users in a session
 */
export const getSessionUsers = async (sessionId: string) => {
  return await prisma.focusSessionUser.findMany({
    where: {
      focusSessionId: sessionId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
};
