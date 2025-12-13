'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function addFriendFromUser(userId: string, userName: string) {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if friend already exists (by name or email in bio)
    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { name: user.name || userName },
          ...(user.email ? [{ bio: { contains: user.email } }] : []),
        ],
      },
    });

    if (existingFriend) {
      return { success: false, error: 'Friend already exists', alreadyExists: true };
    }

    // Create a friend entry
    const friend = await prisma.friend.create({
      data: {
        name: user.name || userName,
        avatar: user.image || undefined,
        bio: `Friend added from user: ${user.email || user.id}`,
      },
    });

    revalidatePath('/');
    revalidatePath('/messages');

    return { success: true, friend };
  } catch (error) {
    console.error('Failed to add friend from user:', error);
    return { success: false, error: 'Failed to add friend' };
  }
}

export async function checkIfUserIsFriend(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, isFriend: false };
    }

    // Check if friend exists
    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { name: user.name || '' },
          ...(user.email ? [{ bio: { contains: user.email } }] : []),
        ],
      },
    });

    return { success: true, isFriend: !!existingFriend };
  } catch (error) {
    console.error('Failed to check if user is friend:', error);
    return { success: false, isFriend: false };
  }
}

export async function createFriend(data: {
  name: string;
  bio: string;
  school?: string;
  major?: string;
  avatarUrl?: string;
}) {
  try {
    const friend = await prisma.friend.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
    });

    revalidatePath('/');
    revalidatePath('/messages');

    return { success: true, friend };
  } catch (error) {
    console.error('Failed to create friend:', error);
    return { success: false, error: 'Failed to create friend' };
  }
}

export async function updateFriend(
  friendId: string,
  data: {
    name?: string;
    bio?: string;
    school?: string;
    major?: string;
    avatarUrl?: string;
  }
) {
  try {
    const friend = await prisma.friend.update({
      where: { id: friendId },
      data,
    });

    revalidatePath('/');
    revalidatePath('/messages');

    return { success: true, friend };
  } catch (error) {
    console.error('Failed to update friend:', error);
    return { success: false, error: 'Failed to update friend' };
  }
}

export async function deleteFriend(friendId: string) {
  try {
    // Delete all related data first
    await prisma.interaction.deleteMany({
      where: { friendId },
    });

    await prisma.post.deleteMany({
      where: { friendId },
    });

    await prisma.focusSession.deleteMany({
      where: { friendId },
    });

    // Then delete the friend
    await prisma.friend.delete({
      where: { id: friendId },
    });

    revalidatePath('/');
    revalidatePath('/messages');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete friend:', error);
    return { success: false, error: 'Failed to delete friend' };
  }
}

