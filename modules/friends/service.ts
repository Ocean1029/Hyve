// modules/friends/service.ts
import { getFriendsWithDetails, getFriendsWithLastMessage, getFriendById } from './repository';
import { Friend } from '@/lib/types';

export const getFriendListService = async (sourceUserId: string): Promise<Friend[]> => {
  const friends = await getFriendsWithDetails(sourceUserId);
  
  return friends.map((f: any) => ({
    id: f.id,
    name: f.user.name || 'Unknown User',
    avatar: f.user.image || '',
    totalHours: f.totalHours,
    streak: f.streak,
    recentInteractions: f.interactions.map((i: any) => ({
      id: i.id,
      activity: i.activity || '',
      date: i.date || '',
      duration: i.duration || '',
      location: i.location || undefined,
    })),
    posts: f.posts.map((p: any) => ({
      id: p.id,
      imageUrl: p.imageUrl || p.photoUrl || '',
      caption: p.caption || '',
    })),
  }));
};

export const getFriendsForMessagesService = async (sourceUserId: string): Promise<Friend[]> => {
  const friends = await getFriendsWithLastMessage(sourceUserId);

  // Sort friends by:
  // 1. Friends with messages (by last message timestamp, newest first)
  // 2. Friends without messages (by friend creation time, newest first)
  const sortedFriends = friends.sort((a: any, b: any) => {
    const aLastMessage = a.messages[0];
    const bLastMessage = b.messages[0];

    // Both have messages - sort by message timestamp
    if (aLastMessage && bLastMessage) {
      return new Date(bLastMessage.timestamp).getTime() - new Date(aLastMessage.timestamp).getTime();
    }

    // Only a has messages - a comes first
    if (aLastMessage && !bLastMessage) {
      return -1;
    }

    // Only b has messages - b comes first
    if (!aLastMessage && bLastMessage) {
      return 1;
    }

    // Neither has messages - sort by friend creation time (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return sortedFriends.map((f: any) => ({
    id: f.id,
    name: f.user.name || 'Unknown User',
    avatar: f.user.image || '',
    totalHours: f.totalHours,
    streak: f.streak,
    recentInteractions: f.interactions.map((i: any) => ({
      id: i.id,
      activity: i.activity || '',
      date: i.date || '',
      duration: i.duration || '',
      location: i.location || undefined,
    })),
    posts: f.posts.map((p: any) => ({
      id: p.id,
      imageUrl: p.imageUrl || p.photoUrl || '',
      caption: p.caption || '',
    })),
    lastMessage: f.messages[0] ? {
      id: f.messages[0].id,
      content: f.messages[0].content,
      senderId: f.messages[0].senderId,
      timestamp: f.messages[0].timestamp,
    } : undefined,
  }));
};

export const getFriendByIdService = async (friendId: string, sourceUserId: string): Promise<Friend | null> => {
  const friend = await getFriendById(friendId, sourceUserId);
  
  if (!friend) {
    return null;
  }
  
  return {
    id: friend.id,
    name: friend.user.name || 'Unknown User',
    avatar: friend.user.image || '',
    totalHours: friend.totalHours,
    streak: friend.streak,
    recentInteractions: friend.interactions.map((i: any) => ({
      id: i.id,
      activity: i.activity || '',
      date: i.date || '',
      duration: i.duration || '',
      location: i.location || undefined,
    })),
    posts: friend.posts.map((p: any) => ({
      id: p.id,
      imageUrl: p.imageUrl || p.photoUrl || '',
      caption: p.caption || '',
    })),
  };
};

