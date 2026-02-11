// app/api/memories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createMemoryService } from '@/modules/memories/service';
import { CreateMemoryRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/memories:
 *   post:
 *     summary: Create a memory
 *     description: Create a new memory associated with a focus session.
 *     tags:
 *       - Memories
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMemoryRequest'
 *     responses:
 *       200:
 *         description: Memory created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 memory:
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const validation = await validateRequest(request, CreateMemoryRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { focusSessionId, type, content, location, happyIndex } = validation.data;
    const result = await createMemoryService(
      focusSessionId,
      session.user.id,
      type,
      content,
      location,
      happyIndex
    );

    const memory = result.memory as { id: string; [k: string]: unknown };
    return NextResponse.json({
      success: true,
      memory: memory
        ? {
            id: memory.id,
            focusSessionId: memory.focusSessionId,
            type: memory.type,
            content: memory.content,
            location: memory.location,
            happyIndex: memory.happyIndex,
            timestamp: (memory.timestamp as Date)?.toISOString?.(),
          }
        : result.memory,
    });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
