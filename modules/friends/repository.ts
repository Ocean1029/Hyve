import prisma from '@/lib/prisma';

export const getFriendsWithDetails = async (sourceUserId: string) => {
  return await prisma.friend.findMany({
    where: {
      sourceUserId: sourceUserId,
    },
    include: {
      user: true, // Include User data for name, avatar
      interactions: true,
      posts: true,
    },
  });
};

export const getFriendsWithLastMessage = async (sourceUserId: string) => {
  // Get all friends with their last message
  const friends = await prisma.friend.findMany({
    where: {
      sourceUserId: sourceUserId,
    },
    include: {
      user: true, // Include User data for name, avatar, bio
      interactions: true,
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
