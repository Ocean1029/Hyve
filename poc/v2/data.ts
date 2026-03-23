import { SessionLog, Photo } from './types';

/**
 * PERSISTENT HYPOTHETICAL DATASET (Background Consistency Store)
 */

export const SESSION_LOGS: SessionLog[] = [
  { 
    id: 's_today_2', 
    friendId: 'u3', 
    date: 'Mar 5, 2026', 
    location: 'Taipei 101', 
    duration: '1h 30m', 
    description: 'Quick lunch and catch up near the tower.', 
    tags: ['Lunch', 'City', 'Catchup'],
    photoUrl: 'https://picsum.photos/800/1000?random=today2',
    photoUrls: [
      'https://picsum.photos/800/1000?random=today2',
      'https://picsum.photos/800/1000?random=today2_2'
    ]
  },
  { 
    id: 's_today_1', 
    friendId: 'u2', 
    date: 'Mar 5, 2026', 
    location: 'Da Vinci Coffee', 
    duration: '4h', 
    description: 'Long morning focus session. We were both super productive.', 
    tags: ['Study', 'Coffee', 'Morning'],
    photoUrl: 'https://picsum.photos/800/1000?random=today1',
    photoUrls: [
      'https://picsum.photos/800/1000?random=today1',
      'https://picsum.photos/800/1000?random=today1_2',
      'https://picsum.photos/800/1000?random=today1_3'
    ]
  },
  { 
    id: 's1', 
    friendId: 'u2', 
    date: 'Mar 3, 2026', 
    location: 'Da Vinci Coffee', 
    duration: '2h 15m', 
    description: 'Deep focus session with Emily. We both managed to finish our project drafts.', 
    tags: ['Study', 'Coffee', 'Focus'],
    photoUrl: 'https://picsum.photos/800/1000?random=s1',
    photoUrls: [
      'https://picsum.photos/800/1000?random=s1',
      'https://picsum.photos/800/1000?random=s1_2',
      'https://picsum.photos/800/1000?random=s1_3'
    ]
  },
  { 
    id: 's2', 
    friendId: 'u3', 
    date: 'Mar 1, 2026', 
    location: 'Gym Center', 
    duration: '1h 30m', 
    description: 'Intense leg day with Jordan. New PR on squats!', 
    tags: ['Gym', 'Fitness', 'Leg Day'],
    photoUrl: 'https://picsum.photos/800/1000?random=s2',
    photoUrls: [
      'https://picsum.photos/800/1000?random=s2',
      'https://picsum.photos/800/1000?random=s2_2'
    ]
  },
  { 
    id: 's3', 
    friendId: 'u5', 
    date: 'Feb 28, 2026', 
    location: 'Glass House', 
    duration: '45m', 
    description: 'Quick catch up with Casey over some amazing matcha lattes.', 
    tags: ['Chat', 'Matcha', 'Vibes'],
    photoUrl: 'https://picsum.photos/800/1000?random=s3',
    photoUrls: ['https://picsum.photos/800/1000?random=s3']
  },
  { 
    id: 's4', 
    friendId: 'u2', 
    date: 'Feb 25, 2026', 
    location: 'The Archive', 
    duration: '3h', 
    description: 'Long reading session. The atmosphere was perfect for getting through that thick novel.', 
    tags: ['Reading', 'Quiet', 'Archive'],
    photoUrl: 'https://picsum.photos/800/1000?random=s4',
    photoUrls: [
      'https://picsum.photos/800/1000?random=s4',
      'https://picsum.photos/800/1000?random=s4_2'
    ]
  },
  { 
    id: 's5', 
    friendId: 'u4', 
    date: 'Feb 20, 2026', 
    location: 'Central Library', 
    duration: '1h 15m', 
    description: 'Researching for the upcoming exhibition. Found some rare manuscripts.', 
    tags: ['Research', 'Art', 'History'],
    photoUrl: 'https://picsum.photos/800/1000?random=s5',
    photoUrls: ['https://picsum.photos/800/1000?random=s5']
  }
];

export const USER_PHOTOS: Photo[] = SESSION_LOGS.map(s => ({
  id: `p_${s.id}`,
  url: s.photoUrl,
  sessionId: s.id,
  friendId: s.friendId,
  date: s.date
}));

export const HYVE_DATABASE = {
  user: {
    id: 'u1',
    quote: "Building silence in a noisy world.",
    metrics: {
      totalHours: 60,
      buildingsMade: 42,
      totalFriends: 30,
      longestStreak: 12,
      mapCoverage: '18km²'
    },
    activityBreakdown: [
      { label: 'Gym', hours: 30, color: '#C9A86A' },
      { label: 'Studying', hours: 20, color: '#E6E1D8' },
      { label: 'Shopping', hours: 8, color: '#3B82F6' },
      { label: 'Cafe Vibing', hours: 6, color: '#EF4444' },
      { label: 'Mountain Climbing', hours: 6, color: '#10B981' }
    ],
    topCafes: [
      { name: 'Da Vinci Coffee', visits: 18 },
      { name: 'The Archive', visits: 12 },
      { name: 'Nook & Cranny', visits: 10 },
      { name: 'Glass House', visits: 8 },
      { name: 'Central Brew', visits: 5 }
    ],
    lastHangout: SESSION_LOGS[0],
    photos: USER_PHOTOS,
    phoneUsage: {
      's_today_2': { you: 5, friend: 10 },
      's_today_1': { you: 8, friend: 12 },
      's1': { you: 10, friend: 15 },
      's2': { you: 4, friend: 8 },
      's3': { you: 2, friend: 5 },
      's4': { you: 15, friend: 20 },
      's5': { you: 6, friend: 10 }
    }
  },
  friendships: {
    'u2': { // Emily
      name: 'Emily',
      quote: "Coffee and deep work is my love language.",
      sharedHours: 22,
      sharedPlaces: 8,
      sharedPhotos: 2,
      lastHangout: SESSION_LOGS.find(s => s.friendId === 'u2'),
      sessionIds: SESSION_LOGS.filter(s => s.friendId === 'u2').map(s => s.id),
      photos: USER_PHOTOS.filter(p => p.friendId === 'u2'),
      sharedActivity: [
        { label: 'Studying', hours: 14 },
        { label: 'Cafe Vibing', hours: 8 }
      ],
      sharedTopPlaces: [
        { name: 'Da Vinci Coffee', visits: 12 },
        { name: 'The Archive', visits: 3 }
      ]
    },
    'u3': { // Jordan
      name: 'Jordan',
      quote: "One more rep, one more hour.",
      sharedHours: 12,
      sharedPlaces: 3,
      sharedPhotos: 1,
      lastHangout: SESSION_LOGS.find(s => s.friendId === 'u3'),
      sessionIds: SESSION_LOGS.filter(s => s.friendId === 'u3').map(s => s.id),
      photos: USER_PHOTOS.filter(p => p.friendId === 'u3'),
      sharedActivity: [
        { label: 'Gym', hours: 12 }
      ],
      sharedTopPlaces: [
        { name: 'Gym Center', visits: 3 }
      ]
    },
    'u4': { // Sam
      name: 'Sam',
      quote: "Exploring the intersections of art and logic.",
      sharedHours: 5,
      sharedPlaces: 2,
      sharedPhotos: 1,
      lastHangout: SESSION_LOGS.find(s => s.friendId === 'u4'),
      sessionIds: SESSION_LOGS.filter(s => s.friendId === 'u4').map(s => s.id),
      photos: USER_PHOTOS.filter(p => p.friendId === 'u4'),
      sharedActivity: [{ label: 'Studying', hours: 5 }],
      sharedTopPlaces: [{ name: 'Central Library', visits: 2 }]
    },
    'u5': { // Casey
      name: 'Casey',
      quote: "Capturing the light between focus blocks.",
      sharedHours: 3,
      sharedPlaces: 1,
      sharedPhotos: 1,
      lastHangout: SESSION_LOGS.find(s => s.friendId === 'u5'),
      sessionIds: SESSION_LOGS.filter(s => s.friendId === 'u5').map(s => s.id),
      photos: USER_PHOTOS.filter(p => p.friendId === 'u5'),
      sharedActivity: [{ label: 'Cafe Vibing', hours: 3 }],
      sharedTopPlaces: [{ name: 'Glass House', visits: 1 }]
    }
  }
};
