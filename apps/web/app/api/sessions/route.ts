// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  createFocusSessionService,
  getUserFocusSessionsService,
} from '@/modules/sessions/service';
import { CreateSessionRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

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
 * /api/sessions:
 *   post:
 *     summary: Create a focus session
 *     description: Create a new focus session with the given user IDs, duration, and time range.
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSessionRequest'
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 session:
 *                   $ref: '#/components/schemas/FocusSession'
 *       400:
 *         description: Validation error or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
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
 *   get:
 *     summary: Get user focus sessions
 *     description: Get focus sessions for the authenticated user. Requires userId query to match the current user.
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
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of sessions to return
 *     responses:
 *       200:
 *         description: List of focus sessions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListSessionsResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - userId does not match current user
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
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const validation = await validateRequest(request, CreateSessionRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { userIds, durationSeconds, startTime, endTime } = validation.data;
    const result = await createFocusSessionService(
      userIds,
      durationSeconds,
      new Date(startTime),
      new Date(endTime)
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const sessionData = result.session as {
      id: string;
      status?: string;
      startTime?: Date;
      endTime?: Date | null;
      minutes?: number;
      createdAt?: Date;
    };
    return NextResponse.json({
      success: true,
      session: sessionData ? serializeSession(sessionData) : result.session,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', sessions: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : 10;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required', sessions: [] },
        { status: 400 }
      );
    }

    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', sessions: [] },
        { status: 403 }
      );
    }

    const result = await getUserFocusSessionsService(userId, limit);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, sessions: [] },
        { status: 500 }
      );
    }

    const sessions = (result.sessions ?? []).map((s: Record<string, unknown>) =>
      serializeSession(s as Parameters<typeof serializeSession>[0])
    );
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', sessions: [] },
      { status: 500 }
    );
  }
}
