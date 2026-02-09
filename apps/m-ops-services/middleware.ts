import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedPaths = ['/dashboard', '/projects', '/account', '/settings'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedPath && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages with active session
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Role check for protected routes — PM/admin/contractor only
  const ALLOWED_ROLES = ['pm', 'admin', 'super_admin', 'contractor'];

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

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/account/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
};
