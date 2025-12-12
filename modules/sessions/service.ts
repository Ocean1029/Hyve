// modules/sessions/service.ts
import { getRecentFocusSessions } from './repository';
import { ChartDataPoint } from '@/lib/types';

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
  sessions.forEach(session => {
    const dayName = daysOfWeek[session.date.getDay()];
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

