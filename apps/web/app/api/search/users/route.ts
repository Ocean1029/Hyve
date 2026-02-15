// app/api/search/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { searchUsersService } from '@/modules/search/service';

/**
 * @swagger
 * /api/search/users:
 *   get:
 *     summary: Search users
 *     description: Search users by ID, userId, name, or email. Excludes current user. Returns up to 20 results with friend count.
 *     tags:
 *       - Search
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search string
 *     responses:
 *       200:
 *         description: List of matching users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchUsersResponse'
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
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') ?? '';
    const users = await searchUsersService(query, currentUserId ?? undefined);

    const usersSerialized = users.map((u) => ({
      ...u,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    }));
    return NextResponse.json({ success: true, users: usersSerialized });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', users: [] },
      { status: 500 }
    );
  }
}
