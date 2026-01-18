import { useEffect, useRef } from 'react';
import { AppState, FocusStatus, Friend } from '@/lib/types';
import { checkActiveSessions, CheckActiveSessionsParams } from '@/hooks/sessions/checkActiveSessions';

interface UseActiveSessionsProps {
  userId: string;
  appState: AppState;
  sessionStartTime: Date | null;
  currentFocusSessionId: string | null;
  friends: Friend[];
  userManuallyExitedRef: React.MutableRefObject<boolean>;
  focusStatus: FocusStatus;
  totalPausedSeconds: number;
  setCurrentFocusSessionId: (id: string | null) => void;
  setSessionStartTime: (time: Date | null) => void;
  setElapsedSeconds: (seconds: number) => void;
  setTotalPausedSeconds: (seconds: number) => void;
  setPauseStartTime: (time: Date | null) => void;
  setSelectedFriend: (friend: Friend | null) => void;
  setAppState: (state: AppState) => void;
  setFocusStatus: (status: FocusStatus) => void;
  setIsSessionPausedByOthers: (paused: boolean) => void;
}

/**
 * Hook to periodically check for active focus sessions
 * Auto-enters Focus Mode when active session is detected
 * Syncs session state and participant information
 */
export function useActiveSessions({
  userId,
  appState,
  sessionStartTime,
  currentFocusSessionId,
  friends,
  userManuallyExitedRef,
  focusStatus,
  totalPausedSeconds,
  setCurrentFocusSessionId,
  setSessionStartTime,
  setElapsedSeconds,
  setTotalPausedSeconds,
  setPauseStartTime,
  setSelectedFriend,
  setAppState,
  setFocusStatus,
  setIsSessionPausedByOthers,
}: UseActiveSessionsProps) {
  const activeSessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check immediately on mount
    checkActiveSessions({
      userId,
      appState,
      sessionStartTime,
      currentFocusSessionId,
      friends,
      userManuallyExitedRef,
      focusStatus,
      totalPausedSeconds,
      setCurrentFocusSessionId,
      setSessionStartTime,
      setElapsedSeconds,
      setTotalPausedSeconds,
      setPauseStartTime,
      setSelectedFriend,
      setAppState,
      setFocusStatus,
      setIsSessionPausedByOthers,
    });

    // Check every 3 seconds for active sessions (more frequent for better UX and faster detection)
    activeSessionCheckIntervalRef.current = setInterval(() => {
      checkActiveSessions({
        userId,
        appState,
        sessionStartTime,
        currentFocusSessionId,
        friends,
        userManuallyExitedRef,
        focusStatus,
        totalPausedSeconds,
        setCurrentFocusSessionId,
        setSessionStartTime,
        setElapsedSeconds,
        setTotalPausedSeconds,
        setPauseStartTime,
        setSelectedFriend,
        setAppState,
        setFocusStatus,
        setIsSessionPausedByOthers,
      });
    }, 3000);

    return () => {
      if (activeSessionCheckIntervalRef.current) {
        clearInterval(activeSessionCheckIntervalRef.current);
      }
    };
  }, [
    userId,
    appState,
    sessionStartTime,
    currentFocusSessionId,
    friends,
    userManuallyExitedRef,
    focusStatus,
    totalPausedSeconds,
    setCurrentFocusSessionId,
    setSessionStartTime,
    setElapsedSeconds,
    setTotalPausedSeconds,
    setPauseStartTime,
    setSelectedFriend,
    setAppState,
    setFocusStatus,
    setIsSessionPausedByOthers,
  ]);
}
