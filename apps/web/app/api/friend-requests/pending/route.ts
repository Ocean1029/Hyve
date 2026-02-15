// app/api/friend-requests/pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { getPendingRequestsService } from '@/modules/friend-requests/service';

/**
 * @swagger
 * /api/friend-requests/pending:
 *   get:
 *     summary: Get pending friend requests
 *     description: Get pending friend requests received by the current user.
 *     tags:
 *       - Friend Requests
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PendingRequestsResponse'
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
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', requests: [] },
        { status: 401 }
      );
    }

    const result = await getPendingRequestsService(session.user.id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, requests: [] },
        { status: 500 }
      );
    }

    const requests = (result.requests ?? []).map((r: { id: string; senderId: string; receiverId: string; status: string; createdAt?: Date }) => ({
      id: r.id,
      senderId: r.senderId,
      receiverId: r.receiverId,
      status: r.status,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', requests: [] },
      { status: 500 }
    );
  }
}
