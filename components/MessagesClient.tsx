'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Friend } from '@/lib/types';
import Messages from '@/components/Messages';
import ChatInterface from '@/components/ChatInterface';
import BottomNav from '@/components/BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface MessagesClientProps {
  friends: Friend[];
  userId: string;
}

const MessagesClient: React.FC<MessagesClientProps> = ({ friends, userId }) => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const router = useRouter();
  
  // Enable swipe navigation only when not in chat
  useSwipeNavigation({ 
    currentPath: '/messages', 
    enabled: !selectedFriend 
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
    setSelectedFriend(friend);
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        
        {selectedFriend ? (
          <div className="absolute inset-0 z-[250]">
            <ChatInterface friend={selectedFriend} userId={userId} onBack={() => setSelectedFriend(null)} />
          </div>
        ) : (
          <>
            <Messages friends={friends} onViewProfile={handleFriendClick} userId={userId} />
            {/* Bottom Navigation - Only show when not in chat */}
            <BottomNav />
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesClient;

