'use client';

import React from 'react';
import TodayDetails from '@/components/TodayDetails';
import BottomNav from '@/components/BottomNav';

interface TodayClientProps {
  userId: string;
}

const TodayClient: React.FC<TodayClientProps> = ({ userId }) => {
  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        <TodayDetails userId={userId} />
        <BottomNav />
      </div>
    </div>
  );
};

export default TodayClient;

