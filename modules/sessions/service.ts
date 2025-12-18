// modules/sessions/service.ts
import { getRecentFocusSessions, findActiveSessionByUsers, createFocusSessionWithUsers } from './repository';
import { ChartDataPoint } from '@/lib/types';
import { getFriendsOnlineStatus } from '@/modules/presence/repository';

export const getWeeklyFocusChartData = async (userId: string): Promise<ChartDataPoint[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6); // Last 7 days including today
  startDate.setHours(0, 0, 0, 0); // Start of day

  const sessions = await getRecentFocusSessions(userId, startDate);

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
export const checkAndCreateFocusSession = async (currentUserId: string): Promise<void> => {
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
      const existingSession = await findActiveSessionByUsers(userIds);
      
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
      
      await createFocusSessionWithUsers(
        userIds,
        now,
        endTime,
        0, // minutes start at 0, will be calculated when session ends
        'active'
      );
    }
  } catch (error) {
    // Log error but don't throw - heartbeat should continue even if session creation fails
    console.error('Error in checkAndCreateFocusSession:', error);
  }
};

