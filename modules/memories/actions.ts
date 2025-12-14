'use server';

import { revalidatePath } from 'next/cache';
import { createMemory } from './repository';
import prisma from '@/lib/prisma';

/**
 * Create a new memory associated with a focus session
 */
export async function createMemoryAction(
  focusSessionId: string,
  type: 'message' | 'call' | 'meet' | 'note',
  content?: string,
  location?: string
) {
  try {
    const memory = await createMemory(focusSessionId, type, content, location);

    // Revalidate relevant pages
    revalidatePath('/messages');
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
export async function addPhotoToMemory(
  memoryId: string,
  photoUrl: string
) {
  try {
    const photo = await prisma.photo.create({
      data: {
        memoryId,
        photoUrl,
      },
    });

    // Revalidate relevant pages
    revalidatePath('/messages');
    revalidatePath('/');

    return { success: true, photo };
  } catch (error) {
    console.error('Failed to add photo to memory:', error);
    return { success: false, error: 'Failed to add photo to memory' };
  }
}

