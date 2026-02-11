// app/api/users/[userId]/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { validateUserId } from '@/modules/users/validation';
import { UpdateUserProfileRequestSchema } from '@hyve/types';
import { validateRequest } from '@/lib/validation';

/**
 * @swagger
 * /api/users/{userId}/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile. Path userId must match the current user.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must match authenticated user)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *       400:
 *         description: Validation error or userId already taken
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
 *         description: Forbidden - cannot update another user
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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = await params;
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const validation = await validateRequest(request, UpdateUserProfileRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const data = validation.data;
    if (data.userId !== undefined) {
      const idValidation = validateUserId(data.userId);
      if (!idValidation.isValid) {
        return NextResponse.json(
          { success: false, error: idValidation.error },
          { status: 400 }
        );
      }
      const existing = await prisma.user.findUnique({
        where: { userId: data.userId },
      });
      if (existing && existing.id !== userId) {
        return NextResponse.json(
          { success: false, error: 'This userId is already taken' },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.userId !== undefined && { userId: data.userId }),
        ...(data.privacy !== undefined && { privacy: data.privacy }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        image: user.image,
        privacy: user.privacy,
      },
    });
  } catch (error: unknown) {
    console.error('Error updating profile:', error);
    const err = error as { code?: string; meta?: { target?: string[] } };
    if (err.code === 'P2002' && err.meta?.target?.includes('userId')) {
      return NextResponse.json(
        { success: false, error: 'This userId is already taken' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
