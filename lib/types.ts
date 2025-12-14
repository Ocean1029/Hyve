
export enum AppState {
  DASHBOARD = 'DASHBOARD',
  SEARCHING = 'SEARCHING',
  FOUND = 'FOUND',
  FOCUS = 'FOCUS', // The hyve state
  SUMMARY = 'SUMMARY',
  QUARTERLY_FEEDBACK = 'QUARTERLY_FEEDBACK',
  HAPPY_INDEX = 'HAPPY_INDEX',
  FRIEND_PROFILE = 'FRIEND_PROFILE',
  TODAY_DETAILS = 'TODAY_DETAILS',
  MY_PROFILE = 'MY_PROFILE',
  POST_MEMORY = 'POST_MEMORY',
  SETTINGS = 'SETTINGS'
}

export enum FocusStatus {
  ACTIVE = 'ACTIVE', // Phone is down / burning
  PAUSED = 'PAUSED'  // Phone is up / embers
}

export interface Interaction {
  id: string;
  activity: string;
  date: string;
  duration: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  participants?: string[];
}

export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
}

export interface Message {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'user' or friendId or 'system'
  text: string;
  timestamp: string;
  type: 'text' | 'system';
  systemMetadata?: {
    duration: string;
    location: string;
    posts: string[];
  };
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  totalHours: number;
  streak: number;
  recentInteractions: Interaction[];
  posts: Post[];
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
  };
}

export interface SessionData {
  durationSeconds: number;
  participants: Friend[];
  startTime: number;
}

export interface ChartDataPoint {
  day: string;
  minutes: number;
}