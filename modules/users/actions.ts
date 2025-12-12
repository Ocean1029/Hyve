'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    email?: string;
    image?: string;
  }
) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    revalidatePath('/profile');

    return { success: true, user };
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return { success: false, error: 'Failed to update user profile' };
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

