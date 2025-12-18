// app/api/sessions/[sessionId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/sessions/[sessionId]/status
 * Get current status of a focus session including pause status of all participants
 */
export async function GET(
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

    // Verify user is part of this session
    const sessionUser = await prisma.focusSessionUser.findUnique({
      where: {
        focusSessionId_userId: {
          focusSessionId: sessionId,
          userId: userId,
        },
      },
    });

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'User is not part of this session' },
        { status: 403 }
      );
    }

    // Get session with all users
    const focusSession = await prisma.focusSession.findUnique({
      where: {
        id: sessionId,
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
      },
    });

    if (!focusSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if any user has paused (if any user picks up phone, session is paused for all)
    const hasAnyPaused = focusSession.users.some((su: typeof focusSession.users[0]) => su.isPaused);

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      status: focusSession.status,
      isPaused: hasAnyPaused, // Overall session pause status
      users: focusSession.users.map((su: typeof focusSession.users[0]) => ({
        userId: su.userId,
        userName: su.user.name,
        userImage: su.user.image,
        isPaused: su.isPaused,
      })),
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get session status' },
      { status: 500 }
    );
  }
}

