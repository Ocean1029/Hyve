/**
 * Polls for active focus sessions and auto-navigates to FocusSession when detected.
 * Mirrors web useSessionPolling / checkActiveSessions behavior.
 */
import { useEffect, useRef } from 'react';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';

const POLL_INTERVAL_MS = 3000;

interface ApiSession {
  sessionId: string;
  status: string;
  isPaused?: boolean;
  startTime: string;
  endTime: string | null;
  minutes: number;
  users?: Array<{
    userId: string;
    userName: string | null;
    userImage: string | null;
    isPaused: boolean;
  }>;
}

interface SessionPollingProps {
  navigationRef: React.RefObject<NavigationContainerRefWithCurrent<RootStackParamList> | null>;
}

export default function SessionPolling({ navigationRef }: SessionPollingProps) {
  const { apiClient, user, isAuthenticated } = useAuth();
  const userManuallyExitedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const checkActiveSessions = async () => {
      try {
        const res = await apiClient.get<{ success?: boolean; sessions?: ApiSession[] }>(
          `${API_PATHS.SESSIONS_ACTIVE}?userId=${encodeURIComponent(user.id)}`
        );
        if (!res?.success || !Array.isArray(res.sessions)) return;

        const sessions = res.sessions as ApiSession[];
        const activeSession = sessions.find((s) => s.status === 'active');
        if (!activeSession) return;

        const nav = navigationRef.current;
        if (!nav?.isReady()) return;

        const state = nav.getRootState();
        const currentRoute = state?.routes[state.index];
        const currentName = currentRoute?.name;
        if (currentName === 'FocusSession' || currentName === 'SessionSummary' || currentName === 'PostMemory') return;
        if (userManuallyExitedRef.current) return;

        nav.navigate('FocusSession', {
          sessionId: activeSession.sessionId,
          autoEntered: true,
          startTime: activeSession.startTime,
        });
      } catch {
        // Silently ignore
      }
    };

    checkActiveSessions();
    const interval = setInterval(checkActiveSessions, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [apiClient, user?.id, isAuthenticated, navigationRef]);

  return null;
}
