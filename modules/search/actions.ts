'use server';

import prisma from '@/lib/prisma';

export async function searchUsers(query: string) {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, users: [] };
    }

    const searchQuery = query.trim();

    // Search users by ID, name, or email (fuzzy search using contains)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            id: {
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
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            focusSessions: true,
          },
        },
      },
      take: 20, // Limit results
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, users };
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

    // Search friends by ID, name, or bio
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
            name: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            bio: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            posts: true,
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

