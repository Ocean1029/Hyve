import { z } from 'zod';

/**
 * Search user item (from searchUsers / getRecommendedUsers)
 */
const SearchUserItemSchema = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  friendCount: z.number().optional(),
  _count: z.object({ focusSessionsAsUser: z.number() }).optional(),
});

/**
 * Schema for search users response
 */
export const SearchUsersResponseSchema = z.object({
  success: z.boolean(),
  users: z.array(SearchUserItemSchema).optional(),
  error: z.string().optional(),
});

export type SearchUsersResponse = z.infer<typeof SearchUsersResponseSchema>;

/**
 * Friend item (from searchFriends)
 */
const SearchFriendItemSchema = z.object({
  id: z.string(),
  user: z.object({
    id: z.string(),
    userId: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
  }).optional(),
}).passthrough();

/**
 * Schema for search friends response
 */
export const SearchFriendsResponseSchema = z.object({
  success: z.boolean(),
  friends: z.array(SearchFriendItemSchema).optional(),
  error: z.string().optional(),
});

export type SearchFriendsResponse = z.infer<typeof SearchFriendsResponseSchema>;

/**
 * Schema for get recommended users response
 */
export const GetRecommendedUsersResponseSchema = z.object({
  success: z.boolean(),
  users: z.array(SearchUserItemSchema).optional(),
  error: z.string().optional(),
});

export type GetRecommendedUsersResponse = z.infer<typeof GetRecommendedUsersResponseSchema>;
