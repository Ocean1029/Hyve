// app/api/auth/mobile/dev-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

/**
 * POST /api/auth/mobile/dev-login
 * Development-only: logs in as test user Alex and returns sessionToken (like mobile/login).
 * Disabled in production.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Dev login is disabled in production' },
      { status: 403 }
    );
  }

  try {
    let alex = await prisma.user.findUnique({ where: { id: 'alex-chen' } });
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

    await prisma.session.deleteMany({ where: { userId: alex.id } });
    await prisma.session.create({
      data: { sessionToken, userId: alex.id, expires },
    });

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt: expires.toISOString(),
      user: {
        id: alex.id,
        name: alex.name,
        email: alex.email,
        image: alex.image,
      },
    });
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Dev login failed',
      },
      { status: 500 }
    );
  }
}
