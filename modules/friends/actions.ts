'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getSpringBloomData, SpringBloomEntry } from './service';

export async function addFriendFromUser(userId: string) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }
    const sourceUserId = session.user.id;

    // Prevent adding yourself as a friend
    if (userId === sourceUserId) {
      return { success: false, error: 'Cannot add yourself as a friend' };
    }

    // Get target user details
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    // Verify source user exists
    const sourceUser = await prisma.user.findUnique({
      where: { id: sourceUserId },
    });

    if (!sourceUser) {
      return { success: false, error: 'Source user not found' };
    }

    // Check if friend relationship already exists using unique constraint
    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_sourceUserId: {
          userId: userId,
          sourceUserId: sourceUserId,
        },
      },
    });

    if (existingFriend) {
      return { success: false, error: 'Friend already exists', alreadyExists: true };
    }

    // Create friend relationship using transaction to prevent race conditions
    const friend = await prisma.$transaction(async (tx: typeof prisma) => {
      // Double-check within transaction
      const existing = await tx.friend.findUnique({
        where: {
          userId_sourceUserId: {
            userId: userId,
            sourceUserId: sourceUserId,
          },
        },
      });

      if (existing) {
        throw new Error('Friend relationship already exists');
      }

      // Create the friend entry
      return await tx.friend.create({
        data: {
          userId: userId,
          sourceUserId: sourceUserId,
        },
        include: {
          user: true,
        },
      });
    });

    revalidatePath('/');
    revalidatePath('/friends');

    return { success: true, friend };
  } catch (error: any) {
    console.error('Failed to add friend from user:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002' || error.message?.includes('already exists')) {
      return { success: false, error: 'Friend already exists', alreadyExists: true };
    }
    
    return { success: false, error: error.message || 'Failed to add friend' };
  }
}

export async function checkIfUserIsFriend(userId: string) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, isFriend: false };
    }
    const sourceUserId = session.user.id;

    // Check if friend relationship exists (bidirectional check)
    const existingFriend1 = await prisma.friend.findUnique({
      where: {
        userId_sourceUserId: {
          userId: userId,
          sourceUserId: sourceUserId,
        },
      },
    });

    const existingFriend2 = await prisma.friend.findUnique({
      where: {
        userId_sourceUserId: {
          userId: sourceUserId,
          sourceUserId: userId,
        },
      },
    });

    // If either relationship exists, they are friends
    return { success: true, isFriend: !!(existingFriend1 || existingFriend2) };
  } catch (error) {
    console.error('Failed to check if user is friend:', error);
    return { success: false, isFriend: false };
  }
}

export async function createFriend(userId: string) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }
    const sourceUserId = session.user.id;

    // Prevent adding yourself as a friend
    if (userId === sourceUserId) {
      return { success: false, error: 'Cannot add yourself as a friend' };
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    // Check if friend relationship already exists
    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_sourceUserId: {
          userId: userId,
          sourceUserId: sourceUserId,
        },
      },
    });

    if (existingFriend) {
      return { success: false, error: 'Friend already exists', alreadyExists: true };
    }

    // Create friend relationship using transaction
    const friend = await prisma.$transaction(async (tx: typeof prisma) => {
      const existing = await tx.friend.findUnique({
        where: {
          userId_sourceUserId: {
            userId: userId,
            sourceUserId: sourceUserId,
          },
        },
      });

      if (existing) {
        throw new Error('Friend relationship already exists');
      }

      return await tx.friend.create({
        data: {
          userId: userId,
          sourceUserId: sourceUserId,
        },
        include: {
          user: true,
        },
      });
    });

    revalidatePath('/');
    revalidatePath('/friends');

    return { success: true, friend };
  } catch (error: any) {
    console.error('Failed to create friend:', error);
    
    if (error.code === 'P2002' || error.message?.includes('already exists')) {
      return { success: false, error: 'Friend already exists', alreadyExists: true };
    }
    
    return { success: false, error: error.message || 'Failed to create friend' };
  }
}

// Note: updateFriend is removed as Friend no longer has mutable fields
// User data (name, avatar) should be updated in User model instead

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
    revalidatePath('/friends');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete friend:', error);
    return { success: false, error: 'Failed to delete friend' };
  }
}

/**
 * Get Spring Bloom data for the current user
 * Returns ranked list of friends with total hours and tags from the last 3 months
 */
export async function getSpringBloomDataAction(): Promise<{ success: boolean; data?: SpringBloomEntry[]; error?: string }> {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      console.error('Spring Bloom: No user session');
      return { success: false, error: 'Unauthorized: Please log in' };
    }
    const sourceUserId = session.user.id;
    console.log('Spring Bloom: Loading data for user', sourceUserId);

    // Get Spring Bloom data
    const data = await getSpringBloomData(sourceUserId);
    console.log('Spring Bloom: Data loaded successfully', data.length, 'friends');

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to get Spring Bloom data:', error);
    return { success: false, error: error.message || 'Failed to get Spring Bloom data' };
  }
}

