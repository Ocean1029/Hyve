// app/api/messages/[friendId]/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { getFocusSessionsByFriendId } from '@/modules/messages/repository';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/messages/{friendId}/sessions:
 *   get:
 *     summary: Get friend focus sessions
 *     description: Get all focus sessions for a friend, including memories and photos.
 *     tags:
 *       - Messages
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend record ID
 *     responses:
 *       200:
 *         description: List of focus sessions with memories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetFriendFocusSessionsResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', sessions: [] },
        { status: 401 }
      );
    }

    const { friendId } = await params;
    const friend = await prisma.friend.findUnique({ where: { id: friendId } });
    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Friend not found', sessions: [] },
        { status: 404 }
      );
    }
    if (friend.sourceUserId !== session.user.id && friend.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', sessions: [] },
        { status: 403 }
      );
    }

    const focusSessions = await getFocusSessionsByFriendId(friendId);
    const sessions = focusSessions.map((fs: {
      id: string;
      startTime: Date;
      endTime: Date | null;
      minutes: number;
      createdAt: Date;
      memories: Array<{
        id: string;
        type: string | null;
        content: string | null;
        timestamp: Date;
        location: string | null;
        photos: Array<{ photoUrl: string }>;
      }>;
    }) => ({
      id: fs.id,
      startTime: fs.startTime instanceof Date ? fs.startTime.toISOString() : fs.startTime,
      endTime: fs.endTime instanceof Date ? fs.endTime.toISOString() : fs.endTime ?? null,
      minutes: fs.minutes,
      createdAt: fs.createdAt instanceof Date ? fs.createdAt.toISOString() : fs.createdAt,
      memories: (fs.memories ?? []).map((m) => ({
        id: m.id,
        type: m.type,
        content: m.content,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
        location: m.location,
        photos: (m.photos ?? []).map((p: { photoUrl: string }) => p.photoUrl),
      })),
    }));
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Error getting friend focus sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', sessions: [] },
      { status: 500 }
    );
  }
}
