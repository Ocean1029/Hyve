// modules/friends/service.ts
import { getFriendsWithDetails } from './repository';
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

