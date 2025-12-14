'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Calendar, Smile, MapPin, Camera } from 'lucide-react';
import { LineChart, Line, XAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  WeeklyHappyIndexDataPoint,
  PeakHappinessMemory,
} from '@/modules/memories/service';

interface HappyIndexProps {
  userId: string;
  weeklyData: WeeklyHappyIndexDataPoint[];
  peakMemories: PeakHappinessMemory[];
}

// Custom Dot to render Peak and Low icons (similar to Dashboard Weekly Focus)
const CustomDot = (props: any) => {
  const { cx, cy, payload, data } = props;
  
  if (!data || data.length === 0) return null;

  const values = data.map((d: any) => d.score).filter((v: number) => v > 0);
  if (values.length === 0) return <circle cx={cx} cy={cy} r={0} />;
  
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  // High Peak
  if (payload.score === max && payload.score > 0) {
     return (
        <g>
           <circle cx={cx} cy={cy} r={6} fill="#fcd34d" stroke="#18181b" strokeWidth={3} />
           <foreignObject x={cx - 20} y={cy - 28} width={40} height={20}>
             <div className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-1 rounded-md text-center border border-amber-500/20">
               {payload.score.toFixed(1)}
             </div>
           </foreignObject>
        </g>
     );
  }
  
  // Low Peak (only show if there's a meaningful difference)
  if (payload.score === min && payload.score > 0 && max - min > 1) {
      return (
        <g>
           <circle cx={cx} cy={cy} r={6} fill="#fb7185" stroke="#18181b" strokeWidth={3} />
           <foreignObject x={cx - 20} y={cy + 10} width={40} height={20}>
              <div className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-1 rounded-md text-center border border-rose-500/20">
               {payload.score.toFixed(1)}
              </div>
           </foreignObject>
        </g>
     );
  }
  return <circle cx={cx} cy={cy} r={0} />; 
};

const HappyIndex: React.FC<HappyIndexProps> = ({ userId, weeklyData, peakMemories }) => {
  const router = useRouter();

  // Calculate weekly average happyIndex
  const weeklyAverage = weeklyData.length > 0
    ? weeklyData.reduce((sum, day) => sum + day.score, 0) / weeklyData.length
    : 0;

  // Format date for week display (showing date range)
  const getWeekRange = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);
    
    const formatDatePart = (date: Date) => {
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };
    
    const startDate = formatDatePart(weekAgo);
    const endDate = formatDatePart(today);
    
    // If same month, only show month once: "Dec 8 - 14"
    if (weekAgo.getMonth() === today.getMonth() && weekAgo.getFullYear() === today.getFullYear()) {
      const month = weekAgo.toLocaleDateString('en-US', { month: 'short' });
      return `${month} ${weekAgo.getDate()} - ${today.getDate()}`;
    }
    
    // Different months: "Dec 8 - Jan 14"
    return `${startDate} - ${endDate}`;
  };

  // Format time for memory display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format date for memory display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 overflow-y-auto scrollbar-hide">
      
      {/* Dynamic Backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center sticky top-0 bg-zinc-950/80 backdrop-blur-md z-30 border-b border-white/5">
        <h2 className="text-xl font-bold text-stone-200 flex items-center gap-2">
          <Smile className="text-amber-400 fill-amber-400 w-6 h-6" />
          Happy Index
        </h2>
        <button 
          onClick={() => router.back()} 
          className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors border border-zinc-800"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
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
              {weeklyAverage > 0 ? weeklyAverage.toFixed(1) : '0.0'}
            </div>
          </div>
          <h1 className="mt-8 text-3xl font-black text-white uppercase tracking-tight drop-shadow-md">
            {weeklyAverage >= 8 ? 'Immaculate' : weeklyAverage >= 6 ? 'Great' : 'Meh'} Vibes
          </h1>
          <p className="text-amber-200/60 text-sm font-bold tracking-widest uppercase mt-2">{getWeekRange()}</p>
        </section>

        {/* 2. Peak Happiness Cards */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg font-bold text-stone-200 tracking-tight">Peak Happiness</h3>
          </div>
          
          {peakMemories.length > 0 ? (
            <div className="space-y-4">
              {peakMemories.map((memory) => {
                const participants = memory.focusSession.friends.map(
                  f => f.friend.user.name || 'Unknown'
                );
                const displayPhotos = memory.photos.slice(0, 2);
                
                return (
                  <div 
                    key={memory.id} 
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-zinc-700 transition-colors"
                  >
                    <div className="p-5 border-b border-zinc-800/50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-black text-stone-200">
                          {memory.content || 'Memory'}
                        </h3>
                        {memory.happyIndex !== null && (
                          <div className="bg-amber-400/20 text-amber-300 border border-amber-500/30 text-xs font-black px-2 py-1 rounded-md">
                            {memory.happyIndex}/10
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mt-3">
                        {memory.location && (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{memory.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{formatDate(memory.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Participants & Photos */}
                    <div className="bg-zinc-950/30 p-4 space-y-4">
                      {/* Participants */}
                      {participants.length > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {memory.focusSession.friends.map((f) => (
                              <div
                                key={f.friend.id}
                                className="w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden"
                              >
                                {f.friend.user.image ? (
                                  <img 
                                    src={f.friend.user.image} 
                                    alt={f.friend.user.name || ''}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-xs text-white font-bold">
                                    {(f.friend.user.name || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="text-xs font-bold text-zinc-500">
                            with {participants.join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Photos */}
                      {displayPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {displayPhotos.map((photo) => (
                            <div 
                              key={photo.id} 
                              className="relative aspect-video rounded-xl overflow-hidden group/photo"
                            >
                              <img 
                                src={photo.photoUrl} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" 
                                alt="Memory" 
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover/photo:bg-transparent transition-colors"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-3 flex items-center justify-center gap-2 text-zinc-600">
                          <Camera className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">No photos taken</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-zinc-900/20 rounded-3xl p-8 flex flex-col items-center justify-center border border-zinc-800/30">
              <p className="text-zinc-500 text-sm font-medium text-center">
                No peak happiness memories yet
              </p>
              <p className="text-zinc-600 text-xs mt-2 text-center">
                Create memories with happy index scores to see them here
              </p>
            </div>
          )}
        </section>

        {/* 3. Weekly Mood Flow */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-stone-200 tracking-tight">Weekly Mood Flow</h3>
          </div>
          <div className="w-full bg-zinc-900/50 rounded-3xl px-2 py-4 border border-zinc-800/50 relative">
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 40, right: 20, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="#fcd34d" />
                    </linearGradient>
                  </defs>
                  
                  {/* Vertical blurred dotted lines */}
                  <CartesianGrid 
                    vertical={true} 
                    horizontal={false} 
                    stroke="#52525b" 
                    strokeDasharray="4 4" 
                    strokeOpacity={0.2} 
                  />

                  <XAxis 
                    dataKey="day" 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                    fontWeight={600}
                    interval={0} // Force show all days
                    padding={{ left: 0, right: 0 }}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']} // Extend domain to hide edge grid lines
                  />

                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="url(#colorGradient)" 
                    strokeWidth={3} 
                    dot={<CustomDot data={weeklyData} />} // Custom Peak/Low dots
                    activeDot={false}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default HappyIndex;