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
      posts: true,
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
      posts: true,
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
      posts: true,
    },
  });
};
