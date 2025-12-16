'use client';

import React from 'react';
import TodayDetails from '@/components/TodayDetails';
import BottomNav from '@/components/BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import SwipePreviewWrapper from '@/components/SwipePreviewWrapper';

interface TodayClientProps {
  userId: string;
}

const TodayClient: React.FC<TodayClientProps> = ({ userId }) => {
  // Enable swipe navigation for today page
  useSwipeNavigation({ 
    currentPath: '/today', 
    enabled: true 
  });

  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        <SwipePreviewWrapper currentPath="/today">
          <TodayDetails userId={userId} />
          <BottomNav />
        </SwipePreviewWrapper>
      </div>
    </div>
  );
};

export default TodayClient;

