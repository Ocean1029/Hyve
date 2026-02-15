// app/api/users/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Log out
 *     description: Sign out the current user. Session cookie is cleared. Client may redirect to login.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      await prisma.session.deleteMany({ where: { sessionToken: token } });
      return NextResponse.json({ success: true });
    }
    await signOut({ redirect: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}
