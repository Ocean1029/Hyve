// app/api/sessions/[sessionId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSessionStatusService } from '@/modules/sessions/service';

/**
 * @swagger
 * /api/sessions/{sessionId}/status:
 *   get:
 *     summary: Get focus session status
 *     description: Get current status of a focus session including pause status of all participants
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "session-1"
 *         description: Focus session ID
 *     responses:
 *       200:
 *         description: Session status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionStatusResponse'
 *             example:
 *               success: true
 *               sessionId: "session-1"
 *               status: "active"
 *               isPaused: false
 *               users:
 *                 - userId: "alex-chen"
 *                   isPaused: false
 *                 - userId: "kai-user"
 *                   isPaused: false
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found or user not a participant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Session not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { sessionId } = await params;

    const result = await getSessionStatusService(sessionId, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      status: result.status,
      isPaused: result.isPaused,
      users: result.users,
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get session status' },
      { status: 500 }
    );
  }
}

