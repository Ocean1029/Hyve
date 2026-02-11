// app/api/memories/[memoryId]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addPhotoToMemoryService } from '@/modules/memories/service';
import { AddPhotoToMemoryRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/memories/{memoryId}/photos:
 *   post:
 *     summary: Add a photo to a memory
 *     description: Attach a photo URL to an existing memory.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddPhotoToMemoryRequest'
 *     responses:
 *       200:
 *         description: Photo added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 photo:
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { memoryId } = await params;
    const validation = await validateRequest(request, AddPhotoToMemoryRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const result = await addPhotoToMemoryService(memoryId, validation.data.photoUrl);
    return NextResponse.json({
      success: true,
      photo: result.photo,
    });
  } catch (error) {
    console.error('Error adding photo to memory:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
