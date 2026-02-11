// app/api/friends/spring-bloom/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSpringBloomDataService } from '@/modules/friends/service';

/**
 * @swagger
 * /api/friends/spring-bloom:
 *   get:
 *     summary: Get Spring Bloom data
 *     description: Get ranked list of friends with total hours and tags from the last 3 months.
 *     tags:
 *       - Friends
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Spring Bloom data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpringBloomResponse'
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
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await getSpringBloomDataService(session.user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error getting Spring Bloom data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
