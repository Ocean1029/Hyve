import React from 'react';
import Image from 'next/image';
import { Grid, Heart, Users, Clock, Flame, Settings, ChevronRight, Calendar, Trophy } from 'lucide-react';
import { Memory } from '@/lib/types';

interface MyProfileProps {
  user?: {
    id: string;
    userId?: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  memories: Memory[] | null;
  stats?: {
    totalFriends: number;
    totalHours: number;
    totalMinutes: number;
    todayMinutes?: number;
    topBuddy: string | null;
  };
  onBack?: () => void;
  onViewDetails: () => void;
  onSettingsClick?: () => void;
}

const MyProfile: React.FC<MyProfileProps> = ({ 
  user, 
  memories = [], 
  stats,
  onViewDetails, 
  onSettingsClick 
}) => {
  // Calculate today's focus time
  const todayMinutes = stats?.todayMinutes || 0;
  const todayHours = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;
  const todayDisplay = todayHours > 0 ? `${todayHours}h ${todayMins}m` : `${todayMins}m`;
  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col overflow-y-auto pb-40 relative z-50">
      
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
                  {user?.image ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-zinc-950">
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 414px) 112px, 112px"
                        quality={100}
                        unoptimized={!user.image.includes('googleusercontent.com')}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-500 to-amber-400 flex items-center justify-center border-4 border-zinc-950">
                      <span className="text-white font-bold text-3xl">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-zinc-900 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-800 flex items-center gap-1 shadow-lg">
                    <Flame className="w-3 h-3 fill-amber-400" /> {stats?.totalHours || 0}
                </div>
            </div>
            
            <h2 className="text-3xl font-black text-white tracking-wide mb-1">{user?.name || 'User'}</h2>
            <p className="text-zinc-600 text-sm font-medium">{user?.userId || 'No user ID'}</p>
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
                    <p className="text-zinc-500 text-xs font-medium">{todayDisplay} disconnected</p>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-stone-300 transition-colors" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                <Users className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-xl font-black text-stone-200">{stats?.totalFriends || 0}</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Friends</span>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-xl font-black text-stone-200">{stats?.totalHours || 0}h</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Focused</span>
            </div>
            {/* Modified Rank -> Top Buddy Block with Trophy */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1">
                <Trophy className="w-4 h-4 text-rose-500 mb-1 fill-rose-500/20" />
                <span className="text-md font-black text-stone-200">{stats?.topBuddy || '-'}</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Best Buddy</span>
            </div>
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
                {memories && memories.length > 0 ? (
                  memories.map((memory) => (
                    <div key={memory.id} className="relative aspect-square bg-zinc-900 overflow-hidden group cursor-pointer">
                      {memory.photos && memory.photos.length > 0 ? (
                        <Image
                          src={memory.photos[0].photoUrl}
                          alt={memory.content || ''}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                          sizes="(max-width: 414px) 33vw, 138px"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <Grid className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 aspect-square bg-zinc-900/50 flex items-center justify-center border border-zinc-800/50 rounded-2xl">
                    <p className="text-zinc-600 text-sm font-medium">No posts yet</p>
                  </div>
                )}
            </div>
        </section>

      </div>
    </div>
  );
};

export default MyProfile;