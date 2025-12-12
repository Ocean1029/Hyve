import React, { useState } from 'react';
import { Search, Edit, Flame } from 'lucide-react';
import { Message, Friend } from '@/lib/types';
import ChatInterface from './ChatInterface';

interface MessagesProps {
    friends: Friend[];
    onViewProfile: (friend: Friend) => void;
}

// Helper to convert friend list to initial message state
const generateMockMessages = (friends: Friend[]): Message[] => {
    const messages = [
        { id: '1', friendId: '1', lastMessage: 'See you at the library?', time: '2m', unread: true },
        { id: '2', friendId: '2', lastMessage: 'That hike was insane!', time: '1h', unread: false },
        { id: '3', friendId: '3', lastMessage: 'Sent a beat, let me know what u think', time: '3h', unread: false },
        { id: '4', friendId: '4', lastMessage: 'Coffee?', time: 'Yesterday', unread: false },
        { id: '5', friendId: '5', lastMessage: 'Are we still on for gym?', time: 'Yesterday', unread: false },
        { id: '6', friendId: '6', lastMessage: 'Happy birthday!! 🎉', time: '2d', unread: false },
    ];
    
    // Map existing friend data to message structure
    return messages.map(msg => {
        const friend = friends.find(f => f.id === msg.friendId);
        return {
            ...msg,
            friendName: friend?.name || 'Unknown',
            friendAvatar: friend?.avatar || 'https://picsum.photos/100/100',
        };
    }).filter(msg => msg.friendName !== 'Unknown');
};

const Messages: React.FC<MessagesProps> = ({ friends, onViewProfile }) => {
  const [selectedChatFriend, setSelectedChatFriend] = useState<Friend | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // active friends mock for stories
  const ACTIVE_FRIENDS_MOCK = [
    { id: '1', status: 'Focusing', timeLeft: '15m' },
    { id: '2', status: 'Focusing', timeLeft: '42m' },
    { id: '4', status: 'Online', timeLeft: null },
  ];

  const handleOpenChat = (friendId: string) => {
      const friend = friends.find(f => f.id === friendId);
      if (friend) {
          setSelectedChatFriend(friend);
      }
  };

  const handleAvatarClick = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation(); // Prevent opening chat
    const friend = friends.find(f => f.id === friendId);
    if (friend) {
        onViewProfile(friend);
    }
  };

  const allMessages = generateMockMessages(friends);
  const filteredMessages = allMessages.filter(msg => 
    msg.friendName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col pt-12 pb-32 overflow-y-auto scrollbar-hide relative">
      
      {/* Chat Overlay */}
      {selectedChatFriend && (
          <ChatInterface friend={selectedChatFriend} onBack={() => setSelectedChatFriend(null)} />
      )}

      {/* Header */}
      <div className="px-6 flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-stone-200 tracking-tight">Messages</h1>
        <button className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors active:scale-95">
          <Edit className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-6">
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-amber-500/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-rose-400 transition-colors z-10" />
            <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search friends" 
            className="relative z-10 w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-10 pr-4 text-stone-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all text-sm font-medium"
            />
        </div>
      </div>

      {/* Active / Focusing Now (Stories Style) */}
      <div className="mb-6 pl-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pr-6">
            {/* Create New Story Node */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors">
                    <Flame className="w-6 h-6 text-zinc-600" />
                </div>
                <span className="text-[10px] font-bold text-zinc-500">Your Turn</span>
            </div>

            {ACTIVE_FRIENDS_MOCK.map((statusItem) => {
                const friend = friends.find(f => f.id === statusItem.id);
                if (!friend) return null;
                
                return (
                <div 
                    key={friend.id} 
                    onClick={() => handleOpenChat(friend.id)}
                    className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
                >
                    <div className={`relative w-16 h-16 rounded-full p-[3px] ${statusItem.status === 'Focusing' ? 'bg-gradient-to-tr from-rose-500 to-amber-500 animate-pulse' : 'bg-zinc-800'}`}>
                        <img 
                            src={friend.avatar} 
                            alt={friend.name} 
                            className="w-full h-full rounded-full border-2 border-zinc-950 object-cover" 
                            onClick={(e) => handleAvatarClick(e, friend.id)}
                        />
                        {statusItem.status === 'Focusing' && (
                             <div className="absolute bottom-0 right-0 bg-zinc-950 rounded-full p-1 border border-zinc-800">
                                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                             </div>
                        )}
                        {statusItem.status === 'Online' && (
                             <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
                        )}
                    </div>
                    <div className="text-center">
                        <span className="text-[11px] font-bold text-stone-300 block leading-tight">{friend.name}</span>
                        {statusItem.status === 'Focusing' && (
                            <span className="text-[9px] font-bold text-rose-400 block">{statusItem.timeLeft} left</span>
                        )}
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
            <div className="relative cursor-pointer" onClick={(e) => handleAvatarClick(e, msg.friendId)}>
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
                No friends found matching "{searchTerm}"
            </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
