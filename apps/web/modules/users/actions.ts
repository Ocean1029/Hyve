'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { validateUserId } from './validation';
import { signOut } from '@/auth';
import {
  updateUserProfileService,
  getUserStatsService,
} from './service';

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    email?: string;
    image?: string;
    userId?: string;
    privacy?: 'public' | 'private';
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    if (session.user.id !== userId) {
      return { success: false, error: 'Forbidden: can only update own profile' };
    }

    const result = await updateUserProfileService(
      userId,
      data,
      validateUserId
    );
    if (result.success) {
      revalidatePath('/profile');
      revalidatePath('/settings');
    }
    return result;
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('userId')) {
      return { success: false, error: 'This userId is already taken' };
    }
    return { success: false, error: error.message || 'Failed to update user profile' };
  }
}

export async function getUserStats(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    if (session.user.id !== userId) {
      return { success: false, error: 'Forbidden: can only view own stats' };
    }

    return await getUserStatsService(userId);
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return { success: false, error: 'Failed to get user stats' };
  }
}

/**
 * Sign out the current user
 * This server action handles the logout process by calling NextAuth's signOut
 * signOut will automatically redirect, so we don't catch NEXT_REDIRECT errors
 */
export async function logout() {
  await signOut({ redirectTo: '/login' });
}


