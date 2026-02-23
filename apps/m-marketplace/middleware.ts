import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // Protected routes
  const protectedPaths = ['/dashboard', '/projects', '/account', '/settings', '/services'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Architect protected routes
  const architectProtectedPaths = ['/architect/projects', '/architect/account', '/architect/team'];
  const isArchitectProtectedPath = architectProtectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Estimation protected routes
  const estimationProtectedPaths = ['/estimation/dashboard', '/estimation/estimates', '/estimation/assemblies', '/estimation/takeoff', '/estimation/ai-takeoff', '/estimation/ai-tools', '/estimation/cost-database', '/estimation/reports', '/estimation/settings'];
  const isEstimationProtectedPath = estimationProtectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Ops protected routes
  const opsProtectedPaths = ['/ops/portal', '/ops/account'];
  const isOpsProtectedPath = opsProtectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Permits protected routes
  const permitsProtectedPaths = ['/permits/dashboard', '/permits/account'];
  const isPermitsProtectedPath = permitsProtectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedPath && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isArchitectProtectedPath && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/architect/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isEstimationProtectedPath && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/estimation/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isOpsProtectedPath && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/ops/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isPermitsProtectedPath && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/permits/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages with active session
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  const architectAuthPaths = ['/architect/login', '/architect/signup'];
  const isArchitectAuthPath = architectAuthPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  const estimationAuthPaths = ['/estimation/login', '/estimation/signup'];
  const isEstimationAuthPath = estimationAuthPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  const opsAuthPaths = ['/ops/login', '/ops/signup'];
  const isOpsAuthPath = opsAuthPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  const permitsAuthPaths = ['/permits/login', '/permits/signup'];
  const isPermitsAuthPath = permitsAuthPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  if (isArchitectAuthPath && session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/architect';
    return NextResponse.redirect(redirectUrl);
  }

  if (isEstimationAuthPath && session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/estimation/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  if (isOpsAuthPath && session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/ops/portal';
    return NextResponse.redirect(redirectUrl);
  }

  if (isPermitsAuthPath && session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/permits/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Role check for protected routes — broad marketplace access
  const ALLOWED_ROLES = ['admin', 'super_admin', 'pm', 'owner', 'client', 'contractor', 'gc', 'builder', 'vendor', 'supplier'];

  if (isProtectedPath && session) {
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

    if (!ALLOWED_ROLES.includes(effectiveRole)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Role check for architect routes — architect/engineer/admin only
  const ARCHITECT_ALLOWED_ROLES = ['architect', 'engineer', 'admin', 'super_admin'];

  if (isArchitectProtectedPath && session) {
    const { data: user } = await supabase
      .from('User')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (!user || user.status !== 'ACTIVE') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/architect/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }

    const { data: membership } = await supabase
      .from('OrgMember')
      .select('roleKey')
      .eq('userId', session.user.id)
      .limit(1)
      .single();

    const effectiveRole = (membership?.roleKey || user.role || 'user').toLowerCase();

    if (!ARCHITECT_ALLOWED_ROLES.includes(effectiveRole)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/architect/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Role check for ops routes — pm/admin/contractor
  const OPS_ALLOWED_ROLES = ['pm', 'admin', 'super_admin', 'contractor'];

  if (isOpsProtectedPath && session) {
    const { data: user } = await supabase
      .from('User')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (!user || user.status !== 'ACTIVE') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/ops/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }

    const { data: membership } = await supabase
      .from('OrgMember')
      .select('roleKey')
      .eq('userId', session.user.id)
      .limit(1)
      .single();

    const effectiveRole = (membership?.roleKey || user.role || 'user').toLowerCase();

    if (!OPS_ALLOWED_ROLES.includes(effectiveRole)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/ops/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Role check for permits routes — pm/admin/inspector
  const PERMITS_ALLOWED_ROLES = ['pm', 'admin', 'super_admin', 'inspector'];

  if (isPermitsProtectedPath && session) {
    const { data: user } = await supabase
      .from('User')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (!user || user.status !== 'ACTIVE') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/permits/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }

    const { data: membership } = await supabase
      .from('OrgMember')
      .select('roleKey')
      .eq('userId', session.user.id)
      .limit(1)
      .single();

    const effectiveRole = (membership?.roleKey || user.role || 'user').toLowerCase();

    if (!PERMITS_ALLOWED_ROLES.includes(effectiveRole)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/permits/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Role check for estimation routes — broad access for estimation tool
  const ESTIMATION_ALLOWED_ROLES = ['admin', 'super_admin', 'pm', 'contractor', 'gc', 'builder', 'estimator', 'architect', 'engineer'];

  if (isEstimationProtectedPath && session) {
    const { data: user } = await supabase
      .from('User')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (!user || user.status !== 'ACTIVE') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/estimation/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }

    const { data: membership } = await supabase
      .from('OrgMember')
      .select('roleKey')
      .eq('userId', session.user.id)
      .limit(1)
      .single();

    const effectiveRole = (membership?.roleKey || user.role || 'user').toLowerCase();

    if (!ESTIMATION_ALLOWED_ROLES.includes(effectiveRole)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/estimation/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/account/:path*',
    '/settings/:path*',
    '/services/:path*',
    '/login',
    '/signup',
    '/architect/projects/:path*',
    '/architect/account/:path*',
    '/architect/team/:path*',
    '/architect/login',
    '/architect/signup',
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
    '/ops/portal/:path*',
    '/ops/account/:path*',
    '/ops/login',
    '/ops/signup',
    '/permits/dashboard/:path*',
    '/permits/account/:path*',
    '/permits/login',
    '/permits/signup',
  ],
};
