/**
 * Authentication Middleware for web-main
 * Protects routes based on authentication status and user roles
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/verify',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/',
  '/pricing',
  '/blog',
  '/contact',
  '/concept',
  '/permits',
  '/estimation'
]

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Create Supabase client
  const supabase = createMiddlewareClient({ req: request, res })

  // Get session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Redirect authenticated users away from auth pages
    if (pathname.startsWith('/auth/') && user && !pathname.startsWith('/auth/callback')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return res
  }

  // Protect all other routes - require authentication
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check email verification for sensitive routes
  if (pathname.startsWith('/billing') || pathname.startsWith('/settings')) {
    const emailConfirmedAt = user.email_confirmed_at

    if (!emailConfirmedAt) {
      const verifyUrl = new URL('/auth/verify', request.url)
      verifyUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(verifyUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml (sitemap)
     * - robots.txt (robots file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg|.*\\.png|.*\\.jpg).*)'
  ]
}
