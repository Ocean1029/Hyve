import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as L from 'leaflet';
import { ChevronLeft, MapPin, Clock, Calendar, Share2, MoreHorizontal, ChevronRight, ArrowLeft, Maximize2 } from 'lucide-react';
import { SessionLog, User, AppScreen } from '../types';
import { Avatar } from './UI';
import { HYVE_DATABASE } from '../data';
import { PLACE_META } from '../src/utils';

const JaggedLine = ({ color }: { color: string }) => (
  <div className="w-1.5 h-full overflow-hidden flex flex-col items-center opacity-80">
    <svg width="6" height="100%" preserveAspectRatio="none" className="overflow-visible">
       <defs>
          <pattern id={`jagged-log-${color}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
             <path d="M 0 0 L 6 3 L 0 6" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </pattern>
       </defs>
       <rect x="0" y="0" width="6" height="100%" fill={`url(#jagged-log-${color})`} />
    </svg>
  </div>
);

interface SessionLogScreenProps {
  sessionLog: SessionLog;
  friend: User;
  onClose: () => void;
  onNavigate?: (screen: AppScreen, user?: User, sessionLog?: SessionLog) => void;
}

const WavyLine = ({ color, width, amplitude = 3 }: { color: string, width: string, amplitude?: number }) => (
  <div style={{ width }} className="h-4 overflow-hidden flex items-center opacity-80">
    <svg width="100%" height="12" preserveAspectRatio="none" className="overflow-visible">
       <defs>
          <pattern id={`wavy-usage-${color.replace('#', '')}-${amplitude}`} x="0" y="0" width="10" height="12" patternUnits="userSpaceOnUse">
             <path d={`M 0 6 Q 2.5 ${6-amplitude} 5 6 Q 7.5 ${6+amplitude} 10 6`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          </pattern>
       </defs>
       <rect x="0" y="0" width="100%" height="12" fill={`url(#wavy-usage-${color.replace('#', '')}-${amplitude})`} />
    </svg>
  </div>
);

export const SessionLogScreen: React.FC<SessionLogScreenProps & { isLightMode?: boolean }> = ({ sessionLog, friend, onClose, onNavigate, isLightMode = false }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const [miniMap, setMiniMap] = useState<L.Map | null>(null);

  const photos = sessionLog.photoUrls || [sessionLog.photoUrl];
  const maxPhotos = Math.min(photos.length, 3);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 100);
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < maxPhotos - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) handleNextPhoto();
    if (isRightSwipe) handlePrevPhoto();
  };

  // Mini Map Initialization
  useEffect(() => {
    let mapInstance: L.Map | null = null;
    
    if (miniMapRef.current) {
      // Find coordinates from PLACE_META
      const meta = Object.values(PLACE_META).find(m => m.name.includes(sessionLog.location) || sessionLog.location.includes(m.name));
      const center: [number, number] = meta ? [meta.lat, meta.lng] : [25.0339, 121.5645];

      mapInstance = L.map(miniMapRef.current, { 
        zoomControl: false, 
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false
      }).setView(center, 16);

      const tileUrl = isLightMode 
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      
      L.tileLayer(tileUrl, { maxZoom: 20, opacity: 0.8 }).addTo(mapInstance);

      // Custom Marker
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 rounded-full bg-hyve-gold flex items-center justify-center shadow-gold-glow border-2 border-white animate-pulse">
                <div class="w-2 h-2 rounded-full bg-black"></div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker(center, { icon }).addTo(mapInstance);
      setMiniMap(mapInstance);
    }
    
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMiniMap(null);
      }
    };
  }, [sessionLog.location, isLightMode]);

  const textPrimary = isLightMode ? 'text-black' : 'text-hyve-text1';
  const textSecondary = isLightMode ? 'text-black/60' : 'text-hyve-text2';
  const textMuted = isLightMode ? 'text-black/40' : 'text-hyve-text3';
  const glassBg = isLightMode ? 'bg-black/5' : 'bg-white/5';
  const glassBorder = isLightMode ? 'border-black/10' : 'border-white/5';
  const shadowColor = isLightMode ? 'shadow-[0_20px_60px_rgba(255,255,255,0.3)]' : 'shadow-[0_20px_60px_rgba(0,0,0,0.6)]';

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className={`h-full w-full flex flex-col animate-fade-in overflow-y-auto no-scrollbar relative transition-colors duration-300 ${isLightMode ? 'bg-white' : 'bg-hyve-bg0'}`}
    >
      {/* Background Ambient Glow */}
      <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${isLightMode ? 'bg-hyve-gold/5' : 'bg-hyve-gold/15'}`}></div>
      <div className={`absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${isLightMode ? 'bg-hyve-gold/5' : 'bg-hyve-gold/10'}`}></div>

      {/* Header */}
      <div className={`shrink-0 flex items-center justify-between px-4 pt-12 pb-4 z-50 sticky top-0 backdrop-blur-xl border-b transition-all duration-300 ${isLightMode ? 'bg-white/90 border-black/5' : 'bg-hyve-bg0/90 border-white/5'}`}>
        <button onClick={onClose} className="p-2 bg-hyve-gold/10 backdrop-blur-md border border-hyve-gold/20 rounded-full text-hyve-gold active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        
        <div className={`flex-1 flex flex-col items-center transition-all duration-300 ml-6 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
           <div className="flex items-center gap-3 bg-hyve-gold/5 px-4 py-1.5 rounded-full border border-hyve-gold/10">
              <Avatar src={friend.avatarUrl} size="xs" />
              <div className="flex flex-col">
                 <span className={`text-[9px] font-bold leading-none ${textPrimary}`}>{friend.name}</span>
                 <span className={`text-[7px] leading-none mt-0.5 ${textMuted}`}>{sessionLog.location}</span>
              </div>
              <div className="w-[1px] h-3 bg-hyve-gold/20 mx-1" />
              <span className="text-[9px] font-light text-hyve-gold">{sessionLog.duration}</span>
           </div>
        </div>

        <div className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-300 ${!isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${textMuted}`}>{sessionLog.date}</span>
        </div>

        <div className="w-2" /> {/* Small spacer instead of w-10 to shift bar right */}
      </div>

      {/* 1. Info Section (No Block) */}
      <div className="px-8 pt-10 pb-8 relative z-10">
        <div className="flex flex-col items-start gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar src={friend.avatarUrl} size="xl" hasRing />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-hyve-bg0 flex items-center justify-center border border-white/10">
                <div className="w-3 h-3 rounded-full bg-hyve-gold animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className={`text-3xl font-bold tracking-tighter ${textPrimary}`}>{friend.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-black text-hyve-gold uppercase tracking-[0.4em]">
                  {sessionLog.tags[0] || 'Hangout'}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-[1px] bg-gradient-to-r from-hyve-gold/30 via-hyve-gold/10 to-transparent" />

          <div className="flex flex-wrap gap-x-12 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${textMuted}`}>Location</span>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-hyve-gold/60" />
                <span className={`text-xs font-bold ${textSecondary}`}>{sessionLog.location}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${textMuted}`}>Duration</span>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-hyve-gold/60" />
                <span className={`text-xs font-bold ${textSecondary}`}>{sessionLog.duration}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${textMuted}`}>Date</span>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-hyve-gold/60" />
                <span className={`text-xs font-bold ${textSecondary}`}>{sessionLog.date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Description & Tags */}
      <div className="px-6 py-4 space-y-4 relative z-10">
        <div className="relative px-2">
          <div className="absolute -left-1 top-0 bottom-0 w-[2px] bg-gradient-to-b from-hyve-gold/50 to-transparent"></div>
          <p className={`text-[11px] ${textSecondary} leading-relaxed italic pl-5`}>
            "{sessionLog.description}"
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {sessionLog.tags.map(tag => (
            <span key={tag} className="px-3 py-1 rounded-xl bg-hyve-gold/5 border border-hyve-gold/10 text-[8px] font-black text-hyve-gold uppercase tracking-[0.15em]">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Picture (Full Width) */}
      <div className="relative z-10 my-4">
        <div 
          className={`relative aspect-[4/5] w-full overflow-hidden group border-y border-hyve-gold/20 ${shadowColor}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Photos */}
          <div 
            className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ transform: `translateX(-${currentPhotoIndex * 100}%)` }}
          >
            {photos.slice(0, 3).map((url, idx) => (
              <img 
                key={idx} 
                src={url} 
                className={`w-full h-full object-cover shrink-0 ${isLightMode ? 'contrast-75' : ''}`} 
                alt={`Session ${idx + 1}`} 
                draggable="false"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>

          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent pointer-events-none ${isLightMode ? 'from-white/90' : 'from-hyve-bg0/90'}`}></div>

          {/* Session Log Label (In-Chat Style) */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3 z-20">
             <div className="bg-hyve-gold p-1.5 rounded-xl text-hyve-bg0 shadow-lg shadow-hyve-gold/20">
                <Clock size={14} />
             </div>
             <div className="flex flex-col">
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] drop-shadow-md ${isLightMode ? 'text-black' : 'text-white'}`}>Session Log</span>
                <span className="text-[8px] font-bold text-hyve-gold/80 uppercase tracking-widest">{sessionLog.date}</span>
             </div>
          </div>

          {/* Navigation Arrows (Desktop/Click) */}
          <div className="absolute inset-y-0 left-0 w-1/4 cursor-pointer" onClick={handlePrevPhoto} />
          <div className="absolute inset-y-0 right-0 w-1/4 cursor-pointer" onClick={handleNextPhoto} />

          {/* Pagination Dots */}
          {maxPhotos > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {Array.from({ length: maxPhotos }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-500 ${i === currentPhotoIndex ? 'w-8 bg-hyve-gold shadow-[0_0_10px_rgba(201,168,106,0.8)]' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-6 py-4 space-y-6 relative z-10">
        {/* 4. Streak */}
        <div className={`glass-panel p-4 rounded-[32px] border ${glassBorder} ${glassBg} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-2xl bg-hyve-gold/10 flex items-center justify-center">
              <Calendar size={16} className="text-hyve-gold" />
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-tight ${textPrimary}`}>Streak</span>
              <span className={`text-[9px] font-medium ${textMuted}`}>5 Days Shared</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <span className="text-base font-bold text-hyve-gold">5</span>
             <span className="text-[7px] font-black text-hyve-gold/50 uppercase">Days</span>
          </div>
        </div>

        {/* 5. Location Map (Literal Map Block) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMuted}`}>Location Map</span>
            <button 
              onClick={() => onNavigate?.(AppScreen.MAP, friend)}
              className="text-[9px] font-bold text-hyve-gold uppercase tracking-widest flex items-center gap-1"
            >
              Open Full Map <Maximize2 size={10} />
            </button>
          </div>
          <div 
            className={`relative aspect-square w-full rounded-[32px] overflow-hidden border ${glassBorder} ${shadowColor}`}
          >
            <div ref={miniMapRef} className="absolute inset-0 z-0" />
            {/* Overlay for aesthetic */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-transparent rounded-[32px] shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]"></div>
            
            {/* Location Label Overlay */}
            <div className="absolute bottom-4 left-4 right-4 glass-panel p-3 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md flex items-center gap-3 z-10">
              <div className="w-8 h-8 rounded-xl bg-hyve-gold/20 flex items-center justify-center">
                <MapPin size={16} className="text-hyve-gold" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-white truncate">{sessionLog.location}</span>
                <span className="text-[8px] text-white/60 truncate">Taipei, Taiwan</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Deep Focus */}
        <div className={`glass-panel p-4 rounded-[32px] border ${glassBorder} ${glassBg} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-2xl bg-hyve-gold/10 flex items-center justify-center">
              <Clock size={16} className="text-hyve-gold" />
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-tight ${textPrimary}`}>Deep Focus</span>
              <span className={`text-[9px] font-medium ${textMuted}`}>92% Efficiency</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <span className="text-base font-bold text-hyve-gold">92</span>
             <span className="text-[7px] font-black text-hyve-gold/50 uppercase">%</span>
          </div>
        </div>

        {/* 7. Phone Usage */}
        <div className="pt-2">
          <div className={`glass-panel p-5 rounded-[32px] border relative overflow-hidden ${glassBorder} ${glassBg}`}>
             <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <span className={`text-[9px] font-black uppercase tracking-tight mb-1 ${textPrimary}`}>Phone Usage</span>
                  <span className={`text-[8px] font-medium uppercase tracking-widest ${textMuted}`}>Session Interference</span>
                </div>
                <div className="text-right">
                   <span className="text-base font-light text-hyve-gold tracking-tighter">
                     {(HYVE_DATABASE.user as any).phoneUsage?.[sessionLog.id]?.you + (HYVE_DATABASE.user as any).phoneUsage?.[sessionLog.id]?.friend || 0}m
                   </span>
                </div>
             </div>

             <div className="h-32 relative w-full flex flex-col justify-center mt-4">
                {/* Horizontal Center Line (White) */}
                <div className={`absolute left-0 right-0 top-1/2 h-[1px] -translate-y-1/2 ${isLightMode ? 'bg-black/20' : 'bg-white/40'} flex items-center justify-start`}>
                   <div className="absolute right-0 w-2 h-2 border-t border-r border-current rotate-[225deg] -translate-y-[0.5px]" style={{ opacity: 0.4 }} />
                </div>
                
                {/* Reading Indicator (Right to Left) */}
                <div className="absolute -top-4 right-0 flex items-center gap-1.5 opacity-60">
                   <span className="text-[7px] font-black uppercase tracking-[0.2em] text-hyve-gold">Timeline</span>
                   <ArrowLeft size={10} className="text-hyve-gold" />
                </div>

                {/* Usage Indicators */}
                <div className="relative w-full h-full">
                   {/* Friend's Usage - ABOVE Line */}
                   {(() => {
                     const friendUsage = (HYVE_DATABASE.user as any).phoneUsage?.[sessionLog.id]?.friend || 0;
                     const totalDurationMin = parseInt(sessionLog.duration) * 60 || 120;
                     const widthPercent = Math.max(10, (friendUsage / totalDurationMin) * 100);
                     
                     return (
                       <div 
                         className="absolute flex flex-col items-center" 
                         style={{ right: '20%', top: '50%', transform: 'translateY(-100%)' }}
                       >
                          {/* Layering: bottom -> wave -> minutes -> name */}
                          <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${textPrimary}`}>{friend.name}</span>
                          <span className="text-[9px] font-black text-hyve-gold mb-1">{friendUsage}m</span>
                          <WavyLine 
                            color="#C9A86A" 
                            width={`${widthPercent}%`} 
                            amplitude={3}
                          />
                       </div>
                     );
                   })()}

                   {/* Your Usage - BELOW Line */}
                   {(() => {
                     const yourUsage = (HYVE_DATABASE.user as any).phoneUsage?.[sessionLog.id]?.you || 0;
                     const totalDurationMin = parseInt(sessionLog.duration) * 60 || 120;
                     const widthPercent = Math.max(10, (yourUsage / totalDurationMin) * 100);

                     return (
                       <div 
                         className="absolute flex flex-col items-center" 
                         style={{ right: '60%', top: '50%' }}
                       >
                          {/* Layering: top -> wave -> minutes -> name */}
                          <WavyLine 
                            color="#C9A86A" 
                            width={`${widthPercent}%`} 
                            amplitude={3}
                          />
                          <span className="text-[9px] font-black text-hyve-gold mt-1">{yourUsage}m</span>
                          <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${textPrimary}`}>You</span>
                       </div>
                     );
                   })()}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Share Block (Added at bottom) */}
      <div className="px-6 pb-12 relative z-10">
        <button className="w-full glass-panel p-6 rounded-[32px] border-hyve-gold/20 bg-hyve-gold/5 flex items-center justify-between group active:scale-[0.98] transition-all">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-hyve-gold flex items-center justify-center text-hyve-bg0 shadow-gold-glow">
                 <Share2 size={24} />
              </div>
              <div className="flex flex-col items-start">
                 <span className="text-sm font-bold text-hyve-text1">Share Session Log</span>
                 <span className="text-[10px] text-hyve-text3 uppercase tracking-widest">Export as memory</span>
              </div>
           </div>
           <ChevronRight size={20} className="text-hyve-gold/50 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
