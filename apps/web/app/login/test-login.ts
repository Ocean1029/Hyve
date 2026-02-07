'use server';

import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

/**
 * Test login action for Alex account
 * Creates or finds the alex user and creates a session
 * Returns success status for client-side redirect
 */
export async function testLoginAsAlex() {
  try {
    // Find or create Alex user
    let alex = await prisma.user.findUnique({
      where: { id: 'alex-chen' },
    });

    if (!alex) {
      // Create Alex user if doesn't exist
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

    // Create or get a test account for Alex (required by NextAuth)
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

    // Generate session token
    const sessionToken = randomBytes(32).toString('base64url');
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30 days

    // Delete any existing sessions for this user first
    await prisma.session.deleteMany({
      where: { userId: alex.id },
    });

    // Create new session
    await prisma.session.create({
      data: {
        sessionToken,
        userId: alex.id,
        expires,
      },
    });

    // Set NextAuth session cookie
    // NextAuth v5 uses 'authjs.session-token' as default cookie name
    const cookieStore = await cookies();
    const headersList = await headers();
    
    // Detect HTTPS environment (including ngrok tunnels)
    // Check request headers first (most reliable for proxies like ngrok)
    const forwardedProto = headersList.get('x-forwarded-proto');
    const forwardedSSL = headersList.get('x-forwarded-ssl');
    const isHTTPS = forwardedProto === 'https' || 
                    forwardedSSL === 'on' ||
                    process.env.AUTH_URL?.startsWith('https://') || 
                    process.env.NEXTAUTH_URL?.startsWith('https://') ||
                    process.env.NODE_ENV === 'production';
    
    // Set both possible cookie names to ensure compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: isHTTPS, // Set to true for HTTPS (including ngrok)
      sameSite: 'lax' as const,
      path: '/',
      expires,
    };
    
    // Set the session cookie
    cookieStore.set('authjs.session-token', sessionToken, cookieOptions);
    
    // Also set secure version if using HTTPS
    if (isHTTPS) {
      cookieStore.set('__Secure-authjs.session-token', sessionToken, cookieOptions);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Test login error:', error);
    return { success: false, error: error.message || 'Failed to login as Alex' };
  }
}
