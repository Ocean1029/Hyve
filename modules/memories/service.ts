// modules/memories/service.ts
import prisma from '@/lib/prisma';

export interface WeeklyHappyIndexDataPoint {
  day: string;
  score: number;
}

export interface PeakHappinessMemory {
  id: string;
  content: string | null;
  location: string | null;
  timestamp: Date;
  happyIndex: number | null;
  photos: Array<{
    id: string;
    photoUrl: string;
  }>;
  focusSession: {
    id: string;
    startTime: Date;
    endTime: Date;
    friends: Array<{
      friend: {
        id: string;
        user: {
          name: string | null;
          image: string | null;
        };
      };
    }>; // Keep same structure for compatibility
  };
}

/**
 * Get weekly happy index data for the last 7 days
 * Groups memories by day and calculates average happyIndex for each day
 */
export const getWeeklyHappyIndexData = async (
  userId: string
): Promise<WeeklyHappyIndexDataPoint[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6); // Last 7 days including today
  startDate.setHours(0, 0, 0, 0); // Start of day
  endDate.setHours(23, 59, 59, 999); // End of day

  // Get all memories with happyIndex from the user's focus sessions in the last 7 days
  const memories = await prisma.memory.findMany({
    where: {
      userId: userId, // Filter by userId directly
      happyIndex: {
        not: null,
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      timestamp: true,
      happyIndex: true,
    },
  });

  // Group happyIndex values by day (using date string as key to handle same day name across weeks)
  const daysMap = new Map<string, { dayName: string; scores: number[]; date: Date }>();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  memories.forEach((memory: { timestamp: Date; happyIndex: number | null }) => {
    if (memory.happyIndex !== null) {
      const memoryDate = new Date(memory.timestamp);
      memoryDate.setHours(0, 0, 0, 0); // Normalize to start of day
      const dateKey = memoryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const dayName = daysOfWeek[memoryDate.getDay()];
      
      // Group scores by date
      if (!daysMap.has(dateKey)) {
        daysMap.set(dateKey, {
          dayName,
          scores: [],
          date: memoryDate,
        });
      }
      daysMap.get(dateKey)!.scores.push(memory.happyIndex);
    }
  });

  // Convert to array, sort by date (maintaining chronological order), and calculate averages
  const result: WeeklyHappyIndexDataPoint[] = Array.from(daysMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ dayName, scores }) => {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return {
        day: dayName,
        score: Math.round(average * 10) / 10, // Round to 1 decimal place
      };
    });

  return result;
};

/**
 * Get peak happiness memories (memories with highest happyIndex)
 * Returns top memories with full relations including focusSession, friends, and photos
 */
export const getPeakHappinessMemories = async (
  userId: string,
  limit: number = 5
): Promise<PeakHappinessMemory[]> => {
  const memories = await prisma.memory.findMany({
    where: {
      userId: userId, // Filter by userId directly
      happyIndex: {
        not: null,
      },
    },
    include: {
      photos: {
        select: {
          id: true,
          photoUrl: true,
        },
      },
      focusSession: {
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      happyIndex: 'desc',
    },
    take: limit,
  });

  return memories.map((memory: {
    id: string;
    content: string | null;
    location: string | null;
    timestamp: Date;
    happyIndex: number | null;
    photos: Array<{ id: string; photoUrl: string }>;
    focusSession: {
      id: string;
      startTime: Date;
      endTime: Date;
      friends: Array<{
        friend: {
          id: string;
          user: {
            name: string | null;
            image: string | null;
          };
        };
      }>;
    };
  }) => ({
    id: memory.id,
    content: memory.content,
    location: memory.location,
    timestamp: memory.timestamp,
    happyIndex: memory.happyIndex,
    photos: memory.photos.map((photo: { id: string; photoUrl: string }) => ({
      id: photo.id,
      photoUrl: photo.photoUrl,
    })),
    focusSession: {
      id: memory.focusSession.id,
      startTime: memory.focusSession.startTime,
      endTime: memory.focusSession.endTime,
      friends: memory.focusSession.users.map((fsu: {
        user: {
          id: string;
          name: string | null;
          image: string | null;
        };
      }) => ({
        friend: {
          id: fsu.user.id, // Use user.id as friend.id for compatibility
          user: {
            name: fsu.user.name,
            image: fsu.user.image,
          },
        },
      })),
    },
  }));
};

