// app/api/sessions/weekly/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { getWeeklyFocusMinutesService } from '@/modules/sessions/service';

/**
 * GET /api/sessions/weekly
 * Returns weekly focus minutes chart data for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', chartData: [] },
        { status: 401 }
      );
    }

    const chartData = await getWeeklyFocusMinutesService(session.user.id);
    return NextResponse.json({ chartData });
  } catch (error) {
    console.error('Error getting weekly sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error', chartData: [] },
      { status: 500 }
    );
  }
}
