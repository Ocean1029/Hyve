import React from 'react';
import { Sparkles } from 'lucide-react';
import Hyve from './Hyve';
import { FocusStatus } from '@/lib/types';

interface FocusModeProps {
  focusStatus: FocusStatus;
  elapsedSeconds: number;
  isPhoneFaceDown: boolean;
  iceBreaker: string | null;
  loadingIceBreaker: boolean;
  onToggleSimulation: () => void;
  onSparkConversation: () => void;
  onDismissIceBreaker: () => void;
  onEndSession: () => void;
  formatTime: (seconds: number) => string;
  sensorAvailable: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
  onRequestPermission: () => Promise<boolean>;
}

const FocusMode: React.FC<FocusModeProps> = ({
  focusStatus,
  elapsedSeconds,
  isPhoneFaceDown,
  iceBreaker,
  loadingIceBreaker,
  onToggleSimulation,
  onSparkConversation,
  onDismissIceBreaker,
  onEndSession,
  formatTime,
  sensorAvailable,
  permissionStatus,
  onRequestPermission,
}) => {
  return (
    <div className="absolute inset-0 z-[60]">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md backdrop-saturate-50 transition-all duration-500"></div>

        <div className={`relative z-[70] flex flex-col h-full transition-colors duration-1000`}>

        {/* Controls: Permission Request and Simulation */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 items-end">
          {/* Permission Request Button (iOS 13+) */}
          {permissionStatus === 'prompt' && (
            <button
              onClick={onRequestPermission}
              className="px-4 py-2 rounded-full text-[10px] font-bold border tracking-wider uppercase transition-all bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
            >
              Enable Sensor
            </button>
          )}
          
          {/* Sensor Status Indicator */}
          {sensorAvailable && permissionStatus === 'granted' && (
            <div className="px-3 py-1 rounded-full text-[9px] font-bold border tracking-wider uppercase bg-green-500/20 text-green-300 border-green-500/30">
              Sensor Active
            </div>
          )}
          
          {/* Simulation Button (always available as fallback) */}
          <button
            onClick={onToggleSimulation}
            className={`px-4 py-2 rounded-full text-[10px] font-bold border tracking-wider uppercase transition-all ${isPhoneFaceDown ? 'bg-zinc-900 text-zinc-500 border-zinc-800' : 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`}
          >
            {isPhoneFaceDown ? "Simulate: Pick Up" : "Simulate: Put Down"}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
            <Hyve status={focusStatus} intensity={Math.min(elapsedSeconds / 60 * 10, 100)} />

            <div className="mt-16 text-center transition-opacity duration-500">
            {focusStatus === FocusStatus.ACTIVE ? (
                <>
                    <p className="text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-4 animate-pulse">Focus Mode Active</p>
                    <div className="text-6xl font-light font-mono text-amber-50 tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                    {formatTime(elapsedSeconds)}
                    </div>
                </>
            ) : (
                <div className="animate-pulse">
                    <h3 className="text-2xl text-stone-200 font-bold mb-2">Resting the Fire...</h3>
                    <p className="text-zinc-500 text-sm font-medium">Put your phone down to resume.</p>
                </div>
            )}
            </div>
            
            {/* Interaction Layer: Ice Breaker */}
            {!isPhoneFaceDown && focusStatus === FocusStatus.PAUSED && (
                <div className="absolute bottom-20 w-full px-8">
                {iceBreaker ? (
                    <div className="bg-zinc-900/90 backdrop-blur-md p-8 rounded-[32px] border border-zinc-800 animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
                    <p className="text-stone-200 text-center font-bold text-xl leading-relaxed">"{iceBreaker}"</p>
                    <button 
                        onClick={onDismissIceBreaker}
                        className="mt-6 w-full text-zinc-500 text-xs font-bold hover:text-white uppercase tracking-widest"
                    >
                        Dismiss
                    </button>
                    </div>
                ) : (
                    <button 
                    onClick={onSparkConversation}
                    disabled={loadingIceBreaker}
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 hover:border-rose-500/30 text-stone-400 py-4 rounded-3xl flex items-center justify-center gap-3 transition-all group font-bold backdrop-blur-sm"
                    >
                    <Sparkles className={`w-5 h-5 ${loadingIceBreaker ? 'animate-spin' : 'text-rose-400 group-hover:text-rose-300'}`} />
                    {loadingIceBreaker ? 'Thinking...' : 'Awkward Silence? Spark a Topic'}
                    </button>
                )}
                </div>
            )}
        </div>

        {/* Footer Controls */}
        <div className={`p-8 flex justify-center transition-all duration-500 ${focusStatus === FocusStatus.ACTIVE ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100'}`}>
            <button
            onClick={onEndSession}
            className="text-rose-400/90 text-xs font-black tracking-[0.2em] uppercase hover:text-rose-300 px-8 py-4 rounded-full border border-rose-900/20 hover:border-rose-500/30 transition-colors bg-rose-950/10 backdrop-blur-sm"
            >
            End Session
            </button>
        </div>
        </div>
    </div>
  );
};

export default FocusMode;

