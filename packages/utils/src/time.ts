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

/**
 * Format an ISO date string into a relative time display for chat messages.
 * Returns "Just now", "5m", "2h", "Yesterday", "3d", or full date for older items.
 * @param isoStr - ISO 8601 date string (e.g. from createdAt)
 * @returns Human-readable relative time string
 */
export function formatMessageTime(isoStr: string | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString();
}
