// app/api/sessions/[sessionId]/pause/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

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

    if (typeof isPaused !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isPaused must be a boolean' },
        { status: 400 }
      );
    }

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
        { success: false, error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Update current user's pause status
    await prisma.focusSessionUser.update({
      where: {
        id: sessionUser.id,
      },
      data: {
        isPaused: isPaused,
        updatedAt: new Date(),
      },
    });

    // Get all users in this session to return updated status
    const sessionUsers = await prisma.focusSessionUser.findMany({
      where: {
        focusSessionId: sessionId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Check if any user has paused (if any user picks up phone, session is paused for all)
    const hasAnyPaused = sessionUsers.some((su: typeof sessionUsers[0]) => su.isPaused);

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      isPaused: hasAnyPaused, // Overall session pause status (true if any user paused)
      users: sessionUsers.map((su: typeof sessionUsers[0]) => ({
        userId: su.userId,
        userName: su.user.name,
        userImage: su.user.image,
        isPaused: su.isPaused,
      })),
    });
  } catch (error) {
    console.error('Error updating pause status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update pause status' },
      { status: 500 }
    );
  }
}

