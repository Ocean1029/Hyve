// app/api/memories/happy-index-weekly/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { getWeeklyHappyIndexDataService } from '@/modules/memories/service';

/**
 * GET /api/memories/happy-index-weekly
 * Returns weekly happy index data for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: [] },
        { status: 401 }
      );
    }

    const data = await getWeeklyHappyIndexDataService(session.user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error getting happy index weekly:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
