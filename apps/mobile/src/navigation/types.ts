/**
 * Root stack navigation param list.
 * Used by screens and AppNavigator to type route params.
 */
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  FindFriends: undefined;
  HappyIndex: undefined;
  Settings: undefined;
  FocusSession: undefined;
  PostMemory: { focusSessionId: string };
  SpringBloom: undefined;
};

/**
 * Messages stack param list (nested inside Main tab).
 */
export type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: { friend: { id: string; userId?: string; name?: string | null; image?: string | null } };
};
