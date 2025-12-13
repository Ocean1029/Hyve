// modules/presence/service.ts
import { 
  updateLastSeen, 
  getLastSeen, 
  getUsersOnlineStatus,
  getFriendsOnlineStatus,
  isUserOnline,
} from './repository';

/**
 * Service to update user's heartbeat (last seen time)
 */
export const updateUserHeartbeat = async (userId: string) => {
  try {
    await updateLastSeen(userId);
    return { success: true };
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return { success: false, error: 'Failed to update heartbeat' };
  }
};

/**
 * Service to get user's online status
 */
export const getUserOnlineStatus = async (userId: string) => {
  try {
    const lastSeen = await getLastSeen(userId);
    if (!lastSeen) {
      return { isOnline: false, lastSeenAt: null };
    }
    
    return {
      isOnline: isUserOnline(lastSeen),
      lastSeenAt: lastSeen,
    };
  } catch (error) {
    console.error('Error getting user status:', error);
    return { isOnline: false, lastSeenAt: null };
  }
};

/**
 * Service to get multiple users' online status
 */
export const getMultipleUsersStatus = async (userIds: string[]) => {
  try {
    const statuses = await getUsersOnlineStatus(userIds);
    return statuses;
  } catch (error) {
    console.error('Error getting users status:', error);
    return [];
  }
};

/**
 * Service to get all friends' online status for a user
 */
export const getFriendsStatusService = async (sourceUserId: string) => {
  try {
    const statuses = await getFriendsOnlineStatus(sourceUserId);
    return statuses;
  } catch (error) {
    console.error('Error getting friends status:', error);
    return [];
  }
};


