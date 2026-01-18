import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Message, Friend } from '@/lib/types';
import { usePresence } from '@/hooks/usePresence';
import SearchBar from '@/components/search/SearchBar';

interface MessagesProps {
    friends: Friend[];
    onViewProfile: (friend: Friend) => void;
    userId: string;
}

// Helper to format timestamp to relative time string
const formatMessageTime = (timestamp: Date): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }
  
  // For older messages, show date
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

// Helper to convert friend list with real messages to message state
const generateMessagesFromFriends = (friends: Friend[]): Message[] => {
  return friends.map(friend => {
    const lastMessage = friend.lastMessage;
    return {
      id: `msg-${friend.id}`,
      friendId: friend.id,
      friendName: friend.name,
      friendAvatar: friend.avatar,
      lastMessage: lastMessage ? lastMessage.content : 'No messages yet',
      time: lastMessage ? formatMessageTime(lastMessage.timestamp) : '',
      unread: false, // TODO: Implement unread message tracking
    };
  });
};

const Messages: React.FC<MessagesProps> = ({ friends, onViewProfile, userId }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get real-time presence status
  const { friendStatuses, isOnline } = usePresence();

  // Get online friends for the active friends section
  const onlineFriends = useMemo(() => {
    return friends.filter(friend => isOnline(friend.id));
  }, [friends, isOnline]);

  const handleOpenChat = (friendId: string) => {
    router.push(`/messages/${friendId}`);
  };

  const handleAvatarClick = (e: React.MouseEvent | React.TouchEvent, friendId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent opening chat and swipe navigation
    const friend = friends.find(f => f.id === friendId);
    if (friend) {
        onViewProfile(friend);
    }
  };

  // Generate messages from real friend data
  const allMessages = useMemo(() => {
    return generateMessagesFromFriends(friends);
  }, [friends]);
  
  const filteredMessages = useMemo(() => {
    return allMessages.filter(msg => 
      msg.friendName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allMessages, searchTerm]);

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col pt-12 pb-40 overflow-y-auto scrollbar-hide relative">
      
      {/* Header */}
      <div className="px-6 flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-stone-200 tracking-tight">Messages</h1>
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-6">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search friends"
          showGradient={true}
        />
      </div>

      {/* Active / Focusing Now (Stories Style) */}
      <div className="mb-6 pl-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pr-6">
            {onlineFriends.map((friend) => {
                return (
                <div 
                    key={friend.id} 
                    onClick={() => handleOpenChat(friend.id)}
                    className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
                >
                    <div className="relative w-16 h-16 rounded-full p-[3px] bg-zinc-800">
                        <img 
                            src={friend.avatar} 
                            alt={friend.name} 
                            className="w-full h-full rounded-full border-2 border-zinc-950 object-cover" 
                            onClick={(e) => handleAvatarClick(e, friend.id)}
                            onTouchEnd={(e) => handleAvatarClick(e, friend.id)}
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
                    </div>
                    <div className="text-center">
                        <span className="text-[11px] font-bold text-stone-300 block leading-tight">{friend.name}</span>
                    </div>
                </div>
            )})}
        </div>
      </div>

      {/* Message List */}
      <div className="px-4 space-y-1">
        {filteredMessages.map((msg) => (
          <div 
            key={msg.id} 
            onClick={() => handleOpenChat(msg.friendId)}
            className="group flex items-center gap-4 p-3 rounded-[20px] hover:bg-zinc-900/50 transition-colors cursor-pointer border border-transparent hover:border-zinc-800/30 active:scale-[0.98]"
          >
            <div className="relative cursor-pointer" onClick={(e) => handleAvatarClick(e, msg.friendId)} onTouchEnd={(e) => handleAvatarClick(e, msg.friendId)}>
              <img src={msg.friendAvatar} alt={msg.friendName} className="w-14 h-14 rounded-full border border-zinc-800 object-cover group-hover:border-zinc-700 transition-colors" />
              {msg.unread && (
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-zinc-950 animate-pulse"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 py-1">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className={`text-base ${msg.unread ? 'font-black text-white' : 'font-bold text-stone-300'} group-hover:text-white transition-colors`}>
                  {msg.friendName}
                </h3>
                <span className={`text-xs ${msg.unread ? 'text-rose-400 font-bold' : 'text-zinc-600 font-medium'}`}>
                  {msg.time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                  <p className={`text-sm truncate pr-4 ${msg.unread ? 'text-stone-200 font-bold' : 'text-zinc-500 font-medium group-hover:text-zinc-400'}`}>
                    {msg.lastMessage}
                  </p>
                  {msg.unread && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
              </div>
            </div>
          </div>
        ))}
        {filteredMessages.length === 0 && (
            <div className="text-center py-10 text-zinc-600 font-medium text-sm">
                {searchTerm ? `No friends found matching "${searchTerm}"` : 'Start adding friends to see messages here!'}
            </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
