import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Clock, Building, Camera, 
  ChevronRight, Heart, Star,
  Plus, Music, MapPin, ChevronLeft,
  ChevronDown
} from 'lucide-react';
import { AppScreen, User } from '../types';
import { GlassCard, Avatar } from './UI';
import { ArchitecturalPrism } from './MapVisualization';

// --- CONTAINER ---

interface SessionJourneyProps {
  currentScreen: AppScreen;
  currentUser: User;
  friends: User[];
  onNavigate: (screen: AppScreen) => void;
  onClose: () => void;
}

export const SessionJourneyContainer: React.FC<SessionJourneyProps> = ({ 
  currentScreen, currentUser, friends, onNavigate, onClose 
}) => {
  const [selectedFriends, setSelectedFriends] = useState<User[]>([friends[0]]);
  
  return (
    <div className="absolute inset-0 z-[1000] bg-hyve-bg0 overflow-hidden">
      {currentScreen === AppScreen.SESSION_LIVE && (
        <Step1InSession 
          currentUser={currentUser} 
          friend={selectedFriends[0]} 
          onEnd={() => onNavigate(AppScreen.POST_SESSION_1)} 
        />
      )}
      {currentScreen === AppScreen.POST_SESSION_1 && (
        <Step2SessionEnded 
          friend={selectedFriends[0]} 
          onPost={() => onNavigate(AppScreen.POST_SESSION_2)} 
          onRecord={onClose} 
        />
      )}
      {currentScreen === AppScreen.POST_SESSION_2 && (
        <Step3Subject 
          friends={friends} 
          selectedFriends={selectedFriends} 
          onSelect={setSelectedFriends} 
          onNext={() => onNavigate(AppScreen.POST_SESSION_3)} 
        />
      )}
      {currentScreen === AppScreen.POST_SESSION_3 && (
        <Step4Content 
          onNext={() => onNavigate(AppScreen.POST_SESSION_4)} 
          friends={selectedFriends}
        />
      )}
      {currentScreen === AppScreen.POST_SESSION_4 && (
        <Step5Location 
          onPost={onClose} 
          friends={selectedFriends}
        />
      )}
    </div>
  );
};

// --- STAGE 1: IN SESSION ---

const Step1InSession = ({ currentUser, friend, onEnd }: any) => {
  const [seconds, setSeconds] = useState(0);
  const [prismHeight, setPrismHeight] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
      // Constructing animation simulation
      setPrismHeight(h => Math.min(h + 1.2, 160));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 animate-flip-in">
      <div className="absolute inset-0 bg-radial-gradient from-hyve-gold/5 to-transparent animate-pulse-slow pointer-events-none" />
      
      {/* Animation of building being constructed */}
      <div className="relative mb-12 h-64 flex items-end">
        <div className="animate-pulse">
           <ArchitecturalPrism color={friend.color} size={80} height={prismHeight} highlight />
        </div>
      </div>

      <div className="text-center mb-16">
        <div className="w-40 h-40 rounded-full border border-hyve-gold/20 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 border-2 border-hyve-gold rounded-full animate-ping opacity-20" style={{ animationDuration: '4s' }} />
          <span className="text-3xl font-light text-hyve-gold tracking-tighter">{formatTime(seconds)}</span>
          <span className="text-[7px] font-black text-hyve-gold/60 uppercase tracking-[0.2em] mt-2">Recording Ritual</span>
        </div>
      </div>

      <button 
        onClick={onEnd}
        className="glass-panel px-8 py-4 rounded-full flex items-center gap-2 group active:scale-95 transition-all"
      >
        <span className="text-[10px] font-black text-hyve-text1 uppercase tracking-widest">simulate end session?</span>
      </button>
    </div>
  );
};

// --- STAGE 2: SESSION ENDED ---

const Step2SessionEnded = ({ friend, onPost, onRecord }: any) => {
  return (
    <div className="h-full flex flex-col items-center pt-20 px-8 text-center animate-flip-in">
      {/* Construction stopped animation */}
      <div className="mb-8 h-32 flex items-end opacity-80">
        <ArchitecturalPrism color={friend.color} size={60} height={120} highlight />
      </div>

      <h1 className="text-3xl font-light text-hyve-text1 mb-2 tracking-tighter">Presence Built.</h1>
      <p className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-8">Session Summary</p>

      {/* Static summary from instructions */}
      <div className="flex gap-12 mb-10">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-light text-hyve-text1">45</span>
          <span className="text-[7px] font-black text-hyve-text3 uppercase tracking-widest text-center">Minutes</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-light text-hyve-text1">+12px</span>
          <span className="text-[7px] font-black text-hyve-text3 uppercase tracking-widest text-center">Growth</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full px-4 mt-auto pb-12">
        <button 
          onClick={onPost}
          className="bg-hyve-gold text-hyve-bg0 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-gold-glow active:scale-95 transition-all"
        >
          post your session!
        </button>
        <button 
          onClick={onRecord}
          className="glass-panel py-4 rounded-2xl text-[11px] font-black text-hyve-text2 uppercase tracking-widest active:scale-95 transition-all border-white/5"
        >
          only record it
        </button>
      </div>
    </div>
  );
};

// --- STAGE 3: SUBJECT ---

const JaggedLine = ({ color }: { color: string }) => (
  <div className="w-1.5 h-full overflow-hidden flex flex-col items-center opacity-80">
    <svg width="6" height="100%" preserveAspectRatio="none" className="overflow-visible">
       <defs>
          <pattern id={`jagged-${color}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
             <path d="M 0 0 L 6 3 L 0 6" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </pattern>
       </defs>
       <rect x="0" y="0" width="6" height="100%" fill={`url(#jagged-${color})`} />
    </svg>
  </div>
);

const PhoneUsageBlock = ({ startPct, endPct, side, label, color }: any) => {
  const top = `${startPct * 100}%`;
  const height = `${(endPct - startPct) * 100}%`;
  const isLeft = side === 'left';
  
  return (
     <div 
       className="absolute w-1/2 flex items-center"
       style={{ 
         top, 
         height, 
         [isLeft ? 'right' : 'left']: '50%',
       }}
     >
        {/* The Jagged Line */}
        <div className={`h-full flex ${isLeft ? 'mr-3 justify-end' : 'ml-3 justify-start'} w-full`}>
           <JaggedLine color={color} />
        </div>
        
        {/* Label and Bracket */}
        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center ${isLeft ? 'right-0 flex-row-reverse' : 'left-0'}`}>
             {/* Bracket */}
             <div className={`h-full w-1.5 border-t border-b ${isLeft ? 'border-r rounded-r-sm mr-1.5' : 'border-l rounded-l-sm ml-1.5'} border-white/30`} style={{ height: '120%', position: 'absolute', top: '-10%', [isLeft?'right':'left']: 0 }}></div>
             
             {/* Text */}
             <div className={`flex flex-col ${isLeft ? 'items-end mr-7' : 'items-start ml-7'}`}>
               <span className="text-[9px] font-bold text-hyve-text1 whitespace-nowrap leading-none mb-1">Phone</span>
               <span className="text-[8px] font-medium text-hyve-text3 whitespace-nowrap leading-none font-mono">{label}</span>
             </div>
        </div>
     </div>
  );
};

const TimelineColumn = ({ name, color, events, isMe, isActive, height }: { name: string, color: string, events: any[], isMe?: boolean, isActive?: boolean, height: number }) => {
  return (
    <div className={`flex flex-col items-center w-[100px] shrink-0 transition-all duration-500 ${isActive ? 'scale-110 opacity-100' : 'scale-90 opacity-30 blur-[0.5px]'}`}>
      <span className="text-[10px] font-black uppercase tracking-widest mb-4 truncate w-full text-center px-1" style={{ color: isMe ? 'var(--hyve-text1)' : color }}>
        {name}
      </span>
      <div className="relative w-full" style={{ height: `${height}px` }}>
        {/* Center Line - Fixed for visibility */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
        
        {/* Start Dot */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-hyve-text3/50"></div>

        {/* Usage Blocks */}
        {events.map((event, i) => (
          <div 
            key={i}
            className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-20'}`}
            style={{ top: `${event.startPct * 100}%`, height: `${(event.endPct - event.startPct) * 100}%` }}
          >
             <JaggedLine color={color} />
             {isActive && (
               <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
                  <span className="text-[8px] font-medium text-hyve-text3 font-mono whitespace-nowrap">{event.label}</span>
               </div>
             )}
          </div>
        ))}

        {/* End Dot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-hyve-text1 shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
      </div>
    </div>
  );
};

const Step3Subject = ({ friends, selectedFriends, onSelect, onNext, currentUser }: any) => {
  const [isExpanding, setIsExpanding] = useState(false);
  const [scrollIndex, setScrollIndex] = useState(0);
  const friend = selectedFriends[0];

  // Reset scroll index if it's out of bounds
  useEffect(() => {
    if (scrollIndex >= selectedFriends.length) {
      setScrollIndex(0);
    }
  }, [selectedFriends.length, scrollIndex]);

  // Logic for variable height based on duration (mocked as 170 mins = 2h 50m)
  const sessionMinutes = 170; 
  const timelineHeight = Math.max(300, sessionMinutes * 2.5); // 2.5px per minute

  const toggleFriend = (f: User) => {
    const exists = selectedFriends.some((sf: any) => sf.id === f.id);
    if (exists) {
      if (selectedFriends.length > 1) {
        onSelect(selectedFriends.filter((sf: any) => sf.id !== f.id));
      }
    } else {
      onSelect([...selectedFriends, f]);
    }
  };

  // Generate Mock Timeline Data for each selected person
  const allParticipants = useMemo(() => [
    { id: 'me', name: 'You', color: '#C9A86A', isMe: true },
    ...selectedFriends.map((f: User) => ({ id: f.id, name: f.name, color: f.color, isMe: false }))
  ], [selectedFriends]);

  const timelineData = useMemo(() => {
    return allParticipants.map((p, idx) => {
      // Mock some usage for each
      const events = [];
      const name = p.name.toLowerCase();
      if (idx === 0) { // Me
        events.push({ startPct: 0.20, endPct: 0.32, label: '30m' });
        events.push({ startPct: 0.75, endPct: 0.82, label: '12m' });
      } else if (name.includes('emily')) {
        events.push({ startPct: 0.65, endPct: 0.70, label: '10m' });
        events.push({ startPct: 0.10, endPct: 0.15, label: '8m' });
      } else if (name.includes('jordan')) {
        events.push({ startPct: 0.45, endPct: 0.55, label: '15m' });
      } else if (name.includes('sam')) {
        events.push({ startPct: 0.15, endPct: 0.25, label: '12m' });
      } else {
        events.push({ startPct: 0.40 + (idx * 0.05), endPct: 0.45 + (idx * 0.05), label: '5m' });
      }
      return { ...p, events };
    });
  }, [allParticipants]);

  const visibleParticipants = useMemo(() => {
    const count = timelineData.length;
    if (count === 0) return [];
    
    // We want 3 names: [prev, current, next]
    const currentIdx = scrollIndex % count;
    const prevIdx = (currentIdx - 1 + count) % count;
    const nextIdx = (currentIdx + 1) % count;

    return [
      { ...timelineData[prevIdx], isActive: false, position: 'left' },
      { ...timelineData[currentIdx], isActive: true, position: 'center' },
      { ...timelineData[nextIdx], isActive: false, position: 'right' }
    ];
  }, [timelineData, scrollIndex]);

  const handleSwitch = (direction: 'next' | 'prev') => {
    if (selectedFriends.length <= 1) return;
    if (direction === 'next') {
      setScrollIndex(prev => (prev + 1) % selectedFriends.length);
    } else {
      setScrollIndex(prev => (prev - 1 + selectedFriends.length) % selectedFriends.length);
    }
  };

  const buttonLabel = selectedFriends.length > 1 
    ? `${friend.name} +${selectedFriends.length - 1}` 
    : friend.name;

  const isMultiPerson = selectedFriends.length > 1;

  const currentFriend = selectedFriends[scrollIndex] || friend;
  const currentFriendData = timelineData.find(d => d.id === currentFriend.id);

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar">
      <div className="min-h-full flex flex-col items-center pt-14 px-8 animate-flip-in relative">
        <h2 className="text-[9px] font-black text-hyve-text3 uppercase tracking-[0.4em] mb-8">Subject</h2>
        
        {/* 1. Subject Avatars */}
        <div className="relative mb-5 min-h-[100px] flex items-center justify-center">
          {selectedFriends.length === 1 ? (
              <div className="w-[100px] h-[100px] rounded-full overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
                 <img src={friend.avatarUrl} className="w-full h-full object-cover" alt={friend.name} />
              </div>
          ) : (
              <div className="flex items-center justify-center -space-x-4">
                  {selectedFriends.slice(0, 3).map((f: User, idx: number) => (
                      <div 
                        key={f.id} 
                        className={`w-[80px] h-[80px] rounded-full overflow-hidden border-2 border-hyve-bg0 shadow-xl relative transition-all duration-300 ${scrollIndex === idx ? 'scale-110 z-50 ring-2 ring-hyve-gold' : 'opacity-50'}`}
                        style={{ zIndex: selectedFriends.length - idx }} 
                      >
                         <img src={f.avatarUrl} className="w-full h-full object-cover" alt={f.name} />
                         <div className="absolute inset-0 rounded-full border border-hyve-gold/20"></div>
                      </div>
                  ))}
              </div>
          )}
        </div>

        {/* 2. With Selector */}
        <div className="flex items-center gap-3 mb-10 relative z-50">
           <span className="text-sm font-medium text-hyve-text2">with</span>
           <button 
             onClick={() => setIsExpanding(!isExpanding)}
             className="glass-panel px-5 py-2.5 rounded-2xl flex items-center gap-2 border-hyve-gold/20 active:scale-95 transition-all"
           >
              <span className="text-sm font-bold text-hyve-gold truncate max-w-[120px]">
                {buttonLabel}
              </span>
              <ChevronDown size={14} className={`text-hyve-gold/50 transition-transform ${isExpanding ? 'rotate-180' : ''}`} />
           </button>

           {/* Friends Selection Dropdown */}
           {isExpanding && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 glass-panel rounded-2xl overflow-hidden z-[1100] shadow-2xl animate-flip-in origin-top">
              <div className="p-2 max-h-48 overflow-y-auto no-scrollbar space-y-1 bg-hyve-bg2/95">
                {friends.map((f: any) => {
                  const isSelected = selectedFriends.some((sf: any) => sf.id === f.id);
                  return (
                    <button 
                      key={f.id} 
                      onClick={() => toggleFriend(f)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${isSelected ? 'bg-hyve-gold/10' : 'hover:bg-white/5'}`}
                    >
                      <Avatar src={f.avatarUrl} size="sm" />
                      <span className={`text-xs font-bold ${isSelected ? 'text-hyve-gold' : 'text-hyve-text1'}`}>{f.name}</span>
                      {isSelected && <div className="ml-auto w-1.5 h-1.5 bg-hyve-gold rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Time Duration */}
        <div className="text-3xl font-light text-hyve-text1 tracking-tighter mb-8 tabular-nums tracking-widest">
           02 : 50 : 47
        </div>

        {/* 4. Timeline Visualization */}
        <div className="w-full flex-1 flex flex-col relative">
            <div className="flex flex-col items-center w-full">
              {/* Headers */}
              <div className="flex w-full max-w-[260px] mb-4 text-[9px] font-black text-hyve-text3 uppercase tracking-widest relative h-4 overflow-hidden">
                 <span className="text-hyve-text1 absolute left-0 w-1/2 text-left px-5 z-20 bg-hyve-bg0">You</span>
                 <div className="absolute right-0 w-1/2 h-full overflow-hidden z-10">
                    <div 
                      className="flex transition-transform duration-300 ease-out h-full w-full"
                      style={{ transform: `translateX(-${scrollIndex * 100}%)` }}
                    >
                      {selectedFriends.map((f: User) => (
                        <span key={f.id} className="shrink-0 w-full text-right px-5" style={{ color: f.color }}>{f.name}</span>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Chart Area */}
              <div className="relative w-full max-w-[260px] py-6" style={{ height: `${timelineHeight + 48}px` }}>
                 {/* Center Line */}
                 <div className="absolute top-12 bottom-12 left-1/2 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-white/40 to-transparent z-20"></div>
                 
                 {/* Start Dot & Time */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                    <span className="text-[8px] font-black text-hyve-text3 mb-2 uppercase tracking-widest">12:00 PM</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-hyve-text3/50"></div>
                 </div>

                 {/* Timeline Content Container (to offset usage blocks by the line's start) */}
                 <div className="absolute top-12 bottom-12 left-0 right-0">
                    {/* "You" side (Left) - Static */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                        <PhoneUsageBlock startPct={0.20} endPct={0.32} side="left" label="30m" color="#C9A86A" />
                        <PhoneUsageBlock startPct={0.75} endPct={0.82} side="left" label="12m" color="#C9A86A" />
                    </div>
                    
                    {/* Friends side (Right) - Clickable Switcher */}
                    <div className="absolute inset-0 z-10">
                        {/* Current Friend Data */}
                        <div className="absolute inset-0 pointer-events-none" key={currentFriend.id}>
                          {currentFriendData?.events.map((event: any, i: number) => (
                            <PhoneUsageBlock 
                              key={i}
                              startPct={event.startPct} 
                              endPct={event.endPct} 
                              side="right" 
                              label={event.label} 
                              color={currentFriend.color} 
                            />
                          ))}
                        </div>

                        {/* Click Targets */}
                        <div className="absolute inset-0 flex">
                           <div 
                             className="w-1/2 h-full cursor-pointer active:bg-white/5 transition-colors" 
                             onClick={() => handleSwitch('prev')} 
                           />
                           <div 
                             className="w-1/2 h-full cursor-pointer active:bg-white/5 transition-colors" 
                             onClick={() => handleSwitch('next')} 
                           />
                        </div>
                    </div>
                 </div>

                 {/* End Dot & Time */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-hyve-text1 shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                    <span className="text-[8px] font-black text-hyve-text1 mt-2 uppercase tracking-widest">02:50 PM</span>
                 </div>
              </div>

              {/* Pagination Indicators (only if multi-person) */}
              {isMultiPerson && (
                <div className="flex gap-1.5 mt-8">
                  {selectedFriends.map((_: any, i: number) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-300 ${i === scrollIndex ? 'w-4 bg-hyve-gold' : 'w-1 bg-white/20'}`}
                    />
                  ))}
                </div>
              )}
            </div>
        </div>

        {/* Next Button at the very bottom */}
        <div className="pb-12 mt-8">
          <NextButton onClick={onNext} />
        </div>
      </div>
    </div>
  );
};

// --- STAGE 4: CONTENT ---

const Step4Content = ({ onNext, friends }: any) => {
  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState('Study');

  const types = ['Gym', 'Study', 'Hike', 'Chat', 'Vibe'];

  return (
    <div className="h-full flex flex-col items-center pt-20 px-6 animate-flip-in overflow-y-auto no-scrollbar">
      <h2 className="text-[9px] font-black text-hyve-text3 uppercase tracking-[0.4em] mb-8 shrink-0">Content</h2>
      
      {/* Icon Transition: Smoothly transitions from avatars to building icon (bottom-up view) */}
      <div className="mb-10 scale-125 transform transition-all duration-1000 origin-bottom shrink-0" style={{ perspective: '1000px' }}>
        <div style={{ transform: 'rotateX(-25deg) rotateY(15deg)' }}>
          <ArchitecturalPrism color={friends[0].color} size={60} height={180} highlight />
        </div>
      </div>

      <div className="w-full space-y-8 shrink-0">
        {/* Prompt 1: Type Selection */}
        <div className="space-y-3">
          <label className="text-[8px] font-black text-hyve-text3 uppercase tracking-widest px-1">Type of Hangout</label>
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <button 
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-4 py-2 rounded-xl border text-[10px] font-bold transition-all ${selectedType === t ? 'bg-hyve-gold/20 border-hyve-gold text-hyve-gold' : 'border-white/5 text-hyve-text3'}`}
              >
                {t}
              </button>
            ))}
            <button className="px-4 py-2 rounded-xl border border-white/5 text-[10px] font-bold text-hyve-text3 flex items-center gap-1">
              <Plus size={10} /> Custom
            </button>
          </div>
        </div>

        {/* Prompt 2: Photos Box */}
        <div className="space-y-3">
          <label className="text-[8px] font-black text-hyve-text3 uppercase tracking-widest px-1">Moments</label>
          <div className="w-full aspect-video glass-panel rounded-3xl border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group cursor-pointer active:scale-[0.98] transition-transform">
             <Camera size={20} className="text-hyve-text3 group-hover:text-hyve-gold transition-colors" />
             <span className="text-[8px] font-black text-hyve-text3 uppercase tracking-widest text-center px-4">Post Photos/Videos</span>
          </div>
        </div>

        {/* Prompt 3: Experience writing */}
        <div className="space-y-3">
          <label className="text-[8px] font-black text-hyve-text3 uppercase tracking-widest px-1">Experience</label>
          <textarea 
            maxLength={150}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How was the session?"
            className="w-full h-24 glass-panel rounded-3xl p-4 text-[11px] text-hyve-text1 focus:outline-none focus:border-hyve-gold/30 placeholder:text-hyve-text3 resize-none border-white/5 bg-transparent"
          />
          <div className="text-right text-[8px] font-bold text-hyve-text3 px-1">{text.length}/150</div>
        </div>

        {/* Prompt 4: Music UI */}
        <div className="space-y-3">
          <label className="text-[8px] font-black text-hyve-text3 uppercase tracking-widest px-1">Presence Music</label>
          <div className="w-full glass-panel rounded-2xl px-4 py-3 flex items-center justify-between border-white/5 group active:bg-white/5 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Music size={14} className="text-hyve-gold" />
              <span className="text-[10px] font-bold text-hyve-text3 uppercase tracking-widest">Select Vibe...</span>
            </div>
            <Plus size={12} className="text-hyve-text3" />
          </div>
        </div>
      </div>

      <div className="py-12 mt-auto shrink-0">
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
};

// --- STAGE 5: LOCATION ---

const Step5Location = ({ onPost, friends }: any) => {
  const [review, setReview] = useState('');
  const [ratings, setRatings] = useState({ service: 0, vibe: 0, food: 0, location: 0, wifi: 0 });

  const categories = [
    { key: 'service', label: 'Service' },
    { key: 'vibe', label: 'Vibe' },
    { key: 'food', label: 'Food/Drink' },
    { key: 'location', label: 'Location' },
    { key: 'wifi', label: 'WiFi' }
  ];

  return (
    <div className="h-full flex flex-col items-center pt-20 px-6 animate-flip-in overflow-y-auto no-scrollbar">
      <h2 className="text-[9px] font-black text-hyve-text3 uppercase tracking-[0.4em] mb-10">Location</h2>
      
      {/* Icon Transition: Top-down View (Map perspective) */}
      <div className="mb-14 relative w-32 h-32 flex items-center justify-center transition-all duration-1000">
         <div className="absolute inset-0 bg-hyve-bg1 rounded-full border border-white/5 blur-xl opacity-40" />
         <div style={{ transform: 'rotateX(55deg) rotateZ(-15deg)' }}>
            <ArchitecturalPrism color={friends[0].color} size={60} height={35} highlight />
         </div>
         {/* Map context details */}
         <div className="absolute -top-4 -right-4 w-1.5 h-1.5 rounded-full bg-hyve-gold/30 animate-pulse" />
         <div className="absolute top-12 -left-10 w-5 h-1 rounded-full bg-white/5 rotate-45" />
         <div className="absolute -bottom-6 left-8 w-1 h-4 rounded-full bg-white/10" />
      </div>

      <div className="w-full space-y-6 pb-32">
        {/* Rating Category List */}
        <div className="space-y-4 px-2">
           {categories.map((cat: any) => (
             <div key={cat.key} className="flex items-center justify-between">
               <span className="text-[9px] font-black text-hyve-text3 uppercase tracking-widest">{cat.label}</span>
               <div className="flex gap-1.5">
                 {[1, 2, 3, 4, 5].map(star => (
                   <button 
                    key={star} 
                    onClick={() => setRatings({...ratings, [cat.key]: star})}
                    className="active:scale-125 transition-transform"
                   >
                     <Star 
                      size={14} 
                      className={star <= (ratings as any)[cat.key] ? 'text-hyve-gold fill-hyve-gold' : 'text-white/5 fill-transparent'} 
                      strokeWidth={1.5}
                     />
                   </button>
                 ))}
               </div>
             </div>
           ))}
        </div>

        {/* Short Review Writing */}
        <div className="space-y-3">
          <label className="text-[8px] font-black text-hyve-text3 uppercase tracking-widest px-1">Review</label>
          <textarea 
            maxLength={150}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write a short review..."
            className="w-full h-20 glass-panel rounded-2xl p-4 text-[11px] text-hyve-text1 focus:outline-none focus:border-hyve-gold/30 placeholder:text-hyve-text3 resize-none border-white/5 bg-transparent"
          />
          <div className="text-right text-[8px] font-bold text-hyve-text3 px-1">{review.length}/150</div>
        </div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 px-8">
        <button 
          onClick={onPost}
          className="w-full bg-hyve-gold text-hyve-bg0 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-gold-glow active:scale-95 transition-all"
        >
          Post
        </button>
      </div>
    </div>
  );
};

// --- HELPERS ---

const NextButton = ({ onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className="w-14 h-14 rounded-full glass-panel flex items-center justify-center border-white/10 group active:scale-90 transition-all shadow-xl"
  >
    {icon || <ChevronRight className="text-hyve-text2 group-hover:text-hyve-gold transition-colors" size={20} />}
  </button>
);