/**
 * Periodically updates user location when app is in foreground.
 * Requires location permission. Runs only when authenticated.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { updateLocation } from '../utils/location';

const LOCATION_INTERVAL_MS = 60000; // 1 minute

export default function LocationTracker() {
  const { token, isAuthenticated } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const sendLocation = () => {
      updateLocation(token).catch(() => {
        // Silently ignore location errors
      });
    };

    sendLocation();
    intervalRef.current = setInterval(sendLocation, LOCATION_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        sendLocation();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [token, isAuthenticated]);

  return null;
}
