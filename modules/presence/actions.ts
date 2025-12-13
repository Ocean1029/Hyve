// modules/presence/actions.ts
'use server';

import { auth } from '@/auth';
import {
  updateUserHeartbeat,
  getUserOnlineStatus,
  getMultipleUsersStatus,
  getFriendsStatusService,
} from './service';

/**
 * Server action to update current user's heartbeat
 */
export async function updateHeartbeat() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return await updateUserHeartbeat(session.user.id);
  } catch (error) {
    console.error('Error in updateHeartbeat action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Server action to get current user's online status
 */
export async function getMyOnlineStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { isOnline: false, lastSeenAt: null };
    }

    return await getUserOnlineStatus(session.user.id);
  } catch (error) {
    console.error('Error in getMyOnlineStatus action:', error);
    return { isOnline: false, lastSeenAt: null };
  }
}

/**
 * Server action to get multiple users' online status
 */
export async function getUsersStatus(userIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    return await getMultipleUsersStatus(userIds);
  } catch (error) {
    console.error('Error in getUsersStatus action:', error);
    return [];
  }
}

/**
 * Server action to get all friends' online status
 */
export async function getFriendsStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    return await getFriendsStatusService(session.user.id);
  } catch (error) {
    console.error('Error in getFriendsStatus action:', error);
    return [];
  }
}

