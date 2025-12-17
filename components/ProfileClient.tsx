'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MyProfile from '@/components/MyProfile';
import BottomNav from '@/components/BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import SwipePreviewWrapper from '@/components/SwipePreviewWrapper';

interface ProfileClientProps {
  user: any; // Define proper User type later
  memories: any[];
}

const ProfileClient: React.FC<ProfileClientProps> = ({ user, memories }) => {
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
        <SwipePreviewWrapper currentPath="/profile">
          <MyProfile 
            user={user}
            memories={memories}
            stats={user?.stats}
            onViewDetails={handleViewDetails} 
            onSettingsClick={handleSettingsClick}
          />

          <BottomNav />
        </SwipePreviewWrapper>
      </div>
    </div>
  );
};

export default ProfileClient;

