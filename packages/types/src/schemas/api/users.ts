import { z } from 'zod';

/**
 * Schema for updating user profile (PUT body)
 */
export const UpdateUserProfileRequestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  image: z.string().url().optional().or(z.literal('')),
  userId: z.string().min(1).optional(),
  privacy: z.enum(['public', 'private']).optional(),
});

export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileRequestSchema>;

/**
 * Schema for update profile response
 */
export const UpdateUserProfileResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  user: z.record(z.unknown()).optional(),
});

export type UpdateUserProfileResponse = z.infer<typeof UpdateUserProfileResponseSchema>;

/**
 * Schema for user stats response
 */
export const UserStatsResponseSchema = z.object({
  success: z.boolean(),
  stats: z.object({
    totalSessions: z.number(),
    totalMemories: z.number(),
    totalMinutes: z.number(),
  }).optional(),
  error: z.string().optional(),
});

export type UserStatsResponse = z.infer<typeof UserStatsResponseSchema>;

/**
 * Schema for logout response (may redirect)
 */
export const LogoutResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
