// app/api/sessions/[sessionId]/pause/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updatePauseStatusService } from '@/modules/sessions/service';

/**
 * POST /api/sessions/[sessionId]/pause
 * Update user's pause status in a focus session
 * When any user picks up their phone (isPaused = true), all participants' sessions are paused
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { sessionId } = await params;
    const body = await request.json();
    const { isPaused } = body;

    const result = await updatePauseStatusService(sessionId, userId, isPaused);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      isPaused: result.isPaused,
      users: result.users,
    });
  } catch (error) {
    console.error('Error updating pause status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update pause status' },
      { status: 500 }
    );
  }
}

