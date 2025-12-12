import React, { useState, useMemo } from 'react';
import { X, Music, Image as ImageIcon, Plus, MapPin, ChevronRight, Star } from 'lucide-react';

interface PostMemoryProps {
  durationSeconds: number;
  sessionEndTime: Date;
  onBack: () => void;
  onPost: () => void;
}

const CATEGORIES = ['📚 Study', '🍔 Eat', '🏋️ Gym', '🚗 Drive', '☕ Chill', '🎮 Game', '🎨 Create'];

const PostMemory: React.FC<PostMemoryProps> = ({ durationSeconds, sessionEndTime, onBack, onPost }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
  const [rating, setRating] = useState(10);
  
  // Calculate time details
  const timeDetails = useMemo(() => {
    const end = sessionEndTime;
    const start = new Date(end.getTime() - durationSeconds * 1000);
    
    // Format Date: "Oct 21"
    const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Format Time Range: "13:53-15:42"
    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const timeRange = `${formatTime(start)}-${formatTime(end)}`;
    
    // Format Duration: "1hr 59min"
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    // If less than a minute, show seconds or < 1 min, but strictly sticking to user format request
    let durationStr = '';
    if (h > 0) durationStr += `${h}hr `;
    if (m > 0 || h === 0) durationStr += `${m}min`; // Show min if 0 hours, even if 0 min (handled as 0min)

    return { dateStr, timeRange, durationStr };
  }, [durationSeconds, sessionEndTime]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative z-50">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-zinc-950/90 backdrop-blur-md z-30 border-b border-zinc-900">
        <h2 className="text-lg font-bold text-white">New Memory</h2>
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-8 pt-6">
        
        {/* 1. Highlight Stats Section */}
        <section className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Star className="w-32 h-32 text-rose-500 rotate-12" />
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-black text-white tracking-tighter mb-1 drop-shadow-lg">
              {timeDetails.durationStr}
            </h3>
            <div className="flex items-center justify-center gap-2 text-rose-400 font-mono text-sm font-bold uppercase tracking-wider">
               <span>{timeDetails.dateStr}</span>
               <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
               <span>{timeDetails.timeRange}</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-zinc-800/50 rounded-full border border-zinc-700/50">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-zinc-400 font-bold">Location automatically tagged</span>
            </div>
          </div>
        </section>

        {/* 2. Category Selector */}
        <section>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Vibe Check</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-stone-100 text-black border-white shadow-lg shadow-white/10 scale-105' 
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
            <button className="px-4 py-3 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-500 border border-zinc-800 border-dashed hover:text-white">
              + Custom
            </button>
          </div>
        </section>

        {/* 3. Media Placeholder */}
        <section>
           <div className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center gap-4 hover:bg-zinc-900/50 transition-colors cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Tap to add photos/video</p>
           </div>
        </section>

        {/* 4. Song & Caption */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
             <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
             </div>
             <div className="flex-1">
               <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Soundtrack</div>
               <input 
                 type="text" 
                 placeholder="Search for a song..." 
                 className="w-full bg-transparent text-white text-sm font-bold placeholder-zinc-700 focus:outline-none"
               />
             </div>
             <ChevronRight className="w-5 h-5 text-zinc-700" />
          </div>

          <textarea 
            placeholder="Write a caption..." 
            className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-white text-sm font-medium placeholder-zinc-600 focus:outline-none focus:border-zinc-700 min-h-[100px] resize-none"
          />
        </section>

        {/* 5. Rating Slider */}
        <section className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800/50">
           <div className="flex justify-between items-end mb-6">
              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-widest block mb-1">Rate Experience</label>
                <p className="text-[10px] text-zinc-600 font-bold">(Private for Happy Index)</p>
              </div>
              <div className="text-2xl font-black text-amber-400 tabular-nums">
                {rating}<span className="text-sm text-amber-600/80 ml-0.5">/10</span>
              </div>
           </div>
           
           <div className="relative h-12 flex items-center justify-between px-2">
             {/* Track */}
             <div className="absolute left-0 right-0 h-2 bg-zinc-800 rounded-full"></div>
             
             {/* Stars Buttons */}
             {[...Array(10)].map((_, i) => {
               const val = i + 1;
               const isActive = val <= rating;
               return (
                 <button 
                    key={val}
                    onClick={() => setRating(val)}
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-90 opacity-40 hover:opacity-100'}`}
                 >
                    <Star 
                      className={`w-full h-full transition-colors ${isActive ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'fill-zinc-700 text-zinc-700'}`} 
                    />
                 </button>
               );
             })}
           </div>
           <div className="flex justify-between mt-2 px-2">
              <span className="text-[10px] font-bold text-zinc-600 uppercase">Meh</span>
              <span className="text-[10px] font-bold text-zinc-600 uppercase">Life Changing</span>
           </div>
        </section>

      </div>

      {/* Footer CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-40">
        <button 
          onClick={onPost}
          className="w-full bg-white text-black font-bold text-lg py-5 rounded-3xl shadow-lg shadow-white/10 hover:bg-stone-200 transition-colors active:scale-[0.98]"
        >
          Post to Vault
        </button>
      </div>

    </div>
  );
};

export default PostMemory;