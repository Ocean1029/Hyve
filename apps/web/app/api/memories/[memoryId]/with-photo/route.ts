// app/api/memories/[memoryId]/with-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth-mobile';
import { updateMemoryWithPhotoService } from '@/modules/memories/service';
import { UpdateMemoryWithPhotoRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/memories/{memoryId}/with-photo:
 *   put:
 *     summary: Update a memory with photo(s)
 *     description: Update an existing memory and replace its photos in a single transaction.
 *     tags:
 *       - Memories
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: memoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMemoryWithPhotoRequest'
 *     responses:
 *       200:
 *         description: Memory and photos updated
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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const session = await getSessionForApi(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { memoryId } = await params;
    const validation = await validateRequest(request, UpdateMemoryWithPhotoRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { photoUrl, content, location, happyIndex, mood } = validation.data;

    const result = await updateMemoryWithPhotoService(
      memoryId,
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
    console.error('Error updating memory with photo:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
