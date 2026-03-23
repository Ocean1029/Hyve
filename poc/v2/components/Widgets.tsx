import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageCircle, MapPin, Clock, Users, User, Radar, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { User as UserType, PlaceAggregate, Widget } from '../types';
import { Avatar } from './UI';

export const WIDGET_TYPES = [
  { id: 'latest_hangout', label: 'Latest Hangout', icon: <MapPin size={16} /> },
  { id: 'messages', label: 'Messages', icon: <MessageCircle size={16} /> },
  { id: 'today_focus', label: 'Today\'s Focus', icon: <Clock size={16} /> },
  { id: 'map', label: 'Map View', icon: <MapPin size={16} /> },
  { id: 'my_circle', label: 'My Circle', icon: <Users size={16} /> },
  { id: 'profile', label: 'My Profile', icon: <User size={16} /> },
  { id: 'radar', label: 'Radar', icon: <Radar size={16} /> },
  { id: 'stickers', label: 'Stickers', icon: <Plus size={16} /> },
];

export const SIZE_CONFIG: Record<number, { w: number, h: number }> = {
  1: { w: 1, h: 1 },
  2: { w: 2, h: 1 },
  3: { w: 3, h: 1 }, 
  4: { w: 2, h: 2 },
  5: { w: 3, h: 2 },
  6: { w: 1, h: 2 }, // 1x2
};

export const EXPANDED_SIZE_MAP: Record<number, number> = {
  1: 6, // 1x1 -> 1x2
  2: 4, // 2x1 -> 2x2
  3: 5, // 3x1 -> 3x2
};

// Specialized Widget Components
const StickerWidget = ({ size, isLightMode, currentUser, onToggleExpand, onNavigate }: any) => {
  const textPrimary = isLightMode ? 'text-black' : 'text-hyve-text1';

  return (
    <div 
      onClick={() => onNavigate?.('PROFILE')}
      className={`flex flex-col items-center justify-center p-2 text-center h-full relative group ${isLightMode ? 'bg-black/5' : 'bg-gradient-to-br from-hyve-gold/20 to-transparent'}`}
    >
      <motion.div 
        animate={{ y: [0, -8, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-2xl mb-1"
      >
        ☀️
      </motion.div>
      <span className="text-[6px] font-black uppercase tracking-widest text-hyve-gold">Sunday Best</span>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
        className="absolute bottom-1 right-1 p-1 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronDown size={8} className="text-hyve-gold" />
      </button>
    </div>
  );
};

const LatestHangoutWidget = ({ buildings, isLightMode, isExpanded, onToggleExpand, onNavigate }: any) => {
  const latest = buildings[0];
  const textPrimary = isLightMode ? 'text-black' : 'text-hyve-text1';
  const textSecondary = isLightMode ? 'text-black/60' : 'text-hyve-text2';
  const textMuted = isLightMode ? 'text-black/40' : 'text-hyve-text3';

  return (
    <div 
      onClick={() => onNavigate?.('SESSION_LOG')}
      className="h-full w-full relative overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-30">
        <img src={latest.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
      </div>
      <div className="relative p-3 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-6 rounded-lg bg-hyve-gold/20 flex items-center justify-center"
          >
            <MapPin size={12} className="text-hyve-gold" />
          </motion.div>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
            className="p-1 rounded-full bg-black/20 text-hyve-gold"
          >
            <ChevronDown size={10} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        <div className="mt-auto">
          <h4 className={`text-[10px] font-bold leading-tight ${textPrimary}`}>{latest.name}</h4>
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-1"
              >
                <p className={`text-[8px] ${textSecondary}`}>{latest.address}</p>
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 rounded-full bg-hyve-gold/10 text-hyve-gold text-[6px] font-bold uppercase">Popular</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const MessagesWidget = ({ friends, isLightMode, isExpanded, onToggleExpand, onNavigate }: any) => {
  const friend = friends[0];
  const textPrimary = isLightMode ? 'text-black' : 'text-hyve-text1';
  const textSecondary = isLightMode ? 'text-black/60' : 'text-hyve-text2';
  const textMuted = isLightMode ? 'text-black/40' : 'text-hyve-text3';

  return (
    <div 
      onClick={() => onNavigate?.('MESSAGES')}
      className="p-3 flex flex-col h-full gap-2 group relative"
    >
      <div className="flex items-center justify-between">
        <span className={`text-[7px] font-black uppercase tracking-widest ${textMuted}`}>Messages</span>
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-hyve-gold" 
          />
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
            className="p-0.5 rounded-full bg-white/5 text-hyve-gold"
          >
            <ChevronDown size={8} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Avatar src={friend.avatarUrl} size="xs" />
          </motion.div>
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className={`text-[9px] font-bold truncate ${textPrimary}`}>{friend.name}</span>
          <span className={`text-[8px] truncate italic ${textSecondary}`}>"On my way!"</span>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 space-y-2"
          >
            <div className="p-2 rounded-lg bg-white/5 text-[7px] text-hyve-text2">
              Hey, are we still meeting at 5?
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TodayFocusWidget = ({ isLightMode, isExpanded, onToggleExpand, onNavigate }: any) => {
  const textPrimary = isLightMode ? 'text-black' : 'text-hyve-text1';
  const textMuted = isLightMode ? 'text-black/40' : 'text-hyve-text3';

  return (
    <div 
      onClick={() => onNavigate?.('HOME')}
      className="p-3 flex flex-col h-full justify-between group"
    >
      <div className="flex justify-between items-center">
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 rounded-lg bg-hyve-gold/20 flex items-center justify-center text-hyve-gold"
        >
          <Clock size={12} />
        </motion.div>
        <div className="flex items-center gap-2">
          <span className={`text-[7px] font-black uppercase tracking-widest ${textMuted}`}>Focus</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
            className="p-1 rounded-full bg-white/5 text-hyve-gold"
          >
            <ChevronDown size={10} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`text-[12px] font-black ${textPrimary}`}>3h 12m</span>
        <span className={`text-[7px] uppercase tracking-widest ${textMuted}`}>Daily Goal</span>
      </div>
      <div className="space-y-1">
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '85%' }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-hyve-gold" 
          />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-2 space-y-2"
            >
              <div className="flex justify-between text-[6px] font-bold text-hyve-gold uppercase tracking-tighter">
                <span>85% Complete</span>
                <span>48m Left</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[40, 60, 20, 80].map((h, i) => (
                  <div key={i} className="h-4 bg-white/5 rounded-sm relative overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="absolute bottom-0 left-0 right-0 bg-hyve-gold/40"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const WidgetContent = ({ 
  widget, 
  currentUser, 
  friends, 
  buildings, 
  isPreview = false, 
  isLightMode = false, 
  isExpanded = false,
  onToggleExpand,
  onNavigate
}: { 
  widget: Omit<Widget, 'id' | 'position'>, 
  currentUser: UserType, 
  friends: UserType[], 
  buildings: PlaceAggregate[], 
  isPreview?: boolean, 
  isLightMode?: boolean, 
  isExpanded?: boolean,
  onToggleExpand?: () => void,
  onNavigate?: (s: any) => void
}) => {
  const containerClass = `h-full w-full flex flex-col relative overflow-hidden ${isPreview ? 'pointer-events-none' : 'cursor-pointer active:scale-[0.98] transition-transform'}`;
  const textPrimary = isLightMode ? 'text-black' : 'text-hyve-text1';
  const textSecondary = isLightMode ? 'text-black/60' : 'text-hyve-text2';
  const textMuted = isLightMode ? 'text-black/40' : 'text-hyve-text3';

  const commonProps = { isLightMode, isExpanded, onToggleExpand, onNavigate };

  switch (widget.type) {
    case 'stickers':
      return <div className={containerClass}><StickerWidget size={widget.size} currentUser={currentUser} {...commonProps} /></div>;
    case 'latest_hangout':
      return <div className={containerClass}><LatestHangoutWidget buildings={buildings} {...commonProps} /></div>;
    case 'messages':
      return <div className={containerClass}><MessagesWidget friends={friends} {...commonProps} /></div>;
    case 'today_focus':
      return <div className={containerClass}><TodayFocusWidget {...commonProps} /></div>;
    case 'map':
      return (
        <div className={containerClass} onClick={() => onNavigate?.('MAP')}>
          <div className="absolute inset-0 bg-hyve-bg2">
            <div className="w-full h-full opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-hyve-gold/20 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
               <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute w-24 h-24 rounded-full bg-hyve-gold/5 blur-xl" 
               />
               <MapPin size={24} className="text-hyve-gold/40 animate-bounce" />
            </div>
          </div>
          <div className="absolute top-2 right-2">
             <button 
              onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
              className="p-1 rounded-full bg-black/40 text-hyve-gold"
            >
              <ChevronDown size={10} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[8px] font-bold text-white uppercase tracking-widest">3 Friends Nearby</span>
             </div>
             {isExpanded && (
               <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 pt-2 border-t border-white/5 flex gap-2"
               >
                  {friends.slice(0, 3).map(f => <Avatar key={f.id} src={f.avatarUrl} size="xs" />)}
               </motion.div>
             )}
          </div>
        </div>
      );
    case 'my_circle':
      return (
        <div className={containerClass} onClick={() => onNavigate?.('SEARCH')}>
          <div className="p-3 flex flex-col h-full gap-2">
            <div className="flex items-center justify-between">
              <span className={`text-[7px] font-black uppercase tracking-widest ${textMuted}`}>My Circle</span>
              <div className="flex items-center gap-2">
                <Users size={10} className="text-hyve-gold animate-pulse" />
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
                  className="p-0.5 rounded-full bg-white/5 text-hyve-gold"
                >
                  <ChevronDown size={8} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex -space-x-2">
              {friends.slice(0, 4).map((f) => (
                <motion.div key={f.id} whileHover={{ y: -2 }}>
                  <Avatar src={f.avatarUrl} size="xs" hasRing={f.isOnline} />
                </motion.div>
              ))}
              <div className="w-6 h-6 rounded-full bg-hyve-gold/20 border border-hyve-gold/40 flex items-center justify-center text-[8px] font-bold text-hyve-gold">
                +{friends.length - 4}
              </div>
            </div>
            <span className={`text-[8px] ${textSecondary}`}>{friends.filter(f => f.isOnline).length} active now</span>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-1 mt-1"
              >
                {friends.slice(4, 6).map(f => (
                  <div key={f.id} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-hyve-gold" />
                    <span className="text-[7px] text-hyve-text2">{f.name}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      );
    case 'profile':
      return (
        <div className={containerClass} onClick={() => onNavigate?.('PROFILE')}>
          <div className="p-3 flex flex-col items-center justify-center h-full gap-1">
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-[1.5px] rounded-full bg-gradient-to-r from-hyve-gold via-white to-hyve-gold opacity-100" 
              />
              <Avatar src={currentUser.avatarUrl} size="sm" />
            </div>
            <span className={`text-[9px] font-bold truncate w-full text-center ${textPrimary}`}>{currentUser.name}</span>
            <div className="px-1.5 py-0.5 rounded-full bg-hyve-gold/10 border border-hyve-gold/20">
              <span className="text-[6px] font-black text-hyve-gold uppercase tracking-widest">Level 24</span>
            </div>
          </div>
        </div>
      );
    case 'radar':
      return (
        <div className={containerClass} onClick={() => onNavigate?.('RADAR')}>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 rounded-full border border-hyve-gold/20" 
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute w-8 h-8 rounded-full border border-hyve-gold/40" 
            />
            <Radar size={16} className="text-hyve-gold relative z-10 animate-pulse" />
          </div>
          <div className="absolute top-2 left-2">
             <span className={`text-[7px] font-black uppercase tracking-widest ${textMuted}`}>Radar</span>
          </div>
        </div>
      );
    default:
      return (
        <div className={`${containerClass} flex items-center justify-center p-4`}>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${isLightMode ? 'bg-black/5' : 'bg-white/5'}`}>
              {WIDGET_TYPES.find(t => t.id === widget.type)?.icon || <Plus size={16} />}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest ${textMuted}`}>
              {WIDGET_TYPES.find(t => t.id === widget.type)?.label || 'Widget'}
            </span>
          </div>
        </div>
      );
  }
};

export const WidgetTypeSection = ({ type, isLightMode, currentUser, friends, buildings, addWidget }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sizes = [1, 2, 3, 4, 5];

  return (
    <section key={type.id}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-hyve-gold">
            {type.icon}
          </div>
          <h3 className={`text-sm font-bold ${isLightMode ? 'text-black' : 'text-white'}`}>{type.label}</h3>
        </div>
        <div className="flex items-center gap-1 text-hyve-gold">
          {/* Removed swipe for sizes phrase */}
        </div>
      </div>

      <div className="relative">
        <div 
          className="flex overflow-x-auto gap-8 pb-4 no-scrollbar snap-x snap-mandatory"
          onScroll={(e) => {
            const scrollLeft = e.currentTarget.scrollLeft;
            const width = e.currentTarget.offsetWidth;
            if (width > 0) {
              setActiveIndex(Math.round(scrollLeft / width));
            }
          }}
        >
          {sizes.map(size => (
            <div key={`${type.id}-${size}`} className="snap-center shrink-0 w-full flex flex-col items-center gap-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => addWidget(type.id, size)}
                onKeyDown={(e) => e.key === 'Enter' && addWidget(type.id, size)}
                className={`relative rounded-2xl border overflow-hidden transition-all active:scale-95 shadow-xl cursor-pointer ${
                  isLightMode ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'
                }`}
                style={{
                  width: SIZE_CONFIG[size].w * 80,
                  height: SIZE_CONFIG[size].h * 80,
                }}
              >
                <WidgetContent 
                  widget={{ type: type.id, size }} 
                  currentUser={currentUser} 
                  friends={friends} 
                  buildings={buildings}
                  isPreview={true}
                  isLightMode={isLightMode}
                />
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-bold ${isLightMode ? 'text-black' : 'text-white'}`}>Size {size}</span>
                <span className={`text-[8px] uppercase tracking-widest ${isLightMode ? 'text-black/40' : 'text-hyve-text3'}`}>
                  {SIZE_CONFIG[size].w}x{SIZE_CONFIG[size].h}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-1.5 mt-2">
          {sizes.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-4 bg-hyve-gold' : 'w-1 bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
