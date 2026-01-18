import { AppState, FocusStatus, Friend } from '@/lib/types';
import { getActiveFocusSessions } from '@/modules/sessions/actions';

export interface CheckActiveSessionsParams {
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
 * Check active focus sessions and update state accordingly
 * Handles three scenarios:
 * 1. Auto-enter Focus Mode when new session detected
 * 2. Sync existing session state
 * 3. Handle session end
 */
export async function checkActiveSessions({
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
}: CheckActiveSessionsParams): Promise<void> {
  try {
    const result = await getActiveFocusSessions(userId);
    if (result.success && result.sessions && result.sessions.length > 0) {
      // User should only have one active session at a time
      const activeSession = result.sessions[0];
      
      // Check if this is the same session we're tracking
      const isSameSession = currentFocusSessionId === activeSession.id;
      
      // Only auto-enter Focus Mode if we're not already in FOCUS state
      // and we don't have a manually started session (no sessionStartTime means no manual session)
      // and user hasn't manually exited from a session
      if (appState !== AppState.FOCUS && !sessionStartTime && !userManuallyExitedRef.current) {
        // Calculate elapsed seconds from session start time
        // Note: This is initial time, actual active time will be tracked by timer
        const sessionStart = new Date(activeSession.startTime);
        const now = new Date();
        const elapsedMs = now.getTime() - sessionStart.getTime();
        const elapsedSec = Math.floor(elapsedMs / 1000);
        
        // Set up the focus session state for auto-created session
        setCurrentFocusSessionId(activeSession.id);
        setSessionStartTime(sessionStart);
        setElapsedSeconds(Math.max(0, elapsedSec));
        // Reset pause tracking when entering new session
        setTotalPausedSeconds(0);
        setPauseStartTime(null);
        
        // Find the friend from the session participants
        const otherUsers = activeSession.users.filter((u: any) => u.user.id !== userId);
        if (otherUsers.length > 0) {
          // Try to find the friend in the friends list
          const friendUserId = otherUsers[0].user.id;
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
      } else if (appState === AppState.FOCUS && isSameSession) {
        // Check if any other user has paused the session
        const otherUserPaused = activeSession.users.some(
          (u: any) => u.userId !== userId && u.isPaused
        );
        
        // Update isSessionPausedByOthers
        setIsSessionPausedByOthers(otherUserPaused);
        
        // Only update elapsed time if session is active (not paused)
        // Calculate actual active time by subtracting paused time
        if (focusStatus === FocusStatus.ACTIVE) {
          const sessionStart = new Date(activeSession.startTime);
          const now = new Date();
          const totalElapsedMs = now.getTime() - sessionStart.getTime();
          const totalElapsedSec = Math.floor(totalElapsedMs / 1000);
          // Subtract total paused time to get actual active time
          const activeElapsedSec = Math.max(0, totalElapsedSec - totalPausedSeconds);
          // Update elapsed time to sync with server only when active
          setElapsedSeconds(activeElapsedSec);
        }
        // Don't update elapsed time when paused - timer is already stopped
      }
    } else {
      // No active sessions - if we're in Focus Mode due to auto-created session, exit
      // Check if we have a currentFocusSessionId (means it was auto-created)
      if (appState === AppState.FOCUS && currentFocusSessionId) {
        // Session ended, go back to dashboard
        setAppState(AppState.DASHBOARD);
        setCurrentFocusSessionId(null);
        setElapsedSeconds(0);
        setSessionStartTime(null);
        setSelectedFriend(null);
      }
    }
  } catch (error) {
    console.error('Failed to check active sessions:', error);
  }
}
