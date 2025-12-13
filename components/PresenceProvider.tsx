// components/PresenceProvider.tsx
'use client';

import { useEffect, useRef } from 'react';

/**
 * Global presence provider that ensures heartbeat is sent
 * even when user is not on the Messages page
 * This component runs in the background to maintain user's online status
 */
export default function PresenceProvider() {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Send initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Silently fail to avoid console spam
        // The hook in Messages component will handle retries
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up heartbeat interval (every 30 seconds)
    heartbeatIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        sendHeartbeat();
      }
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}


