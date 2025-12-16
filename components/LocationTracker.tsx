// components/LocationTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { updateUserLocation } from '@/modules/locations/actions';

/**
 * Global location tracker that updates user's location in the background
 * Runs on every page to maintain location tracking (except login page)
 * Updates location every 5 minutes
 */
export default function LocationTracker() {
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const hasPermissionRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    isMountedRef.current = true;

    // Skip location tracking on login page to avoid requesting GPS permission
    if (pathname === '/login') {
      return;
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      return;
    }

    // Function to update location
    const updateLocation = async () => {
      if (!isMountedRef.current) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isMountedRef.current) return;

          const { latitude, longitude } = position.coords;
          
          try {
            await updateUserLocation(latitude, longitude);
            hasPermissionRef.current = true;
          } catch (error) {
            // Silently fail to avoid console spam
            console.error('Failed to update location:', error);
          }
        },
        (error) => {
          // Handle permission denied or other errors silently
          // Only log if it's the first attempt
          if (!hasPermissionRef.current) {
            console.warn('Location permission not granted:', error.message);
          }
          hasPermissionRef.current = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000, // Accept cached position up to 5 minutes old
        }
      );
    };

    // Update location immediately on mount
    updateLocation();

    // Set up location update interval (every 5 minutes)
    locationIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && hasPermissionRef.current) {
        updateLocation();
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [pathname]);

  // This component doesn't render anything
  return null;
}

