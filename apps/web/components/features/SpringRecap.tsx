
import React, { useEffect, useState } from 'react';
import { X, Share2, Sparkles, Coffee, Dumbbell, BookOpen, Music, Utensils, Tent, PartyPopper, Camera } from 'lucide-react';
import type { SpringBloomEntry } from '@hyve/types';

interface RecapEntry {
  rank: number;
  name: string;
  avatar: string;
  hours: number;
  tags: { label: string; icon: React.ReactNode; color: string }[];
}

interface SpringRecapProps {
  onClose: () => void;
  data?: SpringBloomEntry[];
  loading?: boolean;
}

/**
 * Map tag labels to icons and colors
 * Returns icon component and color class based on tag content
 */
const getTagIconAndColor = (tagLabel: string): { icon: React.ReactNode; color: string } => {
  const lowerTag = tagLabel.toLowerCase();
  
  // Study/Education related
  if (lowerTag.includes('study') || lowerTag.includes('library') || lowerTag.includes('homework') || lowerTag.includes('exam')) {
    return { icon: <BookOpen className="w-3 h-3" />, color: 'bg-indigo-400' };
  }
  
  // Coffee/Food related
  if (lowerTag.includes('coffee') || lowerTag.includes('cafe') || lowerTag.includes('brunch') || lowerTag.includes('food') || lowerTag.includes('meal')) {
    return { icon: <Coffee className="w-3 h-3" />, color: 'bg-amber-700' };
  }
  
  // Gym/Fitness related
  if (lowerTag.includes('gym') || lowerTag.includes('workout') || lowerTag.includes('fitness') || lowerTag.includes('exercise')) {
    return { icon: <Dumbbell className="w-3 h-3" />, color: 'bg-rose-500' };
  }
  
  // Music related
  if (lowerTag.includes('music') || lowerTag.includes('jam') || lowerTag.includes('concert') || lowerTag.includes('song')) {
    return { icon: <Music className="w-3 h-3" />, color: 'bg-purple-500' };
  }
  
  // Food/Dining related
  if (lowerTag.includes('dinner') || lowerTag.includes('lunch') || lowerTag.includes('restaurant') || lowerTag.includes('eat')) {
    return { icon: <Utensils className="w-3 h-3" />, color: 'bg-orange-400' };
  }
  
  // Outdoor/Adventure related
  if (lowerTag.includes('hiking') || lowerTag.includes('outdoor') || lowerTag.includes('camping') || lowerTag.includes('nature')) {
    return { icon: <Tent className="w-3 h-3" />, color: 'bg-emerald-600' };
  }
  
  // Party/Social related
  if (lowerTag.includes('party') || lowerTag.includes('celebration') || lowerTag.includes('event') || lowerTag.includes('social')) {
    return { icon: <PartyPopper className="w-3 h-3" />, color: 'bg-pink-500' };
  }
  
  // Photo/Photography related
  if (lowerTag.includes('photo') || lowerTag.includes('picture') || lowerTag.includes('camera') || lowerTag.includes('photography')) {
    return { icon: <Camera className="w-3 h-3" />, color: 'bg-zinc-500' };
  }
  
  // Gaming/Entertainment related
  if (lowerTag.includes('game') || lowerTag.includes('gaming') || lowerTag.includes('play')) {
    return { icon: <Sparkles className="w-3 h-3" />, color: 'bg-blue-500' };
  }
  
  // Default fallback
  return { icon: <Coffee className="w-3 h-3" />, color: 'bg-teal-500' };
};

const SpringRecap: React.FC<SpringRecapProps> = ({ onClose, data = [], loading = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Transform data with icons and colors
  const recapData: RecapEntry[] = data.map((entry) => ({
    ...entry,
    tags: (entry.tags ?? []).map((tagLabel) => {
      const { icon, color } = getTagIconAndColor(tagLabel);
      return { label: tagLabel, icon, color };
    }),
  }));

  return (
    <div className="absolute inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-zinc-950 to-zinc-950 pointer-events-none"></div>
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-pink-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Floating Petals/Particles (CSS-only for performance) */}
      <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
         {[...Array(6)].map((_, i) => (
           <div 
             key={i}
             className="absolute bg-pink-300/60 rounded-full"
             style={{
               width: Math.random() * 10 + 4 + 'px',
               height: Math.random() * 10 + 4 + 'px',
               top: Math.random() * 100 + '%',
               left: Math.random() * 100 + '%',
               animation: `float ${Math.random() * 5 + 5}s infinite ease-in-out`
             }}
           />
         ))}
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <header className="relative z-10 px-6 pt-12 pb-4 flex justify-between items-center bg-gradient-to-b from-zinc-950/80 to-transparent backdrop-blur-sm sticky top-0">
        <div>
          <h2 className="text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase mb-1">Quarterly Feedback</h2>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            Spring Bloom <span className="text-pink-400">🌸</span>
          </h1>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center hover:bg-zinc-700 transition-colors backdrop-blur-md"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-zinc-400">Loading Spring Bloom data...</div>
          </div>
        ) : recapData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-zinc-400 text-lg mb-2">No focus sessions found</div>
            <div className="text-zinc-500 text-sm">Start focusing with friends to see your Spring Bloom recap!</div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {recapData.map((friend, index) => (
            <div 
              key={friend.rank}
              className="group relative flex items-center gap-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/50 rounded-2xl p-4 transition-all duration-300"
              style={{
                animation: `slideUp 0.5s ease-out forwards ${index * 0.1}s`,
                opacity: 0 // Initial state for animation
              }}
            >
              {/* Rank Badge */}
              <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg z-20
                ${friend.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-black scale-110 border-2 border-yellow-200' : 
                  friend.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black border border-white/20' : 
                  friend.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-black border border-white/20' : 
                  'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                {friend.rank}
              </div>

              {/* Avatar with Glow for Top 3 */}
              <div className={`relative ml-4 ${friend.rank <= 3 ? 'p-1' : ''}`}>
                {friend.rank === 1 && <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-emerald-500 rounded-full animate-spin-slow opacity-70 blur-md"></div>}
                <img 
                  src={friend.avatar} 
                  alt={friend.name} 
                  className={`w-14 h-14 rounded-full object-cover relative z-10 border-2 ${friend.rank === 1 ? 'border-yellow-400' : 'border-zinc-700'}`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-white truncate">{friend.name}</h3>
                  <span className="text-xl font-mono font-bold text-emerald-400">{friend.hours}<span className="text-xs text-zinc-500 ml-1 font-sans font-normal">hrs</span></span>
                </div>
                
                {/* Event Tags / Stickers */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {friend.tags.map((tag, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-sm ${tag.color} text-white/90 transform transition-transform group-hover:scale-105`}
                    >
                      {tag.icon}
                      {tag.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating CTA */}
      <div className="absolute bottom-6 left-6 right-6 z-20">
        <button className="w-full bg-gradient-to-r from-pink-500 to-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Share2 className="w-5 h-5" />
          Share to Instagram Story
        </button>
      </div>
    </div>
  );
};

export default SpringRecap;
