import React from 'react';
import { User, Session } from '../types';

export const CURRENT_USER: User = { id: 'u1', name: 'Alex', handle: '@alex_h', avatarUrl: 'https://picsum.photos/800/800?u=1', color: '#3B82F6' };

export const FRIENDS_DATA: User[] = [
 { id: 'u2', name: 'Emily', handle: '@emily_z', avatarUrl: 'https://picsum.photos/600/600?u=2', isOnline: true, color: '#EAB308', savedMomentsCount: 3 },
 { id: 'u3', name: 'Jordan', handle: '@jordy', avatarUrl: 'https://picsum.photos/600/600?u=3', color: '#EF4444', isOnline: true, savedMomentsCount: 1 },
 { id: 'u4', name: 'Sam', handle: '@sam_k', avatarUrl: 'https://picsum.photos/600/600?u=4', color: '#10B981', savedMomentsCount: 0 }, // 0 logs example
 { id: 'u5', name: 'Casey', handle: '@case_closed', avatarUrl: 'https://picsum.photos/600/600?u=5', color: '#8B5CF6', savedMomentsCount: 2 },
];

// Helper to construct consistent timeline data
export const createSession = (
  id: string, 
  friendId: string, 
  placeId: string, 
  durationMins: number, 
  minsAgoEnd: number
): Session => {
  const now = Date.now();
  const endTime = now - (minsAgoEnd * 60 * 1000);
  const startTime = endTime - (durationMins * 60 * 1000);
  return {
    sessionId: id,
    placeId,
    userId: 'u1',
    friendId,
    startTime,
    endTime,
    focusedMinutes: durationMins
  };
};

export const MOCK_SESSIONS: Session[] = [
 // OLDER SESSIONS (Not Today)
 { sessionId: 's_old_1', placeId: 'b1', userId: 'u1', friendId: 'u4', startTime: Date.now() - 86400000 * 2, endTime: Date.now() - 86400000 * 2 + 2400000, focusedMinutes: 40 },

 // TODAY'S SESSIONS (Total approx 10h 30m)
 // Defined to allow "Chronological" viewing (Morning -> Evening)
 
 // 1. Morning Coffee - 240m (4 hours)
 createSession('s_today_1', 'u2', 'b1', 240, 600), // Ends 10h ago
 
 // 2. Lunch/Eating - 90m (1.5 hours)
 createSession('s_today_2', 'u3', 'p2', 90, 480), // Ends 8h ago

 // 3. Afternoon Bonding - 180m (3 hours)
 createSession('s4', 'u4', 'p1', 180, 240), // Ends 4h ago

 // 4. Evening Drinking (Latest) - 120m (2 hours)
 createSession('s5', 'u2', 'b1', 120, 0), // Ends Now
];

export const INSIGHTS = [
 <span key="1">Mostly at <span className="text-hyve-gold font-medium">Taipei 101</span></span>,
 <span key="2"><span className="text-hyve-gold font-medium">3 days</span> since Emily</span>,
 <span key="3"><span className="text-hyve-gold font-medium">Sunday</span> is your day</span>,
];

export const formatDuration = (mins: number) => {
 const h = Math.floor(mins / 60);
 const m = mins % 60;
 return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
