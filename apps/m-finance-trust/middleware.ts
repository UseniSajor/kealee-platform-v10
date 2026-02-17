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
  const protectedPaths = ['/dashboard', '/projects', '/account', '/settings', '/escrow', '/payments'];
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

  // Role check for protected routes — finance-related roles only
  const ALLOWED_ROLES = ['admin', 'super_admin', 'pm', 'owner', 'client', 'contractor', 'finance'];

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

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/account/:path*',
    '/settings/:path*',
    '/escrow/:path*',
    '/payments/:path*',
    '/login',
    '/signup',
  ],
};
