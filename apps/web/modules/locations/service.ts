import type { NearbyUserWithStatus } from '@hyve/types';
import {
  createUserLocation,
  getUserLocation,
  getNearbyUsers,
  getUsersLatestLocations,
} from './repository';
import { isUserOnline } from '@/modules/presence/repository';

// Type for user location with user relation and distance (derived from repository)
type UserLocationWithDistance = Awaited<ReturnType<typeof getUsersLatestLocations>>[0] & {
  distance: number;
};

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
export async function getNearbyOnlineUsersService(
  userId: string,
  latitude: number,
  longitude: number,
  radiusKm: number = 1
) {
  try {
    // Get nearby users
    const nearbyUsers = await getNearbyUsers(
      userId,
      latitude,
      longitude,
      radiusKm
    );

    // Filter to only online users and add online status
    const nearbyOnlineUsers = nearbyUsers
      .map((userLocation: UserLocationWithDistance) => {
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
      .filter((user: NearbyUserWithStatus) => user.isOnline); // Only return online users

    return { success: true, users: nearbyOnlineUsers };
  } catch (error) {
    console.error('Error getting nearby online users:', error);
    return { success: false, error: 'Failed to get nearby users', users: [] };
  }
}

