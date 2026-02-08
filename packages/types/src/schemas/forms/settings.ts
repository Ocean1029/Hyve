import { z } from 'zod';

/**
 * Schema for updating user name
 */
export const UpdateNameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
});

export type UpdateNameData = z.infer<typeof UpdateNameSchema>;

/**
 * Schema for updating privacy settings
 */
export const UpdatePrivacySchema = z.object({
  privacy: z.enum(['public', 'friends', 'private'], {
    errorMap: () => ({ message: 'Invalid privacy setting' }),
  }),
});

export type UpdatePrivacyData = z.infer<typeof UpdatePrivacySchema>;
