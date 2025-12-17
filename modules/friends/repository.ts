import prisma from '@/lib/prisma';

/**
 * Get friends list for a user with details
 * Note: With bidirectional friend relationships, we only query records where
 * sourceUserId = currentUserId to get the current user's friend list (no duplicates)
 */
export const getFriendsWithDetails = async (sourceUserId: string) => {
  return await prisma.friend.findMany({
    where: {
      sourceUserId: sourceUserId,
    },
    include: {
      user: true, // Include User data for name, avatar
      focusSessionFriends: {
        include: {
          focusSession: {
            include: {
              memories: {
                include: {
                  photos: true,
                },
                orderBy: {
                  timestamp: 'desc',
                },
                take: 5, // Get recent memories
              },
            },
          },
        },
      },
    },
  });
};

/**
 * Get friends list for a user with their last message
 * Note: With bidirectional friend relationships, we only query records where
 * sourceUserId = currentUserId to get the current user's friend list (no duplicates)
 */
export const getFriendsWithLastMessage = async (sourceUserId: string) => {
  // Get all friends with their last message
  const friends = await prisma.friend.findMany({
    where: {
      sourceUserId: sourceUserId,
    },
    include: {
      user: true, // Include User data for name, avatar, bio
      focusSessionFriends: {
        include: {
          focusSession: {
            include: {
              memories: {
                include: {
                  photos: true,
                },
                orderBy: {
                  timestamp: 'desc',
                },
                take: 5, // Get recent memories
              },
            },
          },
        },
      },
      messages: {
        orderBy: {
          timestamp: 'desc',
        },
        take: 1, // Get only the last message
      },
    },
    orderBy: {
      createdAt: 'desc', // Default order by creation time
    },
  });

  return friends;
};

export const checkIfFriendExists = async (userId: string, sourceUserId: string) => {
  // Check if a friend relationship already exists
  const existingFriend = await prisma.friend.findFirst({
    where: {
      userId: userId,
      sourceUserId: sourceUserId,
    },
  });

  return !!existingFriend;
};

export const getFriendById = async (friendId: string, sourceUserId: string) => {
  // Get a friend by ID, ensuring it belongs to the source user
  return await prisma.friend.findFirst({
    where: {
      id: friendId,
      sourceUserId: sourceUserId,
    },
    include: {
      user: true, // Include User data for name, avatar
      focusSessionFriends: {
        include: {
          focusSession: {
            include: {
              memories: {
                include: {
                  photos: true,
                },
                orderBy: {
                  timestamp: 'desc',
                },
                take: 10, // Get recent memories for profile
              },
            },
          },
        },
      },
    },
  });
};

/**
 * Get friend count for a user
 * Counts how many friends a user has (where sourceUserId = userId)
 */
export const getUserFriendCount = async (userId: string): Promise<number> => {
  return await prisma.friend.count({
    where: { sourceUserId: userId },
  });
};

/**
 * Get friends with focus sessions in the last 3 months for Spring Bloom recap
 * Returns friends with their total hours and memories from the last quarter
 */
export const getFriendsForSpringBloom = async (sourceUserId: string) => {
  // Calculate date 3 months ago
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  threeMonthsAgo.setHours(0, 0, 0, 0);

  return await prisma.friend.findMany({
    where: {
      sourceUserId: sourceUserId,
      focusSessionFriends: {
        some: {
          focusSession: {
            startTime: {
              gte: threeMonthsAgo,
            },
          },
        },
      },
    },
    include: {
      user: true, // Include User data for name, avatar
      focusSessionFriends: {
        where: {
          focusSession: {
            startTime: {
              gte: threeMonthsAgo,
            },
          },
        },
        include: {
          focusSession: {
            include: {
              memories: {
                where: {
                  content: {
                    not: null,
                  },
                },
                select: {
                  id: true,
                  content: true,
                  timestamp: true,
                },
                orderBy: {
                  timestamp: 'desc',
                },
              },
            },
          },
        },
      },
    },
  });
};
