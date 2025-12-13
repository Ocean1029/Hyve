// hooks/usePresence.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface FriendStatus {
  friendId: string;
  userId: string;
  lastSeenAt: Date | null;
  isOnline: boolean;
}

interface UsePresenceReturn {
  friendStatuses: Map<string, FriendStatus>;
  isOnline: (friendId: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to manage user presence (online/offline status)
 * - Sends heartbeat every 30 seconds
 * - Connects to SSE stream for real-time updates
 * - Provides friend online status
 */
export function usePresence(): UsePresenceReturn {
  const [friendStatuses, setFriendStatuses] = useState<Map<string, FriendStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isMountedRef = useRef(true);

  // Send heartbeat to update user's last seen time
  const sendHeartbeat = useCallback(async () => {
    try {
      const response = await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send heartbeat');
      }
    } catch (err) {
      console.error('Error sending heartbeat:', err);
      // Don't set error state for heartbeat failures to avoid UI disruption
    }
  }, []);

  // Connect to SSE stream for real-time updates
  const connectToStream = useCallback(() => {
    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/presence/stream');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status' && data.statuses) {
            const newStatuses = new Map<string, FriendStatus>();
            
            data.statuses.forEach((status: FriendStatus) => {
              newStatuses.set(status.friendId, {
                ...status,
                lastSeenAt: status.lastSeenAt ? new Date(status.lastSeenAt) : null,
              });
            });
            
            if (isMountedRef.current) {
              setFriendStatuses(newStatuses);
              setIsLoading(false);
              setError(null);
            }
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        eventSource.close();
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            connectToStream();
          }
        }, 5000);
      };
    } catch (err) {
      console.error('Error connecting to stream:', err);
      setError('Failed to connect to presence stream');
      setIsLoading(false);
    }
  }, []);

  // Initial fetch of friend statuses
  const fetchInitialStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/presence/status');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      const newStatuses = new Map<string, FriendStatus>();
      
      if (data.statuses) {
        data.statuses.forEach((status: FriendStatus) => {
          newStatuses.set(status.friendId, {
            ...status,
            lastSeenAt: status.lastSeenAt ? new Date(status.lastSeenAt) : null,
          });
        });
      }
      
      if (isMountedRef.current) {
        setFriendStatuses(newStatuses);
        setIsLoading(false);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching initial status:', err);
      setError('Failed to fetch friend statuses');
      setIsLoading(false);
    }
  }, []);

  // Initialize: send first heartbeat, fetch initial status, then connect to stream
  useEffect(() => {
    isMountedRef.current = true;
    
    // Send initial heartbeat
    sendHeartbeat();
    
    // Fetch initial status
    fetchInitialStatus();
    
    // Connect to stream for real-time updates
    connectToStream();

    // Set up heartbeat interval (every 30 seconds)
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      isMountedRef.current = false;
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [sendHeartbeat, fetchInitialStatus, connectToStream]);

  // Helper function to check if a friend is online
  const isOnline = useCallback((friendId: string): boolean => {
    const status = friendStatuses.get(friendId);
    return status?.isOnline ?? false;
  }, [friendStatuses]);

  return {
    friendStatuses,
    isOnline,
    isLoading,
    error,
  };
}


