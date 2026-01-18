'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppState, FocusStatus, Friend, ChartDataPoint } from '@/lib/types';
import SpringRecap from '@/components/features/SpringRecap';
import FriendProfile from '@/components/friends/FriendProfile';
import Dashboard from '@/components/dashboard/Dashboard';
import PostMemory from '@/components/memory/PostMemory';
import BottomNav from '@/components/common/BottomNav';
import Searching from '@/components/search/Searching';
import Found from '@/components/search/Found';
import FocusMode from '@/components/focus/FocusMode';
import SessionSummary from '@/components/focus/SessionSummary';
import { generateIceBreaker } from '@/lib/services/geminiService';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useSensorPermission } from '@/components/sensor/SensorPermissionProvider';
import SensorPermissionBanner from '@/components/sensor/SensorPermissionBanner';
import { createMemoryWithPhoto } from '@/modules/memories/actions';
import SwipePreviewWrapper from '@/components/common/SwipePreviewWrapper';
import { formatTime } from '@/lib/utils/time';
import { useFocusPause } from '@/hooks/sessions/useFocusPause';
import { useFocusStatus } from '@/hooks/sessions/useFocusStatus';
import { useFocusSession } from '@/hooks/sessions/useFocusSession';
import { useSessionPauseSync } from '@/hooks/sessions/useSessionPauseSync';
import { useSessionStream } from '@/hooks/sessions/useSessionStream';
import { useActiveSessions } from '@/hooks/sessions/useActiveSessions';
import { useSpringBloom } from '@/hooks/useSpringBloom';

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
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [loadingIceBreaker, setLoadingIceBreaker] = useState(false);
  const [isPhoneFaceDown, setIsPhoneFaceDown] = useState(true);
  const userManuallyExitedRef = useRef(false);
  
  // Enable swipe navigation only in DASHBOARD state
  useSwipeNavigation({ 
    currentPath: '/', 
    enabled: appState === AppState.DASHBOARD 
  });

  // Device orientation sensor from global context
  const { 
    isFaceDown: sensorIsFaceDown, 
    permissionStatus, 
    sensorAvailable, 
    requestPermission,
    showBanner: showSensorBanner,
    dismissBanner: dismissSensorBanner
  } = useSensorPermission();

  // Integrate sensor data with simulation button: prioritize sensor, fallback to false (face up/PAUSED) to avoid false positives
  // When sensor is unavailable or state is unknown (null), default to false (face up) to prevent incorrect timing
  const isFaceDown = sensorAvailable && sensorIsFaceDown !== null 
    ? sensorIsFaceDown 
    : false; // Default to false (face up/PAUSED) when sensor state is unknown

  // Focus pause management
  const {
    totalPausedSeconds,
    isSessionPausedByOthers,
    setIsSessionPausedByOthers,
    startPause,
    endPause,
    resetPauseTracking,
  } = useFocusPause();

  // Focus status management
  const { focusStatus, setFocusStatus } = useFocusStatus({
    appState,
            isFaceDown,
            isSessionPausedByOthers,
    onPauseStart: startPause,
    onPauseEnd: endPause,
  });

  // Focus session management
  const {
    elapsedSeconds,
    sessionStartTime,
    sessionEndTime,
    currentFocusSessionId,
    sessionRecorded,
    isSaving,
    startSession: startFocusSession,
    endSession: endFocusSession,
    ensureSessionRecorded,
    resetSession,
    updateElapsedSeconds,
    setSessionStart,
    setSessionId,
    setSessionEndTime: setSessionEndTimeFromHook,
  } = useFocusSession({
    appState,
    focusStatus,
    userId,
    selectedFriend,
    totalPausedSeconds,
          });

  // Sync pause status with server
  useSessionPauseSync({
    appState,
    currentFocusSessionId,
    isFaceDown,
    userId,
    setIsSessionPausedByOthers,
  });

  // Listen to session stream
  useSessionStream({
    appState,
    currentFocusSessionId,
    userId,
    sessionStartTime,
    friends,
    userManuallyExitedRef,
    setCurrentFocusSessionId: setSessionId,
    setSessionStartTime: (time) => {
      if (time) {
        setSessionStart(time, 0);
          } else {
        resetSession();
          }
    },
    setElapsedSeconds: updateElapsedSeconds,
    setTotalPausedSeconds: () => resetPauseTracking(),
    setPauseStartTime: () => {}, // Handled by useFocusPause
    setSelectedFriend,
    setAppState,
    setFocusStatus,
    setSessionEndTime: setSessionEndTimeFromHook,
    setSessionRecorded: () => {}, // Handled by useFocusSession
    setIsSessionPausedByOthers,
    elapsedSeconds,
    focusStatus,
    isFaceDown,
  });

  // Check for active sessions
  useActiveSessions({
    userId,
    appState,
    sessionStartTime,
    currentFocusSessionId,
    friends,
    userManuallyExitedRef,
    focusStatus,
    totalPausedSeconds,
    setCurrentFocusSessionId: setSessionId,
    setSessionStartTime: (time) => {
      if (time) {
              const now = new Date();
        const elapsedMs = now.getTime() - time.getTime();
              const elapsedSec = Math.floor(elapsedMs / 1000);
        setSessionStart(time, Math.max(0, elapsedSec));
              } else {
        resetSession();
                }
    },
    setElapsedSeconds: updateElapsedSeconds,
    setTotalPausedSeconds: () => resetPauseTracking(),
    setPauseStartTime: () => {}, // Handled by useFocusPause
    setSelectedFriend,
    setAppState,
    setFocusStatus,
    setIsSessionPausedByOthers,
  });

  // Spring Bloom data
  const { springBloomData, springBloomLoading, resetSpringBloomData } = useSpringBloom(appState);

  // Ensure session is recorded when SessionSummary is displayed (backup mechanism)
  useEffect(() => {
    if (appState === AppState.SUMMARY && !sessionRecorded && elapsedSeconds >= 0 && sessionStartTime) {
      const timeoutId = setTimeout(ensureSessionRecorded, 100);
      return () => clearTimeout(timeoutId);
            }
  }, [appState, sessionRecorded, elapsedSeconds, sessionStartTime, ensureSessionRecorded]);

  // --- Handlers ---
  const startSearch = () => {
    router.push('/find-friends');
  };

  const startSession = () => {
    // Reset manual exit flag when user starts a new session
    userManuallyExitedRef.current = false;
    setAppState(AppState.FOCUS);
    resetPauseTracking();
    startFocusSession();
    setIceBreaker(null);
    setIsPhoneFaceDown(false);
    setFocusStatus(FocusStatus.PAUSED);
  };

  const endSession = async () => {
    const result = await endFocusSession();
    if (result?.success) {
            setAppState(AppState.SUMMARY);
        } else {
      // Still switch to SUMMARY state even if save failed
      setAppState(AppState.SUMMARY);
    }
  };

  const handleUnlockPhotoMoment = () => {
    if (!sessionEndTime) setSessionEndTimeFromHook(new Date());
    setAppState(AppState.POST_MEMORY);
  };

  const handleCreateMemory = async (photoUrl?: string | string[], eventName?: string, caption?: string, location?: string, mood?: string, happyIndex?: number) => {
      if (!currentFocusSessionId) {
        alert('Focus session not found. Please complete a focus session first.');
        setAppState(AppState.DASHBOARD);
        return;
      }

    try {
      const result = await createMemoryWithPhoto(
        currentFocusSessionId,
        photoUrl,
        eventName,
        location,
        happyIndex,
        mood
      );

      if (result.success) {
        setAppState(AppState.DASHBOARD);
        setSelectedFriend(null);
      } else {
        console.error('Failed to create memory:', result.error);
        alert(result.error || 'Failed to create memory. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create memory:', error);
      alert('An error occurred while creating the memory. Please try again.');
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

  return (
    // Main Container ensuring iPhone dimensions on Desktop
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        {/* Sensor Permission Banner - Only show on dashboard */}
        {appState === AppState.DASHBOARD && showSensorBanner && (
          <div className="absolute top-0 left-0 right-0 z-50">
            <SensorPermissionBanner
              onRequestPermission={requestPermission}
              onDismiss={dismissSensorBanner}
            />
          </div>
        )}
        
        <SwipePreviewWrapper currentPath="/">
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
        </SwipePreviewWrapper>

        {/* Bottom Navigation - Hidden during Focus, Summary, Post Memory, and Spring Bloom modes */}
        {appState !== AppState.FOCUS && 
         appState !== AppState.SUMMARY && 
         appState !== AppState.POST_MEMORY &&
         appState !== AppState.QUARTERLY_FEEDBACK && (
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
              onReturnHome={() => {
                // Mark that user manually exited, prevent auto-reentry
                userManuallyExitedRef.current = true;
                // Clear all session-related state when returning home
                setAppState(AppState.DASHBOARD);
                resetSession();
                setSelectedFriend(null);
                resetPauseTracking();
                setIsSessionPausedByOthers(false);
              }}
            />
          </div>
        )}
        
        {appState === AppState.QUARTERLY_FEEDBACK && (
          <SpringRecap 
            onClose={() => {
              setAppState(AppState.DASHBOARD);
              resetSpringBloomData();
            }} 
            data={springBloomData}
            loading={springBloomLoading}
          />
        )}
        
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
