'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppState, FocusStatus, Friend, ChartDataPoint } from '@/lib/types';
import SpringRecap from '@/components/SpringRecap';
import HappyIndex from '@/components/HappyIndex';
import FriendProfile from '@/components/FriendProfile';
import Dashboard from '@/components/Dashboard';
import PostMemory from '@/components/PostMemory';
import BottomNav from '@/components/BottomNav';
import Searching from '@/components/Searching';
import Found from '@/components/Found';
import FocusMode from '@/components/FocusMode';
import SessionSummary from '@/components/SessionSummary';
import { generateIceBreaker } from '@/lib/services/geminiService';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface DashboardClientProps {
  friends: Friend[];
  chartData: ChartDataPoint[];
}

const DashboardClient: React.FC<DashboardClientProps> = ({ friends, chartData }) => {
  // --- State ---
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  
  // Enable swipe navigation only in DASHBOARD state
  useSwipeNavigation({ 
    currentPath: '/', 
    enabled: appState === AppState.DASHBOARD 
  });
  const [focusStatus, setFocusStatus] = useState<FocusStatus>(FocusStatus.PAUSED);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [loadingIceBreaker, setLoadingIceBreaker] = useState(false);
  const [isPhoneFaceDown, setIsPhoneFaceDown] = useState(false);
  const timerRef = useRef<number | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (appState === AppState.FOCUS && focusStatus === FocusStatus.ACTIVE) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appState, focusStatus]);

  useEffect(() => {
    if (appState === AppState.FOCUS) {
      setFocusStatus(isPhoneFaceDown ? FocusStatus.ACTIVE : FocusStatus.PAUSED);
    }
  }, [isPhoneFaceDown, appState]);

  // --- Handlers ---
  const startSearch = () => {
    setAppState(AppState.SEARCHING);
    setTimeout(() => {
      setAppState(AppState.FOUND);
      setSelectedFriend(friends[0]);
    }, 2500);
  };

  const startSession = () => {
    setAppState(AppState.FOCUS);
    setElapsedSeconds(0);
    setSessionEndTime(null);
    setIceBreaker(null);
    setIsPhoneFaceDown(false);
  };

  const endSession = () => {
    setSessionEndTime(new Date());
    setAppState(AppState.SUMMARY);
  };

  const handleUnlockPhotoMoment = () => {
    if (!sessionEndTime) setSessionEndTime(new Date()); // Fallback if missing
    setAppState(AppState.POST_MEMORY);
  };

  const handleSparkConversation = async () => {
    if (loadingIceBreaker) return;
    setLoadingIceBreaker(true);
    const question = await generateIceBreaker();
    setIceBreaker(question);
    setLoadingIceBreaker(false);
  };

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setAppState(AppState.FRIEND_PROFILE);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    // Main Container ensuring iPhone dimensions on Desktop
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">

        {/* Dashboard Content */}
        <div className="w-full h-full">
            <Dashboard
              friends={friends}
              chartData={chartData}
              onOpenHappyIndex={() => setAppState(AppState.HAPPY_INDEX)}
              onFriendClick={handleFriendClick}
              onSearch={startSearch}
              onSpringRecap={() => setAppState(AppState.QUARTERLY_FEEDBACK)}
              onStartSession={startSession}
            />
        </div>

        {/* Bottom Navigation - Hidden during Focus, Summary, and Post Memory modes */}
        {appState !== AppState.FOCUS && 
         appState !== AppState.SUMMARY && 
         appState !== AppState.POST_MEMORY && (
          <BottomNav />
        )}

        {/* Global Modals */}
        {appState === AppState.HAPPY_INDEX && (
          <div className="absolute inset-0 z-50">
            <HappyIndex
              onClose={() => setAppState(AppState.DASHBOARD)}
              friends={friends}
              onFriendClick={handleFriendClick}
            />
          </div>
        )}

        {appState === AppState.FRIEND_PROFILE && selectedFriend && (
          <div className="absolute inset-0 z-50">
            <FriendProfile friend={selectedFriend} onBack={() => setAppState(AppState.DASHBOARD)} />
          </div>
        )}

        {/* Other Full Screen Overlays */}
        {appState === AppState.SEARCHING && (
          <div className="absolute inset-0 z-[70] bg-zinc-950">
            <Searching onCancel={() => setAppState(AppState.DASHBOARD)} />
          </div>
        )}
        
        {appState === AppState.FOUND && (
          <div className="absolute inset-0 z-[70] bg-zinc-950">
            <Found friend={selectedFriend} onClose={() => setAppState(AppState.DASHBOARD)} />
          </div>
        )}
        
        {appState === AppState.FOCUS && (
          <FocusMode
            focusStatus={focusStatus}
            elapsedSeconds={elapsedSeconds}
            isPhoneFaceDown={isPhoneFaceDown}
            iceBreaker={iceBreaker}
            loadingIceBreaker={loadingIceBreaker}
            onToggleSimulation={() => setIsPhoneFaceDown(!isPhoneFaceDown)}
            onSparkConversation={handleSparkConversation}
            onDismissIceBreaker={() => setIceBreaker(null)}
            onEndSession={endSession}
            formatTime={formatTime}
          />
        )}
        
        {appState === AppState.SUMMARY && (
          <div className="absolute inset-0 z-[70] bg-zinc-950">
            <SessionSummary
              elapsedSeconds={elapsedSeconds}
              formatTime={formatTime}
              onUnlockPhotoMoment={handleUnlockPhotoMoment}
              onReturnHome={() => setAppState(AppState.DASHBOARD)}
            />
          </div>
        )}
        
        {appState === AppState.QUARTERLY_FEEDBACK && <SpringRecap onClose={() => setAppState(AppState.DASHBOARD)} />}
        
        {appState === AppState.POST_MEMORY && (
          <div className="absolute inset-0 z-[70] bg-zinc-950">
            <PostMemory
              durationSeconds={elapsedSeconds}
              sessionEndTime={sessionEndTime || new Date()}
              onBack={() => setAppState(AppState.SUMMARY)}
              onPost={() => setAppState(AppState.DASHBOARD)}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardClient;

