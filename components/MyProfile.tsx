import React from 'react';
import { Grid, Heart, Users, Clock, Flame, Settings, ChevronRight, Calendar, Trophy } from 'lucide-react';
import { Post } from '../lib/types';

interface MyProfileProps {
  onBack?: () => void;
  onViewDetails: () => void;
  onSettingsClick?: () => void;
}

const MY_POSTS: Post[] = [
  { id: 'mp1', imageUrl: 'https://picsum.photos/300/300?random=101', caption: 'Deep work session' },
  { id: 'mp2', imageUrl: 'https://picsum.photos/300/300?random=102', caption: 'Library vibes' },
  { id: 'mp3', imageUrl: 'https://picsum.photos/300/300?random=103', caption: 'Coffee break' },
  { id: 'mp4', imageUrl: 'https://picsum.photos/300/300?random=104', caption: 'Sunday reset' },
  { id: 'mp5', imageUrl: 'https://picsum.photos/300/300?random=105', caption: 'Late night study' },
  { id: 'mp6', imageUrl: 'https://picsum.photos/300/300?random=106', caption: 'Planning' },
  { id: 'mp7', imageUrl: 'https://picsum.photos/300/300?random=107', caption: 'Sketching' },
  { id: 'mp8', imageUrl: 'https://picsum.photos/300/300?random=108', caption: 'Finals week' },
  { id: 'mp9', imageUrl: 'https://picsum.photos/300/300?random=109', caption: 'Focus mode' },
];

const MyProfile: React.FC<MyProfileProps> = ({ onViewDetails, onSettingsClick }) => {
  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col overflow-y-auto pb-6 relative z-50">
      
      {/* Header Background */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-rose-900/20 via-zinc-950/50 to-zinc-950 z-0 pointer-events-none"></div>

      <div className="px-6 pt-12 relative z-10 space-y-8">
        
        {/* Header: Avatar & Info */}
        <div className="flex flex-col items-center text-center">
            <div className="absolute top-6 right-6">
                <button 
                  onClick={onSettingsClick}
                  className="p-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            <div className="relative mb-4 group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 to-amber-400 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-tr from-rose-500 to-amber-400 relative">
                  <img src="https://picsum.photos/100/100?random=99" className="rounded-full w-full h-full border-4 border-zinc-950 object-cover" alt="Me" />
                </div>
                <div className="absolute bottom-0 right-0 bg-zinc-900 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-800 flex items-center gap-1 shadow-lg">
                    <Flame className="w-3 h-3 fill-amber-400" /> 12
                </div>
            </div>
            
            <h2 className="text-3xl font-black text-white tracking-tight mb-1">Alex Chen</h2>
            <p className="text-zinc-400 text-sm font-medium">Design Student • Night Owl 🦉</p>
        </div>

        {/* Action Card: Today's Summary */}
        <div 
            onClick={onViewDetails}
            className="w-full bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:border-rose-500/30 transition-all active:scale-[0.98]"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <Calendar className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                    <h3 className="text-stone-200 font-bold text-sm">Today's Focus</h3>
                    <p className="text-zinc-500 text-xs font-medium">2h 42m disconnected</p>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-stone-300 transition-colors" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                <Users className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-xl font-black text-stone-200">142</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Friends</span>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-xl font-black text-stone-200">384h</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Focused</span>
            </div>
            {/* Modified Rank -> Top Buddy Block with Trophy */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                <Trophy className="w-4 h-4 text-rose-500 mb-1 fill-rose-500/20" />
                <span className="text-xl font-black text-stone-200">Kai</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">#1 Buddy</span>
            </div>
        </div>

        {/* Bio Section */}
        <div className="bg-zinc-900/20 rounded-2xl p-4 border border-zinc-800/30">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">About</h3>
            <p className="text-stone-400 font-medium text-sm leading-relaxed">
                Design Student @ ArtU. Coffee enthusiast, late-night sketcher, and trying to focus more than I scroll. ✏️☕️
            </p>
        </div>

        {/* Moments Grid */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">My Vault</h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-600 uppercase">See All</span>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden border border-zinc-800/50">
                {MY_POSTS.map((post) => (
                    <div key={post.id} className="relative aspect-square bg-zinc-900 overflow-hidden group cursor-pointer">
                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                    </div>
                ))}
            </div>
        </section>

      </div>
    </div>
  );
};

export default MyProfile;