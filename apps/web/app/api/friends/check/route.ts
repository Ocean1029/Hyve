// app/api/friends/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/friends/check:
 *   get:
 *     summary: Check if user is friend
 *     description: Check whether the current user and the given user are friends (bidirectional).
 *     tags:
 *       - Friends
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
 *         description: success and isFriend
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckFriendResponse'
 *       401:
 *         description: Unauthorized (returns success false, isFriend false)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckFriendResponse'
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
      return NextResponse.json({ success: false, isFriend: false });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const sourceUserId = session.user.id;
    const existingFriend1 = await prisma.friend.findUnique({
      where: {
        userId_sourceUserId: { userId, sourceUserId },
      },
    });
    const existingFriend2 = await prisma.friend.findUnique({
      where: {
        userId_sourceUserId: { userId: sourceUserId, sourceUserId: userId },
      },
    });
    const isFriend = !!(existingFriend1 || existingFriend2);
    return NextResponse.json({ success: true, isFriend });
  } catch (error) {
    console.error('Error checking friend:', error);
    return NextResponse.json({ success: false, isFriend: false }, { status: 500 });
  }
}
