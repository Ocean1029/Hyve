// app/api/auth/test-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

/**
 * @swagger
 * /api/auth/test-login:
 *   post:
 *     summary: Test login as Alex
 *     description: "Development-only endpoint. Logs in as the test user Alex (alex-chen) by creating a session and setting the auth cookie. For mobile app or external tool testing."
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Login successful. Session cookie is set in response.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: Forbidden in production
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Test login is disabled in production' },
      { status: 403 }
    );
  }

  try {
    let alex = await prisma.user.findUnique({
      where: { id: 'alex-chen' },
    });

    if (!alex) {
      alex = await prisma.user.create({
        data: {
          id: 'alex-chen',
          name: 'Alex Chen',
          email: 'alex@example.com',
          image: 'https://picsum.photos/100/100?random=99',
          userId: 'alex-chen',
        },
      });
    }

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'test',
          providerAccountId: alex.id,
        },
      },
      update: {},
      create: {
        userId: alex.id,
        type: 'credentials',
        provider: 'test',
        providerAccountId: alex.id,
      },
    });

    const sessionToken = randomBytes(32).toString('base64url');
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    await prisma.session.deleteMany({
      where: { userId: alex.id },
    });

    await prisma.session.create({
      data: {
        sessionToken,
        userId: alex.id,
        expires,
      },
    });

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedSSL = request.headers.get('x-forwarded-ssl');
    const isHTTPS =
      forwardedProto === 'https' ||
      forwardedSSL === 'on' ||
      process.env.AUTH_URL?.startsWith('https://') ||
      process.env.NEXTAUTH_URL?.startsWith('https://');

    const cookieParams = [
      `authjs.session-token=${sessionToken}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Expires=${expires.toUTCString()}`,
    ];
    if (isHTTPS) {
      cookieParams.push('Secure');
    }

    const response = NextResponse.json({ success: true });
    response.headers.append('Set-Cookie', cookieParams.join('; '));

    if (isHTTPS) {
      response.headers.append(
        'Set-Cookie',
        [
          `__Secure-authjs.session-token=${sessionToken}`,
          'Path=/',
          'HttpOnly',
          'SameSite=Lax',
          'Secure',
          `Expires=${expires.toUTCString()}`,
        ].join('; ')
      );
    }

    return response;
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to login as Alex',
      },
      { status: 500 }
    );
  }
}
