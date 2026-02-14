'use client';

import React, { useEffect, useRef } from 'react';
import { useSwipePreview } from '@/components/common/SwipePreviewProvider';
import PagePreview from '@/components/common/PagePreview';
import { SWIPE } from '@/lib/swipeConstants';

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
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : SWIPE.DEFAULT_SCREEN_WIDTH;
      const transitionStyle = `transform ${SWIPE.ANIMATION_DURATION_MS}ms ${SWIPE.TRANSITION_EASING}, opacity ${SWIPE.ANIMATION_DURATION_MS}ms ease-out`;

      // If shouldComplete is true, use smooth transition to complete the animation
      if (state.shouldComplete) {
        // Enable smooth transition for completion
        wrapperRef.current.style.transition = transitionStyle;
        previewRef.current.style.transition = transitionStyle;
        
        // Animate to 100% - use double requestAnimationFrame to ensure current transform is applied first
        // This ensures the browser has applied the current transform before we change it
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!wrapperRef.current || !previewRef.current) return;
            
            const finalProgress = 1;
            const dir = state.direction === 'left' ? -1 : 1;
            const translateX = dir * finalProgress * screenWidth;
            const scale = 1 - finalProgress * SWIPE.SCALE_FACTOR;
            const opacity = Math.max(1 - SWIPE.OPACITY_FACTOR, 1 - finalProgress * SWIPE.OPACITY_FACTOR);
            const previewOpacity = Math.min(1, 1 - SWIPE.OPACITY_FACTOR + finalProgress * SWIPE.OPACITY_FACTOR);
            wrapperRef.current.style.transform = `translateX(${translateX}px) scale(${scale})`;
            wrapperRef.current.style.opacity = `${opacity}`;
            previewRef.current.style.transform = `translateX(${-dir * screenWidth * (1 - finalProgress)}px)`;
            previewRef.current.style.opacity = `${previewOpacity}`;
          });
        });
        return;
      }

      // Normal swipe animation (no transition, direct transform)
      wrapperRef.current.style.transition = 'none';
      previewRef.current.style.transition = 'none';

      // Use direction multiplier: left = -1, right = +1 for symmetric transform calculation
      const dir = state.direction === 'left' ? -1 : 1;
      const translateX = dir * progress * screenWidth;
      const scale = 1 - progress * SWIPE.SCALE_FACTOR;
      const opacity = Math.max(1 - SWIPE.OPACITY_FACTOR, 1 - progress * SWIPE.OPACITY_FACTOR);
      const previewTranslateX = -dir * screenWidth * (1 - progress);
      const previewOpacity = Math.min(1, 1 - SWIPE.OPACITY_FACTOR + progress * SWIPE.OPACITY_FACTOR);

      wrapperRef.current.style.transform = `translateX(${translateX}px) scale(${scale})`;
      wrapperRef.current.style.opacity = `${opacity}`;
      previewRef.current.style.transform = `translateX(${previewTranslateX}px)`;
      previewRef.current.style.opacity = `${previewOpacity}`;

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
          transition: state.isActive ? 'none' : `transform ${SWIPE.ANIMATION_DURATION_MS}ms ${SWIPE.TRANSITION_EASING}, opacity ${SWIPE.ANIMATION_DURATION_MS}ms ease-out`,
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

