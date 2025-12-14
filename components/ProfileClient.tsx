'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/lib/types';
import MyProfile from '@/components/MyProfile';
import BottomNav from '@/components/BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface ProfileClientProps {
  user: any; // Define proper User type later
  posts: Post[];
}

const ProfileClient: React.FC<ProfileClientProps> = ({ user, posts }) => {
  const router = useRouter();
  
  // Enable swipe navigation
  useSwipeNavigation({ 
    currentPath: '/profile', 
    enabled: true
  });

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  const handleViewDetails = () => {
    router.push('/today');
  };

  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        
        <MyProfile 
          user={user}
          posts={posts}
          stats={user?.stats}
          onViewDetails={handleViewDetails} 
          onSettingsClick={handleSettingsClick}
        />

        <BottomNav />
      </div>
    </div>
  );
};

export default ProfileClient;

