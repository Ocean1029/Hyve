import prisma from '@/lib/prisma';

/**
 * Create a new memory associated with a focus session
 */
export const createMemory = async (
  focusSessionId: string,
  userId: string,
  type: string,
  content?: string,
  location?: string,
  happyIndex?: number
) => {
  return await prisma.memory.create({
    data: {
      focusSessionId,
      userId,
      type,
      content,
      location,
      happyIndex,
      timestamp: new Date(),
    },
  });
};

/**
 * Get memories for a specific focus session
 * Optionally filter by userId to get only a specific user's memories
 */
export const getMemoriesByFocusSession = async (
  focusSessionId: string,
  limit = 50,
  userId?: string
) => {
  return await prisma.memory.findMany({
    where: {
      focusSessionId,
      ...(userId ? { userId } : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      photos: true,
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

/**
 * Get recent memories across all focus sessions
 */
export const getRecentMemories = async (limit = 20) => {
  return await prisma.memory.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      focusSession: {
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
      },
      photos: true,
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

/**
 * Get photos for a specific memory
 */
export const getMemoryPhotos = async (memoryId: string) => {
  return await prisma.photo.findMany({
    where: { memoryId },
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Get all memories for a specific user (from all their focus sessions)
 * Used for displaying user's vault
 */
export const getUserMemories = async (userId: string, limit = 50) => {
  return await prisma.memory.findMany({
    where: {
      userId: userId,
    },
    include: {
      photos: true,
      focusSession: {
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
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });
};

