import { z } from 'zod';

/**
 * User schema for API responses (simplified profile shape)
 */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  image: z.string().url().optional().nullable(),
  lastSeenAt: z.string().datetime().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Session user item (participant in a focus session)
 */
export const SessionUserItemSchema = z.object({
  userId: z.string(),
  isPaused: z.boolean(),
});

export type SessionUserItem = z.infer<typeof SessionUserItemSchema>;

/**
 * Focus session schema for API responses
 */
export const FocusSessionSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable().optional(),
  minutes: z.number().optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
  isPaused: z.boolean().optional(),
  users: z.array(SessionUserItemSchema).optional(),
});

export type FocusSession = z.infer<typeof FocusSessionSchema>;

/**
 * Friend schema for API responses (simplified)
 */
export const FriendApiSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string(),
  avatar: z.string().url().optional(),
  totalHours: z.number().optional(),
  streak: z.number().optional(),
});

export type FriendApi = z.infer<typeof FriendApiSchema>;
