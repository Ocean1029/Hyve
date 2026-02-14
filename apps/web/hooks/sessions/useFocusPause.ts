import { useState } from 'react';

/**
 * Hook to manage pause time tracking for focus sessions
 * Tracks when pause starts and calculates total paused time
 */
export function useFocusPause() {
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
  const [isSessionPausedByOthers, setIsSessionPausedByOthers] = useState(false);

  const startPause = () => {
    setPauseStartTime(new Date());
  };

  const endPause = () => {
    if (pauseStartTime) {
      const pauseDuration = Math.floor(
        (new Date().getTime() - pauseStartTime.getTime()) / 1000
      );
      setTotalPausedSeconds((prev) => prev + pauseDuration);
      setPauseStartTime(null);
    }
  };

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
