// app/api/memories/peak-happiness/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { getPeakHappinessMemoriesService } from '@/modules/memories/service';

/**
 * GET /api/memories/peak-happiness
 * Returns peak happiness memories for the authenticated user.
 * Query: limit (default 5)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', memories: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam
      ? Math.min(Math.max(1, parseInt(limitParam, 10)), 20)
      : 5;

    const memories = await getPeakHappinessMemoriesService(
      session.user.id,
      limit
    );

    const serialized = memories.map((m) => {
      const mem = m as {
        id: string;
        content: string | null;
        location: string | null;
        timestamp: Date;
        happyIndex: number | null;
        photos: { id: string; photoUrl: string }[];
        focusSession?: {
          id: string;
          startTime: Date;
          endTime: Date | null;
          friends?: unknown[];
        };
      };
      return {
        ...mem,
        timestamp:
          mem.timestamp instanceof Date
            ? mem.timestamp.toISOString()
            : mem.timestamp,
        focusSession: mem.focusSession
          ? {
              ...mem.focusSession,
              startTime:
                mem.focusSession.startTime instanceof Date
                  ? mem.focusSession.startTime.toISOString()
                  : mem.focusSession.startTime,
              endTime:
                mem.focusSession.endTime instanceof Date
                  ? mem.focusSession.endTime.toISOString()
                  : mem.focusSession.endTime ?? null,
            }
          : undefined,
      };
    });

    return NextResponse.json({ success: true, memories: serialized });
  } catch (error) {
    console.error('Error getting peak happiness memories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', memories: [] },
      { status: 500 }
    );
  }
}
