import React, { useState } from 'react';
import { X, Image as ImageIcon, Clock, Building, Users, Globe, Zap, Settings, Sun, Moon } from 'lucide-react';
import { User, AppScreen, SessionLog, Photo } from '../types';
import { Avatar, ScrollIndicator } from './UI';
import { HYVE_DATABASE, SESSION_LOGS } from '../data';
import { THEME_COLORS, GENERAL_COLORS } from '../src/constants';

export const ColorPalette = ({ currentColor, onSelect, onClose, isLightMode }: any) => (
  <div className="fixed inset-x-0 bottom-24 z-[1000] flex justify-center px-6 animate-flip-in origin-bottom pointer-events-auto">
    <div className={`glass-panel p-2.5 rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl border flex flex-col gap-2 w-full max-w-[240px] ${
      isLightMode ? 'bg-white/90 border-black/10' : 'bg-black/80 border-white/10'
    }`}>
      <div className="flex justify-between items-center px-1">
        <h4 className={`text-[7px] font-black uppercase tracking-[0.3em] ${isLightMode ? 'text-black/40' : 'text-hyve-text3'}`}>Border Style</h4>
        <button onClick={onClose} className="text-hyve-gold active:scale-90 transition-transform">
           <X size={12} />
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4 p-1">
        {[...THEME_COLORS, ...GENERAL_COLORS].map((color) => (
          <button
            key={color}
            onClick={(e) => { e.stopPropagation(); onSelect(color); onClose(); }}
            className={`relative w-11 h-11 rounded-xl transition-all flex items-center justify-center border-2 overflow-hidden ${
              currentColor === color ? 'scale-110 shadow-lg' : 'border-white/5 hover:border-white/20'
            }`}
            style={{ 
              borderColor: currentColor === color ? 'white' : 'transparent',
              backgroundColor: color 
            }}
          >
            {/* Dynamic Rainbow Border for all colors */}
            <div 
              className="absolute -inset-[1.5px] rounded-full animate-rainbow-border opacity-40" 
              style={{ 
                backgroundImage: `linear-gradient(to right, ${color} 0%, ${color} 40%, rgba(255,255,255,0.8) 50%, ${color} 60%, ${color} 100%)`,
                backgroundSize: '200% 200%'
              }}
            />
            {currentColor === color && <Zap size={12} className="text-white drop-shadow-md relative z-10" />}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export const MetricCapsule = ({ icon: Icon, value, label, position, opacity, delay, themeColor }: any) => (
  <div 
    className={`absolute z-[140] flex items-center gap-2.5 px-3 py-1.5 border rounded-full backdrop-blur-xl shadow-[0_12px_24px_rgba(0,0,0,0.6)] animate-float transition-all duration-500 ${position}`}
    style={{ 
      opacity, 
      animationDelay: delay,
      backgroundColor: `${themeColor}40`, 
      borderColor: `${themeColor}60`      
    }}
  >
    <div style={{ color: themeColor }} className="shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
      <Icon size={14} strokeWidth={2.5} />
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-sm font-black text-hyve-text1 mb-0.5">{value}</span>
      <span className="text-[7px] font-black text-hyve-text3 uppercase tracking-widest">{label}</span>
    </div>
  </div>
);

interface ProfileScreenProps {
  user: User;
  onClose: () => void;
  currentUser: User;
  takenColors: string[];
  onColorChange: (color: string) => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
  onNavigate: (screen: AppScreen, user?: User, sessionLog?: SessionLog) => void;
}

export const SettingsOverlay = ({ onClose, isLightMode, onToggleTheme }: { onClose: () => void, isLightMode: boolean, onToggleTheme: () => void }) => (
  <div className="absolute inset-0 z-[300] bg-hyve-bg0/95 backdrop-blur-2xl animate-in fade-in duration-300">
    <div className="h-full flex flex-col">
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
        <h2 className="text-sm font-black text-hyve-text1 uppercase tracking-[0.3em]">Settings</h2>
        <button onClick={onClose} className="text-hyve-text1 active:scale-90 transition-transform">
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-4">Appearance</h3>
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5">
            <div className="flex items-center gap-3">
              {isLightMode ? <Sun size={18} className="text-hyve-gold" /> : <Moon size={18} className="text-hyve-gold" />}
              <span className="text-sm text-hyve-text2">{isLightMode ? 'Day Mode' : 'Night Mode'}</span>
            </div>
            <button 
              onClick={onToggleTheme}
              className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isLightMode ? 'bg-hyve-gold' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isLightMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </section>
        <section>
          <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-4">Account</h3>
          <div className="space-y-2">
            {['Edit Profile', 'Privacy', 'Notifications', 'Language'].map(item => (
              <div key={item} className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5">
                <span className="text-sm text-hyve-text2">{item}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-4">Support</h3>
          <div className="space-y-2">
            {['Help Center', 'Report a Problem', 'Terms of Service'].map(item => (
              <div key={item} className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5">
                <span className="text-sm text-hyve-text2">{item}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </section>
        <button className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold uppercase tracking-widest active:scale-[0.98] transition-transform">
          Log Out
        </button>
      </div>
    </div>
  </div>
);

export const UserProfileScreen = ({ user, onClose, currentUser, takenColors, onColorChange, isLightMode = false, onToggleTheme = () => {}, onNavigate }: ProfileScreenProps) => {
  const [scrollPos, setScrollPos] = useState(0);
  const [isAlbumExpanded, setIsAlbumExpanded] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const dbEntry = HYVE_DATABASE.user;
  
  const threshold = 300;
  const progress = Math.min(scrollPos / threshold, 1);
  const opacity = 1 - progress;
  const isHeaderMode = progress >= 0.95;

  const startScale = 1;
  const endScale = 0.15; 
  const currentScale = startScale - (startScale - endScale) * progress;
  
  const startY = 228; 
  const endY = -43; 
  const currentY = startY - (startY - endY) * progress;
  const currentX = 0;

  const metrics = [
    { icon: Clock, value: dbEntry.metrics.totalHours, label: 'Hours', delay: '0s', pos: 'top-[170px] left-[10px]' },
    { icon: Building, value: dbEntry.metrics.buildingsMade, label: 'Blocks', delay: '0.5s', pos: 'top-[170px] right-[10px]' },
    { icon: Users, value: dbEntry.metrics.totalFriends, label: 'Circle', delay: '1s', pos: 'top-[300px] left-[10px]' },
    { icon: Globe, value: dbEntry.metrics.mapCoverage, label: 'Map', delay: '2s', pos: 'top-[300px] right-[10px]' },
  ];

  return (
    <div className="absolute inset-0 z-[100] bg-hyve-bg0 overflow-hidden">
      
      {/* MORPHING AVATAR CONTAINER */}
      <div 
        className="absolute z-[130] flex flex-col items-center"
        style={{ 
          top: 0,
          left: '50%',
          transform: `translateX(calc(-50% + ${currentX}px)) translateY(${currentY}px) scale(${currentScale})`,
        }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsPaletteOpen(!isPaletteOpen); }}
          className="w-[180px] h-[180px] rounded-full overflow-hidden bg-hyve-bg2 shadow-[0_30px_70px_rgba(0,0,0,0.7)] transition-all duration-300 relative group pointer-events-auto"
          style={{ 
            boxShadow: isHeaderMode ? 'none' : `0 30px 80px rgba(0,0,0,0.7)`
          }}
        >
          {!isHeaderMode && (
            <div 
              className="absolute -inset-[2px] rounded-full animate-rainbow-border opacity-100" 
              style={{ 
                backgroundImage: `linear-gradient(to right, ${user.color}, white, ${user.color})`,
                backgroundSize: '200% 200%'
              }}
            />
          )}
          <div className={`absolute inset-[6px] rounded-full bg-hyve-bg2 overflow-hidden border-[4px]`} style={{ borderColor: isHeaderMode ? 'transparent' : `${user.color}40` }}>
             <img src={user.avatarUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Profile" />
          </div>
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
             <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md rounded-full p-2">
               <ImageIcon size={20} className="text-white" />
             </div>
          </div>
        </button>

        {/* COLOR PALETTE */}
        {!isHeaderMode && isPaletteOpen && (
          <div className="fixed inset-0 z-[1000] pointer-events-none">
            <ColorPalette 
              currentColor={user.color} 
              onSelect={onColorChange} 
              onClose={() => setIsPaletteOpen(false)} 
              isLightMode={isLightMode}
            />
          </div>
        )}
      </div>

      {/* SCROLLABLE CONTAINER */}
      <div 
        className="absolute inset-0 overflow-y-auto no-scrollbar snap-y snap-mandatory scroll-smooth"
        onScroll={(e) => setScrollPos(e.currentTarget.scrollTop)}
      >
        
        {/* STICKY HEADER */}
        <div 
          className="sticky top-0 left-0 right-0 h-16 z-[120] px-6 flex items-center transition-all duration-300 border-b border-white/0"
          style={{ 
            backgroundColor: isHeaderMode ? (isLightMode ? 'rgba(255, 255, 255, 0.98)' : 'rgba(12, 13, 16, 0.98)') : 'transparent',
            backdropFilter: isHeaderMode ? 'blur(24px)' : 'none',
            borderBottomColor: isHeaderMode ? (isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)') : 'transparent'
          }}
        >
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="flex items-center justify-center text-hyve-text1 transition-all duration-300 active:scale-90"
            style={{ 
              opacity: isHeaderMode ? 1 : 0,
              pointerEvents: isHeaderMode ? 'auto' : 'none',
            }}
          >
            <Settings size={22} strokeWidth={1.5} />
          </button>
          <div className="flex-1" /> 
          <button 
            onClick={onClose} 
            className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center text-hyve-text1 transition-all duration-300 active:scale-90"
            style={{ 
              opacity: isHeaderMode ? 1 : 0,
              pointerEvents: isHeaderMode ? 'auto' : 'none',
            }}
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* STAGE 1: IDENTITY CORE */}
        <div className="relative min-h-[605px] flex flex-col items-center shrink-0 overflow-visible snap-start">
           
           {/* 4 FLOATING CAPSULES */}
           {metrics.map((m, i) => (
             <MetricCapsule key={i} {...m} opacity={opacity} position={m.pos} themeColor={user.color} />
           ))}

           {/* NAME & BIO */}
           <div 
             className="mt-[380px] text-center px-8 transition-all duration-300" 
             style={{ opacity, transform: `translateY(${progress * -35}px)` }}
           >
              <h1 className="text-[28px] font-black text-hyve-text1 uppercase tracking-tighter mb-1.5 leading-none">{user.name}</h1>
              <p className="text-[13px] font-medium text-hyve-text2 italic leading-relaxed max-w-[220px] mx-auto opacity-75">"{dbEntry.quote}"</p>
           </div>

           <ScrollIndicator opacity={opacity} />
        </div>

        {/* STAGE 2: CONTENT */}
        <div className="bg-hyve-bg1 rounded-t-[44px] border-t border-white/5 pt-12 px-6 pb-10 min-h-[605px] relative z-[110] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] snap-start">
           <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-12 opacity-50"></div>
           
           <section className="mb-14">
              <button 
                onClick={() => setIsAlbumExpanded(!isAlbumExpanded)}
                className="w-full flex items-center justify-between mb-6 px-1 group active:opacity-60"
              >
                <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em]">My Album</h3>
                <span className="text-[9px] font-bold text-hyve-gold uppercase tracking-widest">{isAlbumExpanded ? 'See Less' : 'See More'}</span>
              </button>
              <div className="grid grid-cols-3 gap-2 transition-all duration-700">
                 {dbEntry.photos.map((photo, i) => (
                   <button 
                    key={photo.id} 
                    onClick={() => {
                      const log = SESSION_LOGS.find(s => s.id === photo.sessionId);
                      if (log) onNavigate(AppScreen.RECAP, undefined, log);
                    }}
                    className="aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden relative animate-flip-in active:scale-95 transition-transform" 
                    style={{ animationDelay: `${i * 0.05}s` }}
                   >
                      <img 
                        src={photo.url} 
                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
                        alt="Moment" 
                      />
                   </button>
                 ))}
              </div>
           </section>

           <section className="mb-14">
              <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-6 px-1">Latest Hangout</h3>
              <button 
                onClick={() => {
                  if (dbEntry.lastHangout) onNavigate(AppScreen.RECAP, undefined, dbEntry.lastHangout);
                }}
                className="relative w-full h-64 rounded-[32px] overflow-hidden border border-white/10 shadow-soft group text-left active:scale-[0.98] transition-transform"
              >
                <img 
                  src={dbEntry.lastHangout?.photoUrl || "https://picsum.photos/seed/cafe/800/800"} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[2s]" 
                  alt="Latest Hangout" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                <div className="absolute top-5 right-5 bg-hyve-gold/20 backdrop-blur-xl border border-hyve-gold/40 px-3 py-1.5 rounded-full">
                  <span className="text-[9px] font-black text-hyve-gold uppercase tracking-widest">{dbEntry.lastHangout?.duration || '2 Hours'}</span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium text-hyve-text2 mb-1">with Emily</span>
                      <span className="text-xl font-black text-hyve-text1 uppercase tracking-tighter">{dbEntry.lastHangout?.date || 'Last Tuesday'}</span>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-bold text-hyve-text3 block uppercase tracking-tight">@ {dbEntry.lastHangout?.location || 'Da Vinci Cafe'}</span>
                   </div>
                </div>
              </button>
           </section>

           <section className="mb-14">
              <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-6 px-1">Spot Ranking</h3>
              <div className="space-y-3">
                 {dbEntry.topCafes.map((cafe: any, i: number) => {
                   const rank = i + 1;
                   const isTop3 = rank <= 3;
                   return (
                     <div 
                      key={i} 
                      className={`glass-panel px-5 py-5 rounded-2xl flex items-center justify-between transition-all duration-300 ${isTop3 ? 'border-white/15' : 'border-white/5 opacity-80'} hover:bg-white/5`}
                     >
                        <div className="flex items-center gap-5">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-black text-[12px]`}
                                style={{ 
                                  backgroundColor: rank === 1 ? 'rgba(201, 168, 106, 0.2)' : 
                                                  rank === 2 ? 'rgba(192, 192, 192, 0.2)' : 
                                                  rank === 3 ? 'rgba(205, 127, 50, 0.2)' : 'transparent', 
                                  borderColor: rank === 1 ? 'rgba(201, 168, 106, 0.5)' : 
                                              rank === 2 ? 'rgba(192, 192, 192, 0.5)' : 
                                              rank === 3 ? 'rgba(205, 127, 50, 0.5)' : 'rgba(255,255,255,0.1)',
                                  color: rank === 1 ? '#C9A86A' : 
                                         rank === 2 ? '#E5E7EB' : 
                                         rank === 3 ? '#CD7F32' : 'white'
                                }}
                           >
                              {rank}
                           </div>
                           <div className="flex flex-col">
                             <span className={`text-sm font-medium ${rank === 1 ? 'text-hyve-text1 font-bold' : 'text-hyve-text2'}`}>{cafe.name}</span>
                             {rank === 1 && <span style={{ color: user.color }} className="text-[8px] font-black uppercase tracking-[0.2em] mt-0.5">Top Sanctum</span>}
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className={`text-sm font-black ${rank === 1 ? 'text-hyve-gold' : 'text-hyve-text1'}`}>{cafe.visits || 5}</span>
                           <span className="text-[7px] font-black text-hyve-text3 uppercase tracking-tighter">Visits</span>
                        </div>
                     </div>
                   );
                 })}
              </div>
           </section>

           <section className="mb-14">
              <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-6 px-1">Activity Type</h3>
              <div className="space-y-6">
                 {dbEntry.activityBreakdown.map((act: any, i: number) => {
                   const maxHours = dbEntry.activityBreakdown[0].hours;
                   return (
                     <div key={i} className="flex flex-col gap-2.5">
                       <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-black text-hyve-text1 uppercase tracking-wider">{act.label}</span>
                          <span className="text-[10px] font-bold text-hyve-text3 uppercase tracking-tighter">{act.hours} Hours</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000 ease-out" 
                            style={{ 
                              width: `${(act.hours / maxHours) * 100}%`, 
                              backgroundColor: user.color,
                              boxShadow: `0 0 10px ${user.color}40`
                            }} 
                          />
                       </div>
                     </div>
                   );
                 })}
              </div>
           </section>
        </div>
      </div>
      {/* SETTINGS OVERLAY */}
      {isSettingsOpen && <SettingsOverlay onClose={() => setIsSettingsOpen(false)} isLightMode={isLightMode} onToggleTheme={onToggleTheme} />}
      
      <style>{`
        @keyframes rainbow-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-rainbow-border {
          animation: rainbow-border 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export const FriendProfileScreen = ({ user, onClose, currentUser, takenColors, onColorChange, isLightMode = false, onNavigate }: ProfileScreenProps) => {
  const [scrollPos, setScrollPos] = useState(0);
  const [isAlbumExpanded, setIsAlbumExpanded] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  
  const dbEntry = (HYVE_DATABASE.friendships as any)[user.id];
  if (!dbEntry) return null;

  const threshold = 300;
  const progress = Math.min(scrollPos / threshold, 1);
  const opacity = 1 - progress;
  const isHeaderMode = progress >= 0.95;

  const startScale = 1;
  const endScale = 0.15; 
  const currentScale = startScale - (startScale - endScale) * progress;
  
  const startY = 228; 
  const currentY = startY - (startY - -43) * progress;
  
  const metrics = [
    { icon: Clock, value: `${dbEntry.sharedHours}h`, label: 'Together', delay: '0s', pos: 'top-[170px] left-[10px]' },
    { icon: Building, value: dbEntry.sharedPlaces, label: 'Sanctums', delay: '0.5s', pos: 'top-[170px] right-[10px]' },
    { icon: ImageIcon, value: dbEntry.sharedPhotos, label: 'Photos', delay: '1s', pos: 'top-[300px] left-[10px]' },
    { icon: Zap, value: dbEntry.sharedActivity[0]?.label || 'Study', label: 'Main', delay: '1.5s', pos: 'top-[300px] right-[10px]' },
  ];

  return (
    <div className="absolute inset-0 z-[100] bg-hyve-bg0 overflow-hidden">
      
      {/* MORPHING AVATAR CONTAINER */}
      <div 
        className="absolute z-[130] flex flex-col items-center"
        style={{ 
          top: 0,
          left: '50%',
          transform: `translateX(calc(-50%)) translateY(${currentY}px) scale(${currentScale})`,
        }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsPaletteOpen(!isPaletteOpen); }}
          className="w-[180px] h-[180px] rounded-full overflow-hidden bg-hyve-bg2 shadow-[0_30px_70px_rgba(0,0,0,0.7)] transition-all duration-300 pointer-events-auto relative group"
          style={{ 
            boxShadow: isHeaderMode ? 'none' : `0 30px 80px rgba(0,0,0,0.7), 0 0 40px ${user.color}20`
          }}
        >
          {!isHeaderMode && (
            <div 
              className="absolute -inset-[2px] rounded-full animate-rainbow-border opacity-100" 
              style={{ 
                backgroundImage: `linear-gradient(to right, ${user.color}, white, ${user.color})`,
                backgroundSize: '200% 200%'
              }}
            />
          )}
          <div className={`absolute inset-[6px] rounded-full bg-hyve-bg2 overflow-hidden border-[4px]`} style={{ borderColor: isHeaderMode ? 'transparent' : `${user.color}40` }}>
             <img src={user.avatarUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Profile" />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
             <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md rounded-full p-2">
               <ImageIcon size={20} className="text-white" />
             </div>
          </div>
        </button>

        {/* COLOR PALETTE */}
        {!isHeaderMode && isPaletteOpen && (
          <div className="fixed inset-0 z-[1000] pointer-events-none">
            <ColorPalette 
              currentColor={user.color} 
              onSelect={onColorChange} 
              onClose={() => setIsPaletteOpen(false)} 
              isLightMode={isLightMode}
            />
          </div>
        )}
      </div>

      {/* SCROLLABLE CONTAINER */}
      <div 
        className="absolute inset-0 overflow-y-auto no-scrollbar snap-y snap-mandatory scroll-smooth"
        onScroll={(e) => setScrollPos(e.currentTarget.scrollTop)}
      >
        
        {/* STICKY HEADER */}
        <div 
          className="sticky top-0 left-0 right-0 h-16 z-[120] px-6 flex items-center transition-all duration-300 border-b border-white/0"
          style={{ 
            backgroundColor: isHeaderMode ? (isLightMode ? 'rgba(255, 255, 255, 0.98)' : 'rgba(12, 13, 16, 0.98)') : 'transparent',
            backdropFilter: isHeaderMode ? 'blur(24px)' : 'none',
            borderBottomColor: isHeaderMode ? (isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)') : 'transparent'
          }}
        >
          <div className="flex-1" /> 
          <button 
            onClick={onClose} 
            className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center text-hyve-text1 transition-all duration-300 active:scale-90"
            style={{ 
              opacity: isHeaderMode ? 1 : 0,
              pointerEvents: isHeaderMode ? 'auto' : 'none',
            }}
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* STAGE 1: FRIEND IDENTITY CORE */}
        <div className="relative min-h-[605px] flex flex-col items-center shrink-0 overflow-visible snap-start">
           
           {/* 4 FLOATING CAPSULES */}
           {metrics.map((m, i) => (
             <MetricCapsule key={i} {...m} opacity={opacity} position={m.pos} themeColor={user.color} />
           ))}

           {/* NAME & BIO */}
           <div 
             className="mt-[380px] text-center px-8 transition-all duration-300" 
             style={{ opacity, transform: `translateY(${progress * -35}px)` }}
           >
              <h1 className="text-[28px] font-black text-hyve-text1 uppercase tracking-tighter mb-1.5 leading-none">{user.name}</h1>
              <p className="text-[13px] font-medium text-hyve-text2 italic leading-relaxed max-w-[220px] mx-auto opacity-75">"{dbEntry.quote}"</p>
           </div>

           <ScrollIndicator opacity={opacity} />
        </div>

        {/* STAGE 2: CONTENT */}
        <div className="bg-hyve-bg1 rounded-t-[44px] border-t border-white/5 pt-12 px-6 pb-40 min-h-[605px] relative z-[110] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] snap-start">
           <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-12 opacity-50"></div>
           
           <section className="mb-14">
              <button 
                onClick={() => setIsAlbumExpanded(!isAlbumExpanded)}
                className="w-full flex items-center justify-between mb-6 px-1 group active:opacity-60"
              >
                <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em]">Shared Album</h3>
                <span className="text-[9px] font-bold text-hyve-gold uppercase tracking-widest">{isAlbumExpanded ? 'See Less' : 'See More'}</span>
              </button>
              <div className="grid grid-cols-3 gap-2 transition-all duration-700">
                 {dbEntry.photos.map((photo: Photo, i: number) => (
                   <button 
                    key={photo.id} 
                    onClick={() => {
                      const log = SESSION_LOGS.find(s => s.id === photo.sessionId);
                      if (log) onNavigate(AppScreen.RECAP, undefined, log);
                    }}
                    className="aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden relative animate-flip-in active:scale-95 transition-transform" 
                    style={{ animationDelay: `${i * 0.05}s` }}
                   >
                      <img 
                        src={photo.url} 
                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
                        alt="Shared Moment" 
                      />
                   </button>
                 ))}
              </div>
           </section>

           <section className="mb-14">
              <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-6 px-1">Latest Moment</h3>
              <button 
                onClick={() => {
                  if (dbEntry.lastHangout) onNavigate(AppScreen.RECAP, undefined, dbEntry.lastHangout);
                }}
                className="relative w-full h-64 rounded-[32px] overflow-hidden border border-white/10 shadow-soft group text-left active:scale-[0.98] transition-transform"
              >
                <img 
                  src={dbEntry.lastHangout?.photoUrl || `https://picsum.photos/800/800?u=${user.id}latest`} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[2s]" 
                  alt="Latest Together" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                <div className="absolute top-5 right-5 bg-hyve-gold/20 backdrop-blur-xl border border-hyve-gold/40 px-3 py-1.5 rounded-full">
                  <span className="text-[9px] font-black text-hyve-gold uppercase tracking-widest">{dbEntry.lastHangout?.duration || 'Activity'}</span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium text-hyve-text2 mb-1">with {currentUser.name}</span>
                      <span className="text-xl font-black text-hyve-text1 uppercase tracking-tighter">{dbEntry.lastHangout?.date || 'Recently'}</span>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-bold text-hyve-text3 block uppercase tracking-tight">@ {dbEntry.lastHangout?.location || 'Nearby'}</span>
                   </div>
                </div>
              </button>
           </section>

           <section className="mb-14">
              <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-6 px-1">Shared Spot Ranking</h3>
              <div className="space-y-3">
                 {dbEntry.sharedTopPlaces.map((cafe: any, i: number) => {
                   const rank = i + 1;
                   const isTop3 = rank <= 3;
                   return (
                     <div 
                      key={i} 
                      className={`glass-panel px-5 py-5 rounded-2xl flex items-center justify-between transition-all duration-300 ${isTop3 ? 'border-white/15' : 'border-white/5 opacity-80'} hover:bg-white/5`}
                     >
                        <div className="flex items-center gap-5">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-black text-[12px]`}
                                style={{ 
                                  backgroundColor: rank === 1 ? 'rgba(201, 168, 106, 0.2)' : 
                                                  rank === 2 ? 'rgba(192, 192, 192, 0.2)' : 
                                                  rank === 3 ? 'rgba(205, 127, 50, 0.2)' : 'transparent', 
                                  borderColor: rank === 1 ? 'rgba(201, 168, 106, 0.5)' : 
                                              rank === 2 ? 'rgba(192, 192, 192, 0.5)' : 
                                              rank === 3 ? 'rgba(205, 127, 50, 0.5)' : 'rgba(255,255,255,0.1)',
                                  color: rank === 1 ? '#C9A86A' : 
                                         rank === 2 ? '#E5E7EB' : 
                                         rank === 3 ? '#CD7F32' : 'white'
                                }}
                           >
                              {rank}
                           </div>
                           <div className="flex flex-col">
                             <span className={`text-sm font-medium ${rank === 1 ? 'text-hyve-text1 font-bold' : 'text-hyve-text2'}`}>{cafe.name}</span>
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className={`text-sm font-black ${rank === 1 ? 'text-hyve-gold' : 'text-hyve-text1'}`}>{cafe.visits || 5}</span>
                           <span className="text-[7px] font-black text-hyve-text3 uppercase tracking-tighter">Together</span>
                        </div>
                     </div>
                   );
                 })}
              </div>
           </section>

           <section className="mb-14">
              <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-[0.3em] mb-6 px-1">Together Type</h3>
              <div className="space-y-6">
                 {dbEntry.sharedActivity.map((act: any, i: number) => {
                   const maxHours = dbEntry.sharedActivity[0].hours;
                   return (
                     <div key={i} className="flex flex-col gap-2.5">
                       <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-black text-hyve-text1 uppercase tracking-wider">{act.label}</span>
                          <span className="text-[10px] font-bold text-hyve-text3 uppercase tracking-tighter">{act.hours} Hours</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000 ease-out" 
                            style={{ 
                              width: `${(act.hours / maxHours) * 100}%`, 
                              backgroundColor: user.color,
                              boxShadow: `0 0 10px ${user.color}40`
                            }} 
                          />
                       </div>
                     </div>
                   );
                 })}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};
