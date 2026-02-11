// app/api/interactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createInteraction } from '@/modules/interactions/repository';
import prisma from '@/lib/prisma';
import { AddInteractionRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/interactions:
 *   post:
 *     summary: Add an interaction
 *     description: Record an interaction (message, call, meet, note) for a friend.
 *     tags:
 *       - Interactions
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddInteractionRequest'
 *     responses:
 *       200:
 *         description: Interaction created
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const validation = await validateRequest(request, AddInteractionRequestSchema);
  if (!validation.success) {
    return validation.response;
  }

  const { friendId, type, content } = validation.data;
  const friend = await prisma.friend.findUnique({
    where: { id: friendId },
  });
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

  const interaction = await createInteraction(friendId, type, content);
  const timestamp = interaction.timestamp;
  const timestampStr = timestamp instanceof Date ? timestamp.toISOString() : null;
  return NextResponse.json({
    success: true,
    interaction: {
      id: interaction.id,
      friendId: interaction.friendId,
      type: interaction.type,
      content: interaction.content,
      timestamp: timestampStr,
    },
  });
}
