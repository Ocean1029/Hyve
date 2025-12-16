'use client';

import React, { useEffect, useRef } from 'react';
import { useSwipePreview } from './SwipePreviewProvider';
import { useRouter } from 'next/navigation';
import PagePreview from './PagePreview';

interface SwipePreviewWrapperProps {
  children: React.ReactNode;
  currentPath: string;
}

/**
 * SwipePreviewWrapper component
 * Wraps page content and provides visual feedback during swipe gestures
 * Implements iOS-style page transition with preview of next/previous page
 */
export default function SwipePreviewWrapper({ children, currentPath }: SwipePreviewWrapperProps) {
  const { state } = useSwipePreview();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Calculate transform values based on swipe progress
  useEffect(() => {
    // Don't reset if we're completing the animation
    if (!state.isActive && !state.shouldComplete && state.progress === 0) {
      // Reset transforms when not swiping and not completing
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = '';
        wrapperRef.current.style.opacity = '';
        wrapperRef.current.style.transition = '';
      }
      if (previewRef.current) {
        previewRef.current.style.transform = '';
        previewRef.current.style.opacity = '';
        previewRef.current.style.transition = '';
      }
      return;
    }

    const updateTransforms = () => {
      if (!wrapperRef.current || !previewRef.current) return;

      const progress = state.progress / 100;
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 414;

      // If shouldComplete is true, use smooth transition to complete the animation
      if (state.shouldComplete) {
        // Enable smooth transition for completion
        wrapperRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out';
        previewRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out';
        
        // Animate to 100% - use double requestAnimationFrame to ensure current transform is applied first
        // This ensures the browser has applied the current transform before we change it
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!wrapperRef.current || !previewRef.current) return;
            
            const finalProgress = 1;
            if (state.direction === 'left') {
              const translateX = -finalProgress * screenWidth;
              const scale = 1 - finalProgress * 0.1;
              const opacity = Math.max(0.3, 1 - finalProgress * 0.7);
              wrapperRef.current.style.transform = `translateX(${translateX}px) scale(${scale})`;
              wrapperRef.current.style.opacity = `${opacity}`;

              const previewTranslateX = screenWidth * (1 - finalProgress);
              previewRef.current.style.transform = `translateX(${previewTranslateX}px)`;
              previewRef.current.style.opacity = `${Math.min(1, 0.3 + finalProgress * 0.7)}`;
            } else if (state.direction === 'right') {
              const translateX = finalProgress * screenWidth;
              const scale = 1 - finalProgress * 0.1;
              const opacity = Math.max(0.3, 1 - finalProgress * 0.7);
              wrapperRef.current.style.transform = `translateX(${translateX}px) scale(${scale})`;
              wrapperRef.current.style.opacity = `${opacity}`;

              const previewTranslateX = -screenWidth * (1 - finalProgress);
              previewRef.current.style.transform = `translateX(${previewTranslateX}px)`;
              previewRef.current.style.opacity = `${Math.min(1, 0.3 + finalProgress * 0.7)}`;
            }
          });
        });
        return;
      }

      // Normal swipe animation (no transition, direct transform)
      wrapperRef.current.style.transition = 'none';
      previewRef.current.style.transition = 'none';

      if (state.direction === 'left') {
        // Swipe left: current page moves left, next page comes from right
        // At 100% progress, current page should move 100% of screen width
        const translateX = -progress * screenWidth;
        const scale = 1 - progress * 0.1; // Scale down up to 10% max
        const opacity = Math.max(0.3, 1 - progress * 0.7); // Fade out but keep some visibility

        wrapperRef.current.style.transform = `translateX(${translateX}px) scale(${scale})`;
        wrapperRef.current.style.opacity = `${opacity}`;

        // Next page preview comes from right
        // At 0% progress: preview is at screenWidth (completely off-screen right)
        // At 100% progress: preview is at 0 (fully visible)
        const previewTranslateX = screenWidth * (1 - progress);
        previewRef.current.style.transform = `translateX(${previewTranslateX}px)`;
        previewRef.current.style.opacity = `${Math.min(1, 0.3 + progress * 0.7)}`; // Fade in from 30% to 100%
      } else if (state.direction === 'right') {
        // Swipe right: current page moves right, previous page comes from left
        // At 100% progress, current page should move 100% of screen width
        const translateX = progress * screenWidth;
        const scale = 1 - progress * 0.1;
        const opacity = Math.max(0.3, 1 - progress * 0.7);

        wrapperRef.current.style.transform = `translateX(${translateX}px) scale(${scale})`;
        wrapperRef.current.style.opacity = `${opacity}`;

        // Previous page preview comes from left
        // At 0% progress: preview is at -screenWidth (completely off-screen left)
        // At 100% progress: preview is at 0 (fully visible)
        const previewTranslateX = -screenWidth * (1 - progress);
        previewRef.current.style.transform = `translateX(${previewTranslateX}px)`;
        previewRef.current.style.opacity = `${Math.min(1, 0.3 + progress * 0.7)}`;
      }

      if (!state.shouldComplete) {
        animationFrameRef.current = requestAnimationFrame(updateTransforms);
      }
    };

    updateTransforms();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isActive, state.progress, state.direction, state.shouldComplete]);

  // Get preview route
  const previewRoute = state.direction === 'left' ? state.nextRoute : state.prevRoute;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Current page content */}
      <div
        ref={wrapperRef}
        className="w-full h-full will-change-transform transition-transform duration-0"
        style={{
          transition: state.isActive ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out',
        }}
      >
        {children}
      </div>

      {/* Preview overlay for next/previous page */}
      {/* Always render PagePreview when route is known to start preloading */}
      {/* Keep preview visible during completion animation to prevent flash */}
      {(previewRoute && (state.isActive || state.shouldComplete)) && (
        <div
          ref={previewRef}
          className="absolute inset-0 z-50 pointer-events-none will-change-transform overflow-hidden"
          style={{
            boxShadow: (state.isActive || state.shouldComplete) ? '0 0 40px rgba(0, 0, 0, 0.5)' : 'none',
            transition: 'none',
            opacity: (state.isActive || state.shouldComplete) ? 1 : 0,
            visibility: (state.isActive || state.shouldComplete) ? 'visible' : 'hidden',
          }}
        >
          {/* Render actual page content in preview */}
          {/* Start loading immediately when route is known, even before visible */}
          <PagePreview route={previewRoute} isVisible={(state.isActive && state.progress > 5) || state.shouldComplete} />
        </div>
      )}
    </div>
  );
}

