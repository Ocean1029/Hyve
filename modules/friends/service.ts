// modules/friends/service.ts
import { getFriendsWithDetails, getFriendsWithLastMessage } from './repository';
import { Friend } from '@/lib/types';

export const getFriendListService = async (): Promise<Friend[]> => {
  const friends = await getFriendsWithDetails();
  
  return friends.map(f => ({
    id: f.id,
    name: f.name,
    avatar: f.avatar || '',
    totalHours: f.totalHours,
    streak: f.streak,
    bio: f.bio || '',
    recentInteractions: f.interactions.map(i => ({
      id: i.id,
      activity: i.activity,
      date: i.date,
      duration: i.duration,
      location: i.location || undefined,
    })),
    posts: f.posts.map(p => ({
      id: p.id,
      imageUrl: p.imageUrl || '',
      caption: p.caption || '',
    })),
  }));
};

export const getFriendsForMessagesService = async (): Promise<Friend[]> => {
  const friends = await getFriendsWithLastMessage();

  // Sort friends by:
  // 1. Friends with messages (by last message timestamp, newest first)
  // 2. Friends without messages (by friend creation time, newest first)
  const sortedFriends = friends.sort((a, b) => {
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
  
  return sortedFriends.map(f => ({
    id: f.id,
    name: f.name,
    avatar: f.avatar || '',
    totalHours: f.totalHours,
    streak: f.streak,
    bio: f.bio || '',
    recentInteractions: f.interactions.map(i => ({
      id: i.id,
      activity: i.activity,
      date: i.date,
      duration: i.duration,
      location: i.location || undefined,
    })),
    posts: f.posts.map(p => ({
      id: p.id,
      imageUrl: p.imageUrl || '',
      caption: p.caption || '',
    })),
  }));
};

