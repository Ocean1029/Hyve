// app/api/friend-requests/[requestId]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { acceptFriendRequestService } from '@/modules/friend-requests/service';

/**
 * @swagger
 * /api/friend-requests/{requestId}/accept:
 *   post:
 *     summary: Accept a friend request
 *     description: Accept a pending friend request. Creates bidirectional friend relationships.
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
 *         description: Request accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 friend:
 *                   type: object
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
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { requestId } = await params;
    const result = await acceptFriendRequestService(requestId, session.user.id);

    if (!result.success) {
      const status = result.error === 'Friend request not found' ? 404 : result.error === 'Unauthorized' ? 403 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({ success: true, friend: result.friend });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
