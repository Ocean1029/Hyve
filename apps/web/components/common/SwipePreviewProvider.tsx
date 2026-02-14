'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SWIPE } from '@/lib/swipeConstants';

/**
 * Swipe direction type
 */
type SwipeDirection = 'left' | 'right' | null;

/**
 * Initial/reset state for swipe preview
 * Used when ending swipe or when pathname changes
 */
const INITIAL_SWIPE_STATE = {
  progress: 0,
  direction: null as SwipeDirection,
  nextRoute: null as string | null,
  prevRoute: null as string | null,
  isActive: false,
  shouldComplete: false,
};

/**
 * Swipe preview state interface
 */
interface SwipePreviewState {
  // Current swipe progress (0-100)
  progress: number;
  // Swipe direction
  direction: SwipeDirection;
  // Next page route (if swiping left)
  nextRoute: string | null;
  // Previous page route (if swiping right)
  prevRoute: string | null;
  // Whether swipe is currently active
  isActive: boolean;
  // Whether to complete the animation to 100%
  shouldComplete: boolean;
}

/**
 * Swipe preview context interface
 */
interface SwipePreviewContextType {
  state: SwipePreviewState;
  // Update swipe progress
  updateProgress: (progress: number, direction: SwipeDirection) => void;
  // Start swipe gesture
  startSwipe: (direction: SwipeDirection, currentPath: string) => void;
  // End swipe gesture
  endSwipe: () => void;
  // Complete animation to 100% and navigate
  completeSwipe: () => void;
  // Get next route based on current path and direction
  getNextRoute: (currentPath: string, direction: SwipeDirection) => string | null;
  // Mark iframe as loaded for a route
  markIframeLoaded: (route: string) => void;
  // Check if iframe is already loaded for a route
  isIframeLoaded: (route: string) => boolean;
}

const SwipePreviewContext = createContext<SwipePreviewContextType | undefined>(undefined);

/**
 * Hook to get swipe preview context
 */
export const useSwipePreview = () => {
  const context = useContext(SwipePreviewContext);
  if (!context) {
    throw new Error('useSwipePreview must be used within SwipePreviewProvider');
  }
  return context;
};

/**
 * SwipePreviewProvider component
 * Manages swipe navigation state and page preloading
 */
export default function SwipePreviewProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<SwipePreviewState>(INITIAL_SWIPE_STATE);

  // Track prefetched routes to avoid duplicate prefetching
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  // Track loaded iframe routes for instant preview
  const loadedIframesRef = useRef<Map<string, boolean>>(new Map());

  /**
   * Get next route based on current path and swipe direction
   * This matches the logic in useSwipeNavigation hook
   */
  const getNextRoute = useCallback((currentPath: string, direction: SwipeDirection): string | null => {
    if (!direction) return null;

    if (direction === 'left') {
      // Swipe left: go to next page
      // Order: friends -> search -> home -> today -> profile
      if (currentPath === '/friends') {
        return '/search';
      } else if (currentPath === '/search') {
        return '/';
      } else if (currentPath === '/') {
        return '/today';
      } else if (currentPath === '/today') {
        return '/profile';
      }
    } else if (direction === 'right') {
      // Swipe right: go to previous page
      // Handle dynamic routes: friends/[id] -> friends
      // Order: profile -> today -> home -> search -> friends
      if (currentPath.startsWith('/friends/')) {
        return '/friends';
      } else if (currentPath === '/profile') {
        return '/today';
      } else if (currentPath === '/today') {
        return '/';
      } else if (currentPath === '/') {
        return '/search';
      } else if (currentPath === '/search') {
        return '/friends';
      }
    }

    return null;
  }, []);

  /**
   * Prefetch route using Next.js router
   */
  const prefetchRoute = useCallback((route: string) => {
    if (!route || prefetchedRoutesRef.current.has(route)) {
      return;
    }

    try {
      // Use Next.js router prefetch to preload the page
      router.prefetch(route);
      prefetchedRoutesRef.current.add(route);
    } catch (error) {
      console.error('Failed to prefetch route:', route, error);
    }
  }, [router]);

  /**
   * Mark iframe as loaded for a route
   */
  const markIframeLoaded = useCallback((route: string) => {
    if (route) {
      loadedIframesRef.current.set(route, true);
    }
  }, []);

  /**
   * Check if iframe is already loaded for a route
   */
  const isIframeLoaded = useCallback((route: string): boolean => {
    return loadedIframesRef.current.get(route) === true;
  }, []);

  /**
   * Start swipe gesture
   */
  const startSwipe = useCallback((direction: SwipeDirection, currentPath: string) => {
    const nextRoute = getNextRoute(currentPath, direction);
    
    setState({
      progress: 0,
      direction,
      nextRoute: direction === 'left' ? nextRoute : null,
      prevRoute: direction === 'right' ? nextRoute : null,
      isActive: true,
      shouldComplete: false,
    });

    // Prefetch the target route immediately when swipe starts
    if (nextRoute) {
      prefetchRoute(nextRoute);
    }
  }, [getNextRoute, prefetchRoute]);

  /**
   * Update swipe progress
   */
  const updateProgress = useCallback((progress: number, direction: SwipeDirection) => {
    setState(prev => {
      const updatedState = {
        ...prev,
        progress: Math.max(0, Math.min(100, progress)),
        direction: direction || prev.direction,
      };

      // Prefetch route if progress is significant and route hasn't been prefetched
      if (progress > 10) {
        const routeToPrefetch = direction === 'left' ? updatedState.nextRoute : updatedState.prevRoute;
        if (routeToPrefetch && !prefetchedRoutesRef.current.has(routeToPrefetch)) {
          prefetchRoute(routeToPrefetch);
        }
      }

      return updatedState;
    });
  }, [prefetchRoute]);

  /**
   * End swipe gesture
   */
  const endSwipe = useCallback(() => {
    setState(INITIAL_SWIPE_STATE);
  }, []);

  /**
   * Complete animation to 100% and prepare for navigation
   */
  const completeSwipe = useCallback(() => {
    setState(prev => ({
      ...prev,
      shouldComplete: true,
      progress: 100,
    }));
  }, []);

  // Preload adjacent pages when pathname changes (for faster preview)
  useEffect(() => {
    // Prefetch adjacent routes for instant preview
    const leftRoute = getNextRoute(pathname, 'left');
    const rightRoute = getNextRoute(pathname, 'right');
    
    if (leftRoute) {
      prefetchRoute(leftRoute);
    }
    if (rightRoute) {
      prefetchRoute(rightRoute);
    }

    // Reset swipe state when pathname changes (after navigation completes)
    // Use a delay to ensure the new page has rendered and animation is complete
    const resetTimer = setTimeout(() => {
      setState(INITIAL_SWIPE_STATE);
    }, SWIPE.RESET_DELAY_MS);

    return () => clearTimeout(resetTimer);
  }, [pathname, getNextRoute, prefetchRoute]);

  const value: SwipePreviewContextType = {
    state,
    updateProgress,
    startSwipe,
    endSwipe,
    completeSwipe,
    getNextRoute,
    markIframeLoaded,
    isIframeLoaded,
  };

  return (
    <SwipePreviewContext.Provider value={value}>
      {children}
    </SwipePreviewContext.Provider>
  );
}

