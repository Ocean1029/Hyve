import { z } from 'zod';

/**
 * Schema for sending a message (POST body)
 */
export const SendMessageRequestSchema = z.object({
  friendId: z.string().min(1, 'Friend ID is required'),
  content: z.string().min(1, 'Message content is required'),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

/**
 * Schema for send message response
 */
export const SendMessageResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.record(z.unknown()).optional(),
});

export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;

/**
 * Message item for conversation
 */
const MessageItemSchema = z.object({
  id: z.string(),
  friendId: z.string(),
  senderId: z.string(),
  content: z.string(),
  createdAt: z.string().optional(),
});

/**
 * Schema for get conversation response
 */
export const GetConversationResponseSchema = z.object({
  success: z.boolean(),
  messages: z.array(MessageItemSchema).optional(),
  error: z.string().optional(),
});

export type GetConversationResponse = z.infer<typeof GetConversationResponseSchema>;

/**
 * Memory item in focus session summary (internal service return, uses Date)
 */
const FriendFocusSessionMemoryItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  content: z.string().nullable(),
  timestamp: z.coerce.date(),
  location: z.string().nullable(),
  photos: z.array(z.string()),
});

/**
 * Friend focus session summary (internal service return shape)
 */
export const FriendFocusSessionSummarySchema = z.object({
  id: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  minutes: z.number(),
  createdAt: z.coerce.date(),
  memories: z.array(FriendFocusSessionMemoryItemSchema),
});

export type FriendFocusSessionSummary = z.infer<typeof FriendFocusSessionSummarySchema>;

/**
 * Memory item in focus session (API response, uses string for dates)
 */
const SessionMemoryItemSchema = z.object({
  id: z.string(),
  type: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  timestamp: z.string().optional(),
  location: z.string().optional().nullable(),
  photos: z.array(z.string()),
});

/**
 * Focus session item with memories
 */
const FriendFocusSessionItemSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  minutes: z.number().optional(),
  createdAt: z.string().optional(),
  memories: z.array(SessionMemoryItemSchema),
});

/**
 * Schema for get friend focus sessions response
 */
export const GetFriendFocusSessionsResponseSchema = z.object({
  success: z.boolean(),
  sessions: z.array(FriendFocusSessionItemSchema).optional(),
  error: z.string().optional(),
});

export type GetFriendFocusSessionsResponse = z.infer<typeof GetFriendFocusSessionsResponseSchema>;
