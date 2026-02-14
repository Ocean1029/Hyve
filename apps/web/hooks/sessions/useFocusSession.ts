import { useState, useEffect, useRef } from 'react';
import { AppState, FocusStatus } from '@hyve/types';
import { createFocusSession } from '@/modules/sessions/actions';
import { Friend } from '@hyve/types';

interface UseFocusSessionProps {
  appState: AppState;
  focusStatus: FocusStatus;
  userId: string;
  selectedFriend: Friend | null;
  totalPausedSeconds: number;
  isFaceDown: boolean;
  setIsSessionPausedByOthers: (paused: boolean) => void;
}

/**
 * Hook to manage focus session core state and operations
 * Handles elapsed time tracking, session creation, and session recording
 */
export function useFocusSession({
  appState,
  focusStatus,
  userId,
  selectedFriend,
  totalPausedSeconds,
  isFaceDown,
  setIsSessionPausedByOthers,
}: UseFocusSessionProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [currentFocusSessionId, setCurrentFocusSessionId] = useState<string | null>(null);
  const [sessionRecorded, setSessionRecorded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Timer effect: increment elapsedSeconds when session is active
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

  // Sync pause status with server when device orientation changes
  useEffect(() => {
    if (appState === AppState.FOCUS && currentFocusSessionId) {
      const syncPauseStatus = async () => {
        try {
          const isPaused = !isFaceDown;
          const response = await fetch(
            `/api/sessions/${currentFocusSessionId}/pause`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPaused }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            if (result.users) {
              const otherUserPaused = result.users.some(
                (u: { userId: string; isPaused: boolean }) =>
                  u.userId !== userId && u.isPaused
              );
              setIsSessionPausedByOthers(otherUserPaused);
            }
          } else {
            console.error('Failed to sync pause status');
          }
        } catch (error) {
          console.error('Error syncing pause status:', error);
        }
      };

      const timeoutId = setTimeout(syncPauseStatus, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [
    isFaceDown,
    appState,
    currentFocusSessionId,
    userId,
    setIsSessionPausedByOthers,
  ]);

  /**
   * Start a new focus session
   */
  const startSession = () => {
    setElapsedSeconds(0);
    setSessionStartTime(new Date());
    setSessionEndTime(null);
    setSessionRecorded(false);
    setCurrentFocusSessionId(null);
  };

  /**
   * End the current focus session
   */
  const endSession = async () => {
    const endTime = new Date();
    setSessionEndTime(endTime);
    
    setIsSaving(true);
    try {
      // If session already exists (auto-created or previously created), end it for all participants
      if (currentFocusSessionId) {
        const response = await fetch(`/api/sessions/${currentFocusSessionId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endTime: endTime.toISOString(),
            minutes: Math.floor(elapsedSeconds / 60),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.session) {
            setSessionRecorded(true);
            console.log('Focus session ended successfully:', result.session);
            setIsSaving(false);
            return { success: true };
          }
        }
      }
      
      // If no existing session, create a new one
      // Support multiple friends in a session (friendIds can be empty array)
      // Allow 0 second sessions to be recorded
      if (elapsedSeconds >= 0 && sessionStartTime) {
        // Pass userIds: current user + friend's userId if friend is selected
        const userIds = selectedFriend && selectedFriend.userId
          ? [userId, selectedFriend.userId].sort() // Sort to ensure consistent ordering
          : [userId];
        const result = await createFocusSession(
          userIds, 
          elapsedSeconds,
          sessionStartTime,
          endTime
        );
      if (result.success && 'session' in result && result.session) {
        setSessionRecorded(true);
        setCurrentFocusSessionId(result.session.id);
        console.log('Focus session recorded successfully:', result.session);
        setIsSaving(false);
        return { success: true };
      } else {
          console.error('Failed to save focus session:', result.error);
          setIsSaving(false);
          return { success: false, error: result.error };
        }
      } else {
        if (!sessionStartTime) {
          console.warn('Session not recorded: sessionStartTime is missing');
        }
        setIsSaving(false);
        return { success: false, error: 'Session not recorded' };
      }
    } catch (error) {
      console.error('Failed to end/save focus session:', error);
      setIsSaving(false);
      return { success: false, error: 'Failed to save session' };
    }
  };

  /**
   * Ensure session is recorded (backup mechanism)
   */
  const ensureSessionRecorded = async () => {
    if (sessionRecorded || !sessionStartTime || elapsedSeconds < 0) {
      return;
    }

    setIsSaving(true);
    try {
      const userIds = selectedFriend && selectedFriend.userId
        ? [userId, selectedFriend.userId].sort()
        : [userId];
      const endTime = sessionEndTime || new Date();
      const result = await createFocusSession(
        userIds, 
        elapsedSeconds,
        sessionStartTime,
        endTime
      );
      if (result.success && 'session' in result && result.session) {
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

  /**
   * Reset session state
   */
  const resetSession = () => {
    setElapsedSeconds(0);
    setSessionStartTime(null);
    setSessionEndTime(null);
    setCurrentFocusSessionId(null);
    setSessionRecorded(false);
  };

  /**
   * Update elapsed seconds (used for syncing with server)
   */
  const updateElapsedSeconds = (seconds: number) => {
    setElapsedSeconds(seconds);
  };

  /**
   * Set session start time (used when auto-entering existing session)
   */
  const setSessionStart = (startTime: Date, initialElapsedSeconds: number = 0) => {
    setSessionStartTime(startTime);
    setElapsedSeconds(initialElapsedSeconds);
  };

  /**
   * Set current focus session ID (used when joining existing session)
   */
  const setSessionId = (sessionId: string | null) => {
    setCurrentFocusSessionId(sessionId);
  };

  return {
    elapsedSeconds,
    sessionStartTime,
    sessionEndTime,
    currentFocusSessionId,
    sessionRecorded,
    isSaving,
    startSession,
    endSession,
    ensureSessionRecorded,
    resetSession,
    updateElapsedSeconds,
    setSessionStart,
    setSessionId,
    setSessionEndTime,
    setSessionRecorded,
  };
}
