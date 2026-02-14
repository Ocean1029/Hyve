'use client';

import React from 'react';
import HappyIndex from '@/components/features/HappyIndex';
import BottomNav from '@/components/common/BottomNav';
import type {
  WeeklyHappyIndexDataPoint,
  PeakHappinessMemory,
} from '@hyve/types';

interface HappyIndexClientProps {
  userId: string;
  weeklyData: WeeklyHappyIndexDataPoint[];
  peakMemories: PeakHappinessMemory[];
}

const HappyIndexClient: React.FC<HappyIndexClientProps> = ({
  userId,
  weeklyData,
  peakMemories,
}) => {
  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        <HappyIndex
          userId={userId}
          weeklyData={weeklyData}
          peakMemories={peakMemories}
        />
        <BottomNav />
      </div>
    </div>
  );
};

export default HappyIndexClient;

