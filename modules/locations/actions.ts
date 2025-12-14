'use server';

import { auth } from '@/auth';
import {
  updateUserLocationService,
  getNearbyOnlineUsers,
} from './service';

/**
 * Server action to update current user's location
 */
export async function updateUserLocation(
  latitude: number,
  longitude: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return await updateUserLocationService(
      session.user.id,
      latitude,
      longitude
    );
  } catch (error) {
    console.error('Error in updateUserLocation action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Server action to find nearby online users
 */
export async function findNearbyOnlineUsers(
  latitude: number,
  longitude: number,
  radiusKm: number = 1
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', users: [] };
    }

    return await getNearbyOnlineUsers(
      session.user.id,
      latitude,
      longitude,
      radiusKm
    );
  } catch (error) {
    console.error('Error in findNearbyOnlineUsers action:', error);
    return { success: false, error: 'Internal server error', users: [] };
  }
}

