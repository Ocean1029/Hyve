import { z } from 'zod';

/**
 * Schema for upload response
 */
export const UploadResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url().optional(),
  error: z.string().optional(),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;
