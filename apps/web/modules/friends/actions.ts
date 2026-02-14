'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import {
  getSpringBloomDataService,
  deleteFriendService,
  createFriendService,
} from './service';
import type { SpringBloomEntry } from '@hyve/types';

export async function addFriendFromUser(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    const result = await createFriendService(session.user.id, userId);
    if (result.success) {
      revalidatePath('/');
      revalidatePath('/friends');
    }
    return result;
  } catch (error: any) {
    console.error('Failed to add friend from user:', error);
    return { success: false, error: error.message || 'Failed to add friend' };
  }
}

export async function checkIfUserIsFriend(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, isFriend: false };
    }
    const sourceUserId = session.user.id;

    const existingFriend1 = await prisma.friend.findUnique({
      where: {
        userId_sourceUserId: { userId, sourceUserId },
      },
    });
    const existingFriend2 = await prisma.friend.findUnique({
      where: {
        userId_sourceUserId: { userId: sourceUserId, sourceUserId: userId },
      },
    });

    return { success: true, isFriend: !!(existingFriend1 || existingFriend2) };
  } catch (error) {
    console.error('Failed to check if user is friend:', error);
    return { success: false, isFriend: false };
  }
}

export async function createFriend(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    const result = await createFriendService(session.user.id, userId);
    if (result.success) {
      revalidatePath('/');
      revalidatePath('/friends');
    }
    return result;
  } catch (error: any) {
    console.error('Failed to create friend:', error);
    return { success: false, error: error.message || 'Failed to create friend' };
  }
}

// Note: updateFriend is removed as Friend no longer has mutable fields
// User data (name, avatar) should be updated in User model instead

export async function deleteFriend(friendId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    const result = await deleteFriendService(friendId, session.user.id);
    if (!result.success) {
      return result;
    }

    revalidatePath('/');
    revalidatePath('/friends');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete friend:', error);
    return { success: false, error: 'Failed to delete friend' };
  }
}

/**
 * Get Spring Bloom data for the current user
 * Returns ranked list of friends with total hours and tags from the last 3 months
 */
export async function getSpringBloomDataAction(): Promise<{ success: boolean; data?: SpringBloomEntry[]; error?: string }> {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      console.error('Spring Bloom: No user session');
      return { success: false, error: 'Unauthorized: Please log in' };
    }
    const sourceUserId = session.user.id;
    console.log('Spring Bloom: Loading data for user', sourceUserId);

    // Get Spring Bloom data
    const data = await getSpringBloomDataService(sourceUserId);
    console.log('Spring Bloom: Data loaded successfully', data.length, 'friends');

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to get Spring Bloom data:', error);
    return { success: false, error: error.message || 'Failed to get Spring Bloom data' };
  }
}

