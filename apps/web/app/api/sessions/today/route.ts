// app/api/sessions/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { getTodayFocusSessionsService } from '@/modules/sessions/service';

function serializeSession(session: {
  id: string;
  status?: string;
  startTime?: Date;
  endTime?: Date | null;
  minutes?: number;
  createdAt?: Date;
}) {
  return {
    id: session.id,
    sessionId: session.id,
    status: session.status ?? 'active',
    startTime:
      session.startTime instanceof Date
        ? session.startTime.toISOString()
        : session.startTime,
    endTime:
      session.endTime instanceof Date
        ? session.endTime.toISOString()
        : session.endTime ?? null,
    minutes: session.minutes,
    createdAt:
      session.createdAt instanceof Date
        ? session.createdAt.toISOString()
        : (session as { createdAt?: string }).createdAt,
  };
}

/**
 * @swagger
 * /api/sessions/today:
 *   get:
 *     summary: Get today's focus sessions
 *     description: Get focus sessions for the authenticated user for today, with total minutes.
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must match authenticated user)
 *     responses:
 *       200:
 *         description: Today's sessions and total minutes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodaySessionsResponse'
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
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', sessions: [], totalMinutes: 0 },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required', sessions: [], totalMinutes: 0 },
        { status: 400 }
      );
    }

    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', sessions: [], totalMinutes: 0 },
        { status: 403 }
      );
    }

    const result = await getTodayFocusSessionsService(userId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, sessions: [], totalMinutes: 0 },
        { status: 500 }
      );
    }

    const sessions = (result.sessions ?? []).map((s: Record<string, unknown>) =>
      serializeSession(s as Parameters<typeof serializeSession>[0])
    );
    return NextResponse.json({
      success: true,
      sessions,
      totalMinutes: result.totalMinutes ?? 0,
    });
  } catch (error) {
    console.error('Error getting today sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', sessions: [], totalMinutes: 0 },
      { status: 500 }
    );
  }
}
