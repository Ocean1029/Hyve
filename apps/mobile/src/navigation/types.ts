/**
 * Root stack navigation param list.
 * Used by screens and AppNavigator to type route params.
 */
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  FindFriends: undefined;
  FriendProfile: { friend: import('@hyve/types').Friend };
  HappyIndex: undefined;
  Settings: undefined;
  FocusSession: { sessionId?: string; autoEntered?: boolean; startTime?: string } | undefined;
  SessionSummary: { elapsedSeconds: number; sessionId: string };
  PostMemory: { focusSessionId: string; durationSeconds?: number; sessionEndTime?: string };
  SpringBloom: undefined;
};

/**
 * Messages stack param list (nested inside Main tab).
 */
export type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: { friend: { id: string; userId?: string; name?: string | null; image?: string | null } };
};
