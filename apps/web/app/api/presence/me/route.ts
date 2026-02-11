// app/api/presence/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserOnlineStatusService } from '@/modules/presence/service';

/**
 * @swagger
 * /api/presence/me:
 *   get:
 *     summary: Get my online status
 *     description: Get the current authenticated user's online status and last seen time.
 *     tags:
 *       - Presence
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user's online status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresenceMeResponse'
 *       401:
 *         description: Unauthorized (returns isOnline false, lastSeenAt null)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresenceMeResponse'
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
      return NextResponse.json({ isOnline: false, lastSeenAt: null });
    }

    const result = await getUserOnlineStatusService(session.user.id);
    const lastSeenAt =
      result.lastSeenAt instanceof Date
        ? result.lastSeenAt.toISOString()
        : result.lastSeenAt;
    return NextResponse.json({
      isOnline: result.isOnline,
      lastSeenAt,
    });
  } catch (error) {
    console.error('Error getting my presence:', error);
    return NextResponse.json(
      { isOnline: false, lastSeenAt: null },
      { status: 500 }
    );
  }
}
