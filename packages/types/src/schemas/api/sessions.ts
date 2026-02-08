import { z } from 'zod';

/**
 * Schema for ending a focus session
 */
export const EndSessionRequestSchema = z.object({
  endTime: z.string().datetime().optional(),
  minutes: z.number().int().min(0).optional(),
});

export type EndSessionRequest = z.infer<typeof EndSessionRequestSchema>;

/**
 * Schema for pausing/resuming a focus session
 */
export const PauseSessionRequestSchema = z.object({
  isPaused: z.boolean(),
});

export type PauseSessionRequest = z.infer<typeof PauseSessionRequestSchema>;

/**
 * Schema for session response
 */
export const SessionResponseSchema = z.object({
  success: z.boolean(),
  session: z.object({
    id: z.string(),
    sessionId: z.string(),
    status: z.string(),
    startTime: z.string(),
    endTime: z.string().optional(),
    minutes: z.number().optional(),
    users: z.array(z.object({
      userId: z.string(),
      isPaused: z.boolean(),
    })).optional(),
  }).optional(),
  error: z.string().optional(),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;
