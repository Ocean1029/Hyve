// app/api/search/friends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { searchFriendsService } from '@/modules/search/service';

/**
 * @swagger
 * /api/search/friends:
 *   get:
 *     summary: Search friends
 *     description: Search friends by ID or name. Returns up to 20 results.
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
 *         description: List of matching friends
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchFriendsResponse'
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
        { success: false, error: 'Unauthorized', friends: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') ?? '';
    const friendsRaw = await searchFriendsService(query, session.user.id);

    const friends = friendsRaw.map((f: { createdAt?: Date; [k: string]: unknown }) => ({
      ...f,
      createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
    }));
    return NextResponse.json({ success: true, friends });
  } catch (error) {
    console.error('Error searching friends:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', friends: [] },
      { status: 500 }
    );
  }
}
