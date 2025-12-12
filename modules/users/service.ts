// modules/users/service.ts
import { getUserWithPosts } from './repository';
import { Post } from '@/lib/types';

export const getMyProfileService = async (userId: string) => {
  const user = await getUserWithPosts(userId);
  
  if (!user) return null;

  const posts: Post[] = user.posts.map(p => ({
    id: p.id,
    imageUrl: p.imageUrl || '',
    caption: p.caption || '',
  }));

  return {
    ...user,
    posts,
  };
};

