'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import SensorPermissionOnboarding from '@/components/sensor/SensorPermissionOnboarding';

// Context type definition
interface SensorPermissionContextType {
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
  sensorAvailable: boolean;
  isFaceDown: boolean | null;
  requestPermission: () => Promise<boolean>;
  showBanner: boolean;
  dismissBanner: () => void;
}

// Create context with default values
const SensorPermissionContext = createContext<SensorPermissionContextType | null>(null);

// Hook to use sensor permission context
export function useSensorPermission() {
  const context = useContext(SensorPermissionContext);
  if (!context) {
    throw new Error('useSensorPermission must be used within SensorPermissionProvider');
  }
  return context;
}

interface SensorPermissionProviderProps {
  children: ReactNode;
}

/**
 * Global provider for managing sensor permissions across the app
 * Handles onboarding flow for first-time users and permission re-request for denied users
 */
export default function SensorPermissionProvider({ children }: SensorPermissionProviderProps) {
  const pathname = usePathname();
  const { isFaceDown, permissionStatus, sensorAvailable, requestPermission } = useDeviceOrientation();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

  // Check if user has completed onboarding or made a permission decision
  useEffect(() => {
    // Skip on login page
    if (pathname === '/login') {
      return;
    }

    // Only check once when component mounts
    if (hasCheckedPermission) {
      return;
    }

    try {
      const permissionAsked = localStorage.getItem('sensorPermissionAsked');
      const savedPermissionStatus = localStorage.getItem('sensorPermissionStatus');
      const bannerDismissed = sessionStorage.getItem('sensorBannerDismissed');

      // If permission was never asked, show onboarding
      if (!permissionAsked && permissionStatus === 'prompt') {
        setShowOnboarding(true);
        setHasCheckedPermission(true);
        return;
      }

      // If permission was denied and banner wasn't dismissed in this session, show banner
      // Only show banner on dashboard page
      if (
        pathname === '/' &&
        (permissionStatus === 'denied' || (savedPermissionStatus === 'denied' && permissionStatus === 'prompt')) &&
        !bannerDismissed
      ) {
        setShowBanner(true);
      }

      setHasCheckedPermission(true);
    } catch (error) {
      // If localStorage is not available (private mode), silently fail
      console.warn('Failed to check sensor permission status:', error);
      setHasCheckedPermission(true);
    }
  }, [pathname, permissionStatus, hasCheckedPermission]);

  // Update banner visibility when permission status changes
  useEffect(() => {
    if (!hasCheckedPermission) {
      return;
    }

    try {
      const bannerDismissed = sessionStorage.getItem('sensorBannerDismissed');

      // Show banner on dashboard if permission is denied and banner wasn't dismissed
      if (
        pathname === '/' &&
        permissionStatus === 'denied' &&
        !bannerDismissed &&
        !showOnboarding
      ) {
        setShowBanner(true);
      } else if (permissionStatus === 'granted') {
        // Hide banner if permission is granted
        setShowBanner(false);
      }
    } catch (error) {
      console.warn('Failed to update banner visibility:', error);
    }
  }, [permissionStatus, pathname, hasCheckedPermission, showOnboarding]);

  // Handle permission request with state persistence
  const handleRequestPermission = async (): Promise<boolean> => {
    const granted = await requestPermission();
    
    try {
      // Save that permission was asked
      localStorage.setItem('sensorPermissionAsked', 'true');
      localStorage.setItem('sensorPermissionStatus', granted ? 'granted' : 'denied');
      
      // If granted, hide banner
      if (granted) {
        setShowBanner(false);
      }
    } catch (error) {
      console.warn('Failed to save permission status:', error);
    }

    return granted;
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async (granted: boolean) => {
    setShowOnboarding(false);
    
    try {
      localStorage.setItem('sensorPermissionAsked', 'true');
      localStorage.setItem('sensorPermissionStatus', granted ? 'granted' : 'denied');
    } catch (error) {
      console.warn('Failed to save onboarding status:', error);
    }

    // If denied after onboarding and we're on dashboard, show banner
    if (!granted && pathname === '/') {
      setShowBanner(true);
    }
  };

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    
    try {
      // Mark as asked but don't set status to denied
      // This allows showing banner later without being too intrusive
      localStorage.setItem('sensorPermissionAsked', 'true');
      localStorage.setItem('sensorPermissionStatus', 'skipped');
    } catch (error) {
      console.warn('Failed to save skip status:', error);
    }

    // Show banner on dashboard if user skipped onboarding
    if (pathname === '/') {
      setShowBanner(true);
    }
  };

  // Handle banner dismissal
  const dismissBanner = () => {
    setShowBanner(false);
    
    try {
      // Store in session storage so it doesn't show again in current session
      sessionStorage.setItem('sensorBannerDismissed', 'true');
    } catch (error) {
      console.warn('Failed to save banner dismissal:', error);
    }
  };

  const contextValue: SensorPermissionContextType = {
    permissionStatus,
    sensorAvailable,
    isFaceDown,
    requestPermission: handleRequestPermission,
    showBanner,
    dismissBanner,
  };

  return (
    <SensorPermissionContext.Provider value={contextValue}>
      {/* Onboarding modal */}
      {showOnboarding && (
        <SensorPermissionOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          requestPermission={handleRequestPermission}
        />
      )}
      
      {children}
    </SensorPermissionContext.Provider>
  );
}

