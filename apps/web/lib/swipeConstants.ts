/**
 * Shared constants for swipe navigation module
 * Single source of truth for animation timing, thresholds, and visual parameters
 */

export const SWIPE = {
  /** Default screen width for SSR when window is undefined (iPhone 14 Pro width) */
  DEFAULT_SCREEN_WIDTH: 414,
  /** 80% of screen width = 100% progress for swipe gesture */
  PROGRESS_THRESHOLD: 0.8,
  /** Minimum horizontal distance (px) to trigger navigation */
  MIN_SWIPE_DISTANCE: 50,
  /** Duration of completion animation in ms */
  ANIMATION_DURATION_MS: 300,
  /** Delay before resetting swipe state after pathname change (slightly longer than animation) */
  RESET_DELAY_MS: 350,
  /** Scale factor: current page scales down by up to 10% at full progress */
  SCALE_FACTOR: 0.1,
  /** Opacity factor: current page fades to 30% at full progress */
  OPACITY_FACTOR: 0.7,
  /** CSS easing for transition animations */
  TRANSITION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
