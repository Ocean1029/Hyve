import { useState, useEffect, useRef } from 'react';
import { FocusStatus, AppState } from '@hyve/types';

interface UseFocusStatusProps {
  appState: AppState;
  isFaceDown: boolean;
  isSessionPausedByOthers: boolean;
  onPauseStart: () => void;
  onPauseEnd: () => void;
}

/**
 * Hook to manage focus status (ACTIVE/PAUSED) synchronization
 * Calculates status based on device orientation and other users' pause status
 * Tracks pause time transitions
 */
export function useFocusStatus({ appState, isFaceDown, isSessionPausedByOthers, onPauseStart, onPauseEnd }: UseFocusStatusProps) {
  const [focusStatus, setFocusStatus] = useState<FocusStatus>(FocusStatus.PAUSED);
  const prevFocusStatusRef = useRef<FocusStatus>(FocusStatus.PAUSED);

  useEffect(() => {
    if (appState === AppState.FOCUS) {
      // Session is paused if:
      // 1. Current user picks up phone (isFaceDown = false), OR
      // 2. Any other user has paused the session
      // Only resume to ACTIVE when current user puts phone down AND no other users have paused
      const currentUserPaused = !isFaceDown; // Current user picked up phone
      const shouldBePaused = currentUserPaused || isSessionPausedByOthers;
      const newStatus = shouldBePaused ? FocusStatus.PAUSED : FocusStatus.ACTIVE;
      
      // Track pause time: when transitioning to PAUSED, record start time
      // When transitioning to ACTIVE, calculate and add to total paused time
      const prevStatus = prevFocusStatusRef.current;
      if (newStatus === FocusStatus.PAUSED && prevStatus === FocusStatus.ACTIVE) {
        // Just paused - record pause start time
        onPauseStart();
      } else if (newStatus === FocusStatus.ACTIVE && prevStatus === FocusStatus.PAUSED) {
        // Just resumed - calculate paused duration and add to total
        onPauseEnd();
      }
      
      // Only update if status actually changed to avoid unnecessary re-renders
      // Use ref to get current focusStatus to avoid dependency issues
      setFocusStatus((currentStatus) => {
        if (newStatus !== currentStatus) {
          console.log('Updating focusStatus:', {
            isFaceDown,
            currentUserPaused,
            isSessionPausedByOthers,
            shouldBePaused,
            newStatus,
            currentStatus: currentStatus,
            prevStatus: prevStatus
          });
          prevFocusStatusRef.current = newStatus;
          return newStatus;
        }
        return currentStatus;
      });
    }
  }, [isFaceDown, appState, isSessionPausedByOthers, onPauseStart, onPauseEnd]);

  return {
    focusStatus,
    setFocusStatus,
  };
}
