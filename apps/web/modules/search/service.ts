import type { UserSearchResult, UserWithFriendCount } from '@hyve/types';
import { getUserFriendCount } from '@/modules/friends/repository';
import {
  searchUsersByQuery,
  searchFriendsByQuery,
  getUsersExcluding,
  getFriendUserIds,
} from './repository';

/**
 * Search users and add friend count for each
 */
export async function searchUsersService(
  query: string,
  currentUserId?: string | null
): Promise<UserWithFriendCount[]> {
  const excludeIds = currentUserId ? [currentUserId] : [];
  const users = await searchUsersByQuery(query, excludeIds);

  return Promise.all(
    users.map(async (user: UserSearchResult) => ({
      ...user,
      friendCount: await getUserFriendCount(user.id),
    }))
  );
}

/**
 * Search friends for the current user
 */
export async function searchFriendsService(
  query: string,
  sourceUserId: string
) {
  return searchFriendsByQuery(query, sourceUserId);
}

/**
 * Get recommended users (excludes current user and existing friends)
 * Prioritizes users with higher activity, fills remainder with random users
 */
export async function getRecommendedUsersService(
  currentUserId: string
): Promise<UserWithFriendCount[]> {
  const friendUserIds = await getFriendUserIds(currentUserId);
  const excludedIds = [...friendUserIds, currentUserId];

  const allUsers = await getUsersExcluding(excludedIds);

  type UserWithCounts = (typeof allUsers)[0];
  type UserWithScore = UserWithCounts & { activityScore: number };

  const usersWithScore: UserWithScore[] = allUsers.map((user: UserWithCounts) => ({
    ...user,
    activityScore: user._count.focusSessionsAsUser || 0,
  }));

  usersWithScore.sort((a, b) => {
    if (b.activityScore !== a.activityScore) {
      return b.activityScore - a.activityScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activeUsers = usersWithScore.slice(0, 12);
  const remaining = usersWithScore.slice(12);
  const randomUsers = remaining
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(0, 15 - activeUsers.length));

  const combined = [...activeUsers, ...randomUsers].slice(0, 15);

  return Promise.all(
    combined.map(async (u: UserWithScore) => {
      const { activityScore, ...user } = u;
      return {
        ...user,
        friendCount: await getUserFriendCount(user.id),
      };
    })
  );
}
