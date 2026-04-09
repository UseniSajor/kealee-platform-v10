import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  let isAuthenticated = false

  // Check Supabase session (only if configured)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isSupabaseConfigured = supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project')

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({ request: { headers: request.headers } })
              cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
            },
          },
        }
      )
      const { data: { session } } = await supabase.auth.getSession()
      isAuthenticated = !!session
    } catch {
      // Supabase unavailable — fall through to demo cookie check
    }
  }

  // Demo cookie bypass
  const protectedPaths = ['/users', '/orgs', '/subscriptions', '/schema', '/validation', '/test-panel']
  const isProtectedPath = request.nextUrl.pathname === '/' || protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (request.nextUrl.pathname === '/login' && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/', '/users/:path*', '/orgs/:path*', '/subscriptions/:path*', '/schema/:path*', '/validation/:path*', '/test-panel/:path*', '/login'],
}
