'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  createFocusSessionService,
  getUserFocusSessionsService,
  getTodayFocusSessionsService,
  getActiveFocusSessionsService,
} from './service';

/**
 * Server action to create a focus session
 */
export async function createFocusSession(
  userIds: string[],
  durationSeconds: number,
  startTime: Date,
  endTime: Date
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await createFocusSessionService(
      userIds,
      durationSeconds,
      startTime,
      endTime
    );

    if (result.success) {
      // Revalidate the home page to update the chart
      revalidatePath('/');
    }

    return result;
  } catch (error) {
    console.error('Error in createFocusSession action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Server action to get user's focus sessions
 */
export async function getUserFocusSessions(userId: string, limit = 10) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', sessions: [] };
    }

    // Verify user can only access their own sessions
    if (session.user.id !== userId) {
      return { success: false, error: 'Forbidden', sessions: [] };
    }

    return await getUserFocusSessionsService(userId, limit);
  } catch (error) {
    console.error('Error in getUserFocusSessions action:', error);
    return { success: false, error: 'Internal server error', sessions: [] };
  }
}

/**
 * Server action to get today's focus sessions
 */
export async function getTodayFocusSessions(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', sessions: [], totalMinutes: 0 };
    }

    // Verify user can only access their own sessions
    if (session.user.id !== userId) {
      return { success: false, error: 'Forbidden', sessions: [], totalMinutes: 0 };
    }

    return await getTodayFocusSessionsService(userId);
  } catch (error) {
    console.error('Error in getTodayFocusSessions action:', error);
    return { success: false, error: 'Internal server error', sessions: [], totalMinutes: 0 };
  }
}

/**
 * Server action to get active focus sessions for the current user
 * Returns sessions with status 'active' that the user is participating in
 */
export async function getActiveFocusSessions(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', sessions: [] };
    }

    // Verify user can only access their own sessions
    if (session.user.id !== userId) {
      return { success: false, error: 'Forbidden', sessions: [] };
    }

    return await getActiveFocusSessionsService(userId);
  } catch (error) {
    console.error('Error in getActiveFocusSessions action:', error);
    return { success: false, error: 'Internal server error', sessions: [] };
  }
}



