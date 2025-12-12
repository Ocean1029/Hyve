'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function createPost(
  userId: string,
  friendId: string,
  photoUrl: string,
  caption?: string,
  location?: string,
  mood?: string
) {
  try {
    const post = await prisma.post.create({
      data: {
        userId,
        friendId,
        photoUrl,
        caption,
        location,
        mood,
        timestamp: new Date(),
      },
    });

    // Revalidate the profile page to show the new post
    revalidatePath('/profile');

    return { success: true, post };
  } catch (error) {
    console.error('Failed to create post:', error);
    return { success: false, error: 'Failed to create post' };
  }
}

export async function getUserPosts(userId: string, limit = 20) {
  try {
    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        friend: true,
      },
    });

    return { success: true, posts };
  } catch (error) {
    console.error('Failed to get posts:', error);
    return { success: false, error: 'Failed to get posts' };
  }
}

export async function deletePost(postId: string, userId: string) {
  try {
    // Verify the post belongs to the user before deleting
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.userId !== userId) {
      return { success: false, error: 'Post not found or unauthorized' };
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete post:', error);
    return { success: false, error: 'Failed to delete post' };
  }
}

