import prisma from '@/lib/prisma';

/**
 * Get friends list for a user with details
 * Note: With bidirectional friend relationships, we only query records where
 * sourceUserId = currentUserId to get the current user's friend list (no duplicates)
 */
export const getFriendsWithDetails = async (sourceUserId: string) => {
  const friends = await prisma.friend.findMany({
    where: {
      sourceUserId: sourceUserId,
    },
    include: {
      user: true, // Include User data for name, avatar
    },
  });

  // Get focus sessions where both current user and friend participated
  const friendUserIds = friends.map((f: typeof friends[0]) => f.userId);
  
  if (friendUserIds.length === 0) {
    return friends.map((f: typeof friends[0]) => ({ ...f, focusSessionUsers: [] }));
  }

  // Find sessions that contain both sourceUserId and at least one friend userId
  const focusSessions = await prisma.focusSession.findMany({
    where: {
      AND: [
        {
          users: {
            some: {
              userId: sourceUserId,
            },
          },
        },
        {
          users: {
            some: {
              userId: {
                in: friendUserIds,
              },
            },
          },
        },
      ],
    },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
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
  });

  // Map focus sessions to friends
  return friends.map((friend: typeof friends[0]) => {
    const friendSessions = focusSessions.filter((session: typeof focusSessions[0]) =>
      session.users.some((fsu: typeof session.users[0]) => fsu.userId === friend.userId)
    );

    return {
      ...friend,
      focusSessionUsers: friendSessions.map((session: typeof focusSessions[0]) => ({
        focusSession: session,
      })),
    };
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

  // Get focus sessions where both current user and friends participated
  const friendUserIds = friends.map((f: typeof friends[0]) => f.userId);
  
  if (friendUserIds.length === 0) {
    return friends.map((f: typeof friends[0]) => ({ ...f, focusSessionUsers: [] }));
  }

  // Find sessions that contain both sourceUserId and at least one friend userId
  const focusSessions = await prisma.focusSession.findMany({
    where: {
      AND: [
        {
          users: {
            some: {
              userId: sourceUserId,
            },
          },
        },
        {
          users: {
            some: {
              userId: {
                in: friendUserIds,
              },
            },
          },
        },
      ],
    },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
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
  });

  // Map focus sessions to friends
  return friends.map((friend: typeof friends[0]) => {
    const friendSessions = focusSessions.filter((session: typeof focusSessions[0]) =>
      session.users.some((fsu: typeof session.users[0]) => fsu.userId === friend.userId)
    );

    return {
      ...friend,
      focusSessionUsers: friendSessions.map((session: typeof focusSessions[0]) => ({
        focusSession: session,
      })),
    };
  });
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
  const friend = await prisma.friend.findFirst({
    where: {
      id: friendId,
      sourceUserId: sourceUserId,
    },
    include: {
      user: true, // Include User data for name, avatar
    },
  });

  if (!friend) {
    return null;
  }

  // Get focus sessions where both current user and friend participated
  const focusSessions = await prisma.focusSession.findMany({
    where: {
      AND: [
        {
          users: {
            some: {
              userId: sourceUserId,
            },
          },
        },
        {
          users: {
            some: {
              userId: friend.userId,
            },
          },
        },
      ],
    },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
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
  });

  return {
    ...friend,
    focusSessionUsers: focusSessions.map((session: typeof focusSessions[0]) => ({
      focusSession: session,
    })),
  };
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

  // Get friends who have participated in focus sessions with the source user
  // We need to find focus sessions where both users participated
  const focusSessions = await prisma.focusSession.findMany({
    where: {
      users: {
        some: {
          userId: sourceUserId,
        },
      },
      startTime: {
        gte: threeMonthsAgo,
      },
    },
    include: {
      users: {
        include: {
          user: true,
        },
      },
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
          userId: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
      },
    },
  });

  // Get unique friend user IDs from these sessions
  const friendUserIds = new Set<string>();
  focusSessions.forEach((session: typeof focusSessions[0]) => {
    session.users.forEach((fsu: typeof session.users[0]) => {
      if (fsu.userId !== sourceUserId) {
        friendUserIds.add(fsu.userId);
      }
    });
  });

  // Get friends for these user IDs
  const friends = await prisma.friend.findMany({
    where: {
      sourceUserId: sourceUserId,
      userId: {
        in: Array.from(friendUserIds),
      },
    },
    include: {
      user: true,
    },
  });

  // Map sessions to friends
  return friends.map((friend: typeof friends[0]) => {
    const friendSessions = focusSessions.filter((session: typeof focusSessions[0]) =>
      session.users.some((fsu: typeof session.users[0]) => fsu.userId === friend.userId)
    );

    return {
      ...friend,
      focusSessionUsers: friendSessions.map((session: typeof focusSessions[0]) => ({
        focusSession: {
          ...session,
          memories: session.memories.filter((m: typeof session.memories[0]) => m.userId === friend.userId),
        },
      })),
    };
  });
};
