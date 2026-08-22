import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

interface PortalConfig { protectedPaths: string[]; allowedRoles: string[] }

const PORTALS: PortalConfig[] = [
  { protectedPaths: ['/dashboard', '/projects', '/account', '/settings', '/services'], allowedRoles: ['admin', 'super_admin', 'pm', 'owner', 'client', 'contractor', 'gc', 'builder', 'vendor', 'supplier'] },
  { protectedPaths: ['/architect/projects', '/architect/account', '/architect/team'], allowedRoles: ['architect', 'engineer', 'admin', 'super_admin'] },
  { protectedPaths: ['/estimation/dashboard', '/estimation/estimates', '/estimation/assemblies', '/estimation/takeoff', '/estimation/ai-takeoff', '/estimation/ai-tools', '/estimation/cost-database', '/estimation/reports', '/estimation/settings'], allowedRoles: ['admin', 'super_admin', 'pm', 'contractor', 'gc', 'builder', 'estimator', 'architect', 'engineer'] },
  { protectedPaths: ['/ops/portal', '/ops/account'], allowedRoles: ['pm', 'admin', 'super_admin', 'contractor'] },
  { protectedPaths: ['/permits/dashboard', '/permits/account'], allowedRoles: ['pm', 'admin', 'super_admin', 'inspector'] },
  { protectedPaths: ['/engineer/projects', '/engineer/account'], allowedRoles: ['engineer', 'architect', 'admin', 'super_admin'] },
  { protectedPaths: ['/finance/escrow', '/finance/transactions', '/finance/reports', '/finance/statements', '/finance/settings', '/finance/releases', '/finance/deposit', '/finance/payments'], allowedRoles: ['admin', 'super_admin', 'pm', 'owner', 'client', 'contractor', 'gc', 'builder'] },
  { protectedPaths: ['/owner/dashboard', '/owner/projects', '/owner/account', '/owner/analytics', '/owner/reports', '/owner/draws', '/owner/payments', '/owner/onboarding'], allowedRoles: ['homeowner', 'developer', 'property_manager', 'business_owner', 'client', 'owner', 'admin', 'super_admin'] },
  { protectedPaths: ['/pm/dashboard', '/pm/projects', '/pm/analytics', '/pm/command-center', '/pm/account', '/pm/integrations', '/pm/subscription'], allowedRoles: ['pm', 'admin', 'super_admin'] },
]

const LEGACY_AUTH_REDIRECTS: Record<string, string> = {
  '/auth/login': '/', '/auth/forgot-password': '/', '/auth/setup': '/', '/auth/verify-email': '/',
  '/architect/login': '/architect', '/architect/signup': '/architect',
  '/architect/auth/forgot-password': '/architect', '/architect/auth/reset-password': '/architect', '/architect/auth/verify-email': '/architect',
  '/estimation/login': '/estimation/dashboard', '/estimation/signup': '/estimation/dashboard',
  '/ops/login': '/ops/portal', '/ops/signup': '/ops/portal',
  '/permits/login': '/permits/dashboard', '/permits/signup': '/permits/dashboard',
  '/engineer/login': '/engineer/projects', '/engineer/signup': '/engineer/projects',
  '/finance/login': '/finance/escrow', '/finance/signup': '/finance/escrow',
  '/owner/login': '/owner/dashboard', '/owner/signup': '/owner/dashboard',
  '/pm/login': '/pm/dashboard', '/pm/signup': '/pm/dashboard',
}

function safeRedirect(request: NextRequest, fallback: string) {
  const candidate = request.nextUrl.searchParams.get('redirect')
  return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : fallback
}

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth()
  const pathname = request.nextUrl.pathname
  const legacyTarget = LEGACY_AUTH_REDIRECTS[pathname]

  if (legacyTarget) {
    const url = request.nextUrl.clone()
    url.pathname = userId ? legacyTarget : '/login'
    url.search = ''
    if (!userId) url.searchParams.set('redirect', legacyTarget)
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' || pathname === '/signup') {
    if (!userId) return NextResponse.next()
    const url = request.nextUrl.clone()
    url.pathname = safeRedirect(request, '/')
    url.search = ''
    return NextResponse.redirect(url)
  }

  const portal = PORTALS.find(({ protectedPaths }) => protectedPaths.some((path) => pathname.startsWith(path)))
  if (!portal) return NextResponse.next()

  if (!userId) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  const claims = sessionClaims as Record<string, unknown> | null
  const metadata = (claims?.metadata ?? claims?.publicMetadata ?? {}) as Record<string, unknown>
  const role = String(metadata.role ?? claims?.org_role ?? '').toLowerCase()
  const status = String(metadata.status ?? 'ACTIVE').toUpperCase()
  const authorized = role === 'admin' || role === 'super_admin' || portal.allowedRoles.includes(role)

  if (status !== 'ACTIVE' || !authorized) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/login', '/signup', '/auth/:path*', '/dashboard/:path*', '/projects/:path*', '/account/:path*', '/settings/:path*', '/services/:path*', '/architect/:path*', '/estimation/:path*', '/ops/:path*', '/permits/:path*', '/engineer/:path*', '/finance/:path*', '/owner/:path*', '/pm/:path*'],
}
