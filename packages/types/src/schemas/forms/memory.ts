import { z } from 'zod';

/**
 * Schema for memory form validation
 */
export const MemoryFormSchema = z.object({
  eventName: z.string().min(1, 'Event name is required').max(100, 'Event name must be less than 100 characters'),
  caption: z.string().max(500, 'Caption must be less than 500 characters').optional(),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
  category: z.enum(['📚 Study', '🍔 Eat', '🏋️ Gym', '🚗 Drive', '☕ Chill', '🎮 Game', '🎨 Create'], {
    errorMap: () => ({ message: 'Invalid category selected' }),
  }),
  rating: z.number().int().min(0, 'Rating must be at least 0').max(10, 'Rating must be at most 10'),
  photos: z.array(z.string().url('Invalid photo URL')).max(10, 'Maximum 10 photos allowed').optional(),
});

export type MemoryFormData = z.infer<typeof MemoryFormSchema>;
