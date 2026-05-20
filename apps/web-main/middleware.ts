/**
 * Authentication Middleware for web-main
 * Protects routes based on authentication status and user roles
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getOwnerPortalBaseUrl, getOwnerPortalDeliverableUrl } from '@/lib/owner-portal-urls'

// Public routes that don't require authentication
// NOTE: /concept/deliverable is not a viewer — middleware redirects to the owner portal.
// Keep in sync with marketing + checkout funnels (anonymous users must never hit auth wall).
const PUBLIC_ROUTES = [
  '/login',
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
  '/concept/details',
  '/concept/contact',
  '/concept/confirm',
  '/concept/access',
  // NOTE: '/concept' (exact) is handled by special-case below to avoid the
  // startsWith('/concept/') catch-all matching paid deliverables at /concept/[uuid].
  '/concept-engine',
  '/permits',
  '/permits-only',
  '/estimation',
  '/checkout',
  '/intake',
  '/got-you',
  '/pre-design',
  '/new-construction',
  '/bundle',
  '/capture',
  '/book-a-call',
  '/about',
  '/homeowners',
  '/commercial',
  '/government',
  '/careers',
  '/architects',
  '/architect',
  '/design-professionals',
  '/design-services',
  '/developers',
  '/contractors',
  '/contractor',
  '/property-managers',
  '/pm',
  '/exterior',
  '/data-deletion',
  '/get-started',
  '/features',
  '/concept-package',
  '/engineers',
  '/engineer',
  '/milestone-pay',
  // Catalog & service detail (public marketing — must match SiteNav / SEO)
  '/products',
  '/services',
  '/estimate',
  '/marketplace',
  '/faq',
  '/build',
  '/gallery',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // /concept (exact) is the public service/package select page.
  // /concept/[uuid] pages are paid deliverables that require auth — they do NOT appear here.
  if (pathname === '/concept') return NextResponse.next()

  // Deliverables live in the owner portal only — never render on web-main
  if (pathname.startsWith('/concept/deliverable')) {
    const intakeId = request.nextUrl.searchParams.get('intakeId')
    const projectPath = request.nextUrl.searchParams.get('projectPath') ?? undefined
    if (intakeId) {
      return NextResponse.redirect(getOwnerPortalDeliverableUrl(intakeId, projectPath))
    }
    return NextResponse.redirect(`${getOwnerPortalBaseUrl()}/deliverables`)
  }

  // Create Supabase client — must use @supabase/ssr so the refreshed session
  // cookie is written back onto the response that reaches the browser.
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]))
        },
      },
    }
  )

  // Get session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    // Redirect authenticated users away from sign-in entry (web-main has no /dashboard — use home)
    const isAuthEntry =
      pathname.startsWith('/login') ||
      (pathname.startsWith('/auth/') && !pathname.startsWith('/auth/callback'))
    if (isAuthEntry && user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Protect all other routes - require authentication
  if (!user) {
    // Concept deliverables use the email/magic-link access gate, not the
    // external-portal login page, so redirect there directly.
    if (/^\/concept\/[^/]+$/.test(pathname)) {
      const accessUrl = new URL('/concept/access', request.url)
      accessUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(accessUrl)
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check email verification for sensitive routes
  if (pathname.startsWith('/billing') || pathname.startsWith('/settings')) {
    const emailConfirmedAt = user.email_confirmed_at

    if (!emailConfirmedAt) {
      const verifyUrl = new URL('/login', request.url)
      verifyUrl.searchParams.set('redirectTo', pathname)
      verifyUrl.searchParams.set('needsEmailVerification', '1')
      return NextResponse.redirect(verifyUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Skip middleware for:
     * - /api/* (Route Handlers)
     * - /_next/* (includes RSC flight /_next/data — running auth here breaks navigation and can surface as 403/odd errors on Vercel)
     * - static assets & crawlers
     */
    '/((?!api/|_next/|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
