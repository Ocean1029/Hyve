import { z } from 'zod';

/**
 * Schema for creating a friend (POST body)
 */
export const CreateFriendRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type CreateFriendRequest = z.infer<typeof CreateFriendRequestSchema>;

/**
 * Schema for check friend response
 */
export const CheckFriendResponseSchema = z.object({
  success: z.boolean(),
  isFriend: z.boolean(),
});

export type CheckFriendResponse = z.infer<typeof CheckFriendResponseSchema>;

/**
 * Spring Bloom entry (matches actual API response from getSpringBloomDataService)
 */
export const SpringBloomEntrySchema = z.object({
  rank: z.number(),
  name: z.string(),
  avatar: z.string(),
  hours: z.number(),
  tags: z.array(z.string()).optional(),
});

export type SpringBloomEntry = z.infer<typeof SpringBloomEntrySchema>;

/**
 * Schema for Spring Bloom data response
 */
export const SpringBloomResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SpringBloomEntrySchema).optional(),
  error: z.string().optional(),
});

export type SpringBloomResponse = z.infer<typeof SpringBloomResponseSchema>;

/**
 * Create friend success response (may include friend object)
 */
export const CreateFriendResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  alreadyExists: z.boolean().optional(),
  friend: z.record(z.unknown()).optional(),
});

export type CreateFriendResponse = z.infer<typeof CreateFriendResponseSchema>;
