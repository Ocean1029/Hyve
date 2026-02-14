import { Prisma } from '@prisma/client';
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
 * Get user memories with photos only (minimal fields for profile display)
 */
export const getUserMemoriesForProfile = async (userId: string, limit = 20) => {
  return await prisma.memory.findMany({
    where: { userId },
    include: { photos: true },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
};

/**
 * Get memories with happyIndex within date range (for weekly happy index chart)
 */
export const getMemoriesWithHappyIndexByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  return await prisma.memory.findMany({
    where: {
      userId,
      happyIndex: { not: null },
      timestamp: { gte: startDate, lte: endDate },
    },
    select: { timestamp: true, happyIndex: true },
  });
};

/**
 * Get peak happiness memories (highest happyIndex, with photos and focusSession)
 */
export const getPeakHappinessMemories = async (userId: string, limit = 5) => {
  return await prisma.memory.findMany({
    where: {
      userId,
      happyIndex: { not: null },
    },
    include: {
      photos: { select: { id: true, photoUrl: true } },
      focusSession: {
        include: {
          users: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      },
    },
    orderBy: { happyIndex: 'desc' },
    take: limit,
  });
};

/**
 * Create a photo for a memory
 */
export const createPhoto = async (memoryId: string, photoUrl: string) => {
  return await prisma.photo.create({
    data: { memoryId, photoUrl },
  });
};

/**
 * Create memory with photos in a single transaction
 */
export const createMemoryWithPhotosTransaction = async (
  userId: string,
  focusSessionId: string,
  photoUrls: string[],
  options?: {
    content?: string;
    location?: string;
    happyIndex?: number;
    mood?: string;
  }
) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const memory = await tx.memory.create({
      data: {
        focusSessionId,
        userId,
        type: options?.mood || '📚 Study',
        content: options?.content,
        location: options?.location,
        happyIndex: options?.happyIndex,
        timestamp: new Date(),
      },
    });
    const photos = [];
    for (const url of photoUrls) {
      if (url && String(url).trim() !== '') {
        const photo = await tx.photo.create({
          data: { memoryId: memory.id, photoUrl: String(url) },
        });
        photos.push(photo);
      }
    }
    return { memory, photos };
  });
};

/**
 * Update memory with photos in a single transaction (replaces existing photos)
 */
export const updateMemoryWithPhotosTransaction = async (
  memoryId: string,
  photoUrls: string[],
  options?: {
    content?: string;
    location?: string;
    happyIndex?: number;
    mood?: string;
  }
) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updateData: {
      content?: string;
      location?: string;
      happyIndex?: number;
      type?: string;
    } = {
      content: options?.content,
      location: options?.location,
      happyIndex: options?.happyIndex,
    };
    if (options?.mood) updateData.type = options.mood;
    const memory = await tx.memory.update({
      where: { id: memoryId },
      data: updateData,
    });
    await tx.photo.deleteMany({ where: { memoryId } });
    const photos = [];
    for (const url of photoUrls) {
      if (url && String(url).trim() !== '') {
        const photo = await tx.photo.create({
          data: { memoryId: memory.id, photoUrl: String(url) },
        });
        photos.push(photo);
      }
    }
    return { memory, photos };
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

