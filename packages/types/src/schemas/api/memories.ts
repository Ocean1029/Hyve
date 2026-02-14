import { z } from 'zod';

/**
 * Schema for creating a memory (POST body)
 */
export const CreateMemoryRequestSchema = z.object({
  focusSessionId: z.string().min(1, 'Focus session ID is required'),
  type: z.string().min(1, 'Type is required'),
  content: z.string().optional(),
  location: z.string().optional(),
  happyIndex: z.number().int().min(0).max(10).optional(),
});

export type CreateMemoryRequest = z.infer<typeof CreateMemoryRequestSchema>;

/**
 * Schema for adding a photo to a memory (POST body)
 */
export const AddPhotoToMemoryRequestSchema = z.object({
  photoUrl: z.string().url('Invalid photo URL'),
});

export type AddPhotoToMemoryRequest = z.infer<typeof AddPhotoToMemoryRequestSchema>;

/**
 * Schema for create memory with photo (POST body)
 */
export const CreateMemoryWithPhotoRequestSchema = z.object({
  focusSessionId: z.string().min(1, 'Focus session ID is required'),
  photoUrl: z.union([z.string().url(), z.array(z.string().url())]).optional(),
  content: z.string().optional(),
  location: z.string().optional(),
  happyIndex: z.number().int().min(0).max(10).optional(),
  mood: z.string().optional(),
});

export type CreateMemoryWithPhotoRequest = z.infer<typeof CreateMemoryWithPhotoRequestSchema>;

/**
 * Schema for update memory with photo (PUT body)
 */
export const UpdateMemoryWithPhotoRequestSchema = z.object({
  photoUrl: z.union([z.string().url(), z.array(z.string().url())]).optional(),
  content: z.string().optional(),
  location: z.string().optional(),
  happyIndex: z.number().int().min(0).max(10).optional(),
  mood: z.string().optional(),
});

export type UpdateMemoryWithPhotoRequest = z.infer<typeof UpdateMemoryWithPhotoRequestSchema>;

/**
 * Generic memory/photo success response
 */
export const MemoryActionResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  memory: z.record(z.unknown()).optional(),
  photos: z.array(z.record(z.unknown())).optional(),
  photo: z.record(z.unknown()).optional(),
});

export type MemoryActionResult = z.infer<typeof MemoryActionResultSchema>;

/**
 * Weekly happy index data point for chart display
 */
export const WeeklyHappyIndexDataPointSchema = z.object({
  day: z.string(),
  score: z.number(),
});

export type WeeklyHappyIndexDataPoint = z.infer<typeof WeeklyHappyIndexDataPointSchema>;

/**
 * Peak happiness memory with full relations (focus session, friends, photos)
 */
export const PeakHappinessMemorySchema = z.object({
  id: z.string(),
  content: z.string().nullable(),
  location: z.string().nullable(),
  timestamp: z.date(),
  happyIndex: z.number().nullable(),
  photos: z.array(
    z.object({
      id: z.string(),
      photoUrl: z.string(),
    })
  ),
  focusSession: z.object({
    id: z.string(),
    startTime: z.date(),
    endTime: z.date(),
    friends: z.array(
      z.object({
        friend: z.object({
          id: z.string(),
          user: z.object({
            name: z.string().nullable(),
            image: z.string().nullable(),
          }),
        }),
      })
    ),
  }),
});

export type PeakHappinessMemory = z.infer<typeof PeakHappinessMemorySchema>;
