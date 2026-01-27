import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  try {
    const supabase = createMiddlewareClient({ req: request, res });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Require authentication for ALL pages
    if (!session) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Try to check for PM or Admin role, but allow access if profiles table doesn't exist
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      // If profiles table exists and user doesn't have correct role, redirect
      if (profile && !['pm', 'admin'].includes(profile.role)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/unauthorized';
        return NextResponse.redirect(redirectUrl);
      }

      // If there's an error (table doesn't exist), allow access for now
      if (error) {
        console.log('Profiles check skipped:', error.message);
      }
    } catch (profileError) {
      // Allow access if profile check fails (initial setup)
      console.log('Profile check failed, allowing access:', profileError);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    '/((?!login|unauthorized|_next/static|_next/image|favicon.ico|api).*)',
  ],
};
