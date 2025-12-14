'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Friend } from '@/lib/types';
import Messages from '@/components/Messages';
import BottomNav from '@/components/BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface MessagesClientProps {
  friends: Friend[];
  userId: string;
}

const MessagesClient: React.FC<MessagesClientProps> = ({ friends, userId }) => {
  const router = useRouter();
  
  // Enable swipe navigation for messages list page
  useSwipeNavigation({ 
    currentPath: '/messages', 
    enabled: true 
  });

  // Refresh data when page becomes visible (e.g., after adding a friend from another page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when window gains focus (e.g., user switches back to this tab)
    const handleFocus = () => {
      router.refresh();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  const handleFriendClick = (friend: Friend) => {
    router.push(`/messages/${friend.id}`);
  };

  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        <Messages friends={friends} onViewProfile={handleFriendClick} userId={userId} />
        <BottomNav />
      </div>
    </div>
  );
};

export default MessagesClient;

