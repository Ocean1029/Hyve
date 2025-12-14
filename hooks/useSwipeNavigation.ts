import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SwipeNavigationConfig {
  currentPath: string;
  enabled?: boolean;
}

export const useSwipeNavigation = ({ currentPath, enabled = true }: SwipeNavigationConfig) => {
  const router = useRouter();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const hasMoved = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    const minSwipeDistance = 50; // Minimum distance for swipe

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
      touchEndX.current = e.touches[0].clientX;
      isSwiping.current = true;
      hasMoved.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      touchEndX.current = e.touches[0].clientX;
      const moveDistance = Math.abs(touchStartX.current - touchEndX.current);
      // Only mark as moved if the distance is significant
      if (moveDistance > 5) {
        hasMoved.current = true;
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping.current) return;
      
      // Only trigger swipe if there was actual movement
      if (!hasMoved.current) {
        isSwiping.current = false;
        touchStartX.current = 0;
        touchEndX.current = 0;
        hasMoved.current = false;
        return;
      }
      
      const swipeDistance = touchStartX.current - touchEndX.current;
      const absSwipeDistance = Math.abs(swipeDistance);
      
      // Only trigger navigation if swipe distance exceeds minimum
      if (absSwipeDistance < minSwipeDistance) {
        isSwiping.current = false;
        touchStartX.current = 0;
        touchEndX.current = 0;
        hasMoved.current = false;
        return;
      }

      const isLeftSwipe = swipeDistance > minSwipeDistance;
      const isRightSwipe = swipeDistance < -minSwipeDistance;

      if (isLeftSwipe) {
        // Swipe left: go to next page
        // Order: friends -> search -> home -> profile
        if (currentPath === '/friends') {
          router.push('/search');
        } else if (currentPath === '/search') {
          router.push('/');
        } else if (currentPath === '/') {
          router.push('/profile');
        }
      } else if (isRightSwipe) {
        // Swipe right: go to previous page
        // Handle dynamic routes: friends/[id] -> friends
        if (currentPath.startsWith('/friends/')) {
          router.push('/friends');
        } else if (currentPath === '/profile') {
          router.push('/');
        } else if (currentPath === '/') {
          router.push('/search');
        } else if (currentPath === '/search') {
          router.push('/friends');
        }
      }

      isSwiping.current = false;
      touchStartX.current = 0;
      touchEndX.current = 0;
      hasMoved.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPath, enabled, router]);
};

