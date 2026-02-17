import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// All roles allowed in Kealee PM (both internal and external)
const ALLOWED_ROLES = [
  // Internal Kealee staff
  'pm', 'pm_supervisor', 'admin', 'super_admin',
  // External users (GCs, builders, contractors)
  'contractor', 'gc', 'builder', 'architect', 'engineer', 'owner', 'client',
];

// Routes restricted to internal Kealee staff only
const INTERNAL_ONLY_ROUTES = [
  '/work-queue',
  '/pipeline',
  '/autonomous-actions',
  '/contractor-rankings',
  '/contractor-payments',
  '/clients',
];

const INTERNAL_ROLES = ['pm', 'pm_supervisor', 'admin', 'super_admin'];

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
    return response;
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

  // Get org membership for role
  const { data: membership } = await adminClient
    .from('OrgMember')
    .select('roleKey')
    .eq('userId', session.user.id)
    .limit(1)
    .single();

  const effectiveRole = (membership?.roleKey || user.role || 'user').toLowerCase();

  // Check if user has any allowed role
  if (!ALLOWED_ROLES.includes(effectiveRole)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/unauthorized';
    return NextResponse.redirect(redirectUrl);
  }

  // Check internal-only route restrictions
  const pathname = request.nextUrl.pathname;
  const isInternalRoute = INTERNAL_ONLY_ROUTES.some((route) => pathname.startsWith(route));

  if (isInternalRoute && !INTERNAL_ROLES.includes(effectiveRole)) {
    // External user trying to access internal tool — redirect to dashboard
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // Set role header for downstream pages
  response.headers.set('x-user-role', effectiveRole);

  return response;
}

export const config = {
  matcher: [
    '/((?!login|signup|unauthorized|_next/static|_next/image|favicon.ico|api|icon-|manifest).*)',
  ],
};
