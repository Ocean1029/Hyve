/**
 * Detects device face-up/face-down using Accelerometer.
 * Face down: timer runs. Face up: timer paused.
 * Mirrors web useDeviceOrientation (DeviceMotionEvent).
 */
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const THRESHOLD = 0.5; // g-force units; expo Accelerometer returns in Gs

export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

export function useDeviceOrientation() {
  const [isFaceDown, setIsFaceDown] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const [sensorAvailable, setSensorAvailable] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Accelerometer.requestPermissionsAsync) {
        const { status } = await Accelerometer.requestPermissionsAsync();
        if (status === 'granted') {
          setPermissionStatus('granted');
          setSensorAvailable(true);
          return true;
        }
        setPermissionStatus('denied');
        return false;
      }
      setPermissionStatus('granted');
      return true;
    } catch {
      setPermissionStatus('unavailable');
      setSensorAvailable(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setupSensor = async () => {
      try {
        const available = Accelerometer.isAvailableAsync
          ? await Accelerometer.isAvailableAsync()
          : true;
        if (!available) {
          setPermissionStatus('unavailable');
          setSensorAvailable(false);
          return;
        }
        setSensorAvailable(true);
        setPermissionStatus('granted');

        Accelerometer.setUpdateInterval(200);

        subscription = Accelerometer.addListener((data) => {
          const { z } = data;
          if (z !== undefined && z !== null) {
            // z ≈ +1g face-up, z ≈ -1g face-down
            const isDown = z < -THRESHOLD;
            setIsFaceDown(isDown);
          }
        });
      } catch {
        setPermissionStatus('unavailable');
        setSensorAvailable(false);
      }
    };

    setupSensor();

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    isFaceDown,
    permissionStatus,
    sensorAvailable,
    requestPermission,
  };
}
