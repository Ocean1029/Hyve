// app/api/presence/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMultipleUsersStatusService } from '@/modules/presence/service';
import { GetUsersStatusRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/presence/users:
 *   post:
 *     summary: Get multiple users' online status
 *     description: Get online status for a list of user IDs.
 *     tags:
 *       - Presence
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GetUsersStatusRequest'
 *     responses:
 *       200:
 *         description: List of user statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserStatusItem'
 *       401:
 *         description: Unauthorized (returns empty array)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: {}
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
      return NextResponse.json([]);
    }

    const validation = await validateRequest(request, GetUsersStatusRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const statuses = await getMultipleUsersStatusService(validation.data.userIds);
    const serialized = statuses.map(
      (s: { userId: string; isOnline: boolean; lastSeenAt: Date | null }) => ({
        userId: s.userId,
        isOnline: s.isOnline,
        lastSeenAt:
          s.lastSeenAt instanceof Date ? s.lastSeenAt.toISOString() : s.lastSeenAt,
      })
    );
    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error getting users status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
