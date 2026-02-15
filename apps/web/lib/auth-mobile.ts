/**
 * Mobile auth helper: validates Bearer token and returns session compatible with NextAuth.
 * Used by API routes to support both cookie (web) and Bearer token (mobile) authentication.
 */
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import type { Session } from 'next-auth';

/**
 * Extracts and validates Bearer token from request, returns session if valid.
 * Returns null if no Bearer token or token is invalid/expired.
 */
export async function getSessionFromBearer(
  request: NextRequest
): Promise<Session | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
    expires: session.expires.toISOString(),
  };
}

/**
 * Unified session getter for API routes: tries Bearer token first, then cookie-based auth.
 * Use this instead of auth() in route handlers to support both web and mobile clients.
 */
export async function getSessionForApi(request: NextRequest): Promise<Session | null> {
  const bearerSession = await getSessionFromBearer(request);
  if (bearerSession) {
    return bearerSession;
  }
  return auth();
}
