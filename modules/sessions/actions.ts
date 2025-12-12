'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function createFocusSession(
  userId: string,
  friendId: string,
  durationSeconds: number
) {
  try {
    const session = await prisma.focusSession.create({
      data: {
        userId,
        friendId,
        startTime: new Date(Date.now() - durationSeconds * 1000),
        endTime: new Date(),
        durationMinutes: Math.floor(durationSeconds / 60),
      },
    });

    // Revalidate the home page to update the chart
    revalidatePath('/');

    return { success: true, session };
  } catch (error) {
    console.error('Failed to create focus session:', error);
    return { success: false, error: 'Failed to create focus session' };
  }
}

export async function getUserFocusSessions(userId: string, limit = 10) {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        friend: true,
      },
    });

    return { success: true, sessions };
  } catch (error) {
    console.error('Failed to get focus sessions:', error);
    return { success: false, error: 'Failed to get focus sessions' };
  }
}

