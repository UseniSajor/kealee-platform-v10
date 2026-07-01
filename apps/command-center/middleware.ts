import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  hasCommandCenterApiRole,
  verifyOpsBearer,
} from '@kealee/auth/ops-api-auth'

const UI_PROTECTED = ['/', '/twins', '/events', '/bots', '/marketing', '/renderings', '/integrations', '/analytics']
const API_PUBLIC_PREFIXES = ['/api/health', '/api/auth/']

function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

function isPublicApi(pathname: string): boolean {
  return API_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

function isProtectedUi(pathname: string): boolean {
  return UI_PROTECTED.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(`${p}/`)),
  )
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (isApiPath(pathname) && !isPublicApi(pathname)) {
    if (verifyOpsBearer(request)) {
      return NextResponse.next()
    }

    let apiResponse = NextResponse.next({ request: { headers: request.headers } })
    const supabaseApi = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            apiResponse = NextResponse.next({ request: { headers: request.headers } })
            cookiesToSet.forEach(({ name, value, options }) =>
              apiResponse.cookies.set(name, value, options as Parameters<typeof apiResponse.cookies.set>[2]),
            )
          },
        },
      },
    )
    const { data: { user } } = await supabaseApi.auth.getUser()
    const role = (user?.app_metadata?.role as string | undefined)?.toLowerCase()
    if (user && hasCommandCenterApiRole(role)) {
      return apiResponse
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]),
          )
        },
      },
    },
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (isProtectedUi(pathname)) {
    if (!session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    const role = (session.user.app_metadata?.role as string | undefined)?.toLowerCase()
    if (!hasCommandCenterApiRole(role)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(redirectUrl)
    }
  }

  const authPaths = ['/login', '/signup']
  if (authPaths.some((p) => pathname.startsWith(p)) && session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/twins/:path*',
    '/events/:path*',
    '/bots/:path*',
    '/marketing/:path*',
    '/renderings/:path*',
    '/integrations/:path*',
    '/analytics/:path*',
    '/login',
    '/signup',
    '/auth/callback',
    '/api/:path*',
  ],
}
