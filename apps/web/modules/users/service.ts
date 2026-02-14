import type { UpdateUserProfileRequest } from '@hyve/types';
import {
  updateUserById,
  getUserByUserId,
  getUserStats,
  getUserById,
} from './repository';
import { getUserMemoriesForProfile } from '../memories/repository';

/**
 * Update user profile with validation
 */
export async function updateUserProfileService(
  userId: string,
  data: UpdateUserProfileRequest,
  validateUserId: (id: string) => { isValid: boolean; error?: string }
) {
  if (data.userId !== undefined) {
    const validation = validateUserId(data.userId);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const existingUser = await getUserByUserId(data.userId);
    if (existingUser && existingUser.id !== userId) {
      return { success: false, error: 'This userId is already taken' };
    }
  }

  const user = await updateUserById(userId, data);
  return { success: true, user };
}

/**
 * Get user stats (sessions, memories, total minutes)
 */
export async function getUserStatsService(userId: string) {
  const stats = await getUserStats(userId);
  return { success: true, stats };
}

/**
 * Get current user profile with stats and memories
 */
export async function getMyProfileService(userId: string) {
  const [user, stats, memories] = await Promise.all([
    getUserById(userId),
    getUserStats(userId),
    getUserMemoriesForProfile(userId, 20),
  ]);

  if (!user) return null;

  return {
    ...user,
    stats: {
      totalSessions: stats.totalSessions,
      totalMemories: stats.totalMemories,
      totalMinutes: stats.totalMinutes,
    },
    memories,
  };
}
