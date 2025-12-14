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
  location?: string,
  happyIndex?: number
) {
  try {
    const memory = await createMemory(focusSessionId, type, content, location, happyIndex);

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
    revalidatePath('/friends');
    revalidatePath('/');

    return { success: true, photo };
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
  photoUrl?: string,
  content?: string,
  location?: string,
  happyIndex?: number
) {
  try {
    // Use transaction to ensure both memory and photo are created atomically
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the memory
      const memory = await tx.memory.create({
        data: {
          focusSessionId,
          type: 'note',
          content,
          location,
          happyIndex,
          timestamp: new Date(),
        },
      });

      // Create the photo linked to the memory only if photoUrl is provided
      let photo = null;
      if (photoUrl && photoUrl.trim() !== '') {
        photo = await tx.photo.create({
          data: {
            memoryId: memory.id,
            photoUrl,
          },
        });
      }

      return { memory, photo };
    });

    // Revalidate relevant pages
    revalidatePath('/friends');
    revalidatePath('/');
    revalidatePath('/profile');

    return { success: true, memory: result.memory, photo: result.photo };
  } catch (error) {
    console.error('Failed to create memory with photo:', error);
    return { success: false, error: 'Failed to create memory with photo' };
  }
}

