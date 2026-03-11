/**
* PERSISTENT HYPOTHETICAL DATASET (Background Consistency Store)
*/
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
   ]
 },
 friendships: {
   'u2': { // Emily
     name: 'Emily',
     quote: "Coffee and deep work is my love language.",
     sharedHours: 22,
     sharedPlaces: 8,
     sharedPhotos: 4,
     lastHangout: {
       location: 'Da Vinci Coffee',
       duration: '2h',
       description: 'Mainly studying and vibing',
       date: 'Last Tuesday',
       tags: ['Study', 'Coffee']
     },
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
     sharedPhotos: 2,
     lastHangout: {
       location: 'Gym Center',
       duration: '1h 30m',
       description: 'Leg day focus',
       date: 'Last Friday',
       tags: ['Gym']
     },
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
     lastHangout: {
       location: 'Central Library',
       duration: '1h',
       description: 'Research session',
       date: 'Last Month',
       tags: ['Research']
     },
     sharedActivity: [{ label: 'Studying', hours: 5 }],
     sharedTopPlaces: [{ name: 'Central Library', visits: 2 }]
   },
   'u5': { // Casey
     name: 'Casey',
     quote: "Capturing the light between focus blocks.",
     sharedHours: 3,
     sharedPlaces: 1,
     sharedPhotos: 0,
     lastHangout: {
       location: 'Glass House',
       duration: '45m',
       description: 'Quick catch up',
       date: 'Yesterday',
       tags: ['Chat']
     },
     sharedActivity: [{ label: 'Cafe Vibing', hours: 3 }],
     sharedTopPlaces: [{ name: 'Glass House', visits: 1 }]
   }
 }
};