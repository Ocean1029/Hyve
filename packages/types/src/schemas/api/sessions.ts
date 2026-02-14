import { z } from 'zod';

/**
 * Options for querying user focus sessions (repository)
 */
export const GetUserSessionsOptionsSchema = z.object({
  userId: z.string(),
  userIds: z.array(z.string()).optional(),
  userMatchMode: z.enum(['some', 'every']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  endTimeMin: z.coerce.date().optional(),
  limit: z.number().int().positive().optional(),
  orderBy: z.enum(['asc', 'desc']).optional(),
  includeMemories: z.boolean().optional(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});

export type GetUserSessionsOptions = z.infer<typeof GetUserSessionsOptionsSchema>;

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

/**
 * Schema for creating a focus session
 */
export const CreateSessionRequestSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  durationSeconds: z.number().int().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

/**
 * Schema for session list item
 */
export const SessionListItemSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  status: z.string(),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  minutes: z.number().optional(),
  createdAt: z.string().optional(),
});

export type SessionListItem = z.infer<typeof SessionListItemSchema>;

/**
 * Schema for list sessions response
 */
export const ListSessionsResponseSchema = z.object({
  success: z.boolean(),
  sessions: z.array(SessionListItemSchema).optional(),
  error: z.string().optional(),
});

export type ListSessionsResponse = z.infer<typeof ListSessionsResponseSchema>;

/**
 * Schema for today sessions response
 */
export const TodaySessionsResponseSchema = z.object({
  success: z.boolean(),
  sessions: z.array(SessionListItemSchema).optional(),
  totalMinutes: z.number().optional(),
  error: z.string().optional(),
});

export type TodaySessionsResponse = z.infer<typeof TodaySessionsResponseSchema>;

/**
 * Schema for active sessions response
 */
export const ActiveSessionsResponseSchema = z.object({
  success: z.boolean(),
  sessions: z.array(SessionListItemSchema).optional(),
  error: z.string().optional(),
});

export type ActiveSessionsResponse = z.infer<typeof ActiveSessionsResponseSchema>;

/**
 * Schema for GET /api/sessions/[sessionId]/status response
 */
export const SessionStatusResponseSchema = z.object({
  success: z.boolean(),
  sessionId: z.string(),
  status: z.enum(['active', 'completed', 'cancelled']),
  isPaused: z.boolean(),
  users: z.array(z.object({
    userId: z.string(),
    isPaused: z.boolean(),
  })).optional(),
});

export type SessionStatusResponse = z.infer<typeof SessionStatusResponseSchema>;
