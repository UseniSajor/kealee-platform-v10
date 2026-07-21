/**
 * Authentication Middleware for web-main
 * Protects routes based on authentication status and user roles
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hasIntelligenceUiRole } from '@kealee/auth/ops-api-auth'
import { getOwnerPortalBaseUrl, getOwnerPortalDeliverableUrl } from '@/lib/owner-portal-urls'

// Public routes that don't require authentication
// NOTE: /concept/deliverable is not a viewer — middleware redirects to the owner portal.
// Keep in sync with marketing + checkout funnels (anonymous users must never hit auth wall).
const PUBLIC_ROUTES = [
  '/login',
  '/marketing/login',
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
  '/concept/success',
  // NOTE: '/concept' (exact) is handled by special-case below to avoid the
  // startsWith('/concept/') catch-all matching paid deliverables at /concept/[uuid].
  '/concept-engine',
  '/get-concept',
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

function authLoginUrl(request: NextRequest, nextPath: string, extra?: Record<string, string>) {
  const isAgencyLogin =
    nextPath === '/marketing/login' || nextPath.startsWith('/marketing/login/')
  const isAgencyWorkspace =
    nextPath === '/marketing/workspace' || nextPath.startsWith('/marketing/workspace/')
  const loginPath =
    isAgencyLogin || isAgencyWorkspace ? '/marketing/login' : '/auth/login'
  const url = new URL(loginPath, request.url)
  if (!isAgencyLogin && !isAgencyWorkspace) {
    url.searchParams.set('next', nextPath)
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v)
  }
  return url
}

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
      pathname === '/login' ||
      pathname === '/marketing/login' ||
      (pathname.startsWith('/auth/') && !pathname.startsWith('/auth/callback'))
    if (isAuthEntry && user) {
      const next =
        request.nextUrl.searchParams.get('next') ??
        request.nextUrl.searchParams.get('redirectTo')
      if (next?.startsWith('/')) {
        return NextResponse.redirect(new URL(next, request.url))
      }
      if (pathname === '/marketing/login') {
        return NextResponse.redirect(new URL('/marketing/workspace', request.url))
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Protect all other routes - require authentication
  if (!user) {
    // Concept deliverables use the email/magic-link access gate, not the
    // external-portal login page, so redirect there directly.
    if (/^\/concept\/[^/]+$/.test(pathname)) {
      const intakeId = pathname.split('/')[2]
      if (intakeId) {
        return NextResponse.redirect(getOwnerPortalDeliverableUrl(intakeId))
      }
      return NextResponse.redirect(`${getOwnerPortalBaseUrl()}/login`)
    }

    return NextResponse.redirect(authLoginUrl(request, pathname))
  }

  // Check email verification for sensitive routes
  if (pathname.startsWith('/billing') || pathname.startsWith('/settings')) {
    const emailConfirmedAt = user.email_confirmed_at

    if (!emailConfirmedAt) {
      return NextResponse.redirect(
        authLoginUrl(request, pathname, { needsEmailVerification: '1' })
      )
    }
  }

  // Intelligence admin — ops/admin roles only (data still requires ops secret on APIs)
  if (pathname.startsWith('/admin/intelligence')) {
    const appRole = (user.app_metadata?.role as string | undefined)?.toLowerCase()
    if (!hasIntelligenceUiRole(appRole)) {
      return NextResponse.redirect(authLoginUrl(request, pathname, { error: 'unauthorized' }))
    }
  }

  // Marketing workspace / admin approvals — role-gated
  if (pathname.startsWith('/marketing/workspace') || pathname.startsWith('/admin/marketing')) {
    const appRole = (user.app_metadata?.role as string | undefined)?.toLowerCase()
    const isWorkspace = pathname.startsWith('/marketing/workspace')
    const workspaceRoles = new Set(['marketing_agency', 'zem_marketing', 'admin', 'super_admin', 'marketing_admin'])
    const adminRoles = new Set(['admin', 'super_admin', 'marketing_admin', 'owner'])
    const allowed = isWorkspace ? workspaceRoles.has(appRole ?? '') : adminRoles.has(appRole ?? '')
    if (!allowed) {
      return NextResponse.redirect(authLoginUrl(request, pathname, { error: 'unauthorized' }))
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
    '/((?!api/|_next/|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|mov|m4v|ogg|ogv|mp3|wav|woff|woff2|ttf|otf|eot|pdf|txt|xml|json)$).*)',
  ],
}
