import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSwipePreview } from '@/components/common/SwipePreviewProvider';
import { SWIPE } from '@/lib/swipeConstants';
import { isInHorizontalScrollArea, shouldIgnoreTouchTarget } from '@/lib/swipeUtils';

interface SwipeNavigationConfig {
  currentPath: string;
  enabled?: boolean;
}

export const useSwipeNavigation = ({ currentPath, enabled = true }: SwipeNavigationConfig) => {
  const router = useRouter();
  const { startSwipe, updateProgress, endSwipe, completeSwipe, getNextRoute } = useSwipePreview();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const hasMoved = useRef<boolean>(false);
  const swipeDirection = useRef<'left' | 'right' | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const minSwipeDistance = SWIPE.MIN_SWIPE_DISTANCE;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : SWIPE.DEFAULT_SCREEN_WIDTH;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (shouldIgnoreTouchTarget(target)) return;
      if (isInHorizontalScrollArea(target)) return;

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchEndX.current = e.touches[0].clientX;
      isSwiping.current = true;
      hasMoved.current = false;
      swipeDirection.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;

      const target = e.target as HTMLElement;
      if (isInHorizontalScrollArea(target)) {
        isSwiping.current = false;
        endSwipe();
        return;
      }
      
      touchEndX.current = e.touches[0].clientX;
      const moveDistance = Math.abs(touchStartX.current - touchEndX.current);
      
      // Determine swipe direction
      const swipeDistance = touchStartX.current - touchEndX.current;
      const direction = swipeDistance > 0 ? 'left' : 'right';
      
      // Prevent default scrolling during horizontal swipe
      // Only call preventDefault when event is cancelable - Chrome marks touchmove as
      // non-cancelable once it has started scroll optimization, and calling it anyway
      // triggers "[Intervention] Ignored attempt to cancel a touchmove event" warning
      const deltaX = Math.abs(swipeDistance);
      const deltaY = Math.abs(touchStartY.current - e.touches[0].clientY);

      if (deltaX > deltaY && deltaX > 10 && e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Only mark as moved if the distance is significant
      if (moveDistance > 5) {
        hasMoved.current = true;
        
        // Update direction if it changed
        if (swipeDirection.current !== direction) {
          swipeDirection.current = direction;
          startSwipe(direction, currentPath);
        }
        
        // Calculate progress (0-100)
        // Allow user to swipe up to 100% of screen width for full preview
        const progressThreshold = screenWidth * SWIPE.PROGRESS_THRESHOLD;
        const progress = Math.min(100, (moveDistance / progressThreshold) * 100);
        
        // Cancel previous animation frame if exists
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Update progress using requestAnimationFrame for smooth updates
        animationFrameRef.current = requestAnimationFrame(() => {
          updateProgress(progress, direction);
        });
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping.current) return;
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Only trigger swipe if there was actual movement
      if (!hasMoved.current) {
        endSwipe();
        isSwiping.current = false;
        touchStartX.current = 0;
        touchStartY.current = 0;
        touchEndX.current = 0;
        hasMoved.current = false;
        swipeDirection.current = null;
        return;
      }
      
      const swipeDistance = touchStartX.current - touchEndX.current;
      const absSwipeDistance = Math.abs(swipeDistance);
      
      // Only trigger navigation if swipe distance exceeds minimum
      if (absSwipeDistance < minSwipeDistance) {
        // Swipe was too small, end preview and reset
        endSwipe();
        isSwiping.current = false;
        touchStartX.current = 0;
        touchStartY.current = 0;
        touchEndX.current = 0;
        hasMoved.current = false;
        swipeDirection.current = null;
        return;
      }

      const isLeftSwipe = swipeDistance > minSwipeDistance;
      const isRightSwipe = swipeDistance < -minSwipeDistance;

      // If swipe distance exceeds threshold, complete animation instead of immediate navigation
      if (isLeftSwipe || isRightSwipe) {
        // Trigger completion animation to 100%
        completeSwipe();

        // Use single source of truth for route calculation from context
        const direction = isLeftSwipe ? 'left' : 'right';
        const targetRoute = getNextRoute(currentPath, direction);

        // Navigate after animation completes (300ms for smooth transition)
        // Don't call endSwipe here - let the pathname change effect handle it
        if (targetRoute) {
          setTimeout(() => {
            router.push(targetRoute);
          }, SWIPE.ANIMATION_DURATION_MS);
        }
      } else {
        // Swipe was too small, end preview and reset
        endSwipe();
      }

      isSwiping.current = false;
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchEndX.current = 0;
      hasMoved.current = false;
      swipeDirection.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      // End swipe preview on cleanup
      endSwipe();
    };
  }, [currentPath, enabled, router, startSwipe, updateProgress, endSwipe, completeSwipe, getNextRoute]);
};

