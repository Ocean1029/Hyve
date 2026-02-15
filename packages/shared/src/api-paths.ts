/**
 * API path constants for Hyve backend.
 * Use with createApiClient to build full URLs.
 */
export const API_PATHS = {
  // Auth
  AUTH_MOBILE_LOGIN: '/api/auth/mobile/login',
  AUTH_LOGOUT: '/api/users/logout',

  // Presence
  PRESENCE_STATUS: '/api/presence/status',
  PRESENCE_STREAM: '/api/presence/stream',
  PRESENCE_HEARTBEAT: '/api/presence/heartbeat',
  PRESENCE_ME: '/api/presence/me',

  // Sessions
  SESSIONS: '/api/sessions',
  SESSIONS_ACTIVE: '/api/sessions/active',
  SESSIONS_TODAY: '/api/sessions/today',
  SESSIONS_WEEKLY: '/api/sessions/weekly',
  SESSION_STATUS: (id: string) => `/api/sessions/${id}/status`,
  SESSION_PAUSE: (id: string) => `/api/sessions/${id}/pause`,
  SESSION_END: (id: string) => `/api/sessions/${id}/end`,

  // Friends
  FRIENDS: '/api/friends',
  FRIENDS_LIST: '/api/friends/list',
  FRIEND: (id: string) => `/api/friends/${id}`,
  FRIENDS_CHECK: '/api/friends/check',
  FRIENDS_SPRING_BLOOM: '/api/friends/spring-bloom',

  // Friend requests
  FRIEND_REQUESTS: '/api/friend-requests',
  FRIEND_REQUESTS_PENDING: '/api/friend-requests/pending',
  FRIEND_REQUESTS_STATUS: '/api/friend-requests/status',
  FRIEND_REQUEST_ACCEPT: (id: string) => `/api/friend-requests/${id}/accept`,
  FRIEND_REQUEST_REJECT: (id: string) => `/api/friend-requests/${id}/reject`,

  // Messages
  MESSAGES: '/api/messages',
  MESSAGES_SESSIONS: (friendId: string) => `/api/messages/${friendId}/sessions`,

  // Memories
  MEMORIES: '/api/memories',
  MEMORY_WITH_PHOTO: '/api/memories/with-photo',
  MEMORY_UPDATE_WITH_PHOTO: (id: string) => `/api/memories/${id}/with-photo`,
  MEMORY_PHOTOS: (id: string) => `/api/memories/${id}/photos`,

  // Users
  USERS_ME: '/api/users/me',
  USER_PROFILE: (userId: string) => `/api/users/${userId}/profile`,
  USER_STATS: (userId: string) => `/api/users/${userId}/stats`,

  // Search
  SEARCH_USERS: '/api/search/users',
  SEARCH_FRIENDS: '/api/search/friends',
  SEARCH_RECOMMENDED: '/api/search/recommended',

  // Locations
  LOCATIONS: '/api/locations',
  LOCATIONS_NEARBY: '/api/locations/nearby',

  // Upload
  UPLOAD: '/api/upload',

  // AI
  GENERATE_CHAT_RESPONSE: '/api/generate-chat-response',
  GENERATE_ICEBREAKER: '/api/generate-icebreaker',
} as const;
