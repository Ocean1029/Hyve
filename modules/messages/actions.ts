'use server';

import { revalidatePath } from 'next/cache';
import { createMessage, getMessages } from './repository';

export async function sendMessage(
  friendId: string,
  senderId: string,
  content: string
) {
  try {
    const message = await createMessage(friendId, senderId, content);

    // Revalidate the messages page and the specific chat page
    revalidatePath('/messages');
    revalidatePath(`/messages/${friendId}`);

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


