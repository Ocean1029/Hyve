// app/api/sessions/active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSessionStreamDataService } from '@/modules/sessions/service';

/**
 * @swagger
 * /api/sessions/active:
 *   get:
 *     summary: Get active focus sessions
 *     description: Get currently active focus sessions for the authenticated user.
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
 *         description: List of active sessions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActiveSessionsResponse'
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', sessions: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
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

    const result = await getSessionStreamDataService(userId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, sessions: [] },
        { status: 500 }
      );
    }

    // NextResponse.json auto-serializes Date to ISO string
    return NextResponse.json({ success: true, sessions: result.sessions ?? [] });
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', sessions: [] },
      { status: 500 }
    );
  }
}
