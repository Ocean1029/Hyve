'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { validateUserId } from './validation';
import { signOut } from '@/auth';

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    email?: string;
    image?: string;
    userId?: string;
  }
) {
  try {
    // If userId is being updated, validate it
    if (data.userId !== undefined) {
      const validation = validateUserId(data.userId);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Check if userId is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { userId: data.userId },
      });

      if (existingUser && existingUser.id !== userId) {
        return { success: false, error: 'This userId is already taken' };
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    // Revalidate both profile and settings pages
    revalidatePath('/profile');
    revalidatePath('/settings');

    return { success: true, user };
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('userId')) {
      return { success: false, error: 'This userId is already taken' };
    }
    
    return { success: false, error: error.message || 'Failed to update user profile' };
  }
}

export async function getUserStats(userId: string) {
  try {
    const [totalSessions, totalPosts, totalMinutes] = await Promise.all([
      prisma.focusSession.count({
        where: { userId },
      }),
      prisma.post.count({
        where: { userId },
      }),
      prisma.focusSession.aggregate({
        where: { userId },
        _sum: {
          durationMinutes: true,
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalSessions,
        totalPosts,
        totalMinutes: totalMinutes._sum.durationMinutes || 0,
      },
    };
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


