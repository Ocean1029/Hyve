
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

export interface Memory {
  id: string;
  type: string;
  content?: string;
  timestamp: Date;
  focusSessionId: string;
  photos?: Photo[];
  focusSessionMinutes?: number; // Duration in minutes from the related FocusSession
  location?: string; // Location where the memory was created
  happyIndex?: number; // Happiness index score (0-10)
}

export interface Photo {
  id: string;
  photoUrl: string;
  memoryId: string;
  createdAt: Date;
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
  timestamp: string | Date; // Can be Date for sorting, then converted to string for display
  timestampDisplay?: string; // Formatted timestamp string for display
  type: 'text' | 'system';
  systemMetadata?: {
    duration: string;
    location: string;
    posts: string[];
    memoryType?: string; // Type of memory associated with the session
  };
}

export interface Friend {
  id: string;
  userId?: string; // The actual user ID of the friend (not the Friend record ID)
  name: string;
  avatar: string;
  totalHours: number;
  streak: number;
  recentMemories: Memory[]; // Memories from focus sessions with this friend
  friendCount?: number; // Number of friends this user has
  sessionCount?: number; // Number of focus sessions with this friend
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