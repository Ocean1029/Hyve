'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect device orientation (face up/face down) using Device Motion API
 * Handles permission requests for iOS 13+ and provides fallback for unsupported browsers
 */
export function useDeviceOrientation() {
  const [isFaceDown, setIsFaceDown] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt');
  const [sensorAvailable, setSensorAvailable] = useState(false);

  // Request permission for device motion (required on iOS 13+)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Check if DeviceMotionEvent is available
    if (typeof DeviceMotionEvent === 'undefined') {
      setPermissionStatus('unavailable');
      return false;
    }

    // Check if permission request is needed (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        setPermissionStatus(permission);
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting device motion permission:', error);
        setPermissionStatus('denied');
        return false;
      }
    }

    // Permission not required (Android Chrome, desktop browsers)
    setPermissionStatus('granted');
    return true;
  }, []);

  // Detect device orientation from acceleration data
  useEffect(() => {
    // Only proceed if permission is granted or not required
    if (permissionStatus !== 'granted' && permissionStatus !== 'prompt') {
      return;
    }

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      
      if (acceleration && acceleration.z !== null) {
        // z-axis acceleration:
        // - Positive (~+9.81 m/s²) when face down
        // - Negative (~-9.81 m/s²) when face up
        // Use threshold to avoid false positives from small movements
        const threshold = 5; // m/s²
        const isDown = acceleration.z > threshold;
        
        setIsFaceDown(isDown);
        setSensorAvailable(true);
      }
    };

    // Check if permission is required
    if (typeof DeviceMotionEvent !== 'undefined') {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        // iOS 13+: Permission required, wait for user to grant it
        // The event listener will be added after permission is granted
        if (permissionStatus === 'granted') {
          window.addEventListener('devicemotion', handleDeviceMotion);
        }
      } else {
        // Android Chrome or other browsers: No permission needed
        window.addEventListener('devicemotion', handleDeviceMotion);
        setSensorAvailable(true);
        setPermissionStatus('granted');
      }
    } else {
      // DeviceMotionEvent not supported
      setPermissionStatus('unavailable');
      setSensorAvailable(false);
    }

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [permissionStatus]);

  return {
    isFaceDown,
    permissionStatus,
    sensorAvailable,
    requestPermission,
  };
}

