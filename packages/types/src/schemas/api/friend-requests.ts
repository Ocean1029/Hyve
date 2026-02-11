import { z } from 'zod';

/**
 * Schema for sending a friend request
 */
export const SendFriendRequestSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
});

export type SendFriendRequest = z.infer<typeof SendFriendRequestSchema>;

/**
 * Schema for friend request status response
 */
export const FriendRequestStatusSchema = z.enum(['none', 'sent', 'received', 'accepted', 'rejected', 'pending']);
export type FriendRequestStatus = z.infer<typeof FriendRequestStatusSchema>;

export const CheckFriendRequestStatusResponseSchema = z.object({
  status: FriendRequestStatusSchema,
  requestId: z.string().optional(),
});
export type CheckFriendRequestStatusResponse = z.infer<typeof CheckFriendRequestStatusResponseSchema>;

/**
 * Schema for generic success/error response
 */
export const FriendRequestActionResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  alreadyExists: z.boolean().optional(),
});
export type FriendRequestActionResult = z.infer<typeof FriendRequestActionResultSchema>;

/**
 * Schema for pending request item
 */
export const PendingRequestItemSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  status: z.string(),
  createdAt: z.string().optional(),
});

export const PendingRequestsResponseSchema = z.object({
  success: z.boolean(),
  requests: z.array(PendingRequestItemSchema).optional(),
  error: z.string().optional(),
});
export type PendingRequestsResponse = z.infer<typeof PendingRequestsResponseSchema>;
