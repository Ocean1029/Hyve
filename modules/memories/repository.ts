import prisma from '@/lib/prisma';

/**
 * Create a new memory associated with a focus session
 */
export const createMemory = async (
  focusSessionId: string,
  type: string,
  content?: string,
  location?: string,
  happyIndex?: number
) => {
  return await prisma.memory.create({
    data: {
      focusSessionId,
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
 */
export const getMemoriesByFocusSession = async (
  focusSessionId: string,
  limit = 50
) => {
  return await prisma.memory.findMany({
    where: { focusSessionId },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      photos: true,
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
          friends: {
            include: {
              friend: true,
            },
          },
        },
      },
      photos: true,
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
      focusSession: {
        userId: userId,
      },
    },
    include: {
      photos: true,
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });
};

