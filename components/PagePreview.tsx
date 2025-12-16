'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSwipePreview } from './SwipePreviewProvider';

interface PagePreviewProps {
  route: string;
  isVisible: boolean;
}

/**
 * PagePreview component
 * Renders actual page content in an iframe for swipe preview
 * Uses iframe to load the actual Next.js page with all its data and styling
 */
export default function PagePreview({ route, isVisible }: PagePreviewProps) {
  const { markIframeLoaded, isIframeLoaded } = useSwipePreview();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedLoadingRef = useRef(false);

  useEffect(() => {
    if (!iframeRef.current || !route) return;

    const iframe = iframeRef.current;
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const newSrc = `${currentOrigin}${route}`;
    
    // Add preview parameter to prevent SSE connections and other side effects in iframe
    const separator = route.includes('?') ? '&' : '?';
    const previewSrc = `${newSrc}${separator}_preview=true`;

    // Reset loading state when route changes
    if (!iframe.src.includes(previewSrc) && !iframe.src.includes('_preview=true')) {
      hasStartedLoadingRef.current = false;
      setIsLoading(true);
      setIsLoaded(false);
      setHasError(false);
    }

    // Check if iframe is already loaded for this route
    if (isIframeLoaded(route)) {
      // If already loaded, just set src and show immediately
      if (!iframe.src.includes('_preview=true')) {
        iframe.src = previewSrc;
      }
      setIsLoading(false);
      setIsLoaded(true);
      return;
    }

    // Start loading immediately when route is known (not waiting for visibility)
    // This allows preloading in the background for instant preview
    if (!hasStartedLoadingRef.current || !iframe.src.includes('_preview=true')) {
      hasStartedLoadingRef.current = true;
      iframe.src = previewSrc;
    }

    // Check if iframe is already complete (might have loaded in background)
    if (iframe.contentDocument?.readyState === 'complete' && iframe.src.includes('_preview=true')) {
      setIsLoading(false);
      setIsLoaded(true);
      markIframeLoaded(route);
      return;
    }

    // Set up event handlers
    const handleLoad = () => {
      setIsLoading(false);
      setIsLoaded(true);
      setHasError(false);
      markIframeLoaded(route);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setIsLoaded(false);
      setHasError(true);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };

    // Only show loading state when visible
    if (!isVisible) {
      // Keep loading in background but don't show loading indicator
      // Still set up event listeners to track when it's ready
      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);
      
      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    }

    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    // Set loading state when visible
    setIsLoading(true);
    setIsLoaded(false);
    setHasError(false);

    // Set timeout for loading (10 seconds max)
    loadTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setHasError(true);
    }, 10000);

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [route, isVisible, isIframeLoaded, markIframeLoaded]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="relative w-full h-full bg-zinc-950 overflow-hidden">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-zinc-500 text-xs">Loading preview...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
          <div className="text-center px-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 border-2 border-zinc-700/50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-zinc-500 text-sm font-medium">Failed to load preview</p>
            <p className="text-zinc-600 text-xs mt-1">{route}</p>
          </div>
        </div>
      )}

      {/* Iframe with actual page content */}
      {/* 
        Note: We don't use sandbox attribute here because:
        1. The iframe loads same-origin content (our own pages)
        2. We need to share authentication state (cookies/session)
        3. We need JavaScript to run for Next.js to work properly
        4. We trust the content since it's from our own application
        The pointer-events: none style prevents user interaction during swipe preview
      */}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0 bg-zinc-950"
        style={{
          pointerEvents: 'none', // Prevent interaction with iframe content during swipe
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease-in',
          transform: 'scale(1)',
        }}
        title={`Preview of ${route}`}
        loading="lazy"
      />
    </div>
  );
}

