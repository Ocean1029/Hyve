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
        target.closest('select')
      ) {
        return;
      }

      touchStartX.current = e.touches[0].clientX;
      isSwiping.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (!isSwiping.current) return;
      
      const swipeDistance = touchStartX.current - touchEndX.current;
      const isLeftSwipe = swipeDistance > minSwipeDistance;
      const isRightSwipe = swipeDistance < -minSwipeDistance;

      if (isLeftSwipe) {
        // Swipe left: go to next page
        // Order: messages -> search -> home -> profile
        if (currentPath === '/messages') {
          router.push('/search');
        } else if (currentPath === '/search') {
          router.push('/');
        } else if (currentPath === '/') {
          router.push('/profile');
        }
      } else if (isRightSwipe) {
        // Swipe right: go to previous page
        if (currentPath === '/profile') {
          router.push('/');
        } else if (currentPath === '/') {
          router.push('/search');
        } else if (currentPath === '/search') {
          router.push('/messages');
        }
      }

      isSwiping.current = false;
      touchStartX.current = 0;
      touchEndX.current = 0;
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

