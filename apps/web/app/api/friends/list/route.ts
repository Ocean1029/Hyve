// app/api/friends/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { getFriendListService } from '@/modules/friends/service';

/**
 * GET /api/friends/list
 * Returns the authenticated user's friend list with details (for dashboard, mobile).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', friends: [] }, { status: 401 });
    }

    const friends = await getFriendListService(session.user.id);
    return NextResponse.json({ friends });
  } catch (error) {
    console.error('Error getting friends list:', error);
    return NextResponse.json(
      { error: 'Internal server error', friends: [] },
      { status: 500 }
    );
  }
}
