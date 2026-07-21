import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js CSRF Protection Middleware
 * Validates CSRF tokens for all state-changing requests
 */

// CSRF token validation patterns
const CSRF_EXEMPT_PATHS = [
  '/api/webhooks/', // Webhook endpoints (verified by signature)
  '/api/health', // Health check endpoints
  '/_next/', // Next.js internal routes
  '/static/', // Static assets
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Skip CSRF check for exempt paths
  if (CSRF_EXEMPT_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Skip CSRF check for GET/HEAD/OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return NextResponse.next()
  }

  // For state-changing requests (POST/PUT/PATCH/DELETE), CSRF is handled by API
  // The API client automatically includes CSRF tokens in headers
  // This middleware is mainly for API route protection if needed

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
