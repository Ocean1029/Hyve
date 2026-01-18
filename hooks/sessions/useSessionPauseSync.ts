import { useEffect } from 'react';
import { AppState } from '@/lib/types';

interface UseSessionPauseSyncProps {
  appState: AppState;
  currentFocusSessionId: string | null;
  isFaceDown: boolean;
  userId: string;
  setIsSessionPausedByOthers: (paused: boolean) => void;
}

/**
 * Hook to sync pause status with server
 * Sends pause status updates when device orientation changes
 */
export function useSessionPauseSync({
  appState,
  currentFocusSessionId,
  isFaceDown,
  userId,
  setIsSessionPausedByOthers,
}: UseSessionPauseSyncProps) {
  useEffect(() => {
    if (appState === AppState.FOCUS && currentFocusSessionId) {
      const syncPauseStatus = async () => {
        try {
          // isFaceDown = false means phone is picked up (paused)
          // isFaceDown = true means phone is put down (active)
          const isPaused = !isFaceDown;
          
          const response = await fetch(`/api/sessions/${currentFocusSessionId}/pause`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isPaused }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Pause status sync response:', result);
            // Update isSessionPausedByOthers based on server response
            // Check if any other user has paused
            if (result.users) {
              const otherUserPaused = result.users.some(
                (u: any) => u.userId !== userId && u.isPaused
              );
              console.log('Other user paused:', otherUserPaused, 'Current isFaceDown:', isFaceDown);
              // Update isSessionPausedByOthers state
              // Don't immediately update focusStatus here - let the main useEffect handle it
              // This avoids race conditions with isFaceDown state
              setIsSessionPausedByOthers(otherUserPaused);
            }
          } else {
            console.error('Failed to sync pause status');
          }
        } catch (error) {
          console.error('Error syncing pause status:', error);
        }
      };

      // Debounce to avoid too many API calls
      const timeoutId = setTimeout(syncPauseStatus, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isFaceDown, appState, currentFocusSessionId, userId, setIsSessionPausedByOthers]);
}
