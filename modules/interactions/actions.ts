'use server';

import { revalidatePath } from 'next/cache';
import { createInteraction } from './repository';

export async function addInteraction(
  friendId: string,
  type: 'message' | 'call' | 'meet' | 'note',
  content?: string
) {
  try {
    const interaction = await createInteraction(friendId, type, content);

    // Revalidate relevant pages
    revalidatePath('/messages');
    revalidatePath('/');

    return { success: true, interaction };
  } catch (error) {
    console.error('Failed to add interaction:', error);
    return { success: false, error: 'Failed to add interaction' };
  }
}

