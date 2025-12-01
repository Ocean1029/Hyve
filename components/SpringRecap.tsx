
import React, { useEffect, useState } from 'react';
import { X, Share2, Sparkles, Coffee, Dumbbell, BookOpen, Music, Utensils, Tent, PartyPopper, Camera } from 'lucide-react';

interface RecapEntry {
  rank: number;
  name: string;
  avatar: string;
  hours: number;
  tags: { label: string; icon: React.ReactNode; color: string }[];
}

const MOCK_RECAP_DATA: RecapEntry[] = [
  { 
    rank: 1, name: 'Kai', avatar: 'https://picsum.photos/100/100?random=1', hours: 124, 
    tags: [{ label: 'Late Night Study', icon: <BookOpen className="w-3 h-3" />, color: 'bg-indigo-400' }, { label: 'Coffee Runs', icon: <Coffee className="w-3 h-3" />, color: 'bg-amber-700' }] 
  },
  { 
    rank: 2, name: 'Sarah', avatar: 'https://picsum.photos/100/100?random=2', hours: 98, 
    tags: [{ label: 'Gym Buddy', icon: <Dumbbell className="w-3 h-3" />, color: 'bg-rose-500' }] 
  },
  { 
    rank: 3, name: 'Leo', avatar: 'https://picsum.photos/100/100?random=3', hours: 85, 
    tags: [{ label: 'Jam Sessions', icon: <Music className="w-3 h-3" />, color: 'bg-purple-500' }] 
  },
  { 
    rank: 4, name: 'Mia', avatar: 'https://picsum.photos/100/100?random=4', hours: 72, 
    tags: [{ label: 'Brunch', icon: <Utensils className="w-3 h-3" />, color: 'bg-orange-400' }] 
  },
  { 
    rank: 5, name: 'Noah', avatar: 'https://picsum.photos/100/100?random=5', hours: 64, 
    tags: [{ label: 'Hiking', icon: <Tent className="w-3 h-3" />, color: 'bg-emerald-600' }] 
  },
  { 
    rank: 6, name: 'Ava', avatar: 'https://picsum.photos/100/100?random=6', hours: 50, 
    tags: [{ label: 'Parties', icon: <PartyPopper className="w-3 h-3" />, color: 'bg-pink-500' }] 
  },
  { 
    rank: 7, name: 'James', avatar: 'https://picsum.photos/100/100?random=7', hours: 42, 
    tags: [{ label: 'Gaming', icon: <Sparkles className="w-3 h-3" />, color: 'bg-blue-500' }] 
  },
  { 
    rank: 8, name: 'Lily', avatar: 'https://picsum.photos/100/100?random=8', hours: 38, 
    tags: [{ label: 'Library', icon: <BookOpen className="w-3 h-3" />, color: 'bg-indigo-400' }] 
  },
  { 
    rank: 9, name: 'Ethan', avatar: 'https://picsum.photos/100/100?random=9', hours: 25, 
    tags: [{ label: 'Photo Walk', icon: <Camera className="w-3 h-3" />, color: 'bg-zinc-500' }] 
  },
  { 
    rank: 10, name: 'Zoe', avatar: 'https://picsum.photos/100/100?random=10', hours: 12, 
    tags: [{ label: 'Chilling', icon: <Coffee className="w-3 h-3" />, color: 'bg-teal-500' }] 
  },
];

interface SpringRecapProps {
  onClose: () => void;
}

const SpringRecap: React.FC<SpringRecapProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
        <div className="space-y-4 pt-2">
          {MOCK_RECAP_DATA.map((friend, index) => (
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
