// app/api/presence/heartbeat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateUserHeartbeatService } from '@/modules/presence/service';

/**
 * @swagger
 * /api/presence/heartbeat:
 *   post:
 *     summary: Update user heartbeat
 *     description: Update the current authenticated user's last seen timestamp to indicate they are online
 *     tags:
 *       - Presence
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Heartbeat updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *             example:
 *               success: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
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

    const result = await updateUserHeartbeatService(session.user.id);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in heartbeat route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



