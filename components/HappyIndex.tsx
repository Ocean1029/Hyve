import React from 'react';
import { X, TrendingUp, Calendar, Star, Smile, Users, Medal } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Friend } from '../lib/types';

interface HappyIndexProps {
  onClose: () => void;
  friends?: Friend[];
  onFriendClick?: (friend: Friend) => void;
}

// Data including who you were with
const MOCK_HAPPY_DATA = [
  { day: 'Mon', score: 6.5, with: 'Noah' },
  { day: 'Tue', score: 8.0, with: 'Sarah' },
  { day: 'Wed', score: 7.2, with: 'Study Group' },
  { day: 'Thu', score: 9.5, with: 'Kai & Sarah' },
  { day: 'Fri', score: 8.8, with: 'Mia' },
  { day: 'Sat', score: 9.8, with: 'The Squad' },
  { day: 'Sun', score: 9.0, with: 'Self' },
];

const HappyIndex: React.FC<HappyIndexProps> = ({ onClose, friends, onFriendClick }) => {
  
  const handleFriendClick = (name: string) => {
    if (!friends || !onFriendClick) return;
    const friend = friends.find(f => f.name === name);
    if (friend) {
      onFriendClick(friend);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-y-auto animate-in slide-in-from-bottom duration-300 relative z-50">
      
      {/* Dynamic Backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center sticky top-0 bg-zinc-950/80 backdrop-blur-md z-30 border-b border-white/5">
        <h2 className="text-xl font-bold text-stone-200 flex items-center gap-2">
          <Smile className="text-amber-400 fill-amber-400 w-6 h-6" />
          Happy Index
        </h2>
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors border border-zinc-800">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <div className="px-6 pb-24 space-y-10 pt-4 relative z-20">
        
        {/* 1. Big Emoji Vibe Score */}
        <section className="text-center py-8 relative">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-[60px] animate-pulse"></div>
            <div className="relative text-[120px] leading-none filter drop-shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-105 transition-transform duration-500 cursor-pointer select-none">
              🤩
            </div>
            {/* Vibe Score Badge */}
            <div className="absolute -right-6 top-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-lg px-4 py-2 rounded-full rotate-12 border-4 border-zinc-950 shadow-xl">
              9.2
            </div>
          </div>
          <h1 className="mt-8 text-3xl font-black text-white uppercase tracking-tight drop-shadow-md">
            Immaculate<br/>Vibes
          </h1>
          <p className="text-amber-200/60 text-sm font-bold tracking-widest uppercase mt-2">Week of Oct 21</p>
        </section>

        {/* 2. Who you hang out with (Vibe Bringers) */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="text-lg font-bold text-stone-200 tracking-tight">Who brings the joy?</h3>
          </div>
          <div className="space-y-4">
            {[
              { rank: 1, name: 'Kai', score: 9.8, avatar: 'https://picsum.photos/100/100?random=1', color: 'border-amber-400/50 bg-amber-400/10' },
              { rank: 2, name: 'Sarah', score: 9.5, avatar: 'https://picsum.photos/100/100?random=2', color: 'border-zinc-400/50 bg-zinc-400/10' },
              { rank: 3, name: 'Leo', score: 8.9, avatar: 'https://picsum.photos/100/100?random=3', color: 'border-orange-700/50 bg-orange-700/10' }
            ].map((friend, i) => (
              <div 
                key={i} 
                onClick={() => handleFriendClick(friend.name)}
                className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.02] cursor-pointer ${friend.color}`}
              >
                <div className="flex items-center gap-4">
                   <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-950 font-black text-stone-300 shadow-sm border border-zinc-800">
                     {friend.rank}
                   </div>
                  <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full border-2 border-zinc-950 object-cover" />
                  <div>
                    <span className="font-bold text-lg text-white block leading-none">{friend.name}</span>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Homie</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-stone-200">{friend.score}</span>
                  <span className="text-[10px] text-amber-500/80 font-bold uppercase">Rating</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Peak Happiness (Day & Specific Hangout) */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg font-bold text-stone-200 tracking-tight">Peak Happiness</h3>
          </div>
          
          {/* Changed height from auto to aspect ratio to reduce height */}
          <div className="group relative rounded-3xl overflow-hidden shadow-2xl shadow-rose-900/20 aspect-[2/1]">
            {/* Background Image/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none"></div>
            <img 
              src="https://picsum.photos/400/200?random=99" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              alt="Memory" 
            />
            
            <div className="relative z-20 p-5 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                 <div className="bg-zinc-950/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                    <span className="text-rose-200 text-xs font-black uppercase tracking-widest">Thursday</span>
                 </div>
                 <div className="bg-amber-400 text-amber-900 px-2 py-1 rounded-md text-xs font-black flex items-center gap-1 shadow-lg">
                    <Medal className="w-3 h-3" /> Top Pick
                 </div>
              </div>
              
              <div>
                 <h4 className="text-lg font-black text-white leading-snug mb-1 drop-shadow-lg">
                   Late Night Drive & Burgers
                 </h4>
                 <div className="flex items-center gap-2">
                   <div className="flex -space-x-2">
                     <img src="https://picsum.photos/100/100?random=1" className="w-5 h-5 rounded-full border-2 border-zinc-900" />
                     <img src="https://picsum.photos/100/100?random=2" className="w-5 h-5 rounded-full border-2 border-zinc-900" />
                   </div>
                   <span className="text-[10px] text-stone-300 font-bold ml-1">with Kai & Sarah</span>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Overall Weekly Line Showcase */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-stone-200 tracking-tight">Weekly Mood Flow</h3>
          </div>
          <div className="h-64 w-full bg-zinc-900/40 backdrop-blur-sm rounded-3xl p-5 border border-zinc-800/50 relative">
            <div className="absolute top-4 right-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Happiness Index</div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_HAPPY_DATA}>
                <defs>
                  <linearGradient id="vibrantGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={15} 
                  fontFamily="monospace"
                  fontWeight="bold"
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950/90 border border-zinc-700 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                          <p className="text-amber-400 font-black text-xl mb-1">{data.score}/10</p>
                          <div className="h-px w-full bg-zinc-800 my-2"></div>
                          <p className="text-stone-300 text-xs font-bold uppercase tracking-wider mb-1 text-zinc-500">With</p>
                          <p className="text-white text-sm font-bold flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            {data.with}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="url(#vibrantGradient)" 
                  strokeWidth={5} 
                  dot={{ r: 0 }}
                  activeDot={{ r: 8, fill: '#fff', stroke: '#fbbf24', strokeWidth: 3 }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>
    </div>
  );
};

export default HappyIndex;