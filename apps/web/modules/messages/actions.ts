'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { createMessage, getMessages } from './repository';
import { getFriendFocusSessionsService } from './service';

async function verifyFriendAccess(friendId: string, currentUserId: string): Promise<boolean> {
  const friend = await prisma.friend.findUnique({
    where: { id: friendId },
    select: { sourceUserId: true, userId: true },
  });
  if (!friend) return false;
  return friend.sourceUserId === currentUserId || friend.userId === currentUserId;
}

export async function sendMessage(
  friendId: string,
  senderId: string,
  content: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    if (session.user.id !== senderId) {
      return { success: false, error: 'Forbidden: sender must be current user' };
    }
    const hasAccess = await verifyFriendAccess(friendId, session.user.id);
    if (!hasAccess) {
      return { success: false, error: 'Forbidden: no access to this conversation' };
    }

    const message = await createMessage(friendId, senderId, content);

    // Revalidate the friends page and the specific chat page
    revalidatePath('/friends');
    revalidatePath(`/friends/${friendId}`);

    return { success: true, message };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export async function getConversation(friendId: string, limit = 50) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', messages: [] };
    }
    const hasAccess = await verifyFriendAccess(friendId, session.user.id);
    if (!hasAccess) {
      return { success: false, error: 'Forbidden: no access to this conversation', messages: [] };
    }

    const messages = await getMessages(friendId, limit);

    return { success: true, messages };
  } catch (error) {
    console.error('Failed to get messages:', error);
    return { success: false, error: 'Failed to get messages' };
  }
}

/**
 * Get all FocusSessions for a friend, including memories and photos
 */
export async function getFriendFocusSessions(friendId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', sessions: [] };
    }
    const hasAccess = await verifyFriendAccess(friendId, session.user.id);
    if (!hasAccess) {
      return { success: false, error: 'Forbidden: no access to this friend', sessions: [] };
    }

    const sessions = await getFriendFocusSessionsService(friendId);
    return { success: true, sessions };
  } catch (error) {
    console.error('Failed to get focus sessions:', error);
    return { success: false, error: 'Failed to get focus sessions' };
  }
}


