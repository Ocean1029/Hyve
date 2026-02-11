// app/api/presence/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFriendsStatusService } from '@/modules/presence/service';

/**
 * @swagger
 * /api/presence/status:
 *   get:
 *     summary: Get friends' online status
 *     description: Get online status for all friends of the current authenticated user
 *     tags:
 *       - Presence
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved friends' status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresenceStatusResponse'
 *             example:
 *               statuses:
 *                 - userId: "kai-user"
 *                   isOnline: true
 *                   lastSeenAt: "2024-01-15T14:30:00Z"
 *                 - userId: "sarah-user"
 *                   isOnline: false
 *                   lastSeenAt: "2024-01-15T13:15:00Z"
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const statuses = await getFriendsStatusService(session.user.id);
    
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error in status route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



