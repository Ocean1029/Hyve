'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getUserFriendCount } from '@/modules/friends/repository';

export async function searchUsers(query: string) {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, users: [] };
    }

    // Get current user session to exclude self from results
    const session = await auth();
    const currentUserId = session?.user?.id;

    const searchQuery = query.trim();

    // Search users by ID, userId, name, or email (fuzzy search using contains)
    // Exclude the current user from results
    const users = await prisma.user.findMany({
      where: {
        ...(currentUserId && {
          id: {
            not: currentUserId,
          },
        }),
        OR: [
          {
            id: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            userId: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            focusSessions: true,
          },
        },
      },
      take: 20, // Limit results
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add friend count for each user
    const usersWithFriendCount = await Promise.all(
      users.map(async (user: typeof users[0]) => {
        const friendCount = await getUserFriendCount(user.id);
        return {
          ...user,
          friendCount,
        };
      })
    );

    return { success: true, users: usersWithFriendCount };
  } catch (error) {
    console.error('Failed to search users:', error);
    return { success: false, error: 'Failed to search users' };
  }
}

export async function searchFriends(query: string) {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, friends: [] };
    }

    const searchQuery = query.trim();

    // Search friends by ID or name
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          {
            id: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            user: {
              name: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            interactions: true,
          },
        },
      },
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, friends };
  } catch (error) {
    console.error('Failed to search friends:', error);
    return { success: false, error: 'Failed to search friends' };
  }
}

/**
 * Get recommended users for the current user
 * Excludes the current user and users who are already friends
 * Prioritizes users with higher activity (posts + focusSessions)
 */
export async function getRecommendedUsers() {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }
    const currentUserId = session.user.id;

    // Get all friend IDs that the current user has already added
    const existingFriends = await prisma.friend.findMany({
      where: {
        sourceUserId: currentUserId,
      },
      select: {
        userId: true,
      },
    });

    const existingFriendIds = existingFriends.map((f: { userId: string }) => f.userId);
    // Also exclude the current user itself
    const excludedUserIds = [...existingFriendIds, currentUserId];

    // Get all users with their activity counts
    // We'll calculate activity score based on focusSessions
    type UserWithCounts = {
      id: string;
      userId: string | null;
      name: string | null;
      email: string | null;
      image: string | null;
      createdAt: Date;
      _count: {
        focusSessions: number;
      };
    };

    const allUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: excludedUserIds,
        },
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            focusSessions: true,
          },
        },
      },
    }) as UserWithCounts[];

    // Calculate activity score and sort by it
    // Activity score = focusSessions count
    type UserWithScore = UserWithCounts & { activityScore: number };

    const usersWithScore: UserWithScore[] = allUsers.map((user: UserWithCounts) => ({
      ...user,
      activityScore: user._count.focusSessions || 0,
    }));

    // Sort by activity score (descending), then by creation date (newest first)
    usersWithScore.sort((a: UserWithScore, b: UserWithScore) => {
      if (b.activityScore !== a.activityScore) {
        return b.activityScore - a.activityScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Take top 12 users (active users)
    const activeUsers: UserWithCounts[] = usersWithScore.slice(0, 12).map((userWithScore: UserWithScore) => {
      const { activityScore, ...user } = userWithScore;
      return user;
    });

    // If we have less than 15 users, fill with random users from the remaining pool
    const remainingUsers = usersWithScore.slice(12);
    const randomUsers: UserWithCounts[] = remainingUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(0, 15 - activeUsers.length))
      .map((userWithScore: UserWithScore) => {
        const { activityScore, ...user } = userWithScore;
        return user;
      });

    // Combine active and random users, limit to 15 total
    const combinedUsers = [...activeUsers, ...randomUsers].slice(0, 15);

    // Add friend count for each recommended user
    const recommendedUsersWithFriendCount = await Promise.all(
      combinedUsers.map(async (user) => {
        const friendCount = await getUserFriendCount(user.id);
        return {
          ...user,
          friendCount,
        };
      })
    );

    return { success: true, users: recommendedUsersWithFriendCount };
  } catch (error) {
    console.error('Failed to get recommended users:', error);
    return { success: false, error: 'Failed to get recommended users' };
  }
}


