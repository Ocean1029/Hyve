export interface User {
 id: string;
 name: string;
 handle: string;
 avatarUrl: string;
 isOnline?: boolean;
 color: string; // Color for the map block (lego brick)
 savedMomentsCount?: number; // 7d count for My Circle tooltip
}


export interface Session {
 sessionId: string;
 placeId: string;
 userId: string;
 friendId: string;
 startTime: number; // Timestamp
 endTime: number;   // Timestamp
 focusedMinutes: number;
}


export interface Layer {
 friendId: string;
 minutes: number;
 heightPx: number; // calculated: minutes * factor
 color: string;
 isToday: boolean;
}


export interface PlaceAggregate {
 placeId: string;
 name: string;
 lat: number;
 lng: number;
 totalMinutes: number;
 layers: Layer[];
 type: 'friend' | 'ad' | 'public'; // Metadata for icons/UI
 isActiveToday: boolean;
 price?: string;
}


export enum AppScreen {
 HOME = 'HOME',
 SEARCH = 'SEARCH',
 MAP = 'MAP',
 SESSION_LIVE = 'SESSION_LIVE',
 POST_SESSION_1 = 'POST_SESSION_1',
 POST_SESSION_2 = 'POST_SESSION_2',
 POST_SESSION_3 = 'POST_SESSION_3',
 POST_SESSION_4 = 'POST_SESSION_4',
 PROFILE = 'PROFILE',
 RECAP = 'RECAP',
 TODAY = 'TODAY',
 RADAR = 'RADAR',
 MESSAGES = 'MESSAGES'
}