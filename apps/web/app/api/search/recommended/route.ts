// app/api/search/recommended/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { getRecommendedUsersService } from '@/modules/search/service';

/**
 * @swagger
 * /api/search/recommended:
 *   get:
 *     summary: Get recommended users
 *     description: Get recommended users to add as friends. Excludes current user and existing friends. Prioritizes active users.
 *     tags:
 *       - Search
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of recommended users (up to 15)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetRecommendedUsersResponse'
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
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await getRecommendedUsersService(session.user.id);

    const usersSerialized = users.map((u) => ({
      ...u,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    }));
    return NextResponse.json({ success: true, users: usersSerialized });
  } catch (error) {
    console.error('Error getting recommended users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', users: [] },
      { status: 500 }
    );
  }
}
