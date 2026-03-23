import React from 'react';
import { X, ChevronRight, Image as ImageIcon, Calendar, MapPin } from 'lucide-react';
import { User, SessionLog } from '../types';
import { Avatar } from './UI';
import { FRIENDS_DATA } from '../src/data_constants';

export const SessionRecapModal = ({ sessionLog, onClose, onProfileClick }: { sessionLog: SessionLog, onClose: () => void, onProfileClick: () => void }) => {
  const friend = FRIENDS_DATA.find(f => f.id === sessionLog.friendId);

  if (!friend) return null;

  return (
    <div className="absolute inset-0 z-[150] bg-hyve-bg0 flex flex-col animate-fade-in">
      <div 
        className="flex-1 flex flex-col p-6 relative overflow-hidden"
      >
        {/* Background Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-hyve-gold/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-hyve-gold/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 relative z-10 pt-6">
          <h2 className="text-[12px] font-black text-hyve-gold uppercase tracking-[0.4em] drop-shadow-[0_0_8px_rgba(201,168,106,0.4)]">Session Log</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-hyve-gold bg-hyve-gold/10 rounded-full backdrop-blur-md border border-hyve-gold/20 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 relative z-10 pb-10">
           {/* People (Circle) - Moved to top */}
           <div className="animate-flip-in" style={{ animationDelay: '0.1s' }}>
              <span className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.2em] mb-3 block">Circle</span>
              <button 
                onClick={onProfileClick}
                className="w-full flex items-center gap-4 bg-hyve-gold/5 p-3 rounded-2xl border border-hyve-gold/10 hover:bg-hyve-gold/10 transition-all text-left group active:scale-[0.98] shadow-lg"
              >
                 <Avatar src={friend.avatarUrl} size="md" hasRing={friend.isOnline} />
                 <div>
                    <span className="text-sm font-black text-hyve-text1 block group-hover:text-hyve-gold transition-colors">{friend.name}</span>
                    <span className="text-[10px] text-hyve-text3 font-medium">Shared {sessionLog.duration}</span>
                 </div>
                 <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={16} className="text-hyve-gold" />
                 </div>
              </button>
           </div>

           {/* Session Photo - Single Block */}
           <div className="w-full aspect-[4/5] rounded-[40px] overflow-hidden border border-hyve-gold/20 relative group bg-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-flip-in" style={{ animationDelay: '0.2s' }}>
              <img 
                src={sessionLog.photoUrl} 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700 transform group-hover:scale-105" 
                alt="Session Memory" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-hyve-bg0/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 right-4 bg-hyve-gold/20 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-hyve-gold/30 flex items-center gap-2">
                 <ImageIcon size={12} className="text-hyve-gold" />
                 <span className="text-[9px] font-black text-hyve-gold uppercase tracking-widest">Memory</span>
              </div>
           </div>

           {/* Date & Location - Moved below circle */}
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <Calendar size={12} className="text-hyve-gold" />
                 <span className="text-xs font-bold text-hyve-text1">{sessionLog.date}</span>
              </div>
              <div className="flex items-center gap-2 pl-0.5">
                 <MapPin size={10} className="text-hyve-text3" />
                 <span className="text-[10px] font-medium text-hyve-text2">{sessionLog.location}</span>
              </div>
           </div>

           {/* Description */}
           <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
              <p className="text-xs text-hyve-text2 leading-relaxed italic">"{sessionLog.description}"</p>
           </div>

           {/* Cues / Tags */}
           {sessionLog.tags && (
             <div className="flex flex-wrap gap-2">
                {sessionLog.tags.map((tag: string) => (
                   <span key={tag} className="px-2 py-1 rounded-lg bg-hyve-gold/10 border border-hyve-gold/20 text-[9px] font-bold text-hyve-gold uppercase tracking-wider">
                      {tag}
                   </span>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
