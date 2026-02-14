'use server';

import { revalidatePath } from 'next/cache';
import { createMemory } from './repository';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import {
  getWeeklyHappyIndexDataService,
  getPeakHappinessMemoriesService,
  createMemoryWithPhotoService,
  updateMemoryWithPhotoService,
  addPhotoToMemoryService,
} from './service';

/**
 * Create a new memory associated with a focus session
 */
export async function createMemoryAction(
  focusSessionId: string,
  type: string,
  content?: string,
  location?: string,
  happyIndex?: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const memory = await createMemory(
      focusSessionId,
      session.user.id,
      type,
      content,
      location,
      happyIndex
    );

    // Revalidate relevant pages
    revalidatePath('/friends');
    revalidatePath('/');

    return { success: true, memory };
  } catch (error) {
    console.error('Failed to create memory:', error);
    return { success: false, error: 'Failed to create memory' };
  }
}

/**
 * Add a photo to a memory
 */
export async function addPhotoToMemory(memoryId: string, photoUrl: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { userId: true },
    });
    if (!memory) {
      return { success: false, error: 'Memory not found' };
    }
    if (memory.userId !== session.user.id) {
      return { success: false, error: 'Forbidden: can only add photo to own memory' };
    }

    const result = await addPhotoToMemoryService(memoryId, photoUrl);
    revalidatePath('/friends');
    revalidatePath('/');
    return result;
  } catch (error) {
    console.error('Failed to add photo to memory:', error);
    return { success: false, error: 'Failed to add photo to memory' };
  }
}

/**
 * Create a memory with a photo in a single transaction
 * Used for "Unlock Photo Moment" feature
 */
export async function createMemoryWithPhoto(
  focusSessionId: string,
  photoUrl?: string | string[],
  content?: string,
  location?: string,
  happyIndex?: number,
  mood?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await createMemoryWithPhotoService(
      session.user.id,
      focusSessionId,
      photoUrl,
      content,
      location,
      happyIndex,
      mood
    );
    if (result.success) {
      revalidatePath('/friends');
      revalidatePath('/');
      revalidatePath('/profile');
      revalidatePath('/today');
    }
    return result;
  } catch (error) {
    console.error('Failed to create memory with photo:', error);
    return { success: false, error: 'Failed to create memory with photo' };
  }
}

/**
 * Update an existing memory with photos in a single transaction
 * Used for editing existing memories
 */
export async function updateMemoryWithPhoto(
  memoryId: string,
  photoUrl?: string | string[],
  content?: string,
  location?: string,
  happyIndex?: number,
  mood?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const existingMemory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { userId: true },
    });
    if (!existingMemory) {
      return { success: false, error: 'Memory not found' };
    }
    if (existingMemory.userId !== session.user.id) {
      return { success: false, error: 'Forbidden: can only update own memory' };
    }

    const result = await updateMemoryWithPhotoService(
      memoryId,
      photoUrl,
      content,
      location,
      happyIndex,
      mood
    );
    if (result.success) {
      revalidatePath('/friends');
      revalidatePath('/');
      revalidatePath('/profile');
      revalidatePath('/today');
    }
    return result;
  } catch (error) {
    console.error('Failed to update memory with photo:', error);
    return { success: false, error: 'Failed to update memory with photo' };
  }
}

/**
 * Get weekly happy index data for the current user.
 * Used by server components (e.g. happy-index page) for initial data fetch.
 */
export async function getWeeklyHappyIndexData() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: [] };
  }
  const data = await getWeeklyHappyIndexDataService(session.user.id);
  return { success: true, data };
}

/**
 * Get peak happiness memories for the current user.
 * Used by server components (e.g. happy-index page) for initial data fetch.
 */
export async function getPeakHappinessMemories(limit: number = 5) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: [] };
  }
  const data = await getPeakHappinessMemoriesService(session.user.id, limit);
  return { success: true, data };
}

