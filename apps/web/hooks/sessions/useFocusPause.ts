import { useState } from 'react';

/**
 * Hook to manage pause time tracking for focus sessions
 * Tracks when pause starts and calculates total paused time
 */
export function useFocusPause() {
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
  const [isSessionPausedByOthers, setIsSessionPausedByOthers] = useState(false);

  /**
   * Start tracking pause time
   */
  const startPause = () => {
    setPauseStartTime(new Date());
  };

  /**
   * End pause and add duration to total paused time
   */
  const endPause = () => {
    if (pauseStartTime) {
      const pauseDuration = Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000);
      setTotalPausedSeconds(prev => prev + pauseDuration);
      setPauseStartTime(null);
    }
  };

  /**
   * Reset all pause tracking (used when starting a new session)
   */
  const resetPauseTracking = () => {
    setPauseStartTime(null);
    setTotalPausedSeconds(0);
  };

  return {
    pauseStartTime,
    totalPausedSeconds,
    isSessionPausedByOthers,
    setIsSessionPausedByOthers,
    startPause,
    endPause,
    resetPauseTracking,
  };
}
