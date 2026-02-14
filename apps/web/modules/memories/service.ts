// modules/memories/service.ts
import {
  createMemory,
  getMemoriesWithHappyIndexByDateRange,
  getPeakHappinessMemories,
  createPhoto,
  createMemoryWithPhotosTransaction,
  updateMemoryWithPhotosTransaction,
} from './repository';
import type { WeeklyHappyIndexDataPoint, PeakHappinessMemory } from '@hyve/types';

/**
 * Get weekly happy index data for the last 7 days
 * Groups memories by day and calculates average happyIndex for each day
 */
export const getWeeklyHappyIndexDataService = async (
  userId: string
): Promise<WeeklyHappyIndexDataPoint[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6); // Last 7 days including today
  startDate.setHours(0, 0, 0, 0); // Start of day
  endDate.setHours(23, 59, 59, 999); // End of day

  const memories = await getMemoriesWithHappyIndexByDateRange(
    userId,
    startDate,
    endDate
  );

  // Group happyIndex values by day (using date string as key to handle same day name across weeks)
  const daysMap = new Map<string, { dayName: string; scores: number[]; date: Date }>();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  memories.forEach((memory: { timestamp: Date; happyIndex: number | null }) => {
    if (memory.happyIndex !== null) {
      const memoryDate = new Date(memory.timestamp);
      memoryDate.setHours(0, 0, 0, 0); // Normalize to start of day
      const dateKey = memoryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const dayName = daysOfWeek[memoryDate.getDay()];
      
      // Group scores by date
      if (!daysMap.has(dateKey)) {
        daysMap.set(dateKey, {
          dayName,
          scores: [],
          date: memoryDate,
        });
      }
      daysMap.get(dateKey)!.scores.push(memory.happyIndex);
    }
  });

  // Convert to array, sort by date (maintaining chronological order), and calculate averages
  const result: WeeklyHappyIndexDataPoint[] = Array.from(daysMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ dayName, scores }) => {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return {
        day: dayName,
        score: Math.round(average * 10) / 10, // Round to 1 decimal place
      };
    });

  return result;
};

/**
 * Get peak happiness memories (memories with highest happyIndex)
 * Returns top memories with full relations including focusSession, friends, and photos
 */
export const getPeakHappinessMemoriesService = async (
  userId: string,
  limit: number = 5
): Promise<PeakHappinessMemory[]> => {
  const memories = await getPeakHappinessMemories(userId, limit);

  return memories.map((memory: (typeof memories)[0]) => ({
    id: memory.id,
    content: memory.content,
    location: memory.location,
    timestamp: memory.timestamp,
    happyIndex: memory.happyIndex,
    photos: memory.photos.map((photo: { id: string; photoUrl: string }) => ({
      id: photo.id,
      photoUrl: photo.photoUrl,
    })),
    focusSession: {
      id: memory.focusSession.id,
      startTime: memory.focusSession.startTime,
      endTime: memory.focusSession.endTime,
      friends: memory.focusSession.users.map((fsu: {
        user: {
          id: string;
          name: string | null;
          image: string | null;
        };
      }) => ({
        friend: {
          id: fsu.user.id, // Use user.id as friend.id for compatibility
          user: {
            name: fsu.user.name,
            image: fsu.user.image,
          },
        },
      })),
    },
  }));
};

/**
 * Create a memory (used by API)
 */
export async function createMemoryService(
  focusSessionId: string,
  userId: string,
  type: string,
  content?: string,
  location?: string,
  happyIndex?: number
) {
  const memory = await createMemory(
    focusSessionId,
    userId,
    type,
    content,
    location,
    happyIndex
  );
  return { success: true, memory };
}

/**
 * Add a photo to a memory
 */
export async function addPhotoToMemoryService(memoryId: string, photoUrl: string) {
  const photo = await createPhoto(memoryId, photoUrl);
  return { success: true, photo };
}

/**
 * Create a memory with photos in a single transaction
 */
export async function createMemoryWithPhotoService(
  userId: string,
  focusSessionId: string,
  photoUrl?: string | string[],
  content?: string,
  location?: string,
  happyIndex?: number,
  mood?: string
) {
  const photoUrls = photoUrl
    ? Array.isArray(photoUrl) ? photoUrl : [photoUrl]
    : [];
  const result = await createMemoryWithPhotosTransaction(
    userId,
    focusSessionId,
    photoUrls,
    { content, location, happyIndex, mood }
  );
  return { success: true, memory: result.memory, photos: result.photos };
}

/**
 * Update a memory with photos in a single transaction
 */
export async function updateMemoryWithPhotoService(
  memoryId: string,
  photoUrl?: string | string[],
  content?: string,
  location?: string,
  happyIndex?: number,
  mood?: string
) {
  const photoUrls = photoUrl
    ? Array.isArray(photoUrl) ? photoUrl : [photoUrl]
    : [];
  const result = await updateMemoryWithPhotosTransaction(memoryId, photoUrls, {
    content,
    location,
    happyIndex,
    mood,
  });
  return { success: true, memory: result.memory, photos: result.photos };
}

