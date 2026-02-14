import {
  createFriendRequest,
  getFriendRequestById,
  getFriendRequestBetweenUsers,
  getPendingRequestsReceived,
  updateFriendRequestStatus,
  acceptFriendRequestTransaction,
} from './repository';
import { checkFriendsExistBidirectional } from '../friends/repository';
import { revalidatePath } from 'next/cache';

/**
 * Send a friend request
 */
export async function sendFriendRequestService(
  senderId: string,
  receiverId: string
) {
  try {
    // Prevent sending request to yourself
    if (senderId === receiverId) {
      return { success: false, error: 'Cannot send request to yourself' };
    }

    // Check if users are already friends (bidirectional check)
    const { exists } = await checkFriendsExistBidirectional(senderId, receiverId);
    if (exists) {
      return { success: false, error: 'Users are already friends' };
    }

    // Check if there's already a pending request
    const existingRequest = await getFriendRequestBetweenUsers(
      senderId,
      receiverId
    );

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return {
          success: false,
          error: 'Friend request already exists',
          alreadyExists: true,
        };
      }
      // If request was rejected, allow creating a new one
    }

    // Create the friend request
    const request = await createFriendRequest(senderId, receiverId);

    revalidatePath('/friends');
    revalidatePath('/find-friends');

    return { success: true, request };
  } catch (error: any) {
    console.error('Error sending friend request:', error);
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Friend request already exists',
        alreadyExists: true,
      };
    }
    return { success: false, error: error.message || 'Failed to send request' };
  }
}

/**
 * Accept a friend request
 * Creates bidirectional Friend relationships and updates request status
 */
export async function acceptFriendRequestService(
  requestId: string,
  receiverId: string
) {
  try {
    // Get the request
    const request = await getFriendRequestById(requestId);

    if (!request) {
      return { success: false, error: 'Friend request not found' };
    }

    // Verify the receiver is the current user
    if (request.receiverId !== receiverId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if request is already processed
    if (request.status !== 'pending') {
      return {
        success: false,
        error: `Request already ${request.status}`,
      };
    }

    const result = await acceptFriendRequestTransaction(
      requestId,
      request.senderId,
      request.receiverId
    );

    revalidatePath('/friends');
    revalidatePath('/find-friends');

    return { success: true, friend: result.friend };
  } catch (error: any) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: error.message || 'Failed to accept request' };
  }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequestService(
  requestId: string,
  receiverId: string
) {
  try {
    const request = await getFriendRequestById(requestId);

    if (!request) {
      return { success: false, error: 'Friend request not found' };
    }

    if (request.receiverId !== receiverId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (request.status !== 'pending') {
      return {
        success: false,
        error: `Request already ${request.status}`,
      };
    }

    await updateFriendRequestStatus(requestId, 'rejected');

    revalidatePath('/friends');
    revalidatePath('/find-friends');

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting friend request:', error);
    return { success: false, error: error.message || 'Failed to reject request' };
  }
}

/**
 * Get pending requests for current user
 */
export async function getPendingRequestsService(userId: string) {
  try {
    const received = await getPendingRequestsReceived(userId);
    return { success: true, requests: received };
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return { success: false, error: 'Failed to get requests', requests: [] };
  }
}

/**
 * Check friend request status between two users
 */
export async function checkFriendRequestStatusService(
  currentUserId: string,
  otherUserId: string
) {
  try {
    const request = await getFriendRequestBetweenUsers(
      currentUserId,
      otherUserId
    );

    if (!request) {
      return { status: 'none' };
    }

    // Determine the status from current user's perspective
    if (request.senderId === currentUserId) {
      return {
        status: request.status === 'pending' ? 'sent' : request.status,
        requestId: request.id,
      };
    } else {
      return {
        status: request.status === 'pending' ? 'received' : request.status,
        requestId: request.id,
      };
    }
  } catch (error) {
    console.error('Error checking friend request status:', error);
    return { status: 'none' };
  }
}

