import { z } from 'zod';

/**
 * Schema for generating chat response request
 */
export const GenerateChatResponseRequestSchema = z.object({
  friendName: z.string().min(1, 'Friend name is required'),
  friendBio: z.string().optional(),
  lastMessage: z.string().min(1, 'Last message is required'),
});

export type GenerateChatResponseRequest = z.infer<typeof GenerateChatResponseRequestSchema>;

/**
 * Schema for generating chat response response
 */
export const GenerateChatResponseResponseSchema = z.object({
  replyText: z.string(),
});

export type GenerateChatResponseResponse = z.infer<typeof GenerateChatResponseResponseSchema>;

/**
 * Schema for generating tags request
 */
export const GenerateTagsRequestSchema = z.object({
  memoryContents: z.array(z.string()).min(1, 'At least one memory content is required'),
});

export type GenerateTagsRequest = z.infer<typeof GenerateTagsRequestSchema>;

/**
 * Schema for generating tags response
 */
export const GenerateTagsResponseSchema = z.object({
  tags: z.array(z.string()),
});

export type GenerateTagsResponse = z.infer<typeof GenerateTagsResponseSchema>;

/**
 * Schema for generating icebreaker request
 */
export const GenerateIcebreakerRequestSchema = z.object({
  context: z.string().optional().default('college students hanging out'),
});

export type GenerateIcebreakerRequest = z.infer<typeof GenerateIcebreakerRequestSchema>;

/**
 * Schema for generating icebreaker response
 */
export const GenerateIcebreakerResponseSchema = z.object({
  question: z.string(),
});

export type GenerateIcebreakerResponse = z.infer<typeof GenerateIcebreakerResponseSchema>;
