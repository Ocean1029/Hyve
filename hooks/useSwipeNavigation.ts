import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSwipePreview } from '@/components/SwipePreviewProvider';

interface SwipeNavigationConfig {
  currentPath: string;
  enabled?: boolean;
}

export const useSwipeNavigation = ({ currentPath, enabled = true }: SwipeNavigationConfig) => {
  const router = useRouter();
  const { startSwipe, updateProgress, endSwipe, completeSwipe } = useSwipePreview();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const hasMoved = useRef<boolean>(false);
  const swipeDirection = useRef<'left' | 'right' | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const minSwipeDistance = 50; // Minimum distance for swipe
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 414;

    const handleTouchStart = (e: TouchEvent) => {
      // Ignore touch events on input, textarea, button, and select elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'SELECT' ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('button') ||
        target.closest('select') ||
        target.closest('img') || // Ignore touch on images (avatars)
        target.closest('a') // Ignore touch on links
      ) {
        return;
      }

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchEndX.current = e.touches[0].clientX;
      isSwiping.current = true;
      hasMoved.current = false;
      swipeDirection.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      
      touchEndX.current = e.touches[0].clientX;
      const moveDistance = Math.abs(touchStartX.current - touchEndX.current);
      
      // Determine swipe direction
      const swipeDistance = touchStartX.current - touchEndX.current;
      const direction = swipeDistance > 0 ? 'left' : 'right';
      
      // Prevent default scrolling during horizontal swipe
      const deltaX = Math.abs(swipeDistance);
      const deltaY = Math.abs(touchStartY.current - e.touches[0].clientY);
      
      // Only proceed if horizontal movement is greater than vertical
      if (deltaX > deltaY && deltaX > 10) {
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
        // Use a threshold (e.g., 80% of screen width) to reach 100% progress
        const progressThreshold = screenWidth * 0.8; // 80% of screen width = 100% progress
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
        
        // Determine target route
        let targetRoute: string | null = null;
        if (isLeftSwipe) {
          // Swipe left: go to next page
          // Order: friends -> search -> home -> today -> profile
          if (currentPath === '/friends') {
            targetRoute = '/search';
          } else if (currentPath === '/search') {
            targetRoute = '/';
          } else if (currentPath === '/') {
            targetRoute = '/today';
          } else if (currentPath === '/today') {
            targetRoute = '/profile';
          }
        } else if (isRightSwipe) {
          // Swipe right: go to previous page
          // Handle dynamic routes: friends/[id] -> friends
          // Order: profile -> today -> home -> search -> friends
          if (currentPath.startsWith('/friends/')) {
            targetRoute = '/friends';
          } else if (currentPath === '/profile') {
            targetRoute = '/today';
          } else if (currentPath === '/today') {
            targetRoute = '/';
          } else if (currentPath === '/') {
            targetRoute = '/search';
          } else if (currentPath === '/search') {
            targetRoute = '/friends';
          }
        }
        
        // Navigate after animation completes (300ms for smooth transition)
        // Don't call endSwipe here - let the pathname change effect handle it
        if (targetRoute) {
          setTimeout(() => {
            router.push(targetRoute!);
            // Don't call endSwipe immediately - let pathname change handle cleanup
          }, 300); // Match the transition duration
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
  }, [currentPath, enabled, router, startSwipe, updateProgress, endSwipe, completeSwipe]);
};

