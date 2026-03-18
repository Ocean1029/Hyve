/**
 * Mock data for Map screen.
 * Provides place locations in Taipei for development without backend.
 */

export interface MapFriend {
  id: string;
  name: string;
  avatar?: string;
}

export interface MapPlace {
  id: string;
  name: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  category: keyof typeof PLACE_CATEGORIES;
  visitCount: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
  friends: MapFriend[];
}

export const PLACE_CATEGORIES = {
  cafe: { label: 'Cafe', color: '#C9A86A' },
  restaurant: { label: 'Restaurant', color: '#22c55e' },
  bar: { label: 'Bar', color: '#a78bfa' },
  gym: { label: 'Gym', color: '#f97316' },
  park: { label: 'Park', color: '#34d399' },
  other: { label: 'Other', color: '#64748b' },
} as const;

export const MOCK_PLACES: MapPlace[] = [
  {
    id: '1',
    name: 'Louisa Coffee',
    coordinate: { latitude: 25.0339, longitude: 121.5645 },
    category: 'cafe',
    visitCount: 8,
    visitsThisWeek: 3,
    visitsThisMonth: 6,
    friends: [
      { id: 'f1', name: 'Alice' },
      { id: 'f2', name: 'Bob' },
    ],
  },
  {
    id: '2',
    name: 'Draft Land',
    coordinate: { latitude: 25.0275, longitude: 121.5555 },
    category: 'bar',
    visitCount: 5,
    visitsThisWeek: 1,
    visitsThisMonth: 3,
    friends: [
      { id: 'f3', name: 'Charlie' },
    ],
  },
  {
    id: '3',
    name: 'Addiction Aquatic',
    coordinate: { latitude: 25.0598, longitude: 121.5362 },
    category: 'restaurant',
    visitCount: 3,
    visitsThisWeek: 0,
    visitsThisMonth: 2,
    friends: [
      { id: 'f1', name: 'Alice' },
      { id: 'f4', name: 'Diana' },
      { id: 'f5', name: 'Eve' },
    ],
  },
  {
    id: '4',
    name: 'World Gym',
    coordinate: { latitude: 25.0415, longitude: 121.5502 },
    category: 'gym',
    visitCount: 12,
    visitsThisWeek: 4,
    visitsThisMonth: 10,
    friends: [
      { id: 'f2', name: 'Bob' },
    ],
  },
  {
    id: '5',
    name: 'Daan Forest Park',
    coordinate: { latitude: 25.0298, longitude: 121.5355 },
    category: 'park',
    visitCount: 6,
    visitsThisWeek: 2,
    visitsThisMonth: 4,
    friends: [
      { id: 'f1', name: 'Alice' },
      { id: 'f3', name: 'Charlie' },
      { id: 'f5', name: 'Eve' },
    ],
  },
  {
    id: '6',
    name: 'Simple Kaffa',
    coordinate: { latitude: 25.0365, longitude: 121.5580 },
    category: 'cafe',
    visitCount: 4,
    visitsThisWeek: 0,
    visitsThisMonth: 1,
    friends: [
      { id: 'f4', name: 'Diana' },
    ],
  },
];
