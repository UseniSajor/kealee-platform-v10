import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// Portal configuration — defines protected paths, allowed roles, and defaults
// ============================================================================

interface PortalConfig {
  protectedPaths: string[];
  allowedRoles: string[];
  defaultRedirect: string; // Where to go after login for this portal
}

const PORTAL_CONFIG: Record<string, PortalConfig> = {
  marketplace: {
    protectedPaths: ['/dashboard', '/projects', '/account', '/settings', '/services'],
    allowedRoles: ['admin', 'super_admin', 'pm', 'owner', 'client', 'contractor', 'gc', 'builder', 'vendor', 'supplier'],
    defaultRedirect: '/',
  },
  architect: {
    protectedPaths: ['/architect/projects', '/architect/account', '/architect/team'],
    allowedRoles: ['architect', 'engineer', 'admin', 'super_admin'],
    defaultRedirect: '/architect',
  },
  estimation: {
    protectedPaths: ['/estimation/dashboard', '/estimation/estimates', '/estimation/assemblies', '/estimation/takeoff', '/estimation/ai-takeoff', '/estimation/ai-tools', '/estimation/cost-database', '/estimation/reports', '/estimation/settings'],
    allowedRoles: ['admin', 'super_admin', 'pm', 'contractor', 'gc', 'builder', 'estimator', 'architect', 'engineer'],
    defaultRedirect: '/estimation/dashboard',
  },
  ops: {
    protectedPaths: ['/ops/portal', '/ops/account'],
    allowedRoles: ['pm', 'admin', 'super_admin', 'contractor'],
    defaultRedirect: '/ops/portal',
  },
  permits: {
    protectedPaths: ['/permits/dashboard', '/permits/account'],
    allowedRoles: ['pm', 'admin', 'super_admin', 'inspector'],
    defaultRedirect: '/permits/dashboard',
  },
  engineer: {
    protectedPaths: ['/engineer/projects', '/engineer/account'],
    allowedRoles: ['engineer', 'architect', 'admin', 'super_admin'],
    defaultRedirect: '/engineer/projects',
  },
  finance: {
    protectedPaths: ['/finance/escrow', '/finance/transactions', '/finance/reports', '/finance/statements', '/finance/settings', '/finance/releases', '/finance/deposit', '/finance/payments'],
    allowedRoles: ['admin', 'super_admin', 'pm', 'owner', 'client', 'contractor', 'gc', 'builder'],
    defaultRedirect: '/finance/escrow',
  },
  owner: {
    protectedPaths: ['/owner/dashboard', '/owner/projects', '/owner/account', '/owner/analytics', '/owner/reports', '/owner/draws', '/owner/payments'],
    allowedRoles: ['homeowner', 'developer', 'property_manager', 'business_owner', 'client', 'owner', 'admin', 'super_admin'],
    defaultRedirect: '/owner/dashboard',
  },
  pm: {
    protectedPaths: ['/pm/dashboard', '/pm/projects', '/pm/analytics', '/pm/command-center', '/pm/account', '/pm/integrations', '/pm/subscription'],
    allowedRoles: ['pm', 'admin', 'super_admin'],
    defaultRedirect: '/pm/dashboard',
  },
};

// Old per-portal login paths that should redirect to unified login
const PORTAL_LOGIN_PATHS: Record<string, string> = {
  '/architect/login': '/architect',
  '/architect/signup': '/architect',
  '/estimation/login': '/estimation/dashboard',
  '/estimation/signup': '/estimation/dashboard',
  '/ops/login': '/ops/portal',
  '/ops/signup': '/ops/portal',
  '/permits/login': '/permits/dashboard',
  '/permits/signup': '/permits/dashboard',
  '/engineer/login': '/engineer/projects',
  '/engineer/signup': '/engineer/projects',
  '/finance/login': '/finance/escrow',
  '/finance/signup': '/finance/escrow',
  '/owner/login': '/owner/dashboard',
  '/owner/signup': '/owner/dashboard',
  '/pm/login': '/pm/dashboard',
  '/pm/signup': '/pm/dashboard',
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // ──────────────────────────────────────────────────────────────────
  // 1. Handle old per-portal login pages → redirect to unified /login
  // ──────────────────────────────────────────────────────────────────
  const portalLoginDefault = PORTAL_LOGIN_PATHS[pathname];
  if (portalLoginDefault !== undefined) {
    if (session) {
      // Already authenticated → go to portal home
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = portalLoginDefault;
      return NextResponse.redirect(redirectUrl);
    } else {
      // Not authenticated → go to unified login with redirect back to portal
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirect', portalLoginDefault);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 2. Handle unified auth pages (/login, /signup)
  // ──────────────────────────────────────────────────────────────────
  if (pathname === '/login' || pathname === '/signup') {
    if (session) {
      const redirectUrl = request.nextUrl.clone();
      const redirectTo = request.nextUrl.searchParams.get('redirect');
      redirectUrl.pathname = redirectTo || '/';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // ──────────────────────────────────────────────────────────────────
  // 3. Check if current path is protected by any portal
  // ──────────────────────────────────────────────────────────────────
  let matchedPortal: PortalConfig | null = null;
  for (const config of Object.values(PORTAL_CONFIG)) {
    if (config.protectedPaths.some(p => pathname.startsWith(p))) {
      matchedPortal = config;
      break;
    }
  }

  if (!matchedPortal) {
    return response;
  }

  // ──────────────────────────────────────────────────────────────────
  // 4. Redirect to unified login if not authenticated
  // ──────────────────────────────────────────────────────────────────
  if (!session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ──────────────────────────────────────────────────────────────────
  // 5. Role-based access check
  // ──────────────────────────────────────────────────────────────────
  const { data: user } = await supabase
    .from('User')
    .select('role, status')
    .eq('id', session.user.id)
    .single();

  if (!user || user.status !== 'ACTIVE') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/unauthorized';
    return NextResponse.redirect(redirectUrl);
  }

  const { data: membership } = await supabase
    .from('OrgMember')
    .select('roleKey')
    .eq('userId', session.user.id)
    .limit(1)
    .single();

  const effectiveRole = (membership?.roleKey || user.role || 'user').toLowerCase();

  if (!matchedPortal.allowedRoles.includes(effectiveRole)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/unauthorized';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Unified auth
    '/login',
    '/signup',
    // Marketplace
    '/dashboard/:path*',
    '/projects/:path*',
    '/account/:path*',
    '/settings/:path*',
    '/services/:path*',
    // Architect
    '/architect/projects/:path*',
    '/architect/account/:path*',
    '/architect/team/:path*',
    '/architect/login',
    '/architect/signup',
    // Estimation
    '/estimation/dashboard/:path*',
    '/estimation/estimates/:path*',
    '/estimation/assemblies/:path*',
    '/estimation/takeoff/:path*',
    '/estimation/ai-takeoff/:path*',
    '/estimation/ai-tools/:path*',
    '/estimation/cost-database/:path*',
    '/estimation/reports/:path*',
    '/estimation/settings/:path*',
    '/estimation/login',
    '/estimation/signup',
    // Ops
    '/ops/portal/:path*',
    '/ops/account/:path*',
    '/ops/login',
    '/ops/signup',
    // Permits
    '/permits/dashboard/:path*',
    '/permits/account/:path*',
    '/permits/login',
    '/permits/signup',
    // Engineer
    '/engineer/projects/:path*',
    '/engineer/account/:path*',
    '/engineer/login',
    '/engineer/signup',
    // Finance
    '/finance/escrow/:path*',
    '/finance/transactions/:path*',
    '/finance/reports/:path*',
    '/finance/statements/:path*',
    '/finance/settings/:path*',
    '/finance/releases/:path*',
    '/finance/deposit/:path*',
    '/finance/payments/:path*',
    '/finance/login',
    '/finance/signup',
    // Owner
    '/owner/dashboard/:path*',
    '/owner/projects/:path*',
    '/owner/account/:path*',
    '/owner/analytics/:path*',
    '/owner/reports/:path*',
    '/owner/draws/:path*',
    '/owner/payments/:path*',
    '/owner/login',
    '/owner/signup',
    // PM
    '/pm/dashboard/:path*',
    '/pm/projects/:path*',
    '/pm/analytics/:path*',
    '/pm/command-center/:path*',
    '/pm/account/:path*',
    '/pm/integrations/:path*',
    '/pm/subscription/:path*',
    '/pm/login',
    '/pm/signup',
  ],
};
