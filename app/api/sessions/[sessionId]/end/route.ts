// app/api/sessions/[sessionId]/end/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

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

    // Verify user is part of this session
    const sessionUser = await prisma.focusSessionUser.findUnique({
      where: {
        focusSessionId_userId: {
          focusSessionId: sessionId,
          userId: userId,
        },
      },
      include: {
        focusSession: true,
      },
    });

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'User is not part of this session' },
        { status: 403 }
      );
    }

    // Check if session is still active
    if (sessionUser.focusSession.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Session is already ended' },
        { status: 400 }
      );
    }

    // Update session status to 'completed' for all participants
    const updatedSession = await prisma.focusSession.update({
      where: {
        id: sessionId,
      },
      data: {
        status: 'completed',
        endTime: endTime ? new Date(endTime) : new Date(),
        minutes: minutes !== undefined ? minutes : sessionUser.focusSession.minutes,
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        memories: {
          include: {
            photos: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

