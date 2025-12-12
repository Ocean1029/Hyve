'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

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

