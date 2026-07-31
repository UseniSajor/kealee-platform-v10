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

  const protectedPaths = ['/leads', '/bids', '/projects', '/payments', '/credentials', '/profile', '/services', '/permits']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // A homeowner or developer account signed in elsewhere still carries a valid
  // Supabase session (auth cookies are shared across .kealee.com) — that alone
  // must not grant contractor-portal access. Only block on an explicit
  // mismatch so accounts predating this field aren't locked out.
  if (isProtectedPath && session) {
    const role = session.user.user_metadata?.role
    if (role && role !== 'contractor') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.search = '?error=wrong_portal'
      return NextResponse.redirect(redirectUrl)
    }
  }

  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isAuthPath && session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/leads'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/leads/:path*', '/bids/:path*', '/projects/:path*', '/payments/:path*', '/credentials/:path*', '/profile/:path*', '/services/:path*', '/services', '/permits/:path*', '/permits', '/login', '/signup'],
}
