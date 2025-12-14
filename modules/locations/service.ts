import {
  createUserLocation,
  getUserLocation,
  findNearbyUsers,
} from './repository';
import { isUserOnline } from '@/modules/presence/repository';

/**
 * Create a new user location record
 * Each call creates a new record instead of updating existing one
 */
export async function updateUserLocationService(
  userId: string,
  latitude: number,
  longitude: number
) {
  try {
    const location = await createUserLocation(userId, latitude, longitude);
    return { success: true, location };
  } catch (error) {
    console.error('Error creating user location:', error);
    return { success: false, error: 'Failed to create location' };
  }
}

/**
 * Get nearby online users
 * Combines location data with online status
 */
export async function getNearbyOnlineUsers(
  userId: string,
  latitude: number,
  longitude: number,
  radiusKm: number = 1
) {
  try {
    // Get nearby users
    const nearbyUsers = await findNearbyUsers(
      userId,
      latitude,
      longitude,
      radiusKm
    );

    // Filter to only online users and add online status
    const nearbyOnlineUsers = nearbyUsers
      .map((userLocation) => {
        const isOnline = userLocation.user.lastSeenAt
          ? isUserOnline(userLocation.user.lastSeenAt)
          : false;
        return {
          id: userLocation.user.id,
          userId: userLocation.user.userId,
          name: userLocation.user.name,
          image: userLocation.user.image,
          distance: userLocation.distance,
          isOnline,
          lastSeenAt: userLocation.user.lastSeenAt,
        };
      })
      .filter((user) => user.isOnline); // Only return online users

    return { success: true, users: nearbyOnlineUsers };
  } catch (error) {
    console.error('Error getting nearby online users:', error);
    return { success: false, error: 'Failed to get nearby users', users: [] };
  }
}

