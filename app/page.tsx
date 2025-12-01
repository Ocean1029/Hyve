'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Camera, Trophy } from 'lucide-react';
import { AppState, FocusStatus, Friend, ChartDataPoint } from '@/lib/types';
import Campfire from '@/components/Campfire';
import Radar from '@/components/Radar';
import SpringRecap from '@/components/SpringRecap';
import HappyIndex from '@/components/HappyIndex';
import FriendProfile from '@/components/FriendProfile';
import TodayDetails from '@/components/TodayDetails';
import MyProfile from '@/components/MyProfile';
import Messages from '@/components/Messages';
import Dashboard from '@/components/Dashboard';
import PostMemory from '@/components/PostMemory';
import Settings from '@/components/Settings';
import { generateIceBreaker } from '@/lib/services/geminiService';

// Mock Data
const MOCK_FRIENDS: Friend[] = [
  {
    id: '1', name: 'Kai', avatar: 'https://picsum.photos/100/100?random=1', totalHours: 42, streak: 5,
    bio: 'Architecture student. Coffee addict.',
    recentInteractions: [
      { id: '1a', activity: 'Studio Late Night', date: 'Yesterday', duration: '3h 15m' },
      { id: '1b', activity: 'Lunch', date: '2 days ago', duration: '45m' }
    ],
    posts: [
      { id: 'p1', imageUrl: 'https://picsum.photos/300/300?random=11', caption: 'Studio vibes' },
      { id: 'p2', imageUrl: 'https://picsum.photos/300/300?random=12', caption: 'Coffee run' }
    ]
  },
  {
    id: '2', name: 'Sarah', avatar: 'https://picsum.photos/100/100?random=2', totalHours: 28, streak: 2,
    bio: 'Hiking & Photography.',
    recentInteractions: [
      { id: '2a', activity: 'Morning Hike', date: 'Sunday', duration: '2h 30m' }
    ],
    posts: [
      { id: 'p3', imageUrl: 'https://picsum.photos/300/300?random=13', caption: 'Sunrise' }
    ]
  },
  {
    id: '3', name: 'Leo', avatar: 'https://picsum.photos/100/100?random=3', totalHours: 12, streak: 0,
    bio: 'Music production.',
    recentInteractions: [],
    posts: []
  },
];

const MOCK_CHART_DATA: ChartDataPoint[] = [
  { day: 'Mon', minutes: 45 },
  { day: 'Tue', minutes: 120 },
  { day: 'Wed', minutes: 30 },
  { day: 'Thu', minutes: 90 },
  { day: 'Fri', minutes: 180 },
  { day: 'Sat', minutes: 240 },
  { day: 'Sun', minutes: 60 },
];

const Home: React.FC = () => {
  // --- State ---
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [focusStatus, setFocusStatus] = useState<FocusStatus>(FocusStatus.PAUSED);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [loadingIceBreaker, setLoadingIceBreaker] = useState(false);
  const [isPhoneFaceDown, setIsPhoneFaceDown] = useState(false);
  const timerRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Scroll to center (Dashboard) on initial mount
  useLayoutEffect(() => {
    const scrollToDashboard = () => {
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollTo({ left: width, behavior: 'instant' });
      }
    };

    // Immediate attempt
    scrollToDashboard();

    // Backup attempt for frame resizing/loading scenarios
    const timer = setTimeout(scrollToDashboard, 100);
    return () => clearTimeout(timer);
  }, []);

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
      setSelectedFriend(MOCK_FRIENDS[0]);
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

  // --- Renderers for Full Screen States ---

  const renderSearching = () => (
    <div className="flex flex-col h-full bg-zinc-950 items-center justify-center relative">
      <div className="absolute top-24 text-center">
        <h2 className="text-2xl font-bold text-stone-200 animate-pulse tracking-tight">Scanning...</h2>
        <p className="text-sm text-zinc-600 mt-2 font-medium">Looking for nearby campfires</p>
      </div>
      <Radar />
      <button
        onClick={() => setAppState(AppState.DASHBOARD)}
        className="absolute bottom-20 text-zinc-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase"
      >
        Cancel
      </button>
    </div>
  );

  const renderFound = () => (
    <div className="flex flex-col h-full bg-zinc-950 items-center justify-center px-6 animate-in fade-in duration-500">
      <div className="bg-zinc-900 p-8 rounded-[40px] w-full border border-zinc-800 flex flex-col items-center shadow-2xl shadow-rose-900/10">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl"></div>
          <img
            src={selectedFriend?.avatar}
            className="w-32 h-32 rounded-full border-4 border-zinc-800 relative z-10"
            alt="Friend"
          />
          <div className="absolute -bottom-2 -right-2 bg-zinc-950 p-2 rounded-full z-20 border border-zinc-800">
             <div className="bg-emerald-500 w-5 h-5 rounded-full animate-bounce"></div>
          </div>
        </div>

        <h2 className="text-3xl font-black text-stone-100 mb-1">{selectedFriend?.name}</h2>
        <p className="text-emerald-400 text-xs font-bold mb-10 tracking-[0.2em] uppercase">Connected!</p>

        <div className="text-center mb-8">
            <p className="text-stone-300 text-sm">Kai is nearby.</p>
        </div>

        <button
          onClick={() => setAppState(AppState.DASHBOARD)}
          className="w-full bg-zinc-800 text-stone-300 hover:text-white font-bold py-5 rounded-3xl text-lg transition-all active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );

  const renderFocus = () => (
    <div className="absolute inset-0 z-[60]">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md backdrop-saturate-50 transition-all duration-500"></div>

        <div className={`relative z-[70] flex flex-col h-full transition-colors duration-1000`}>

        {/* Simulation Controls */}
        <div className="absolute top-4 right-4 z-50">
            <button
            onClick={() => setIsPhoneFaceDown(!isPhoneFaceDown)}
            className={`px-4 py-2 rounded-full text-[10px] font-bold border tracking-wider uppercase transition-all ${isPhoneFaceDown ? 'bg-zinc-900 text-zinc-500 border-zinc-800' : 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`}
            >
            {isPhoneFaceDown ? "Simulate: Pick Up" : "Simulate: Put Down"}
            </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
            <Campfire status={focusStatus} intensity={Math.min(elapsedSeconds / 60 * 10, 100)} />

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
        </div>

        {/* Footer Controls */}
        <div className={`p-8 flex justify-center transition-all duration-500 ${focusStatus === FocusStatus.ACTIVE ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100'}`}>
            <button
            onClick={endSession}
            className="text-rose-400/90 text-xs font-black tracking-[0.2em] uppercase hover:text-rose-300 px-8 py-4 rounded-full border border-rose-900/20 hover:border-rose-500/30 transition-colors bg-rose-950/10 backdrop-blur-sm"
            >
            End Session
            </button>
        </div>
        </div>
    </div>
  );

  const renderSummary = () => (
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
             onClick={handleUnlockPhotoMoment}
             className="w-full bg-stone-100 text-black font-bold py-5 rounded-3xl flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-lg shadow-white/5"
            >
             <Camera className="w-5 h-5" />
             Unlock Photo Moment
           </button>

           <button
             onClick={() => setAppState(AppState.DASHBOARD)}
             className="w-full bg-transparent text-zinc-500 font-bold text-xs uppercase tracking-widest py-4 rounded-xl hover:text-white transition-colors"
           >
             Return Home
           </button>
        </div>
      </div>
    </div>
  );

  return (
    // Main Container ensuring iPhone dimensions on Desktop
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">

        {/* Horizontal Scroll Container (Carousel) */}
        {/* Only show this carousel structure when in standard nav states (DASHBOARD/MESSAGES/PROFILE) or overlay states that shouldn't unmount the main view */}
        <div
          ref={scrollContainerRef}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide overscroll-contain"
        >

          {/* Page 1: Left - Messages */}
          <div className="w-full h-full flex-shrink-0 snap-center">
            <Messages />
          </div>

          {/* Page 2: Center - Dashboard */}
          <div className="w-full h-full flex-shrink-0 snap-center">
            <Dashboard
              friends={MOCK_FRIENDS}
              chartData={MOCK_CHART_DATA}
              onOpenHappyIndex={() => setAppState(AppState.HAPPY_INDEX)}
              onFriendClick={handleFriendClick}
              onSearch={startSearch}
              onSpringRecap={() => setAppState(AppState.QUARTERLY_FEEDBACK)}
              onStartSession={startSession}
            />
          </div>

          {/* Page 3: Right - My Profile */}
          <div className="w-full h-full flex-shrink-0 snap-center">
            <MyProfile
              onViewDetails={() => setAppState(AppState.TODAY_DETAILS)}
              onSettingsClick={() => setAppState(AppState.SETTINGS)}
            />
          </div>

        </div>

        {/* Global Modals (Absolute Positioned Overlaying the Scroll Container) */}
        {appState === AppState.HAPPY_INDEX && (
          <div className="absolute inset-0 z-50">
            <HappyIndex
              onClose={() => setAppState(AppState.DASHBOARD)}
              friends={MOCK_FRIENDS}
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
        {appState === AppState.SEARCHING && <div className="absolute inset-0 z-40 bg-zinc-950">{renderSearching()}</div>}
        {appState === AppState.FOUND && <div className="absolute inset-0 z-40 bg-zinc-950">{renderFound()}</div>}
        {appState === AppState.FOCUS && renderFocus()}
        {appState === AppState.SUMMARY && <div className="absolute inset-0 z-40 bg-zinc-950">{renderSummary()}</div>}
        {appState === AppState.QUARTERLY_FEEDBACK && <SpringRecap onClose={() => setAppState(AppState.DASHBOARD)} />}
        {appState === AppState.TODAY_DETAILS && <TodayDetails onClose={() => setAppState(AppState.MY_PROFILE)} />}
        {appState === AppState.SETTINGS && <Settings onClose={() => setAppState(AppState.MY_PROFILE)} />}

        {appState === AppState.POST_MEMORY && (
          <div className="absolute inset-0 z-50 bg-zinc-950">
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

export default Home;