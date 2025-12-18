'use server';

import { revalidatePath } from 'next/cache';
import { createMessage, getMessages, getFocusSessionsByFriendId } from './repository';

export async function sendMessage(
  friendId: string,
  senderId: string,
  content: string
) {
  try {
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
    const focusSessions = await getFocusSessionsByFriendId(friendId);
    
    return { 
      success: true, 
      sessions: focusSessions.map((fs: any) => ({
        id: fs.id,
        startTime: fs.startTime,
        endTime: fs.endTime,
        minutes: fs.minutes,
        createdAt: fs.createdAt,
        memories: fs.memories.map((m: any) => ({
          id: m.id,
          type: m.type,
          content: m.content,
          timestamp: m.timestamp,
          location: m.location,
          photos: m.photos.map((p: any) => p.photoUrl),
        })),
      })),
    };
  } catch (error) {
    console.error('Failed to get focus sessions:', error);
    return { success: false, error: 'Failed to get focus sessions' };
  }
}


