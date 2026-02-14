/**
 * Format total seconds into a human-readable time string
 * @param totalSeconds - Total number of seconds
 * @returns Formatted time string (e.g., "2h 30m" or "5:30")
 */
export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format minutes into a compact string for chart labels (e.g., "2h" or "45m")
 * @param minutes - Total number of minutes
 * @returns Formatted string (e.g., "1h" when >= 60, "45m" when < 60)
 */
export function formatMinutesCompact(minutes: number): string {
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h` : `${minutes}m`;
}
