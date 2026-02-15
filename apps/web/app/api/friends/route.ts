// app/api/friends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { createFriendService } from '@/modules/friends/service';
import { CreateFriendRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/friends:
 *   post:
 *     summary: Add a friend
 *     description: Create a friend relationship with another user (by their user ID).
 *     tags:
 *       - Friends
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFriendRequest'
 *     responses:
 *       200:
 *         description: Friend added successfully
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
 *         description: Validation error or already friends / cannot add self
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Friend already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *                 alreadyExists: { type: boolean, example: true }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const validation = await validateRequest(request, CreateFriendRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const result = await createFriendService(session.user.id, validation.data.userId);

    if (!result.success) {
      if (result.error === 'User not found') {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 });
      }
      if (result.alreadyExists) {
        return NextResponse.json(
          { success: false, error: result.error, alreadyExists: true },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, friend: result.friend });
  } catch (error) {
    console.error('Error creating friend:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
