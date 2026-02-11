import { z } from 'zod';

/**
 * Generic error response schema
 */
export const ErrorSchema = z.object({
  error: z.string().describe('Error message'),
  success: z.boolean().optional().default(false),
});

export type Error = z.infer<typeof ErrorSchema>;

/**
 * Generic success response schema
 */
export const SuccessSchema = z.object({
  success: z.boolean().optional().default(true),
});

export type Success = z.infer<typeof SuccessSchema>;
