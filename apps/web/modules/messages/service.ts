import type { FriendFocusSessionSummary } from '@hyve/types';
import { getFocusSessionsByFriendId } from './repository';

/**
 * Get all FocusSessions for a friend with formatted output
 * Includes memories and photos for each session
 */
export async function getFriendFocusSessionsService(
  friendId: string
): Promise<FriendFocusSessionSummary[]> {
  const focusSessions = await getFocusSessionsByFriendId(friendId);

  return focusSessions.map((fs: { id: string; startTime: Date; endTime: Date; minutes: number; createdAt: Date; memories: Array<{ id: string; type: string; content: string | null; timestamp: Date; location: string | null; photos: Array<{ photoUrl: string }> }> }) => ({
    id: fs.id,
    startTime: fs.startTime,
    endTime: fs.endTime,
    minutes: fs.minutes,
    createdAt: fs.createdAt,
    memories: fs.memories.map((m: { id: string; type: string; content: string | null; timestamp: Date; location: string | null; photos: Array<{ photoUrl: string }> }) => ({
      id: m.id,
      type: m.type,
      content: m.content,
      timestamp: m.timestamp,
      location: m.location,
      photos: m.photos.map((p: { photoUrl: string }) => p.photoUrl),
    })),
  }));
}
