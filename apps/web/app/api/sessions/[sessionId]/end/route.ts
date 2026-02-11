// app/api/sessions/[sessionId]/end/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { endFocusSessionService } from '@/modules/sessions/service';
import { EndSessionRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/sessions/{sessionId}/end:
 *   post:
 *     summary: End a focus session
 *     description: End a focus session for all participants. When any user ends the session, all participants' sessions are ended.
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EndSessionRequest'
 *           example:
 *             endTime: "2024-01-15T16:30:00Z"
 *             minutes: 45
 *     responses:
 *       200:
 *         description: Session ended successfully
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
 *         description: Invalid request body
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
 *                   example: "Invalid request"
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
export async function POST(
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

    // Validate request body
    const validation = await validateRequest(request, EndSessionRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { endTime, minutes } = validation.data;

    const result = await endFocusSessionService(
      sessionId,
      userId,
      endTime ? new Date(endTime) : undefined,
      minutes
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: result.session,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

