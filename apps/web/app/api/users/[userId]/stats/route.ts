// app/api/users/[userId]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/users/{userId}/stats:
 *   get:
 *     summary: Get user stats
 *     description: Get total sessions, memories, and focus minutes for a user. Path userId must match the current user.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must match authenticated user)
 *     responses:
 *       200:
 *         description: User stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStatsResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = await params;
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const [totalSessions, totalMemories, totalMinutesAgg] = await Promise.all([
      prisma.focusSession.count({
        where: {
          users: { some: { userId } },
        },
      }),
      prisma.memory.count({
        where: { userId },
      }),
      prisma.focusSession.aggregate({
        where: {
          users: { some: { userId } },
        },
        _sum: { minutes: true },
      }),
    ]);

    const totalMinutes = totalMinutesAgg._sum.minutes ?? 0;
    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        totalMemories,
        totalMinutes,
      },
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
