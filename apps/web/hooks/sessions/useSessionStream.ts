import { useEffect } from 'react';
import { AppState, FocusStatus, Friend } from '@hyve/types';

interface UseSessionStreamProps {
  appState: AppState;
  currentFocusSessionId: string | null;
  userId: string;
  sessionStartTime: Date | null;
  friends: Friend[];
  userManuallyExitedRef: React.MutableRefObject<boolean>;
  setCurrentFocusSessionId: (id: string | null) => void;
  setSessionStartTime: (time: Date | null) => void;
  setElapsedSeconds: (seconds: number) => void;
  setTotalPausedSeconds: (seconds: number) => void;
  setPauseStartTime: (time: Date | null) => void;
  setSelectedFriend: (friend: Friend | null) => void;
  setAppState: (state: AppState) => void;
  setFocusStatus: (status: FocusStatus) => void;
  setSessionEndTime: (time: Date | null) => void;
  setSessionRecorded: (recorded: boolean) => void;
  setIsSessionPausedByOthers: (paused: boolean) => void;
  elapsedSeconds: number;
  focusStatus: FocusStatus;
  isFaceDown: boolean;
}

/**
 * Hook to listen to session stream EventSource
 * Handles real-time session status updates, auto-entering Focus Mode, and session end events
 */
export function useSessionStream({
  appState,
  currentFocusSessionId,
  userId,
  sessionStartTime,
  friends,
  userManuallyExitedRef,
  setCurrentFocusSessionId,
  setSessionStartTime,
  setElapsedSeconds,
  setTotalPausedSeconds,
  setPauseStartTime,
  setSelectedFriend,
  setAppState,
  setFocusStatus,
  setSessionEndTime,
  setSessionRecorded,
  setIsSessionPausedByOthers,
  elapsedSeconds,
  focusStatus,
  isFaceDown,
}: UseSessionStreamProps) {
  useEffect(() => {
    // Only skip if we're in a state that doesn't need session updates
    if (appState === AppState.SUMMARY || appState === AppState.POST_MEMORY || appState === AppState.QUARTERLY_FEEDBACK) {
      return;
    }

    const eventSource = new EventSource('/api/sessions/stream');
    let isCleaningUp = false;

    eventSource.onmessage = (event) => {
      try {
        // Skip empty or invalid messages
        if (!event.data || event.data.trim() === '') {
          return;
        }
        
        const data = JSON.parse(event.data);
        
        if (data.type === 'session_status' && data.sessions) {
          // Check if there's a new active session that we're not tracking yet
          if (!currentFocusSessionId && data.sessions.length > 0) {
            // Find the first active session
            const newActiveSession = data.sessions.find(
              (s: any) => s.status === 'active'
            );
            
            if (newActiveSession && appState !== AppState.FOCUS && !sessionStartTime && !userManuallyExitedRef.current) {
              // New session detected, auto-enter Focus Mode
              console.log('New active session detected from stream:', newActiveSession);
              
              // Calculate elapsed seconds from session start time
              // Note: This is initial time, actual active time will be tracked by timer
              const sessionStart = new Date(newActiveSession.startTime);
              const now = new Date();
              const elapsedMs = now.getTime() - sessionStart.getTime();
              const elapsedSec = Math.floor(elapsedMs / 1000);
              
              // Set up the focus session state
              setCurrentFocusSessionId(newActiveSession.sessionId);
              setSessionStartTime(sessionStart);
              setElapsedSeconds(Math.max(0, elapsedSec));
              // Reset pause tracking when entering new session
              setTotalPausedSeconds(0);
              setPauseStartTime(null);
              
              // Find the friend from the session participants
              const otherUsers = newActiveSession.users.filter(
                (u: any) => u.userId !== userId
              );
              if (otherUsers.length > 0) {
                // Try to find the friend in the friends list
                const friendUserId = otherUsers[0].userId;
                const friend = friends.find(f => f.userId === friendUserId);
                if (friend) {
                  setSelectedFriend(friend);
                }
              }
              
              // Enter Focus Mode
              // Set initial focusStatus based on actual isFaceDown state
              // If sensor is not ready or phone is face up, start as PAUSED
              setAppState(AppState.FOCUS);
              // Default to PAUSED, let the useEffect handle the actual state based on isFaceDown
              setFocusStatus(FocusStatus.PAUSED);
              return;
            }
          }
          
          // Find the current session
          const currentSession = data.sessions.find(
            (s: any) => s.sessionId === currentFocusSessionId
          );
          
          if (currentSession) {
            // Check if session was ended by another user
            if (currentSession.status !== 'active') {
              // Session ended by another user, update state with session information from stream
              console.log('Session ended by another user:', currentSession);
              
              // Calculate elapsed seconds from session minutes
              const sessionMinutes = currentSession.minutes || 0;
              const calculatedElapsedSeconds = sessionMinutes * 60;
              
              // Update state with session end information
              if (sessionStartTime) {
                // Use session endTime if available, otherwise use current time
                const endTime = currentSession.endTime 
                  ? new Date(currentSession.endTime) 
                  : new Date();
                setSessionEndTime(endTime);
                
                // Use calculated elapsed seconds if available, otherwise keep current
                if (calculatedElapsedSeconds > 0) {
                  setElapsedSeconds(calculatedElapsedSeconds);
                }
              } else {
                // If no sessionStartTime, set it from session startTime
                if (currentSession.startTime) {
                  setSessionStartTime(new Date(currentSession.startTime));
                }
                const endTime = currentSession.endTime 
                  ? new Date(currentSession.endTime) 
                  : new Date();
                setSessionEndTime(endTime);
                if (calculatedElapsedSeconds > 0) {
                  setElapsedSeconds(calculatedElapsedSeconds);
                }
              }
              
              setSessionRecorded(true);
              console.log('Entering SUMMARY state with session info:', {
                elapsedSeconds: calculatedElapsedSeconds || elapsedSeconds,
                endTime: currentSession.endTime,
                minutes: sessionMinutes
              });
              setAppState(AppState.SUMMARY);
              return;
            }
            
            // Check if any other user has paused the session
            // Find if any user other than current user has paused
            const otherUserPaused = currentSession.users.some(
              (u: any) => u.userId !== userId && u.isPaused
            );
            
            console.log('Stream update - otherUserPaused:', otherUserPaused, 'Current isFaceDown:', isFaceDown, 'Current focusStatus:', focusStatus);
            // Update isSessionPausedByOthers state
            // Don't immediately update focusStatus here - let the main useEffect handle it
            // This avoids race conditions with isFaceDown state
            setIsSessionPausedByOthers(otherUserPaused);
          }
        }
      } catch (error) {
        console.error('Error parsing session stream message:', error);
      }
    };

    eventSource.onerror = (error) => {
      // EventSource fires 'error' when closed - skip logging during intentional cleanup
      if (isCleaningUp) return;
      console.error('Session stream error:', error);
      eventSource.close();
    };

    return () => {
      isCleaningUp = true;
      eventSource.close();
    };
  }, [
    appState,
    currentFocusSessionId,
    userId,
    sessionStartTime,
    friends,
    userManuallyExitedRef,
    setCurrentFocusSessionId,
    setSessionStartTime,
    setElapsedSeconds,
    setTotalPausedSeconds,
    setPauseStartTime,
    setSelectedFriend,
    setAppState,
    setFocusStatus,
    setSessionEndTime,
    setSessionRecorded,
    setIsSessionPausedByOthers,
    elapsedSeconds,
    focusStatus,
    isFaceDown,
  ]);
}
