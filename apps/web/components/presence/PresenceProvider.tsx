// components/PresenceProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global presence provider that ensures heartbeat is sent
 * even when user is not on the Messages page
 * This component runs in the background to maintain user's online status
 * Skips heartbeat on login page since user is not authenticated yet
 */
export default function PresenceProvider() {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const pathname = usePathname();

  useEffect(() => {
    isMountedRef.current = true;

    // Skip heartbeat on login page - user is not authenticated
    if (pathname === '/login') {
      return;
    }

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
      }
    };

    sendHeartbeat();

    heartbeatIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        sendHeartbeat();
      }
    }, 30000); // 30 seconds

    return () => {
      isMountedRef.current = false;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [pathname]);

  return null;
}



