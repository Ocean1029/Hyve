'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { createFocusSessionWithUsers } from './repository';

export async function createFocusSession(
  userIds: string[],
  durationSeconds: number,
  startTime: Date,
  endTime: Date
) {
  try {
    if (userIds.length === 0) {
      return { success: false, error: 'At least one user ID is required' };
    }

    // Use repository function to create session with users
    const session = await createFocusSessionWithUsers(
      userIds,
      startTime,
      endTime,
      Math.floor(durationSeconds / 60),
      'active'
    );

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
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        memories: {
          include: {
            photos: true,
          },
        },
      },
    });

    return { success: true, sessions };
  } catch (error) {
    console.error('Failed to get focus sessions:', error);
    return { success: false, error: 'Failed to get focus sessions' };
  }
}

export async function getTodayFocusSessions(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await prisma.focusSession.findMany({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { startTime: 'asc' },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        memories: {
          include: {
            photos: true,
          },
        },
      },
    });

    // Calculate total minutes for today
    const totalMinutes = sessions.reduce((sum: number, session: { minutes: number }) => sum + session.minutes, 0);

    return { success: true, sessions, totalMinutes };
  } catch (error) {
    console.error('Failed to get today focus sessions:', error);
    return { success: false, error: 'Failed to get today focus sessions' };
  }
}

/**
 * Get active focus sessions for the current user
 * Returns sessions with status 'active' that the user is participating in
 */
export async function getActiveFocusSessions(userId: string) {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: {
        status: 'active',
        users: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        memories: {
          include: {
            photos: true,
          },
        },
      },
    });

    return { success: true, sessions };
  } catch (error) {
    console.error('Failed to get active focus sessions:', error);
    return { success: false, error: 'Failed to get active focus sessions' };
  }
}



