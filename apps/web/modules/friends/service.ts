// modules/friends/service.ts
import { getFriendsWithDetails, getFriendsWithLastMessage, getFriendById, getFriendsForSpringBloom, getUserFriendCount } from './repository';
import { Friend } from '@hyve/types';
import { GoogleGenAI } from '@google/genai';

/**
 * Generate tags from memory contents using Gemini API
 */
const generateTagsFromMemories = async (memoryContents: string[]): Promise<string[]> => {
  if (!memoryContents || memoryContents.length === 0) {
    return [];
  }

  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found, skipping tag generation');
    return [];
  }

  // Filter out null/undefined/empty strings
  const validContents = memoryContents
    .filter((content: string) => content && content.trim().length > 0)
    .slice(0, 20); // Limit to 20 most recent memories to avoid token limits

  if (validContents.length === 0) {
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Combine all memory contents into a single text
    const combinedContent = validContents.join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following memory entries and generate 2-3 short activity tags that best describe the shared experiences. 
Each tag should be 2-4 words, in English, and describe a specific activity or theme (e.g., "Late Night Study", "Coffee Runs", "Gym Buddy", "Jam Sessions").
Return only the tags, one per line, without numbers or bullets. Do not include any other text.

Memory entries:
${combinedContent}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed is priority here
      }
    });

    const responseText = response.text || '';
    
    // Parse the response to extract tags
    // Split by newlines and filter out empty lines
    const tags = responseText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3); // Limit to 3 tags max

    return tags;
  } catch (error) {
    console.error('Failed to generate tags with Gemini API:', error);
    return [];
  }
};

export const getFriendListService = async (sourceUserId: string): Promise<Friend[]> => {
  const friends = await getFriendsWithDetails(sourceUserId);
  
  // Batch fetch friend counts for all friends
  const friendCounts = await Promise.all(
    friends.map((f: any) => getUserFriendCount(f.user.id))
  );
  
  return friends.map((f: any, index: number) => {
    // Collect memories from all focus sessions with this friend
    // Note: We need to find sessions where both current user and friend participated
    // For now, we'll get memories from sessions where the friend's user participated
    const allMemories: any[] = [];
    f.focusSessionUsers?.forEach((fsu: any) => {
      if (fsu.focusSession?.memories) {
        // Filter memories to only include those from the friend's user
        const friendMemories = fsu.focusSession.memories.filter(
          (m: any) => m.userId === f.userId
        );
        allMemories.push(...friendMemories);
      }
    });
    
    // Sort by timestamp and take recent ones
    const recentMemories = allMemories
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map((m: any) => {
        // Find the FocusSession that this memory belongs to
        let focusSessionMinutes: number | undefined;
        f.focusSessionUsers?.forEach((fsu: any) => {
          if (fsu.focusSession?.id === m.focusSessionId) {
            focusSessionMinutes = fsu.focusSession.minutes;
          }
        });
        
        return {
          id: m.id,
          type: m.type,
          content: m.content,
          timestamp: m.timestamp,
          focusSessionId: m.focusSessionId,
          photos: m.photos || [],
          focusSessionMinutes,
          location: m.location,
        };
      });
    
    return {
      id: f.id,
      userId: f.userId, // Include the actual user ID
      name: f.user.name || 'Unknown User',
      avatar: f.user.image || '',
      totalHours: f.totalHours,
      streak: f.streak,
      recentMemories,
      friendCount: friendCounts[index],
      sessionCount: f.focusSessionUsers?.length || 0,
    };
  });
};

export const getFriendsForMessagesService = async (sourceUserId: string): Promise<Friend[]> => {
  const friends = await getFriendsWithLastMessage(sourceUserId);

  // Sort friends by:
  // 1. Friends with messages (by last message timestamp, newest first)
  // 2. Friends without messages (by friend creation time, newest first)
  const sortedFriends = friends.sort((a: any, b: any) => {
    const aLastMessage = a.messages[0];
    const bLastMessage = b.messages[0];

    // Both have messages - sort by message timestamp
    if (aLastMessage && bLastMessage) {
      return new Date(bLastMessage.timestamp).getTime() - new Date(aLastMessage.timestamp).getTime();
    }

    // Only a has messages - a comes first
    if (aLastMessage && !bLastMessage) {
      return -1;
    }

    // Only b has messages - b comes first
    if (!aLastMessage && bLastMessage) {
      return 1;
    }

    // Neither has messages - sort by friend creation time (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return sortedFriends.map((f: any) => {
    // Collect memories from all focus sessions with this friend
    const allMemories: any[] = [];
    f.focusSessionUsers?.forEach((fsu: any) => {
      if (fsu.focusSession?.memories) {
        // Filter memories to only include those from the friend's user
        const friendMemories = fsu.focusSession.memories.filter(
          (m: any) => m.userId === f.userId
        );
        allMemories.push(...friendMemories);
      }
    });
    
    // Sort by timestamp and take recent ones
    const recentMemories = allMemories
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map((m: any) => {
        // Find the FocusSession that this memory belongs to
        let focusSessionMinutes: number | undefined;
        f.focusSessionUsers?.forEach((fsu: any) => {
          if (fsu.focusSession?.id === m.focusSessionId) {
            focusSessionMinutes = fsu.focusSession.minutes;
          }
        });
        
        return {
          id: m.id,
          type: m.type,
          content: m.content,
          timestamp: m.timestamp,
          focusSessionId: m.focusSessionId,
          photos: m.photos || [],
          focusSessionMinutes,
          location: m.location,
        };
      });
    
    return {
      id: f.id,
      userId: f.userId, // Include the actual user ID
      name: f.user.name || 'Unknown User',
      avatar: f.user.image || '',
      totalHours: f.totalHours,
      streak: f.streak,
      recentMemories,
      lastMessage: f.messages[0] ? {
        id: f.messages[0].id,
        content: f.messages[0].content,
        senderId: f.messages[0].senderId,
        timestamp: f.messages[0].timestamp,
      } : undefined,
    };
  });
};

export const getFriendByIdService = async (friendId: string, sourceUserId: string): Promise<Friend | null> => {
  const friend = await getFriendById(friendId, sourceUserId);
  
  if (!friend) {
    return null;
  }
  
  // Collect memories from all focus sessions with this friend
  const allMemories: any[] = [];
  friend.focusSessionUsers?.forEach((fsu: any) => {
    if (fsu.focusSession?.memories) {
      // Filter memories to only include those from the friend's user
      const friendMemories = fsu.focusSession.memories.filter(
        (m: any) => m.userId === friend.userId
      );
      allMemories.push(...friendMemories);
    }
  });
  
    // Sort by timestamp and take recent ones
    const recentMemories = allMemories
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
      .map((m: any) => {
        // Find the FocusSession that this memory belongs to
        let focusSessionMinutes: number | undefined;
        friend.focusSessionUsers?.forEach((fsu: any) => {
          if (fsu.focusSession?.id === m.focusSessionId) {
            focusSessionMinutes = fsu.focusSession.minutes;
          }
        });
        
        return {
          id: m.id,
          type: m.type,
          content: m.content,
          timestamp: m.timestamp,
          focusSessionId: m.focusSessionId,
          photos: m.photos || [],
          focusSessionMinutes,
          location: m.location,
        };
      });
  
  // Get friend count for this friend's user (how many friends they have)
  const friendCount = await getUserFriendCount(friend.user.id);
  
  // Get session count (number of focus sessions with this friend)
  const sessionCount = friend.focusSessionUsers?.length || 0;
  
  return {
    id: friend.id,
    userId: friend.userId, // Include the actual user ID
    name: friend.user.name || 'Unknown User',
    avatar: friend.user.image || '',
    totalHours: friend.totalHours,
    streak: friend.streak,
    recentMemories,
    friendCount,
    sessionCount,
  };
};

/**
 * Get Spring Bloom data for the last 3 months
 * Returns ranked list of friends with total hours and generated tags
 */
export interface SpringBloomEntry {
  rank: number;
  name: string;
  avatar: string;
  hours: number;
  tags: string[];
}

export const getSpringBloomDataService = async (sourceUserId: string): Promise<SpringBloomEntry[]> => {
  try {
    // Get friends with focus sessions in the last 3 months
    const friends = await getFriendsForSpringBloom(sourceUserId);

    if (!friends || friends.length === 0) {
      return [];
    }

    // Process each friend to calculate hours and collect memory contents
    const friendData = await Promise.all(
      friends.map(async (f: any) => {
        try {
          // Calculate total hours from focus sessions in the last 3 months
          let totalMinutes = 0;
          const memoryContents: string[] = [];

          f.focusSessionUsers?.forEach((fsu: any) => {
            if (fsu.focusSession) {
              // Add minutes from this focus session
              totalMinutes += fsu.focusSession.minutes || 0;

              // Collect memory contents (only from the friend's user)
              if (fsu.focusSession.memories) {
                fsu.focusSession.memories.forEach((memory: any) => {
                  // Only include memories from the friend's user
                  if (memory.userId === f.userId && memory.content && memory.content.trim()) {
                    memoryContents.push(memory.content.trim());
                  }
                });
              }
            }
          });

          const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place

          // Generate tags from memory contents (non-blocking, returns empty array on error)
          const tags = await generateTagsFromMemories(memoryContents).catch((error) => {
            console.error('Error generating tags for friend:', f.user?.name, error);
            return [];
          });

          return {
            friendId: f.id,
            name: f.user?.name || 'Unknown User',
            avatar: f.user?.image || '',
            hours: totalHours,
            tags,
          };
        } catch (error) {
          console.error('Error processing friend:', f.user?.name, error);
          // Return null to filter out later
          return null;
        }
      })
    );

    // Filter out null values and friends with 0 hours, then sort by hours (descending)
    const rankedFriends = friendData
      .filter((f): f is NonNullable<typeof f> => f !== null && f.hours > 0)
      .sort((a, b) => b.hours - a.hours)
      .map((f, index) => ({
        rank: index + 1,
        name: f.name,
        avatar: f.avatar,
        hours: f.hours,
        tags: f.tags,
      }));

    return rankedFriends;
  } catch (error) {
    console.error('Error in getSpringBloomDataService:', error);
    return [];
  }
};

