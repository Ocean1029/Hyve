import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium } from 'lucide-react';

export const StatusBar = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })), 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 h-6 z-[1001] flex items-center justify-between px-6 pointer-events-none">
       <span className="text-[10px] font-bold text-white/90">{time}</span>
       <div className="flex items-center gap-1.5 opacity-80">
          <Wifi size={10} className="text-white" />
          <span className="text-[8px] font-bold text-white leading-none">88%</span>
          <BatteryMedium size={12} className="text-white" />
       </div>
    </div>
  );
};
