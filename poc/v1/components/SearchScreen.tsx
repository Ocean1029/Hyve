import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Image as ImageIcon } from 'lucide-react';
import { AppScreen, User } from '../types';
import { Avatar } from './UI';

export const SearchScreen = ({ onNavigate, friends }: { onNavigate: (s: AppScreen, u?: User) => void, friends: User[] }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const friendsList = useMemo(() => [
    { 
      ...friends[0], 
      interactionType: 'photo', 
      interactionContent: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=400&q=80' 
    },
    {
      ...friends[1],
      interactionType: 'message',
      interactionContent: 'Leg day was brutal yesterday lol'
    },
    {
      ...friends[2],
      interactionType: 'photo',
      interactionContent: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=400&q=80'
    },
    {
      ...friends[3],
      interactionType: 'message',
      interactionContent: 'See you at the archive?'
    }
  ], [friends]);

  const filteredList = useMemo(() => {
     if (!searchQuery.trim()) return friendsList;
     const q = searchQuery.toLowerCase();
     return friendsList.filter(f => f.name.toLowerCase().startsWith(q) || f.handle.toLowerCase().includes(q));
  }, [friendsList, searchQuery]);

  return (
    <div className="h-full w-full pt-10 px-4 flex flex-col overflow-hidden">
      <h1 className="text-2xl font-light tracking-tight mb-4 text-hyve-text1 px-2">Friends</h1>
      <div className="flex gap-2 mb-6 shrink-0 h-10 px-2">
        <div className="relative flex-1 h-full">
          <input 
             type="text" 
             placeholder="Search..." 
             className="w-full h-full glass-input rounded-xl pl-10 pr-4 text-[10px] text-hyve-text1 focus:outline-none placeholder:text-hyve-text3"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hyve-text3 w-3 h-3" />
        </div>
        <button 
          onClick={() => onNavigate(AppScreen.RADAR)}
          className="shrink-0 w-10 h-full glass-panel rounded-xl flex items-center justify-center text-hyve-gold active:scale-95 transition-transform"
        >
          <UserPlus size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-2">
        {filteredList.map((friend: any) => (
          <div key={friend.id} className="flex items-start gap-4 py-6 border-b border-white/5 last:border-0 group transition-colors">
            {/* Profile Zone: Avatar, Name, Handle */}
            <div 
              onClick={() => onNavigate(AppScreen.PROFILE, friend as User)}
              className="shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <Avatar src={friend.avatarUrl} size="sm" hasRing={friend.isOnline} />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Profile Zone: Header */}
              <div 
                onClick={() => onNavigate(AppScreen.PROFILE, friend as User)}
                className="flex justify-between items-start mb-2 cursor-pointer active:opacity-70 transition-opacity"
              >
                <div>
                   <div className="text-hyve-text1 font-medium text-xs mb-0.5">{friend.name}</div>
                   <p className="text-[10px] text-hyve-text3 leading-relaxed truncate">{friend.handle}</p>
                </div>
                {friend.isOnline && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />}
              </div>

              {/* Message Zone: Content (Photo or Message) */}
              <div 
                onClick={() => onNavigate(AppScreen.MESSAGES, friend as User)}
                className="mt-1 animate-flip-in cursor-pointer active:scale-[0.98] transition-transform" 
                style={{ animationDelay: '0.1s' }}
              >
                 {friend.interactionType === 'photo' ? (
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors shadow-sm">
                       <img src={friend.interactionContent} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Last Session" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                          <div className="bg-white/10 backdrop-blur-md p-1 rounded-md">
                             <ImageIcon size={10} className="text-white" />
                          </div>
                          <span className="text-[9px] font-bold text-white uppercase tracking-wider">Last Session</span>
                       </div>
                       <div className="absolute top-2 right-2 text-[8px] font-medium text-white/80 bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                         2d ago
                       </div>
                    </div>
                 ) : (
                    <div className="relative bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none inline-block max-w-[90%] group-hover:bg-white/10 transition-colors">
                       <p className="text-[11px] text-hyve-text2 leading-relaxed">{friend.interactionContent}</p>
                       <div className="absolute -bottom-4 left-0 text-[8px] text-hyve-text3 font-medium opacity-0 group-hover:opacity-60 transition-opacity">
                          Yesterday · 8:42 PM
                       </div>
                    </div>
                 )}
              </div>
            </div>
          </div>
        ))}
        {filteredList.length === 0 && (
           <div className="text-center py-10 opacity-50 text-xs">No friends found.</div>
        )}
      </div>
    </div>
  );
};
