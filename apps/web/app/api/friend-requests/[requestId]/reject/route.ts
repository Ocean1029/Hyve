// app/api/friend-requests/[requestId]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rejectFriendRequestService } from '@/modules/friend-requests/service';

/**
 * @swagger
 * /api/friend-requests/{requestId}/reject:
 *   post:
 *     summary: Reject a friend request
 *     description: Reject a pending friend request.
 *     tags:
 *       - Friend Requests
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend request ID
 *     responses:
 *       200:
 *         description: Request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Request not found or already processed
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
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { requestId } = await params;
    const result = await rejectFriendRequestService(requestId, session.user.id);

    if (!result.success) {
      const status = result.error === 'Friend request not found' ? 404 : result.error === 'Unauthorized' ? 403 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
