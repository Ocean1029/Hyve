'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppState, FocusStatus, Friend, ChartDataPoint } from '@/lib/types';
import SpringRecap from '@/components/SpringRecap';
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
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { createFocusSession } from '@/modules/sessions/actions';
import { createMemoryWithPhoto } from '@/modules/memories/actions';

interface DashboardClientProps {
  friends: Friend[];
  chartData: ChartDataPoint[];
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ friends, chartData, userId, user }) => {
  const router = useRouter();
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
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [loadingIceBreaker, setLoadingIceBreaker] = useState(false);
  const [isPhoneFaceDown, setIsPhoneFaceDown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionRecorded, setSessionRecorded] = useState(false);
  const [currentFocusSessionId, setCurrentFocusSessionId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // Device orientation sensor hook
  const { 
    isFaceDown: sensorIsFaceDown, 
    permissionStatus, 
    sensorAvailable, 
    requestPermission 
  } = useDeviceOrientation();

  // Integrate sensor data with simulation button: prioritize sensor, fallback to simulation
  const isFaceDown = sensorAvailable && sensorIsFaceDown !== null 
    ? sensorIsFaceDown 
    : isPhoneFaceDown;

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

  // Update focusStatus based on device orientation (sensor or simulation)
  useEffect(() => {
    if (appState === AppState.FOCUS) {
      setFocusStatus(isFaceDown ? FocusStatus.ACTIVE : FocusStatus.PAUSED);
    }
  }, [isFaceDown, appState]);

  // --- Handlers ---
  const startSearch = () => {
    router.push('/find-friends');
  };

  const startSession = () => {
    setAppState(AppState.FOCUS);
    setElapsedSeconds(0);
    setSessionStartTime(new Date()); // Record actual start time
    setSessionEndTime(null);
    setIceBreaker(null);
    setIsPhoneFaceDown(false);
    setSessionRecorded(false); // Reset session recorded flag when starting new session
    setCurrentFocusSessionId(null); // Reset focus session ID when starting new session
  };

  const endSession = async () => {
    const endTime = new Date();
    setSessionEndTime(endTime);
    
    // Save focus session to database
    // Support multiple friends in a session (friendIds can be empty array)
    // Allow 0 second sessions to be recorded
    if (elapsedSeconds >= 0 && sessionStartTime) {
      setIsSaving(true);
      try {
        // Pass friendIds as an array (empty if no friend selected)
        const friendIds = selectedFriend ? [selectedFriend.id] : [];
        const result = await createFocusSession(
          userId, 
          friendIds, 
          elapsedSeconds,
          sessionStartTime,
          endTime
        );
        if (result.success) {
          setSessionRecorded(true);
          setCurrentFocusSessionId(result.session.id);
          console.log('Focus session recorded successfully:', result.session);
        } else {
          console.error('Failed to save focus session:', result.error);
        }
      } catch (error) {
        console.error('Failed to save focus session:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      if (!sessionStartTime) {
        console.warn('Session not recorded: sessionStartTime is missing');
      }
    }
    
    // Only switch to SUMMARY state after attempting to save
    setAppState(AppState.SUMMARY);
  };

  // Ensure session is recorded when SessionSummary is displayed (backup mechanism)
  // Allow 0 second sessions to be recorded
  useEffect(() => {
    if (appState === AppState.SUMMARY && !sessionRecorded && elapsedSeconds >= 0 && sessionStartTime) {
      const ensureSessionRecorded = async () => {
        setIsSaving(true);
        try {
          // Pass friendIds as an array (empty if no friend selected)
          const friendIds = selectedFriend ? [selectedFriend.id] : [];
          const endTime = sessionEndTime || new Date();
          const result = await createFocusSession(
            userId, 
            friendIds, 
            elapsedSeconds,
            sessionStartTime,
            endTime
          );
          if (result.success) {
            setSessionRecorded(true);
            setCurrentFocusSessionId(result.session.id);
            console.log('Focus session recorded successfully (backup):', result.session);
          } else {
            console.error('Failed to save focus session (backup):', result.error);
          }
        } catch (error) {
          console.error('Failed to save focus session (backup):', error);
        } finally {
          setIsSaving(false);
        }
      };
      // Small delay to ensure endSession has completed
      const timeoutId = setTimeout(ensureSessionRecorded, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [appState, sessionRecorded, selectedFriend, elapsedSeconds, userId, sessionStartTime, sessionEndTime]);

  const handleUnlockPhotoMoment = () => {
    if (!sessionEndTime) setSessionEndTime(new Date()); // Fallback if missing
    setAppState(AppState.POST_MEMORY);
  };

  const handleCreateMemory = async (photoUrl?: string, eventName?: string, caption?: string, location?: string, mood?: string, happyIndex?: number) => {
    setIsSaving(true);
    try {
      // Check if focus session ID exists
      if (!currentFocusSessionId) {
        alert('Focus session not found. Please complete a focus session first.');
        setAppState(AppState.DASHBOARD);
        return;
      }

      // Create memory with photo
      // eventName is stored as content, caption is for additional description
      const result = await createMemoryWithPhoto(
        currentFocusSessionId,
        photoUrl,
        eventName, // eventName goes to content field
        location,
        happyIndex
      );

      if (result.success) {
        setAppState(AppState.DASHBOARD);
        // Reset selected friend after creating memory
        setSelectedFriend(null);
      } else {
        console.error('Failed to create memory:', result.error);
        alert(result.error || 'Failed to create memory. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create memory:', error);
      alert('An error occurred while creating the memory. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">

        {/* Dashboard Content */}
        <div className="w-full h-full">
            <Dashboard
              friends={friends}
              chartData={chartData}
              user={user}
              onOpenHappyIndex={() => router.push('/happy-index')}
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
            sensorAvailable={sensorAvailable}
            permissionStatus={permissionStatus}
            onRequestPermission={requestPermission}
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
              friend={selectedFriend}
              onBack={() => setAppState(AppState.SUMMARY)}
              onPost={handleCreateMemory}
              isSaving={isSaving}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardClient;

