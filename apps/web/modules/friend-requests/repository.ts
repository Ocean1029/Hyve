import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Create a friend request
 */
export async function createFriendRequest(
  senderId: string,
  receiverId: string
) {
  return await prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
      status: 'pending',
    },
    include: {
      sender: {
        select: {
          id: true,
          userId: true,
          name: true,
          image: true,
        },
      },
      receiver: {
        select: {
          id: true,
          userId: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

/**
 * Get friend request by ID
 */
export async function getFriendRequestById(requestId: string) {
  return await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: {
        select: {
          id: true,
          userId: true,
          name: true,
          image: true,
        },
      },
      receiver: {
        select: {
          id: true,
          userId: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

/**
 * Get friend request between two users
 */
export async function getFriendRequestBetweenUsers(
  userId1: string,
  userId2: string
) {
  return await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          userId: true,
          name: true,
          image: true,
        },
      },
      receiver: {
        select: {
          id: true,
          userId: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

/**
 * Get pending friend requests received by a user
 */
export async function getPendingRequestsReceived(receiverId: string) {
  return await prisma.friendRequest.findMany({
    where: {
      receiverId,
      status: 'pending',
    },
    include: {
      sender: {
        select: {
          id: true,
          userId: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get pending friend requests sent by a user
 */
export async function getPendingRequestsSent(senderId: string) {
  return await prisma.friendRequest.findMany({
    where: {
      senderId,
      status: 'pending',
    },
    include: {
      receiver: {
        select: {
          id: true,
          userId: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Update friend request status
 */
export async function updateFriendRequestStatus(
  requestId: string,
  status: 'accepted' | 'rejected'
) {
  return await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status },
  });
}

/**
 * Accept friend request: create bidirectional Friend relationships and update request status
 * Returns the friend relationship from receiver's perspective
 */
export async function acceptFriendRequestTransaction(
  requestId: string,
  senderId: string,
  receiverId: string
) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingFriend1 = await tx.friend.findUnique({
      where: {
        userId_sourceUserId: { userId: senderId, sourceUserId: receiverId },
      },
    });
    const existingFriend2 = await tx.friend.findUnique({
      where: {
        userId_sourceUserId: { userId: receiverId, sourceUserId: senderId },
      },
    });

    if (existingFriend1 && existingFriend2) {
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      });
      return { friend: existingFriend2, requestUpdated: true };
    }

    const friend1 =
      existingFriend1 ||
      (await tx.friend.create({
        data: { userId: senderId, sourceUserId: receiverId },
        include: { user: true },
      }));
    const friend2 =
      existingFriend2 ||
      (await tx.friend.create({
        data: { userId: receiverId, sourceUserId: senderId },
        include: { user: true },
      }));

    await tx.friendRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });

    return { friend: friend1, requestUpdated: true };
  });
}

