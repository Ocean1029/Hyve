'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Friend } from '@hyve/types';
import ChatInterface from '@/components/messages/ChatInterface';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface ChatInterfaceClientProps {
  friend: Friend;
  userId: string;
}

const ChatInterfaceClient: React.FC<ChatInterfaceClientProps> = ({ friend, userId }) => {
  const router = useRouter();
  
  // Enable swipe navigation to go back to friends list
  useSwipeNavigation({ 
    currentPath: `/friends/${friend.id}`, 
    enabled: true 
  });

  const handleBack = () => {
    router.push('/friends');
  };

  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        <ChatInterface friend={friend} userId={userId} onBack={handleBack} />
      </div>
    </div>
  );
};

export default ChatInterfaceClient;

