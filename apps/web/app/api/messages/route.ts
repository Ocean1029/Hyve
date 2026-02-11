// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createMessage, getMessages } from '@/modules/messages/repository';
import prisma from '@/lib/prisma';
import { SendMessageRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     description: Send a message in a friend chat. Sender is the authenticated user.
 *     tags:
 *       - Messages
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       200:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - friend not accessible
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
 *   get:
 *     summary: Get conversation
 *     description: Get messages for a friend chat.
 *     tags:
 *       - Messages
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetConversationResponse'
 *       400:
 *         description: Missing friendId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
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
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const validation = await validateRequest(request, SendMessageRequestSchema);
  if (!validation.success) {
    return validation.response;
  }

  const { friendId, content } = validation.data;
  const friend = await prisma.friend.findUnique({ where: { id: friendId } });
  if (!friend) {
    return NextResponse.json(
      { success: false, error: 'Friend not found' },
      { status: 404 }
    );
  }
  if (friend.sourceUserId !== session.user.id && friend.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  const message = await createMessage(friendId, session.user.id, content);
  const msgTimestamp = (message as { timestamp?: Date }).timestamp;
  const timestampStr = msgTimestamp instanceof Date ? msgTimestamp.toISOString() : null;
  return NextResponse.json({
    success: true,
    message: {
      id: message.id,
      friendId: message.friendId,
      senderId: message.senderId,
      content: message.content,
      timestamp: timestampStr,
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', messages: [] },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const friendId = searchParams.get('friendId');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : 50;

  if (!friendId) {
    return NextResponse.json(
      { success: false, error: 'friendId is required', messages: [] },
      { status: 400 }
    );
  }

  const friend = await prisma.friend.findUnique({ where: { id: friendId } });
  if (!friend) {
    return NextResponse.json(
      { success: false, error: 'Friend not found', messages: [] },
      { status: 404 }
    );
  }
  if (friend.sourceUserId !== session.user.id && friend.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: 'Forbidden', messages: [] },
      { status: 403 }
    );
  }

  const messages = await getMessages(friendId, limit);
  const serialized = messages.map((m: { id: string; friendId: string; senderId: string; content: string; timestamp?: Date }) => ({
    id: m.id,
    friendId: m.friendId,
    senderId: m.senderId,
    content: m.content,
    createdAt: m.timestamp instanceof Date ? m.timestamp.toISOString() : undefined,
  }));
  return NextResponse.json({ success: true, messages: serialized });
}
