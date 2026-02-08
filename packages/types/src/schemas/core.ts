import { z } from 'zod';

/**
 * AppState enum schema
 */
export const AppStateSchema = z.nativeEnum({
  DASHBOARD: 'DASHBOARD',
  SEARCHING: 'SEARCHING',
  FOUND: 'FOUND',
  FOCUS: 'FOCUS',
  SUMMARY: 'SUMMARY',
  QUARTERLY_FEEDBACK: 'QUARTERLY_FEEDBACK',
  HAPPY_INDEX: 'HAPPY_INDEX',
  FRIEND_PROFILE: 'FRIEND_PROFILE',
  TODAY_DETAILS: 'TODAY_DETAILS',
  MY_PROFILE: 'MY_PROFILE',
  POST_MEMORY: 'POST_MEMORY',
  SETTINGS: 'SETTINGS',
} as const);

export enum AppState {
  DASHBOARD = 'DASHBOARD',
  SEARCHING = 'SEARCHING',
  FOUND = 'FOUND',
  FOCUS = 'FOCUS',
  SUMMARY = 'SUMMARY',
  QUARTERLY_FEEDBACK = 'QUARTERLY_FEEDBACK',
  HAPPY_INDEX = 'HAPPY_INDEX',
  FRIEND_PROFILE = 'FRIEND_PROFILE',
  TODAY_DETAILS = 'TODAY_DETAILS',
  MY_PROFILE = 'MY_PROFILE',
  POST_MEMORY = 'POST_MEMORY',
  SETTINGS = 'SETTINGS',
}

/**
 * FocusStatus enum schema
 */
export const FocusStatusSchema = z.nativeEnum({
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
} as const);

export enum FocusStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
}

/**
 * Photo schema
 */
export const PhotoSchema = z.object({
  id: z.string(),
  photoUrl: z.string().url(),
  memoryId: z.string(),
  createdAt: z.date(),
});

export type Photo = z.infer<typeof PhotoSchema>;

/**
 * Memory schema
 */
export const MemorySchema = z.object({
  id: z.string(),
  type: z.string(),
  content: z.string().optional(),
  timestamp: z.date(),
  focusSessionId: z.string(),
  photos: z.array(PhotoSchema).optional(),
  focusSessionMinutes: z.number().optional(),
  location: z.string().optional(),
  happyIndex: z.number().int().min(0).max(10).optional(),
});

export type Memory = z.infer<typeof MemorySchema>;

/**
 * Message schema
 */
export const MessageSchema = z.object({
  id: z.string(),
  friendId: z.string(),
  friendName: z.string(),
  friendAvatar: z.string().url(),
  lastMessage: z.string(),
  time: z.string(),
  unread: z.boolean(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * ChatMessage systemMetadata schema
 */
export const SystemMetadataSchema = z.object({
  duration: z.string(),
  location: z.string(),
  posts: z.array(z.string()),
  memoryType: z.string().optional(),
});

/**
 * ChatMessage schema
 */
export const ChatMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  text: z.string(),
  timestamp: z.union([z.string(), z.date()]),
  timestampDisplay: z.string().optional(),
  type: z.enum(['text', 'system']),
  systemMetadata: SystemMetadataSchema.optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Friend lastMessage schema
 */
export const FriendLastMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  senderId: z.string(),
  timestamp: z.date(),
});

/**
 * Friend schema
 */
export const FriendSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string(),
  avatar: z.string().url(),
  totalHours: z.number(),
  streak: z.number(),
  recentMemories: z.array(MemorySchema),
  friendCount: z.number().optional(),
  sessionCount: z.number().optional(),
  lastMessage: FriendLastMessageSchema.optional(),
});

export type Friend = z.infer<typeof FriendSchema>;

/**
 * SessionData schema
 */
export const SessionDataSchema = z.object({
  durationSeconds: z.number().int().min(0),
  participants: z.array(FriendSchema),
  startTime: z.number(),
});

export type SessionData = z.infer<typeof SessionDataSchema>;

/**
 * ChartDataPoint schema
 */
export const ChartDataPointSchema = z.object({
  day: z.string(),
  minutes: z.number().int().min(0),
});

export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;
