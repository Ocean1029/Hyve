/**
 * Sends presence heartbeat to backend periodically when user is authenticated.
 * Keeps user's online status up to date for friends.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';

const HEARTBEAT_INTERVAL_MS = 30000;

export default function PresenceHeartbeat() {
  const { apiClient, isAuthenticated } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const sendHeartbeat = () => {
      apiClient.post(API_PATHS.PRESENCE_HEARTBEAT).catch(() => {
        // Silently ignore heartbeat errors
      });
    };

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        sendHeartbeat();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [apiClient, isAuthenticated]);

  return null;
}
