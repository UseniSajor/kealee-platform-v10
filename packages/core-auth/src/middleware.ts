/**
 * Authentication Middleware
 * Protects routes based on authentication and role requirements
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/auth/verify',
  '/',
  '/pricing',
  '/blog',
  '/contact',
  '/concept',
  '/permits',
  '/estimation'
]

/**
 * Admin-only routes
 */
const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/organizations',
  '/admin/analytics',
  '/admin/settings'
]

/**
 * Contractor-only routes
 */
const CONTRACTOR_ROUTES = [
  '/contractor/dashboard',
  '/contractor/leads',
  '/contractor/profile',
  '/contractor/billing'
]

/**
 * PM-only routes
 */
const PM_ROUTES = [
  '/pm/dashboard',
  '/pm/projects',
  '/pm/clients',
  '/pm/tasks'
]

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if route requires specific role
 */
function getRequiredRole(pathname: string): string | null {
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) return 'ADMIN'
  if (CONTRACTOR_ROUTES.some(route => pathname.startsWith(route))) return 'CONTRACTOR'
  if (PM_ROUTES.some(route => pathname.startsWith(route))) return 'PM'
  return null
}

/**
 * Main authentication middleware
 */
export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Create Supabase client
  const supabase = createMiddlewareClient({ req: request, res })

  // Get session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // Public routes - allow all
  if (isPublicRoute(pathname)) {
    // Redirect logged-in users from auth pages to dashboard
    if (pathname.startsWith('/auth/') && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return res
  }

  // Protected routes - require authentication
  if (!user) {
    // Redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based route protection
  const requiredRole = getRequiredRole(pathname)
  if (requiredRole) {
    const userRole = user.user_metadata?.role

    // Check if user has required role or is admin
    if (userRole !== requiredRole && userRole !== 'ADMIN') {
      // Redirect to dashboard with error
      const dashboardUrl = new URL('/dashboard', request.url)
      dashboardUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Check email verification for sensitive routes
  if (pathname.startsWith('/billing') || pathname.startsWith('/settings')) {
    const emailConfirmedAt = user.email_confirmed_at

    if (!emailConfirmedAt) {
      const verifyUrl = new URL('/auth/verify-email', request.url)
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'
  ]
}
