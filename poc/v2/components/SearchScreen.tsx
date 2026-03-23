import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Image as ImageIcon, Coffee, Book, Dumbbell, Utensils, Film, Music, MessageCircle, Calendar, Eye, Library, Building2 } from 'lucide-react';
import { AppScreen, User } from '../types';
import { Avatar } from './UI';
import { SESSION_LOGS } from '../data';

const getIconForTag = (tag: string, size = 20) => {
  const t = tag.toLowerCase();
  if (t.includes('coffee') || t.includes('cafe') || t.includes('matcha')) return <Coffee size={size} />;
  if (t.includes('study') || t.includes('reading') || t.includes('research')) return <Book size={size} />;
  if (t.includes('gym') || t.includes('fitness')) return <Dumbbell size={size} />;
  if (t.includes('lunch') || t.includes('food')) return <Utensils size={size} />;
  if (t.includes('movie') || t.includes('theater')) return <Film size={size} />;
  if (t.includes('music')) return <Music size={size} />;
  if (t.includes('watch')) return <Eye size={size} />;
  if (t.includes('library')) return <Library size={size} />;
  if (t.includes('taipei101') || t.includes('building')) return <Building2 size={size} />;
  return null;
};

const formatDateShort = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return (
      <div className="flex items-center gap-1.5 leading-none">
        <span className="text-[10px] font-black text-white">{day}</span>
        <span className="text-[8px] font-bold text-white/60">{month}</span>
      </div>
    );
  } catch (e) {
    return dateStr;
  }
};

export const SearchScreen = ({ onNavigate, friends, isLightMode = false }: { onNavigate: (s: AppScreen, u?: User) => void, friends: User[], isLightMode?: boolean }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const friendsList = useMemo(() => {
    return friends.map(friend => {
      // Emily (u2) and Jordan (u3) have session logs as their last "message"
      // Others have regular text messages
      const lastSession = SESSION_LOGS.find(s => s.friendId === friend.id);
      const isSessionLog = ['u2', 'u3', 'u4', 'u5'].includes(friend.id);

      if (isSessionLog && lastSession) {
        return {
          ...friend,
          interactionType: 'photo',
          lastSession,
          interactionIcons: (friend.id === 'u3') ? (
            <div className={`flex items-center gap-4 ml-3 ${isLightMode ? 'text-black' : 'text-white'} opacity-80`}>
              {getIconForTag('taipei101', 22)}
              {getIconForTag('food', 22)}
            </div>
          ) : null
        };
      }
      return {
        ...friend,
        interactionType: 'message',
        interactionContent: friend.id === 'u4' ? 'See you at the archive?' : 'Leg day was brutal yesterday lol',
        interactionIcons: null
      };
    });
  }, [friends, isLightMode]);

  const filteredList = useMemo(() => {
     if (!searchQuery.trim()) return friendsList;
     const q = searchQuery.toLowerCase();
     return friendsList.filter(f => f.name.toLowerCase().startsWith(q) || f.handle.toLowerCase().includes(q));
  }, [friendsList, searchQuery]);

  const textPrimary = isLightMode ? 'text-black' : 'text-hyve-text1';
  const textSecondary = isLightMode ? 'text-black/60' : 'text-hyve-text2';
  const textMuted = isLightMode ? 'text-black/40' : 'text-hyve-text3';

  return (
    <div className={`h-full w-full pt-14 flex flex-col overflow-hidden transition-colors duration-300 ${isLightMode ? 'bg-white' : 'bg-hyve-bg0'}`}>
      <div className="flex gap-2 mb-6 shrink-0 h-10 px-6">
        <div className="relative flex-1 h-full">
          <input 
             type="text" 
             placeholder="Search..." 
             className={`w-full h-full glass-input rounded-xl pl-10 pr-4 text-[10px] focus:outline-none ${isLightMode ? 'bg-black/5 border-black/10 text-black placeholder:text-black/40' : 'text-hyve-text1 placeholder:text-hyve-text3'}`}
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 ${isLightMode ? 'text-black/40' : 'text-hyve-text3'}`} />
        </div>
        <button 
          onClick={() => onNavigate(AppScreen.RADAR)}
          className={`shrink-0 w-10 h-full glass-panel rounded-xl flex items-center justify-center text-hyve-gold active:scale-95 transition-transform ${isLightMode ? 'bg-black/5 border-black/10' : ''}`}
        >
          <UserPlus size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {filteredList.map((friend: any) => (
          <div 
            key={friend.id} 
            onClick={() => onNavigate(AppScreen.MESSAGES, friend as User)}
            className={`relative flex items-start gap-4 py-6 border-b group transition-all duration-300 cursor-pointer active:bg-white/5 px-4 overflow-hidden w-full ${isLightMode ? 'border-black/5' : 'border-white/5'}`}
            style={friend.interactionType === 'message' ? { backgroundColor: `${friend.color}15` } : {}}
          >
            {/* Background Image (if session log) */}
            {friend.interactionType === 'photo' && (
              <>
                <img 
                  src={friend.lastSession.photoUrl} 
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-110 group-hover:scale-105 transition-transform duration-1000" 
                  alt="Last Session" 
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-r via-transparent ${isLightMode ? 'from-white via-white/60' : 'from-hyve-bg0 via-hyve-bg0/60'}`}></div>
              </>
            )}

            {/* Profile Zone: Avatar */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(AppScreen.PROFILE, friend as User);
              }}
              className="shrink-0 cursor-pointer active:scale-95 transition-transform z-10"
            >
              <Avatar src={friend.avatarUrl} size="sm" hasRing={friend.isOnline} />
            </div>
            
            <div className="flex-1 min-w-0 z-10">
              {/* Profile Zone: Header */}
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                   <div 
                     onClick={(e) => {
                       e.stopPropagation();
                       onNavigate(AppScreen.PROFILE, friend as User);
                     }}
                     className={`${textPrimary} font-bold text-xs hover:text-hyve-gold transition-colors`}
                   >
                     {friend.name}
                   </div>
                   {friend.interactionType === 'photo' && !['u4', 'u5'].includes(friend.id) && (
                     <div className={`flex items-center gap-4 ml-3 ${isLightMode ? 'text-black' : 'text-white'}`}>
                        {formatDateShort(friend.lastSession.date)}
                        {getIconForTag(friend.lastSession.tags.find((t: string) => t.toLowerCase().includes('coffee') || t.toLowerCase().includes('cafe') || t.toLowerCase().includes('gym') || t.toLowerCase().includes('library')) || 'location', 22)}
                        {getIconForTag(friend.lastSession.tags.find((t: string) => t.toLowerCase().includes('study') || t.toLowerCase().includes('fitness') || t.toLowerCase().includes('reading')) || 'activity', 22)}
                     </div>
                   )}
                   {(friend as any).interactionIcons}
                </div>
                {friend.isOnline && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
              </div>

              {/* Message Zone: Content */}
              <div className="mt-1">
                 {friend.interactionType === 'photo' ? (
                    <p className={`text-[11px] ${textSecondary} leading-relaxed line-clamp-1 italic opacity-80`}>
                      "{friend.lastSession.description}"
                    </p>
                 ) : (
                    <p className={`text-[11px] ${textSecondary} leading-relaxed line-clamp-1`}>{friend.interactionContent}</p>
                 )}
              </div>
            </div>
          </div>
        ))}
        {filteredList.length === 0 && (
           <div className={`text-center py-10 opacity-50 text-xs ${textMuted}`}>No friends found.</div>
        )}
      </div>
    </div>
  );
};
