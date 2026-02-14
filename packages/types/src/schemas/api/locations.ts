import { z } from 'zod';

/**
 * Schema for updating user location (POST body)
 */
export const UpdateLocationRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type UpdateLocationRequest = z.infer<typeof UpdateLocationRequestSchema>;

/**
 * Schema for update location response
 */
export const UpdateLocationResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export type UpdateLocationResponse = z.infer<typeof UpdateLocationResponseSchema>;

/**
 * Nearby user item (from GET /api/locations/nearby)
 */
export const NearbyUserItemSchema = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isOnline: z.boolean().optional(),
  distance: z.number().optional(),
  lastSeenAt: z.string().datetime().nullable().optional(),
});

export type NearbyUserItem = z.infer<typeof NearbyUserItemSchema>;

/**
 * Nearby user with status (internal service return shape)
 */
export const NearbyUserWithStatusSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  distance: z.number(),
  isOnline: z.boolean(),
  lastSeenAt: z.coerce.date().nullable(),
});

export type NearbyUserWithStatus = z.infer<typeof NearbyUserWithStatusSchema>;

/**
 * Response for GET /api/locations/nearby
 */
export const NearbyUsersResponseSchema = z.object({
  success: z.boolean(),
  users: z.array(NearbyUserItemSchema).optional(),
  error: z.string().optional(),
});

export type NearbyUsersResponse = z.infer<typeof NearbyUsersResponseSchema>;
