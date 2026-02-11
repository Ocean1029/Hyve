import { z } from 'zod';

/**
 * Interaction type enum
 */
export const InteractionTypeSchema = z.enum(['message', 'call', 'meet', 'note']);
export type InteractionType = z.infer<typeof InteractionTypeSchema>;

/**
 * Schema for adding an interaction (POST body)
 */
export const AddInteractionRequestSchema = z.object({
  friendId: z.string().min(1, 'Friend ID is required'),
  type: InteractionTypeSchema,
  content: z.string().optional(),
});

export type AddInteractionRequest = z.infer<typeof AddInteractionRequestSchema>;

/**
 * Schema for add interaction response
 */
export const AddInteractionResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  interaction: z.record(z.unknown()).optional(),
});

export type AddInteractionResponse = z.infer<typeof AddInteractionResponseSchema>;
