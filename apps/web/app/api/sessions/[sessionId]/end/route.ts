// app/api/sessions/[sessionId]/end/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { endFocusSessionService } from '@/modules/sessions/service';

/**
 * POST /api/sessions/[sessionId]/end
 * End a focus session for all participants
 * When any user ends the session, all participants' sessions are ended
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
    const { endTime, minutes } = body;

    const result = await endFocusSessionService(
      sessionId,
      userId,
      endTime ? new Date(endTime) : undefined,
      minutes
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: result.session,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

