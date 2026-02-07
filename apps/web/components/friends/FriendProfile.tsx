import React from 'react';
import { ChevronLeft, Calendar, Clock, Hash, Flame } from 'lucide-react';
import { Friend } from '@hyve/types';

interface FriendProfileProps {
  friend: Friend;
  onBack: () => void;
}

const FriendProfile: React.FC<FriendProfileProps> = ({ friend, onBack }) => {
  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-y-auto animate-in slide-in-from-right duration-300 relative z-50">
      
      {/* Header Image & Name */}
      <div className="relative h-80 w-full flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent z-10"></div>
        <img src={friend.avatar} alt="Cover" className="w-full h-full object-cover" />
        
        {/* Navigation */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-20 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20 group"
        >
          <ChevronLeft className="w-6 h-6 text-white group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Title Area */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-6">
           <div className="flex items-end justify-between">
              <div>
                 <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{friend.name}</h1>
                 <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                      Bestie
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest border border-orange-500/20 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {friend.streak} Day Streak
                    </span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="px-6 relative z-20 pb-24 space-y-10 mt-2">
        
        {/* 1. Total Hours */}
        <section>
          <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-[32px] p-6">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Clock className="w-32 h-32 text-rose-500 rotate-12" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center py-4">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Total Friendship Time</span>
              <div className="text-6xl font-black text-white tabular-nums tracking-tighter drop-shadow-glow">
                {friend.totalHours}<span className="text-2xl text-zinc-600 ml-1">h</span>
              </div>
              <div className="mt-4 px-4 py-1.5 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-400 text-xs font-bold">
                 Top 5% of your circle
              </div>
            </div>
          </div>
        </section>

        {/* 3. Recent Memories */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-lg">
               <Hash className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-black text-stone-200 uppercase tracking-widest">Our History</h3>
          </div>
          
          <div className="space-y-4 pl-2">
            {friend.recentMemories && friend.recentMemories.length > 0 ? (
              friend.recentMemories.map((memory, idx) => (
                <div key={memory.id} className="relative pl-6 border-l-2 border-zinc-800 hover:border-amber-500/50 transition-colors pb-2 last:pb-0">
                   <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-zinc-950 ring-2 ring-zinc-950"></div>
                   
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-stone-200 text-lg capitalize">{memory.type}</h4>
                        <p className="text-xs text-zinc-500 font-bold mt-1 uppercase">
                          {new Date(memory.timestamp).toLocaleDateString()}
                        </p>
                        {memory.content && (
                          <p className="text-sm text-zinc-400 mt-1">{memory.content}</p>
                        )}
                      </div>
                      <div className="px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800 text-xs font-mono font-bold text-zinc-400">
                        {new Date(memory.timestamp).toLocaleTimeString()}
                      </div>
                   </div>
                   {memory.photos && memory.photos.length > 0 && (
                     <div className="mt-2 flex gap-2">
                       {memory.photos.map((photo) => (
                         <img 
                           key={photo.id} 
                           src={photo.photoUrl} 
                           alt="Memory photo" 
                           className="w-16 h-16 rounded-lg object-cover"
                         />
                       ))}
                     </div>
                   )}
                </div>
              ))
            ) : (
              <div className="text-zinc-600 text-sm font-medium italic pl-4">No recent memories recorded.</div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default FriendProfile;