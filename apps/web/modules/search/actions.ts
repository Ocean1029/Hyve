'use server';

import { auth } from '@/auth';
import {
  searchUsersService,
  searchFriendsService,
  getRecommendedUsersService,
} from './service';

export async function searchUsers(query: string) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!query || query.trim().length === 0) {
      return { success: true, users: [] };
    }

    const users = await searchUsersService(query, currentUserId);
    return { success: true, users };
  } catch (error) {
    console.error('Failed to search users:', error);
    return { success: false, error: 'Failed to search users' };
  }
}

export async function searchFriends(query: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', friends: [] };
    }

    if (!query || query.trim().length === 0) {
      return { success: true, friends: [] };
    }

    const friends = await searchFriendsService(query, session.user.id);
    return { success: true, friends };
  } catch (error) {
    console.error('Failed to search friends:', error);
    return { success: false, error: 'Failed to search friends' };
  }
}

/**
 * Get recommended users for the current user
 * Excludes the current user and users who are already friends
 * Prioritizes users with higher activity (focusSessions)
 */
export async function getRecommendedUsers() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    const users = await getRecommendedUsersService(session.user.id);
    return { success: true, users };
  } catch (error) {
    console.error('Failed to get recommended users:', error);
    return { success: false, error: 'Failed to get recommended users' };
  }
}
