import prisma from '@/lib/prisma';
import { calculateDistance } from '@hyve/utils';

/**
 * Create a new user location record
 * Each update creates a new record instead of updating existing one
 */
export async function createUserLocation(
  userId: string,
  latitude: number,
  longitude: number
) {
  return await prisma.userLocation.create({
    data: {
      userId,
      latitude,
      longitude,
      timestamp: new Date(),
    },
  });
}

/**
 * Get user's most recent location
 */
export async function getUserLocation(userId: string) {
  return await prisma.userLocation.findFirst({
    where: { userId },
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Get the most recent location for multiple users
 */
export async function getUsersLatestLocations(userIds: string[]) {
  // Get the most recent location for each user
  const locations = await prisma.userLocation.findMany({
    where: {
      userId: { in: userIds },
    },
    orderBy: {
      timestamp: 'desc',
    },
    distinct: ['userId'],
    include: {
      user: {
        select: {
          id: true,
          userId: true,
          name: true,
          image: true,
          lastSeenAt: true,
        },
      },
    },
  });

  return locations;
}

/**
 * Find nearby users within specified radius (in kilometers)
 * Returns users with their distance from the given coordinates
 * Uses the most recent location for each user
 */
export async function getNearbyUsers(
  userId: string,
  latitude: number,
  longitude: number,
  radiusKm: number = 1
) {
  // Get all unique user IDs (excluding current user)
  const allUserIds = await prisma.userLocation.findMany({
    where: {
      userId: { not: userId },
    },
    select: {
      userId: true,
    },
    distinct: ['userId'],
  });

  const userIds = allUserIds.map((u: { userId: string }) => u.userId);

  if (userIds.length === 0) {
    return [];
  }

  // Get the most recent location for each user
  const latestLocations = await getUsersLatestLocations(userIds);

  // Calculate distance for each user and filter by radius
  const nearbyUsers = latestLocations
    .map((location: any) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );
      return {
        ...location,
        distance,
      };
    })
    .filter((location: any) => location.distance <= radiusKm)
    .sort((a: any, b: any) => a.distance - b.distance); // Sort by distance

  return nearbyUsers;
}

