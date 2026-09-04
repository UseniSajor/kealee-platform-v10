import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ROLES = ['admin', 'super_admin'];

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId, sessionClaims } = await auth();

  // Require authentication
  if (!userId) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check role from app_metadata (set via Supabase SQL: UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' WHERE email = '...')
  const claims = sessionClaims as Record<string, unknown> | null;
  const metadata = (claims?.metadata ?? claims?.publicMetadata ?? {}) as Record<string, unknown>;
  const role = String(metadata.role ?? 'user').toLowerCase();

  if (!ALLOWED_ROLES.includes(role)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/unauthorized';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next({ request: { headers: request.headers } });
});

export const config = {
  matcher: [
    '/((?!health|login|signup|unauthorized|auth|_next/static|_next/image|favicon.ico|api).*)',
  ],
};
