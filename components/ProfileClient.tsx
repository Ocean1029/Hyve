'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/lib/types';
import MyProfile from '@/components/MyProfile';
import TodayDetails from '@/components/TodayDetails';
import BottomNav from '@/components/BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface ProfileClientProps {
  user: any; // Define proper User type later
  posts: Post[];
}

const ProfileClient: React.FC<ProfileClientProps> = ({ user, posts }) => {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  
  // Enable swipe navigation only when no overlays are shown
  useSwipeNavigation({ 
    currentPath: '/profile', 
    enabled: !showDetails
  });

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  // Note: MyProfile component currently uses hardcoded posts internally or props?
  // Let's check MyProfile component. It uses MY_POSTS constant.
  // We should update MyProfile to accept posts prop if we want real data.
  // For now, we render it as is.

  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        
        <MyProfile 
          user={user}
          posts={posts}
          stats={user?.stats}
          onViewDetails={() => setShowDetails(true)} 
          onSettingsClick={handleSettingsClick}
        />

        {showDetails && user?.id && (
          <TodayDetails 
            userId={user.id} 
            onClose={() => setShowDetails(false)} 
          />
        )}

        <BottomNav />
      </div>
    </div>
  );
};

export default ProfileClient;

