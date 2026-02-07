'use server';

import { auth } from '@/auth';
import {
  sendFriendRequestService,
  acceptFriendRequestService,
  rejectFriendRequestService,
  getPendingRequestsService,
  checkFriendRequestStatusService,
} from './service';

/**
 * Server action to send a friend request
 */
export async function sendFriendRequest(receiverId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return await sendFriendRequestService(session.user.id, receiverId);
  } catch (error) {
    console.error('Error in sendFriendRequest action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Server action to accept a friend request
 */
export async function acceptFriendRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return await acceptFriendRequestService(requestId, session.user.id);
  } catch (error) {
    console.error('Error in acceptFriendRequest action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Server action to reject a friend request
 */
export async function rejectFriendRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return await rejectFriendRequestService(requestId, session.user.id);
  } catch (error) {
    console.error('Error in rejectFriendRequest action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Server action to get pending friend requests
 */
export async function getPendingRequests() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', requests: [] };
    }

    return await getPendingRequestsService(session.user.id);
  } catch (error) {
    console.error('Error in getPendingRequests action:', error);
    return { success: false, error: 'Internal server error', requests: [] };
  }
}

/**
 * Server action to check friend request status with another user
 */
export async function checkFriendRequestStatus(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { status: 'none' };
    }

    return await checkFriendRequestStatusService(session.user.id, userId);
  } catch (error) {
    console.error('Error in checkFriendRequestStatus action:', error);
    return { status: 'none' };
  }
}

