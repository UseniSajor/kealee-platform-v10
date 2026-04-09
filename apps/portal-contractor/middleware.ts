import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  let isAuthenticated = false

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
      // Supabase unavailable
    }
  }

  const protectedPaths = ['/leads', '/bids', '/projects', '/payments', '/credentials', '/profile', '/marketing', '/permits']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isAuthPath && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/leads'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/leads/:path*', '/bids/:path*', '/projects/:path*', '/payments/:path*', '/credentials/:path*', '/profile/:path*', '/marketing/:path*', '/permits/:path*', '/login', '/signup'],
}
