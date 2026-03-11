import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Play } from 'lucide-react';
import { AppScreen, User, PlaceAggregate } from '../types';
import { GlassCard, Avatar } from './UI';
import { MapVisualization } from './MapVisualization';
import { HYVE_DATABASE } from '../data';
import { MOCK_SESSIONS, INSIGHTS, formatDuration } from '../src/data_constants';

export const FriendCircleItem: React.FC<{ friend: User, onNavigate: (s: AppScreen, u?: User) => void }> = ({ friend, onNavigate }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const timerRef = useRef<any>(null);

  const handleStart = () => {
    timerRef.current = setTimeout(() => {
      setIsTooltipVisible(true);
      if (navigator.vibrate) navigator.vibrate(10);
    }, 500);
  };

  const handleEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isTooltipVisible) {
      setTimeout(() => setIsTooltipVisible(false), 2000);
    } else {
      if (friend.savedMomentsCount === 0) {
        onNavigate(AppScreen.MAP, friend);
      } else {
        onNavigate(AppScreen.RECAP, friend);
      }
    }
  };

  const logCount = friend.savedMomentsCount || 0;
  const hasLogs = logCount > 0;

  return (
    <div 
      className="snap-start shrink-0 flex flex-col items-center gap-3 group cursor-pointer w-[64px] relative"
      onTouchStart={handleStart} 
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={() => {
        clearTimeout(timerRef.current);
        setIsTooltipVisible(false);
      }}
    >
        {/* Tooltip */}
        <div 
          className={`absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[100] glass-panel px-3 py-1.5 rounded-xl border-white/10 shadow-xl transition-all duration-200 pointer-events-none ${isTooltipVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          <div className="text-center">
            <span className="block text-[10px] font-bold text-hyve-text1 leading-tight">{friend.name}</span>
            <span className="block text-[8px] font-medium text-hyve-text3 leading-tight mt-0.5">
               {friend.savedMomentsCount === 0 ? 'No saved moments yet' : `${friend.savedMomentsCount} saved moments (7d)`}
            </span>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white/10"></div>
        </div>

        {/* Avatar Container with Badge */}
        <div className="relative">
          <div className={`relative w-[52px] h-[52px] rounded-full overflow-hidden transition-transform duration-300 group-active:scale-90 ${friend.isOnline ? 'ring-2 ring-hyve-gold ring-offset-2 ring-offset-hyve-bg0' : 'border border-white/10'}`}>
             <img src={friend.avatarUrl} className="w-full h-full object-cover" alt={friend.name} draggable="false" />
          </div>

          {/* Log Count Badge */}
          {hasLogs && (
              <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-hyve-gold/60 rounded-full animate-pulse blur-[1px]"></div>
                <div className="relative min-w-[14px] h-[14px] px-1 bg-hyve-bg0 border border-hyve-gold/80 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(201,168,106,0.3)]">
                    <span className="text-[8px] font-black text-hyve-gold leading-none">{logCount}</span>
                </div>
              </div>
          )}
        </div>

        <span className="text-[9px] font-medium text-hyve-text2 truncate w-full text-center">{friend.name}</span>
    </div>
  );
};

export const HomeScreen = ({ onNavigate, buildings, onStartRitual, friends, currentUser }: { onNavigate: (s: AppScreen, u?: User) => void, buildings: PlaceAggregate[], onStartRitual: () => void, friends: User[], currentUser: User }) => {
  const [insightIndex, setInsightIndex] = useState(0);
  const [isTodayExpanded, setIsTodayExpanded] = useState(false);
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  // Calculate today's stats dynamically
  const todaySessions = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    return MOCK_SESSIONS.filter(s => s.endTime >= startOfDay).map(s => {
       const f = friends.find(u => u.id === s.friendId);
       // Infer activity from DB or default
       let activity = 'Bonding';
       if (f?.name === 'Emily') {
           const hour = new Date(s.endTime).getHours();
           activity = hour < 18 ? 'Cafe' : 'Drinking'; 
       }
       if (f?.name === 'Jordan') activity = 'Eating';
       if (f?.name === 'Sam') activity = 'Bonding'; 

       return { ...s, friend: f, activity };
    }).sort((a, b) => a.startTime - b.startTime); // Earliest first
  }, [friends]);

  const todayTotalMinutes = useMemo(() => todaySessions.reduce((acc, s) => acc + s.focusedMinutes, 0), [todaySessions]);

  useEffect(() => {
    const interval = setInterval(() => setInsightIndex(prev => (prev + 1) % INSIGHTS.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
  <div className="h-full w-full flex flex-col pt-14 px-4 pb-24 overflow-hidden gap-2 relative">
    {/* Header */}
    <div className="flex justify-between items-center shrink-0 pt-2 px-2">
      <div className="flex flex-col">
        <span className="text-[8px] font-black tracking-[0.2em] text-hyve-text3 uppercase mb-0.5">{dateStr}</span>
        <h1 className="text-xl font-light text-hyve-text1 tracking-tight leading-none">Hi, {currentUser.name}</h1>
      </div>
      <button onClick={() => onNavigate(AppScreen.PROFILE, currentUser)} className="active:scale-95 transition-transform">
         <Avatar src={currentUser.avatarUrl} size="sm" hasRing />
      </button>
    </div>


    {/* Stats Card (Today) - Expandable */}
    <div className="shrink-0 px-2 mt-1 relative z-50">
      <GlassCard 
         className={`transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden !rounded-[24px] ${isTodayExpanded ? 'max-h-[500px] bg-hyve-bg2/95 shadow-2xl' : 'max-h-14'}`} 
         noPadding
         onClick={() => setIsTodayExpanded(!isTodayExpanded)}
      >
        {/* Collapsed Header View */}
        <div className="flex items-center justify-between px-6 h-14 cursor-pointer">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-light text-hyve-text1 tracking-tighter whitespace-nowrap">10h 30m</span>
            <span className="text-[8px] font-black text-hyve-text3 uppercase tracking-[0.2em] translate-y-[-2px]">Today</span>
          </div>
          
          <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all duration-500 border border-white/5 ${isTodayExpanded ? 'rotate-180 bg-white/10 scale-110' : ''}`}>
                 <ChevronDown size={14} className="text-hyve-text2" />
              </div>
          </div>
        </div>

        {/* Expanded Content View (Timeline) */}
        <div className={`relative px-4 pb-6 pt-0 transition-opacity duration-300 delay-100 ${isTodayExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="border-t border-white/5 pt-4 max-h-[360px] overflow-y-auto no-scrollbar">
                {/* Vertical Axis Line */}
                <div className="absolute left-1/2 top-4 bottom-6 w-px -translate-x-1/2 border-l border-dashed border-white/20" />
                
                <div className="space-y-6 pb-4">
                   {todaySessions.map((session, i) => {
                       const isRight = i % 2 === 0; // Alternate sides: Top (0) is Right in screenshot, 1 is Left
                       const color = session.friend?.color || '#fff';
                       
                       return (
                           <div key={i} className="relative w-full flex items-center mb-1">
                              
                              {/* Absolute Marker - Centered */}
                              <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-[2px] bg-hyve-bg1 z-10 flex items-center justify-center" style={{ borderColor: color }} />

                              {/* Left Content */}
                              <div className={`flex-1 flex ${isRight ? 'justify-end pr-5 text-right' : 'justify-end pr-5'}`}>
                                 {isRight ? (
                                    // Time Label
                                    <div className="flex flex-col pt-2">
                                       <span className="text-[12px] font-bold text-hyve-text1 font-mono leading-none tracking-tight">
                                         {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                                       </span>
                                       <span className="text-[10px] font-medium text-hyve-text3 font-mono mt-0.5 opacity-60">
                                          - {new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                                       </span>
                                    </div>
                                 ) : (
                                    // Card (Left)
                                    <div className="w-full flex justify-end">
                                       <div 
                                         className="relative p-3 rounded-2xl border backdrop-blur-md transition-transform duration-300 active:scale-[0.98] w-full max-w-[140px] overflow-hidden"
                                         style={{ backgroundColor: `${color}08`, borderColor: `${color}20`, borderRadius: '16px 4px 16px 16px' }}
                                       >
                                          <div className="absolute right-0 bottom-0 text-[3.5rem] font-black leading-none pointer-events-none -mb-3 -mr-1 z-0 opacity-20 animate-pulse-slow" style={{ color: color }}>
                                             {Math.round(session.focusedMinutes)}
                                          </div>
                                          <div className="relative z-10 flex items-center gap-3">
                                             <Avatar src={session.friend?.avatarUrl || ''} size="sm" />
                                             <div className="flex flex-col">
                                                <span className="text-xs font-black text-hyve-text1 leading-tight">{session.friend?.name}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-80" style={{ color: color }}>{session.activity}</span>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 )}
                              </div>

                              {/* Right Content */}
                              <div className={`flex-1 flex ${isRight ? 'justify-start pl-5' : 'justify-start pl-5 text-left'}`}>
                                 {isRight ? (
                                    // Card (Right)
                                    <div className="w-full flex justify-start">
                                       <div 
                                         className="relative p-3 rounded-2xl border backdrop-blur-md transition-transform duration-300 active:scale-[0.98] w-full max-w-[140px] overflow-hidden"
                                         style={{ backgroundColor: `${color}08`, borderColor: `${color}20`, borderRadius: '4px 16px 16px 16px' }}
                                       >
                                          {/* Watermark Number */}
                                          <div className="absolute right-0 bottom-0 text-[3.5rem] font-black leading-none pointer-events-none -mb-3 -mr-1 z-0 opacity-20 animate-pulse-slow" style={{ color: color }}>
                                             {Math.round(session.focusedMinutes)}
                                          </div>
                                          <div className="relative z-10 flex items-center gap-3">
                                             <Avatar src={session.friend?.avatarUrl || ''} size="sm" />
                                             <div className="flex flex-col">
                                                <span className="text-xs font-black text-hyve-text1 leading-tight">{session.friend?.name}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-80" style={{ color: color }}>{session.activity}</span>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 ) : (
                                    // Time Label
                                    <div className="flex flex-col pt-2">
                                       <span className="text-[12px] font-bold text-hyve-text1 font-mono leading-none tracking-tight">
                                         {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                                       </span>
                                       <span className="text-[10px] font-medium text-hyve-text3 font-mono mt-0.5 opacity-60">
                                          - {new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>
                       );
                   })}
                </div>
            </div>
        </div>
      </GlassCard>
    </div>


    {/* Live Map Preview */}
    <div className="shrink-0 h-[140px] rounded-[32px] overflow-hidden relative border border-white/5 shadow-soft cursor-pointer transition-all active:scale-[0.99] mx-2 mt-1">
      <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-[8px] font-black uppercase tracking-widest text-hyve-text1">Live</span>
      </div>
      <div className="absolute inset-0 bg-hyve-bg1 flex items-center justify-center transform scale-[0.8]">
         <MapVisualization variant="marker" building={buildings[0]} onClick={() => {}} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-hyve-bg0/80 via-transparent to-transparent pointer-events-none"></div>
    </div>


    {/* Friend Circle Row */}
    <div className="shrink-0 w-full mt-0">
      <div className="flex justify-between items-center px-5 mb-0">
        <h3 className="text-[8px] font-black text-hyve-text3 uppercase tracking-[0.2em]">My Circle</h3>
        <button className="flex items-center gap-0.5 text-[8px] font-medium text-hyve-text3 opacity-60 hover:opacity-100 transition-opacity">
          See all <ChevronRight size={8} />
        </button>
      </div>
      <div className="flex overflow-x-auto px-5 pt-4 pb-2 gap-3 snap-x snap-mandatory no-scrollbar">
        {[...friends, ...friends].map((f, i) => (
          <FriendCircleItem key={`${f.id}-${i}`} friend={f} onNavigate={onNavigate} />
        ))}
      </div>
    </div>


    {/* Floating Ritual Button */}
    <button onClick={onStartRitual} className="absolute bottom-[115px] right-4 w-18 h-18 rounded-full bg-hyve-gold text-hyve-bg0 shadow-[0_10px_40px_rgba(201,168,106,0.6)] flex items-center justify-center z-[100] active:scale-90 transition-all border border-white/20">
      <Play size={32} fill="currentColor" className="ml-1.5" />
    </button>


    {/* Insight Ticker */}
    <div className="shrink-0 text-center pb-1 px-4 h-6 relative mt-auto">
       <div key={insightIndex} className="animate-flip-in origin-top">
          <p className="text-[10px] font-medium text-hyve-text3 italic truncate">"Sunday is your day"</p>
       </div>
    </div>
  </div>
  );
};
