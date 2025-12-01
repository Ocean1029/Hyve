import React from 'react';
import { Search, Edit, Flame } from 'lucide-react';
import { Message } from '../lib/types';

const MOCK_MESSAGES: Message[] = [
  { id: '1', friendId: '1', friendName: 'Kai', friendAvatar: 'https://picsum.photos/100/100?random=1', lastMessage: 'See you at the library?', time: '2m', unread: true },
  { id: '2', friendId: '2', friendName: 'Sarah', friendAvatar: 'https://picsum.photos/100/100?random=2', lastMessage: 'That hike was insane!', time: '1h', unread: false },
  { id: '3', friendId: '3', friendName: 'Leo', friendAvatar: 'https://picsum.photos/100/100?random=3', lastMessage: 'Sent a beat, let me know what u think', time: '3h', unread: false },
  { id: '4', friendId: '4', friendName: 'Mia', friendAvatar: 'https://picsum.photos/100/100?random=4', lastMessage: 'Coffee?', time: 'Yesterday', unread: false },
  { id: '5', friendId: '5', friendName: 'Noah', friendAvatar: 'https://picsum.photos/100/100?random=5', lastMessage: 'Are we still on for gym?', time: 'Yesterday', unread: false },
  { id: '6', friendId: '6', friendName: 'Ava', friendAvatar: 'https://picsum.photos/100/100?random=6', lastMessage: 'Happy birthday!! 🎉', time: '2d', unread: false },
  { id: '7', friendId: '7', friendName: 'Ethan', friendAvatar: 'https://picsum.photos/100/100?random=7', lastMessage: 'Did you submit the assignment?', time: '3d', unread: false },
  { id: '8', friendId: '8', friendName: 'Zoe', friendAvatar: 'https://picsum.photos/100/100?random=8', lastMessage: 'Let’s gooo!', time: '4d', unread: false },
  { id: '9', friendId: '9', friendName: 'Liam', friendAvatar: 'https://picsum.photos/100/100?random=9', lastMessage: 'Call me when you can', time: '1w', unread: false },
];

const ACTIVE_FRIENDS = [
  { id: 'a1', name: 'Kai', avatar: 'https://picsum.photos/100/100?random=1', duration: '24m' },
  { id: 'a2', name: 'Mia', avatar: 'https://picsum.photos/100/100?random=4', duration: '1h' },
  { id: 'a3', name: 'Lucas', avatar: 'https://picsum.photos/100/100?random=15', duration: '5m' },
];

const Messages: React.FC = () => {
  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col pt-12 pb-6 overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <div className="px-6 flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-stone-200 tracking-tight">Messages</h1>
        <button className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors active:scale-95">
          <Edit className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Active / Focusing Now Bar */}
      <div className="px-6 mb-8 overflow-x-auto scrollbar-hide flex gap-4">
        {ACTIVE_FRIENDS.map((friend) => (
           <div key={friend.id} className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group">
              <div className="relative p-[3px]">
                 {/* Pulsing Outline Ring */}
                 <div className="absolute inset-0 rounded-full border-2 border-rose-500/50 animate-pulse"></div>
                 <div className="absolute inset-0 rounded-full border border-rose-500 scale-105 opacity-50"></div>
                 
                 <img 
                    src={friend.avatar} 
                    alt={friend.name} 
                    className="w-14 h-14 rounded-full border-2 border-zinc-950 object-cover" 
                 />
                 
                 {/* Duration Badge */}
                 <div className="absolute -bottom-1 -right-2 bg-zinc-900 text-rose-400 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-zinc-800 shadow-md flex items-center gap-0.5">
                    <Flame className="w-2 h-2 fill-rose-500" />
                    {friend.duration}
                 </div>
              </div>
              <span className="text-[11px] font-bold text-stone-300 mt-1 group-hover:text-white transition-colors">
                {friend.name}
              </span>
           </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-8">
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-amber-500/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-rose-400 transition-colors z-10" />
            <input 
            type="text" 
            placeholder="Search friends" 
            className="relative z-10 w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-10 pr-4 text-stone-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all text-sm font-medium"
            />
        </div>
      </div>

      {/* Message List */}
      <div className="px-4 space-y-1">
        {MOCK_MESSAGES.map((msg) => (
          <div key={msg.id} className="group flex items-center gap-4 p-3 rounded-[20px] hover:bg-zinc-900/50 transition-colors cursor-pointer border border-transparent hover:border-zinc-800/30 active:scale-[0.98]">
            <div className="relative">
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
      </div>
    </div>
  );
};

export default Messages;