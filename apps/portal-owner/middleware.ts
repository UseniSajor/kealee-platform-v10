import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const protectedPaths = ['/', '/projects', '/project', '/payments', '/documents', '/messages', '/twin', '/concepts', '/deliverables', '/services']
  const isProtectedPath = protectedPaths.some(path =>
    path === '/' ? request.nextUrl.pathname === '/' : request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !session) {
    const redirectUrl = request.nextUrl.clone()
    const next = request.nextUrl.pathname + request.nextUrl.search
    redirectUrl.pathname = '/login'
    redirectUrl.search = `?next=${encodeURIComponent(next)}`
    return NextResponse.redirect(redirectUrl)
  }

  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isAuthPath && session) {
    const next = request.nextUrl.searchParams.get('next')
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = next && next.startsWith('/') ? next : '/deliverables'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/projects/:path*', '/project/:path*', '/payments/:path*',
    '/documents/:path*', '/messages/:path*', '/twin/:path*',
    '/concepts/:path*',
    '/deliverables/:path*', '/deliverables',
    '/services/:path*', '/services',
    '/login', '/signup',
    '/auth/callback',
    '/auth/callback/:path*',
  ],
}
