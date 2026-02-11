import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Roles allowed in the PM dashboard
const ALLOWED_ROLES = ['pm', 'admin', 'super_admin'];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Require authentication for all protected pages
  if (!session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Use service role client for DB lookups (bypasses RLS)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    // If service key not configured, allow through (rely on page-level auth)
    return res;
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  // Check for user in User table
  const { data: user } = await adminClient
    .from('User')
    .select('role, status')
    .eq('id', session.user.id)
    .single();

  // Must be ACTIVE
  if (!user || user.status !== 'ACTIVE') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/unauthorized';
    return NextResponse.redirect(redirectUrl);
  }

  // Enforce PM or admin role
  const { data: membership } = await adminClient
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

  return res;
}

export const config = {
  matcher: [
    '/((?!login|signup|unauthorized|_next/static|_next/image|favicon.ico|api).*)',
  ],
};
