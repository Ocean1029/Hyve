import React from 'react';
import { FocusStatus } from '../lib/types';

interface CampfireProps {
  status: FocusStatus;
  intensity: number; // 0 to 100
}

const Campfire: React.FC<CampfireProps> = ({ status, intensity }) => {
  const isPaused = status === FocusStatus.PAUSED;
  
  // Scale calculation: Base size + intensity growth
  const scale = 1 + (intensity / 200); 
  const opacity = isPaused ? 0.4 : 1;
  const filter = isPaused ? 'grayscale(80%) blur(2px)' : 'drop-shadow(0 0 20px rgba(251, 146, 60, 0.3))';
  const transition = 'all 1s ease-in-out';

  return (
    <div className="relative w-64 h-64 flex items-center justify-center transition-all duration-1000">
      {/* Outer Glow - Softened from bright orange to Warm Amber/Rose */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500/20 to-amber-500/20 blur-3xl transition-all duration-1000"
        style={{ 
          opacity: isPaused ? 0.1 : 0.3 + (intensity / 300),
          transform: `scale(${scale * 1.3})`,
        }}
      />

      {/* Core Fire SVG */}
      <svg 
        viewBox="0 0 200 200" 
        className={`w-full h-full ${isPaused ? '' : 'animate-flicker'}`}
        style={{ opacity, filter, transition, transform: `scale(${scale})` }}
      >
        <defs>
          <linearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#e11d48" /> {/* Rose 600 */}
            <stop offset="40%" stopColor="#fb923c" /> {/* Orange 400 */}
            <stop offset="100%" stopColor="#fef3c7" /> {/* Amber 100 */}
          </linearGradient>
        </defs>
        
        {/* Flames */}
        <path 
          d="M100 180 Q140 160 140 120 Q140 80 100 20 Q60 80 60 120 Q60 160 100 180" 
          fill="url(#fireGradient)" 
        />
        <path 
          d="M100 170 Q120 150 120 120 Q120 100 100 50 Q80 100 80 120 Q80 150 100 170" 
          fill="#fde68a" /* Amber 200 */
          className={isPaused ? '' : 'animate-flicker-fast'}
          style={{ opacity: 0.9 }}
        />
      </svg>
      
      {/* Wood Logs (Static) - Darker/Cooler to match black theme */}
      <div className="absolute bottom-4 w-32 h-8 bg-stone-800 rounded-full rotate-12 opacity-90 shadow-lg" />
      <div className="absolute bottom-4 w-32 h-8 bg-stone-900 rounded-full -rotate-12 opacity-90 shadow-lg" />
    </div>
  );
};

export default Campfire;