import { z } from 'zod';

/**
 * Schema for sending a chat message
 */
export const SendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message must be less than 1000 characters'),
});

export type SendMessageData = z.infer<typeof SendMessageSchema>;
