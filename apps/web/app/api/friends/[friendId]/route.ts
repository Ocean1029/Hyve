// app/api/friends/[friendId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { deleteFriendService } from '@/modules/friends/service';

/**
 * @swagger
 * /api/friends/{friendId}:
 *   delete:
 *     summary: Delete a friend
 *     description: Remove the friend relationship. Only the user who added the friend can delete it.
 *     tags:
 *       - Friends
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend record ID (not user ID)
 *     responses:
 *       200:
 *         description: Friend deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not the owner of this friend record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Friend not found
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { friendId } = await params;
    const result = await deleteFriendService(friendId, session.user.id);

    if (!result.success) {
      if (result.error === 'Friend not found') {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 });
      }
      if (result.error === 'Forbidden') {
        return NextResponse.json({ success: false, error: result.error }, { status: 403 });
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting friend:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
