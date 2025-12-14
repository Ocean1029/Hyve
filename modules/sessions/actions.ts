'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function createFocusSession(
  userId: string,
  friendIds: string[],
  durationSeconds: number,
  startTime: Date,
  endTime: Date
) {
  try {
    // Use transaction to ensure data consistency
    const session = await prisma.$transaction(async (tx: any) => {
      // Create FocusSession record with actual start and end times
      const focusSession = await tx.focusSession.create({
        data: {
          userId,
          startTime: startTime,
          endTime: endTime,
          minutes: Math.floor(durationSeconds / 60),
        },
      });

      // Create FocusSessionFriend records for each friend
      if (friendIds.length > 0) {
        await tx.focusSessionFriend.createMany({
          data: friendIds.map((friendId) => ({
            focusSessionId: focusSession.id,
            friendId,
          })),
        });
      }

      // Return session with friends included
      return await tx.focusSession.findUnique({
        where: { id: focusSession.id },
        include: {
          friends: {
            include: {
              friend: true,
            },
          },
        },
      });
    });

    // Revalidate the home page to update the chart
    revalidatePath('/');

    return { success: true, session };
  } catch (error) {
    console.error('Failed to create focus session:', error);
    return { success: false, error: 'Failed to create focus session' };
  }
}

export async function getUserFocusSessions(userId: string, limit = 10) {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        friends: {
          include: {
            friend: true,
          },
        },
        memories: {
          include: {
            photos: true,
          },
        },
      },
    });

    return { success: true, sessions };
  } catch (error) {
    console.error('Failed to get focus sessions:', error);
    return { success: false, error: 'Failed to get focus sessions' };
  }
}

export async function getTodayFocusSessions(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await prisma.focusSession.findMany({
      where: {
        userId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        minutes: {
          gte: 1,
        },
      },
      orderBy: { startTime: 'asc' },
      include: {
        friends: {
          include: {
            friend: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        memories: {
          include: {
            photos: true,
          },
        },
      },
    });

    // Calculate total minutes for today
    const totalMinutes = sessions.reduce((sum: number, session: { minutes: number }) => sum + session.minutes, 0);

    return { success: true, sessions, totalMinutes };
  } catch (error) {
    console.error('Failed to get today focus sessions:', error);
    return { success: false, error: 'Failed to get today focus sessions' };
  }
}



