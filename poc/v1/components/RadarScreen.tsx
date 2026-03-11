import React, { useState, useEffect } from 'react';
import { X, Wifi, UserPlus, Check } from 'lucide-react';
import { AppScreen, User } from '../types';
import { Avatar } from './UI';
import { CURRENT_USER } from '../src/data_constants';

export const RadarScreen = ({ onNavigate, onClose }: { onNavigate: (s: AppScreen, u?: User) => void, onClose: () => void }) => {
  const [scanState, setScanState] = useState<'scanning' | 'detected' | 'connecting' | 'connected'>('scanning');
  
  // Mock found user
  const foundUser = {
    id: 'u_new',
    name: 'Sera',
    handle: '@sera_ph',
    avatarUrl: 'https://picsum.photos/600/600?u=99',
    color: '#EC4899', // Pink
    isOnline: true
  };

  useEffect(() => {
    if (scanState === 'scanning') {
      const timer = setTimeout(() => {
        setScanState('detected');
      }, 3000); // 3s scan
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  const handleConnect = () => {
    setScanState('connecting');
    setTimeout(() => {
      setScanState('connected');
    }, 1500);
  };

  return (
    <div className="h-full w-full bg-hyve-bg0 flex flex-col relative overflow-hidden animate-flip-in">
       {/* Background Grid/Radar lines */}
       <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10"></div>
       </div>

       {/* Header */}
       <div className="absolute top-6 left-6 z-50">
          <button onClick={onClose} className="p-2 glass-panel rounded-full text-hyve-text2 hover:text-white transition-colors">
             <X size={20} />
          </button>
       </div>

       {/* Main Content */}
       <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          
          {/* Radar Visual */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-12">
             {/* Ripples */}
             {scanState === 'scanning' && (
               <>
                 <div className="absolute inset-0 rounded-full border border-hyve-gold/20 animate-[ping_3s_ease-out_infinite]"></div>
                 <div className="absolute inset-4 rounded-full border border-hyve-gold/20 animate-[ping_3s_ease-out_infinite_1s]"></div>
                 <div className="absolute inset-8 rounded-full border border-hyve-gold/20 animate-[ping_3s_ease-out_infinite_2s]"></div>
               </>
             )}
             
             {/* Center Node */}
             <div className="relative z-20 w-16 h-16 rounded-full bg-hyve-bg1 border border-hyve-gold/50 shadow-[0_0_30px_rgba(201,168,106,0.2)] flex items-center justify-center">
                 {scanState === 'scanning' ? (
                   <Wifi size={24} className="text-hyve-gold animate-pulse" />
                 ) : (
                   <Avatar src={CURRENT_USER.avatarUrl} size="md" hasRing />
                 )}
             </div>

             {/* Scanning Line */}
             {scanState === 'scanning' && (
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                   <div className="w-1/2 h-1/2 bg-gradient-to-br from-hyve-gold/20 to-transparent absolute top-0 right-0 origin-bottom-left animate-[spin_2s_linear_infinite]"></div>
                </div>
             )}

             {/* Found User Node */}
             {scanState !== 'scanning' && (
               <div className="absolute top-0 right-0 animate-flip-in">
                  <div className="relative w-14 h-14 rounded-full border-2 border-hyve-gold overflow-hidden shadow-[0_0_20px_rgba(201,168,106,0.5)]">
                     <img src={foundUser.avatarUrl} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                     <span className="text-[10px] font-bold text-white">{foundUser.name}</span>
                  </div>
               </div>
             )}
          </div>

          {/* Status Text */}
          <div className="text-center h-24">
             {scanState === 'scanning' && (
               <>
                 <h2 className="text-lg font-light text-hyve-text1 tracking-widest mb-2 animate-pulse">SCANNING FREQUENCY</h2>
                 <p className="text-[10px] text-hyve-text3">Searching for nearby signals...</p>
               </>
             )}
             {scanState === 'detected' && (
               <div className="animate-flip-in">
                 <h2 className="text-lg font-bold text-hyve-text1 tracking-wide mb-2">SIGNAL DETECTED</h2>
                 <p className="text-[10px] text-hyve-text2 mb-4">Found {foundUser.name} nearby</p>
                 <button onClick={handleConnect} className="px-8 py-3 bg-hyve-gold text-hyve-bg0 rounded-full font-bold text-xs uppercase tracking-widest shadow-gold-glow active:scale-95 transition-transform flex items-center gap-2 mx-auto">
                    <UserPlus size={14} />
                    Connect
                 </button>
               </div>
             )}
             {scanState === 'connecting' && (
                <div className="flex flex-col items-center">
                   <div className="w-6 h-6 border-2 border-hyve-gold border-t-transparent rounded-full animate-spin mb-3"></div>
                   <span className="text-xs text-hyve-gold font-medium tracking-widest">ESTABLISHING LINK...</span>
                </div>
             )}
             {scanState === 'connected' && (
                <div className="animate-flip-in flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-2 border border-green-500/50">
                      <Check size={20} />
                   </div>
                   <h2 className="text-lg font-bold text-white tracking-wide">CONNECTED</h2>
                   <p className="text-[10px] text-hyve-text3 mt-1">You and {foundUser.name} are now linked.</p>
                   <button onClick={onClose} className="mt-4 text-xs text-hyve-text2 hover:text-white underline underline-offset-4">
                      Return to Friends
                   </button>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};
