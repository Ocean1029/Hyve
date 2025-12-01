import React from 'react';

const Radar: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Core Dot */}
      <div className="w-4 h-4 bg-rose-400 rounded-full z-10 shadow-[0_0_15px_rgba(251,113,133,0.6)]"></div>
      
      {/* Ripple 1 */}
      <div className="absolute w-full h-full border border-rose-400/20 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
      
      {/* Ripple 2 (Delayed) */}
      <div className="absolute w-2/3 h-2/3 border border-amber-200/20 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
      
      {/* Static Rings for aesthetic */}
      <div className="absolute w-48 h-48 border border-zinc-800/50 rounded-full"></div>
      <div className="absolute w-32 h-32 border border-zinc-800/50 rounded-full"></div>
    </div>
  );
};

export default Radar;