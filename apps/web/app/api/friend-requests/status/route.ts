// app/api/friend-requests/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkFriendRequestStatusService } from '@/modules/friend-requests/service';

/**
 * @swagger
 * /api/friend-requests/status:
 *   get:
 *     summary: Check friend request status
 *     description: Check the friend request status between the current user and another user.
 *     tags:
 *       - Friend Requests
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The other user's ID
 *     responses:
 *       200:
 *         description: Status (none, sent, received, accepted, rejected)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckFriendRequestStatusResponse'
 *       401:
 *         description: Unauthorized (returns status none)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckFriendRequestStatusResponse'
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
      return NextResponse.json({ status: 'none' });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const result = await checkFriendRequestStatusService(session.user.id, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking friend request status:', error);
    return NextResponse.json({ status: 'none' });
  }
}
