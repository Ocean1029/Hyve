import prisma from '@/lib/prisma';

export const getFriendsWithDetails = async () => {
  return await prisma.friend.findMany({
    include: {
      interactions: true,
      posts: true,
    },
  });
};

export const getFriendsWithLastMessage = async () => {
  // Get all friends with their last message
  const friends = await prisma.friend.findMany({
    include: {
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

export const checkIfFriendExists = async (userName: string, userEmail?: string) => {
  // Check if a friend with the same name or email already exists
  const existingFriend = await prisma.friend.findFirst({
    where: {
      OR: [
        { name: userName },
        ...(userEmail ? [{ bio: { contains: userEmail } }] : []),
      ],
    },
  });

  return !!existingFriend;
};
