// app/api/friend-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendFriendRequestService } from '@/modules/friend-requests/service';
import { SendFriendRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/friend-requests:
 *   post:
 *     summary: Send a friend request
 *     description: Send a friend request to another user.
 *     tags:
 *       - Friend Requests
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendFriendRequest'
 *     responses:
 *       200:
 *         description: Request sent or error (e.g. already friends)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                 alreadyExists:
 *                   type: boolean
 *       400:
 *         description: Validation error or business rule (e.g. cannot send to self)
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
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const validation = await validateRequest(request, SendFriendRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const result = await sendFriendRequestService(
      session.user.id,
      validation.data.receiverId
    );

    if (!result.success) {
      const status = result.alreadyExists ? 409 : 400;
      return NextResponse.json(
        { success: false, error: result.error, alreadyExists: result.alreadyExists },
        { status }
      );
    }

    return NextResponse.json({ success: true, request: result.request });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
