'use server';

import { revalidatePath } from 'next/cache';
import { createMemory } from './repository';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

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

    const userId = session.user.id;

    // Normalize photoUrl to array
    const photoUrls = photoUrl 
      ? (Array.isArray(photoUrl) ? photoUrl : [photoUrl])
      : [];

    // Use transaction to ensure both memory and photos are created atomically
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the memory
      const memory = await tx.memory.create({
        data: {
          focusSessionId,
          userId: userId,
          type: mood || '📚 Study',
          content,
          location,
          happyIndex,
          timestamp: new Date(),
        },
      });

      // Create photos linked to the memory
      const photos = [];
      for (const url of photoUrls) {
        if (url && url.trim() !== '') {
          const photo = await tx.photo.create({
            data: {
              memoryId: memory.id,
              photoUrl: url,
            },
          });
          photos.push(photo);
        }
      }

      return { memory, photos };
    });

    // Revalidate relevant pages
    revalidatePath('/friends');
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/today');

    return { success: true, memory: result.memory, photos: result.photos };
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
    // Normalize photoUrl to array
    const photoUrls = photoUrl 
      ? (Array.isArray(photoUrl) ? photoUrl : [photoUrl])
      : [];

    // Use transaction to ensure both memory and photos are updated atomically
    const result = await prisma.$transaction(async (tx: any) => {
      // Update the memory
      const updateData: any = {
        content,
        location,
        happyIndex,
      };
      
      // Only update type if mood is provided
      if (mood) {
        updateData.type = mood;
      }
      
      const memory = await tx.memory.update({
        where: { id: memoryId },
        data: updateData,
      });

      // Delete existing photos
      await tx.photo.deleteMany({
        where: { memoryId },
      });

      // Create new photos linked to the memory
      const photos = [];
      for (const url of photoUrls) {
        if (url && url.trim() !== '') {
          const photo = await tx.photo.create({
            data: {
              memoryId: memory.id,
              photoUrl: url,
            },
          });
          photos.push(photo);
        }
      }

      return { memory, photos };
    });

    // Revalidate relevant pages
    revalidatePath('/friends');
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/today');

    return { success: true, memory: result.memory, photos: result.photos };
  } catch (error) {
    console.error('Failed to update memory with photo:', error);
    return { success: false, error: 'Failed to update memory with photo' };
  }
}

