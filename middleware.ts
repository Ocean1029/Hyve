import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const isOnLogin = req.nextUrl.pathname.startsWith('/login')
  const isOnAuthApi = req.nextUrl.pathname.startsWith('/api/auth')
  
  // Allow auth API routes
  if (isOnAuthApi) {
    return NextResponse.next()
  }

  // Check if session cookie exists (NextAuth sets this cookie)
  // For NextAuth v5, the cookie name is usually 'authjs.session-token' in production
  // and 'authjs.session-token' or similar in development
  const sessionCookie = req.cookies.get('authjs.session-token') || 
                        req.cookies.get('__Secure-authjs.session-token')
  
  const hasSession = !!sessionCookie

  // If user has session and trying to access login page, redirect to home
  if (isOnLogin && hasSession) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // If user has no session and not on login page, redirect to login
  if (!hasSession && !isOnLogin) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

