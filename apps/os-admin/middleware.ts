import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Require authentication
  if (!session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check for admin role in User table
  const { data: user } = await supabase
    .from('User')
    .select('role, status')
    .eq('id', session.user.id)
    .single();

  // Allow if user exists and is active (admin check is optional for os-admin)
  if (!user || user.status !== 'ACTIVE') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/unauthorized';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!login|unauthorized|_next/static|_next/image|favicon.ico|api).*)',
  ],
};
