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

  const protectedPaths = ['/pipeline', '/feasibility', '/capital', '/portfolio', '/reports']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // A homeowner or contractor account signed in elsewhere still carries a valid
  // Supabase session (auth cookies are shared across .kealee.com) — that alone
  // must not grant developer-portal access. Only block on an explicit
  // mismatch so accounts predating this field aren't locked out.
  if (isProtectedPath && session) {
    const role = session.user.user_metadata?.role
    if (role && role !== 'developer') {
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
    redirectUrl.pathname = '/pipeline'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/pipeline/:path*', '/feasibility/:path*', '/capital/:path*', '/portfolio/:path*', '/reports/:path*', '/login', '/signup'],
}
