/**
 * Presence hook using polling - works in both web and React Native.
 * Polls GET /api/presence/status at interval. Use this in mobile; web can use EventSource for lower latency.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '@hyve/shared';
import { API_PATHS } from '@hyve/shared';

export interface FriendStatus {
  friendId: string;
  userId: string;
  lastSeenAt: Date | null;
  isOnline: boolean;
}

export interface UsePresenceOptions {
  /** Polling interval in ms. Default 15000. */
  interval?: number;
}

export interface UsePresenceReturn {
  friendStatuses: Map<string, FriendStatus>;
  isOnline: (friendId: string) => boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches and polls friend presence status. Platform-agnostic (uses polling, no EventSource).
 */
export function usePresence(
  apiClient: ApiClient,
  options: UsePresenceOptions = {}
): UsePresenceReturn {
  const { interval = 15000 } = options;
  const [friendStatuses, setFriendStatuses] = useState<Map<string, FriendStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiClient.get<{ statuses?: FriendStatus[] }>(API_PATHS.PRESENCE_STATUS);
      const newStatuses = new Map<string, FriendStatus>();
      if (data?.statuses) {
        for (const s of data.statuses) {
          newStatuses.set(s.friendId, {
            ...s,
            lastSeenAt: s.lastSeenAt ? new Date(s.lastSeenAt) : null,
          });
        }
      }
      if (isMountedRef.current) {
        setFriendStatuses(newStatuses);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch presence');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiClient]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStatus();
    const id = setInterval(fetchStatus, interval);
    return () => {
      isMountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchStatus, interval]);

  const isOnline = useCallback(
    (friendId: string): boolean => friendStatuses.get(friendId)?.isOnline ?? false,
    [friendStatuses]
  );

  return {
    friendStatuses,
    isOnline,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}
