// modules/sessions/service.ts
import {
  getUserSessions,
  getActiveSessionsByUsers,
  createSession,
  getActiveSessions,
  getSessionById,
  getSessionUser,
  getSessionUsers,
  updateSessionStatus,
  updateSessionUserPauseStatus,
  getActiveSessionsForStream,
} from './repository';
import { ChartDataPoint } from '@hyve/types';
import { getFriendsOnlineStatus } from '@/modules/presence/repository';

export const getWeeklyFocusMinutesService = async (userId: string): Promise<ChartDataPoint[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6); // Last 7 days including today
  startDate.setHours(0, 0, 0, 0); // Start of day

  const sessions = await getUserSessions({ userId, startDate, orderBy: 'asc', includeMemories: false, limit: 10 });

  // Initialize map with last 7 days (e.g., "Mon", "Tue"...)
  const daysMap = new Map<string, number>();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create 7 days template in order
  const resultOrder: string[] = [];

  for (let i = 0; i < 7; i++) {
     const d = new Date();
     d.setDate(d.getDate() - (6 - i));
     const dayName = daysOfWeek[d.getDay()];
     daysMap.set(dayName, 0); // Init 0
     resultOrder.push(dayName);
  }

  // Aggregate minutes
  sessions.forEach((session: { startTime: Date; minutes: number }) => {
    const dayName = daysOfWeek[session.startTime.getDay()];
    if (daysMap.has(dayName)) {
        daysMap.set(dayName, (daysMap.get(dayName) || 0) + session.minutes);
    }
  });

  // Convert to array in correct order
  return resultOrder.map(day => ({
      day,
      minutes: daysMap.get(day) || 0
  }));
};

/**
 * Check if friends are online and automatically create focus sessions
 * This function is called during heartbeat to detect online friends
 * and create focus sessions automatically
 */
export const checkAndCreateFocusSessionService = async (currentUserId: string): Promise<void> => {
  try {
    // Get all friends' online status
    const friendsStatus = await getFriendsOnlineStatus(currentUserId);
    
    // Filter to find online friends
    const onlineFriends = friendsStatus.filter((status: any) => status.isOnline);
    
    if (onlineFriends.length === 0) {
      return; // No online friends, nothing to do
    }

    // For each online friend, check if we should create a session
    for (const friendStatus of onlineFriends) {
      const friendUserId = friendStatus.userId;
      
      // Create sorted array of user IDs to ensure consistent ordering
      // This helps prevent duplicate session creation
      const userIds = [currentUserId, friendUserId].sort();
      
      // Check if an active session already exists for these users
      const existingSession = await getActiveSessionsByUsers(userIds);
      
      if (existingSession) {
        // Session already exists, skip
        continue;
      }
      
      // Use user ID sorting to determine who creates the session
      // Only the user with the smaller ID creates the session to prevent duplicates
      if (currentUserId !== userIds[0]) {
        // Current user is not the "creator" (smaller ID), skip
        // The other user will create the session when they send heartbeat
        continue;
      }
      
      // Create new focus session
      const now = new Date();
      // Set endTime to a future time (e.g., 1 hour from now)
      // This will be updated when the session actually ends
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour default
      
      await createSession(
        userIds,
        now,
        endTime,
        0, // minutes start at 0, will be calculated when session ends
        'active'
      );
    }
  } catch (error) {
    // Log error but don't throw - heartbeat should continue even if session creation fails
    console.error('Error in checkAndCreateFocusSessionService:', error);
  }
};

/**
 * Create a focus session with validation
 */
export const createFocusSessionService = async (
  userIds: string[],
  durationSeconds: number,
  startTime: Date,
  endTime: Date
) => {
  try {
    if (userIds.length === 0) {
      return { success: false, error: 'At least one user ID is required' };
    }

    // Use repository function to create session with users
    const session = await createSession(
      userIds,
      startTime,
      endTime,
      Math.floor(durationSeconds / 60),
      'active'
    );

    return { success: true, session };
  } catch (error) {
    console.error('Failed to create focus session:', error);
    return { success: false, error: 'Failed to create focus session' };
  }
};

/**
 * Get user's focus sessions
 */
export const getUserFocusSessionsService = async (userId: string, limit: number = 10) => {
  try {
    const sessions = await getUserSessions({ userId, limit, orderBy: 'desc', includeMemories: true });
    return { success: true, sessions };
  } catch (error) {
    console.error('Failed to get focus sessions:', error);
    return { success: false, error: 'Failed to get focus sessions' };
  }
};

/**
 * Get today's focus sessions with total minutes calculation
 */
export const getTodayFocusSessionsService = async (userId: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await getUserSessions({
      userId,
      startDate: today,
      endDate: tomorrow,
      orderBy: 'asc',
      includeMemories: true,
    });
    
    // Calculate total minutes for today
    const totalMinutes = sessions.reduce(
      (sum: number, session: { minutes: number }) => sum + session.minutes,
      0
    );

    return { success: true, sessions, totalMinutes };
  } catch (error) {
    console.error('Failed to get today focus sessions:', error);
    return { success: false, error: 'Failed to get today focus sessions' };
  }
};

/**
 * Get active focus sessions for a user
 */
export const getActiveFocusSessionsService = async (userId: string) => {
  try {
    const sessions = await getActiveSessions(userId);
    return { success: true, sessions };
  } catch (error) {
    console.error('Failed to get active focus sessions:', error);
    return { success: false, error: 'Failed to get active focus sessions' };
  }
};

/**
 * End a focus session with permission validation
 */
export const endFocusSessionService = async (
  sessionId: string,
  userId: string,
  endTime?: Date,
  minutes?: number
) => {
  try {
    // Verify user is part of this session
    const sessionUser = await getSessionUser(sessionId, userId);

    if (!sessionUser) {
      return {
        success: false,
        error: 'User is not part of this session',
        statusCode: 403,
      };
    }

    // Check if session is still active
    if (sessionUser.focusSession.status !== 'active') {
      return {
        success: false,
        error: 'Session is already ended',
        statusCode: 400,
      };
    }

    // Update session status to 'completed' for all participants
    const finalEndTime = endTime || new Date();
    const finalMinutes = minutes !== undefined ? minutes : sessionUser.focusSession.minutes;

    const updatedSession = await updateSessionStatus(
      sessionId,
      'completed',
      finalEndTime,
      finalMinutes
    );

    return { success: true, session: updatedSession };
  } catch (error) {
    console.error('Error ending session:', error);
    return { success: false, error: 'Failed to end session' };
  }
};

/**
 * Update pause status with permission validation
 */
export const updatePauseStatusService = async (
  sessionId: string,
  userId: string,
  isPaused: boolean
) => {
  try {
    if (typeof isPaused !== 'boolean') {
      return {
        success: false,
        error: 'isPaused must be a boolean',
        statusCode: 400,
      };
    }

    // Verify user is part of this session
    const sessionUser = await getSessionUser(sessionId, userId);

    if (!sessionUser) {
      return {
        success: false,
        error: 'User is not part of this session',
        statusCode: 403,
      };
    }

    // Check if session is still active
    if (sessionUser.focusSession.status !== 'active') {
      return {
        success: false,
        error: 'Session is not active',
        statusCode: 400,
      };
    }

    // Update current user's pause status
    await updateSessionUserPauseStatus(sessionUser.id, isPaused);

    // Get all users in this session to return updated status
    const sessionUsers = await getSessionUsers(sessionId);

    // Check if any user has paused (if any user picks up phone, session is paused for all)
    const hasAnyPaused = sessionUsers.some((su: { isPaused: boolean }) => su.isPaused);

    return {
      success: true,
      sessionId,
      isPaused: hasAnyPaused, // Overall session pause status (true if any user paused)
      users: sessionUsers.map((su: { userId: string; user: { name: string | null; image: string | null }; isPaused: boolean }) => ({
        userId: su.userId,
        userName: su.user.name,
        userImage: su.user.image,
        isPaused: su.isPaused,
      })),
    };
  } catch (error) {
    console.error('Error updating pause status:', error);
    return { success: false, error: 'Failed to update pause status' };
  }
};

/**
 * Get session status with permission validation
 */
export const getSessionStatusService = async (sessionId: string, userId: string) => {
  try {
    // Verify user is part of this session
    const sessionUser = await getSessionUser(sessionId, userId);

    if (!sessionUser) {
      return {
        success: false,
        error: 'User is not part of this session',
        statusCode: 403,
      };
    }

    // Get session with all users
    const focusSession = await getSessionById(sessionId);

    if (!focusSession) {
      return {
        success: false,
        error: 'Session not found',
        statusCode: 404,
      };
    }

    // Check if any user has paused (if any user picks up phone, session is paused for all)
    const hasAnyPaused = focusSession.users.some((su: { isPaused: boolean }) => su.isPaused);

    return {
      success: true,
      sessionId,
      status: focusSession.status,
      isPaused: hasAnyPaused, // Overall session pause status
      users: focusSession.users.map((su: { userId: string; user: { name: string | null; image: string | null }; isPaused: boolean }) => ({
        userId: su.userId,
        userName: su.user.name,
        userImage: su.user.image,
        isPaused: su.isPaused,
      })),
    };
  } catch (error) {
    console.error('Error getting session status:', error);
    return { success: false, error: 'Failed to get session status' };
  }
};

/**
 * Get session stream data (active and recently completed sessions)
 */
export const getSessionStreamDataService = async (userId: string) => {
  try {
    const sessions = await getActiveSessionsForStream(userId);

    // Format session status
    const sessionStatuses = sessions.map((session: any) => {
      const hasAnyPaused = session.users.some((su: any) => su.isPaused);
      return {
        sessionId: session.id,
        status: session.status,
        isPaused: hasAnyPaused,
        startTime: session.startTime,
        endTime: session.endTime,
        minutes: session.minutes,
        users: session.users.map((su: any) => ({
          userId: su.userId,
          userName: su.user.name,
          userImage: su.user.image,
          isPaused: su.isPaused,
        })),
      };
    });

    return { success: true, sessions: sessionStatuses };
  } catch (error) {
    console.error('Error getting session stream data:', error);
    return { success: false, error: 'Failed to get session stream data' };
  }
};