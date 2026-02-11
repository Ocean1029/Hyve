import { z } from 'zod';

/**
 * Schema for getting multiple users' status (POST body)
 */
export const GetUsersStatusRequestSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
});

export type GetUsersStatusRequest = z.infer<typeof GetUsersStatusRequestSchema>;

/**
 * Single user status item
 */
export const UserStatusItemSchema = z.object({
  userId: z.string(),
  isOnline: z.boolean(),
  lastSeenAt: z.string().datetime().nullable(),
});

export type UserStatusItem = z.infer<typeof UserStatusItemSchema>;

/**
 * Response for GET /api/presence/me
 */
export const PresenceMeResponseSchema = z.object({
  isOnline: z.boolean(),
  lastSeenAt: z.string().datetime().nullable(),
});

export type PresenceMeResponse = z.infer<typeof PresenceMeResponseSchema>;

/**
 * Single user presence status (for GET /api/presence/status)
 */
export const PresenceStatusSchema = z.object({
  userId: z.string(),
  isOnline: z.boolean(),
  lastSeenAt: z.string().datetime().nullable().optional(),
});

export type PresenceStatus = z.infer<typeof PresenceStatusSchema>;

/**
 * Response for GET /api/presence/status (array of presence statuses)
 */
export const PresenceStatusResponseSchema = z.object({
  statuses: z.array(PresenceStatusSchema),
});

export type PresenceStatusResponse = z.infer<typeof PresenceStatusResponseSchema>;
