'use client';

import React, { useState } from 'react';
import { Friend } from '@/lib/types';
import Messages from '@/components/Messages';
import ChatInterface from '@/components/ChatInterface';
import BottomNav from '@/components/BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface MessagesClientProps {
  friends: Friend[];
}

const MessagesClient: React.FC<MessagesClientProps> = ({ friends }) => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  
  // Enable swipe navigation only when not in chat
  useSwipeNavigation({ 
    currentPath: '/messages', 
    enabled: !selectedFriend 
  });

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        
        {selectedFriend ? (
          <div className="absolute inset-0 z-50">
            <ChatInterface friend={selectedFriend} onBack={() => setSelectedFriend(null)} />
          </div>
        ) : (
          <Messages friends={friends} onViewProfile={handleFriendClick} />
        )}

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default MessagesClient;

