// app/api/auth/mobile/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo?id_token=';

interface GoogleTokenPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  aud: string;
  exp: string;
  iss: string;
}

/**
 * POST /api/auth/mobile/login
 * Exchanges Google idToken for a session token. Mobile app stores the session token
 * and sends it as Authorization: Bearer <token> for subsequent API requests.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid idToken' },
        { status: 400 }
      );
    }

    const clientId = process.env.AUTH_GOOGLE_ID;
    if (!clientId) {
      console.error('AUTH_GOOGLE_ID not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const res = await fetch(`${GOOGLE_TOKENINFO_URL}${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error('Google token verification failed:', errText);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired idToken' },
        { status: 401 }
      );
    }

    const payload = (await res.json()) as GoogleTokenPayload;

    if (payload.aud !== clientId) {
      return NextResponse.json(
        { success: false, error: 'Token audience mismatch' },
        { status: 401 }
      );
    }

    const googleId = payload.sub;
    const email = payload.email ?? null;
    const name = payload.name ?? null;
    const picture = payload.picture ?? null;

    let user = await prisma.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: 'google',
            providerAccountId: googleId,
          },
        },
      },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: email ?? undefined },
      });
    }

    if (!user) {
      const newUserId = `google_${googleId}`;
      user = await prisma.user.create({
        data: {
          name: name ?? 'User',
          email,
          image: picture,
          userId: newUserId,
        },
      });
    } else {
      if (name !== null || email !== null || picture !== null) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(name !== null && { name }),
            ...(email !== null && { email }),
            ...(picture !== null && { image: picture }),
          },
        });
      }
    }

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleId,
        },
      },
      update: { userId: user.id },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: googleId,
      },
    });

    const sessionToken = randomBytes(32).toString('base64url');
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt: expires.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    );
  }
}
