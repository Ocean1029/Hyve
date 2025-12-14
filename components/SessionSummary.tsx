import React from 'react';
import { Camera, Trophy } from 'lucide-react';

interface SessionSummaryProps {
  elapsedSeconds: number;
  formatTime: (seconds: number) => string;
  onUnlockPhotoMoment: () => void;
  onReturnHome: () => void;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({
  elapsedSeconds,
  formatTime,
  onUnlockPhotoMoment,
  onReturnHome,
}) => {
  return (
    <div className="flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-zinc-950 to-zinc-950"></div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 text-center">

        <div className="mb-8 bg-gradient-to-tr from-rose-500/10 to-amber-500/10 p-6 rounded-full border border-zinc-800 shadow-[0_0_30px_rgba(251,113,133,0.1)]">
          <Trophy className="w-12 h-12 text-amber-200" />
        </div>

        <h2 className="text-4xl font-black text-stone-100 mb-2">Session<br/>Complete</h2>
        <p className="text-zinc-500 mb-12 text-sm font-medium">Quality time captured.</p>

        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-3xl p-8 w-full mb-8">
           <div className="text-[10px] text-rose-300 uppercase tracking-[0.2em] mb-2 font-bold">Total Focus Time</div>
           <div className="text-6xl font-light text-stone-100 font-mono tracking-tighter">{formatTime(elapsedSeconds)}</div>
        </div>

        <div className="space-y-4 w-full">
           <button
             onClick={onUnlockPhotoMoment}
             className="w-full bg-stone-100 text-black font-bold py-5 rounded-3xl flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-lg shadow-white/5"
            >
             <Camera className="w-5 h-5" />
             Unlock Photo Moment
           </button>

           <button
             onClick={onReturnHome}
             className="w-full bg-transparent text-zinc-500 font-bold text-xs uppercase tracking-widest py-4 rounded-xl hover:text-white transition-colors"
           >
             Return Home
           </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary;



