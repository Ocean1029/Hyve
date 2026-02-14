import { AppState, FocusStatus, Friend } from '@hyve/types';

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
  setSessionEndTime: (time: Date | null) => void;
  setSessionRecorded: (recorded: boolean) => void;
  setIsSessionPausedByOthers: (paused: boolean) => void;
}

/**
 * Session format from GET /api/sessions/active (getSessionStreamDataService)
 */
interface ApiSession {
  sessionId: string;
  status: string;
  isPaused?: boolean;
  startTime: string;
  endTime: string | null;
  minutes: number;
  users: Array<{
    userId: string;
    userName: string | null;
    userImage: string | null;
    isPaused: boolean;
  }>;
}

/**
 * Check active focus sessions and update state accordingly
 * Handles four scenarios:
 * 1. Auto-enter Focus Mode when new active session detected
 * 2. Sync existing session state (pause status, elapsed time)
 * 3. Handle session end by another user -> transition to SUMMARY
 * 4. Empty sessions (ended > 1 min ago) -> return to DASHBOARD
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
  setSessionEndTime,
  setSessionRecorded,
  setIsSessionPausedByOthers,
}: CheckActiveSessionsParams): Promise<void> {
  try {
    const response = await fetch(
      `/api/sessions/active?userId=${encodeURIComponent(userId)}`,
      { credentials: 'include' }
    );
    const result = await response.json();

    if (!result.success || !result.sessions) {
      return;
    }

    const sessions: ApiSession[] = result.sessions;

    // Find current session by sessionId (API returns sessionId, not id)
    const currentSession = sessions.find(
      (s) => s.sessionId === currentFocusSessionId
    );

    // Handle: session ended by another user -> transition to SUMMARY
    if (
      currentSession &&
      currentSession.status !== 'active' &&
      appState === AppState.FOCUS
    ) {
      const sessionMinutes = currentSession.minutes ?? 0;
      const calculatedElapsedSeconds = sessionMinutes * 60;

      const endTime = currentSession.endTime
        ? new Date(currentSession.endTime)
        : new Date();
      setSessionEndTime(endTime);

      if (sessionStartTime) {
        if (calculatedElapsedSeconds > 0) {
          setElapsedSeconds(calculatedElapsedSeconds);
        }
      } else if (currentSession.startTime) {
        setSessionStartTime(new Date(currentSession.startTime));
        if (calculatedElapsedSeconds > 0) {
          setElapsedSeconds(calculatedElapsedSeconds);
        }
      }

      setSessionRecorded(true);
      setAppState(AppState.SUMMARY);
      return;
    }

    // Find first active session for auto-enter
    const activeSession = sessions.find((s) => s.status === 'active');

    if (activeSession) {
      const sessionId = activeSession.sessionId;
      const isSameSession = currentFocusSessionId === sessionId;

      // Auto-enter Focus Mode when new active session detected
      if (
        appState !== AppState.FOCUS &&
        !sessionStartTime &&
        !userManuallyExitedRef.current
      ) {
        const sessionStart = new Date(activeSession.startTime);
        const now = new Date();
        const elapsedMs = now.getTime() - sessionStart.getTime();
        const elapsedSec = Math.floor(elapsedMs / 1000);

        setCurrentFocusSessionId(sessionId);
        setSessionStartTime(sessionStart);
        setElapsedSeconds(Math.max(0, elapsedSec));
        setTotalPausedSeconds(0);
        setPauseStartTime(null);

        // Find friend from session participants (API format: users[].userId)
        const otherUsers = activeSession.users.filter((u) => u.userId !== userId);
        if (otherUsers.length > 0) {
          const friendUserId = otherUsers[0].userId;
          const friend = friends.find((f) => f.userId === friendUserId);
          if (friend) {
            setSelectedFriend(friend);
          }
        }

        setAppState(AppState.FOCUS);
        setFocusStatus(FocusStatus.PAUSED);
      } else if (appState === AppState.FOCUS && isSameSession) {
        // Sync: check if any other user has paused
        const otherUserPaused = activeSession.users.some(
          (u) => u.userId !== userId && u.isPaused
        );
        setIsSessionPausedByOthers(otherUserPaused);

        // Update elapsed time when active (not paused)
        if (focusStatus === FocusStatus.ACTIVE) {
          const sessionStart = new Date(activeSession.startTime);
          const now = new Date();
          const totalElapsedMs = now.getTime() - sessionStart.getTime();
          const totalElapsedSec = Math.floor(totalElapsedMs / 1000);
          const activeElapsedSec = Math.max(
            0,
            totalElapsedSec - totalPausedSeconds
          );
          setElapsedSeconds(activeElapsedSec);
        }
      }
    } else {
      // No active sessions - if we were in Focus Mode (auto-created), exit to DASHBOARD
      if (appState === AppState.FOCUS && currentFocusSessionId) {
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
