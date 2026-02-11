// app/api/memories/with-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createMemoryWithPhotoService } from '@/modules/memories/service';
import { CreateMemoryWithPhotoRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/memories/with-photo:
 *   post:
 *     summary: Create a memory with photo(s)
 *     description: Create a memory and attach photo URLs in a single transaction.
 *     tags:
 *       - Memories
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMemoryWithPhotoRequest'
 *     responses:
 *       200:
 *         description: Memory and photos created
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
 *                 photos:
 *                   type: array
 *                   items:
 *                     type: object
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

    const validation = await validateRequest(request, CreateMemoryWithPhotoRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const {
      focusSessionId,
      photoUrl,
      content,
      location,
      happyIndex,
      mood,
    } = validation.data;

    const result = await createMemoryWithPhotoService(
      session.user.id,
      focusSessionId,
      photoUrl,
      content,
      location,
      happyIndex,
      mood
    );

    return NextResponse.json({
      success: true,
      memory: result.memory,
      photos: result.photos,
    });
  } catch (error) {
    console.error('Error creating memory with photo:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
