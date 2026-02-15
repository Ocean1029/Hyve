// app/api/sessions/[sessionId]/pause/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { updatePauseStatusService } from '@/modules/sessions/service';
import { PauseSessionRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/sessions/{sessionId}/pause:
 *   post:
 *     summary: Pause or resume a focus session
 *     description: Update user's pause status in a focus session. When any user picks up their phone (isPaused = true), all participants' sessions are paused.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PauseSessionRequest'
 *           example:
 *             isPaused: true
 *     responses:
 *       200:
 *         description: Pause status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sessionId:
 *                   type: string
 *                   example: "session-1"
 *                 isPaused:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "alex-chen"
 *                       isPaused:
 *                         type: boolean
 *                         example: true
 *       400:
 *         description: Invalid request body
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
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { sessionId } = await params;

    // Validate request body
    const validation = await validateRequest(request, PauseSessionRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { isPaused } = validation.data;

    const result = await updatePauseStatusService(sessionId, userId, isPaused);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      isPaused: result.isPaused,
      users: result.users,
    });
  } catch (error) {
    console.error('Error updating pause status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update pause status' },
      { status: 500 }
    );
  }
}

