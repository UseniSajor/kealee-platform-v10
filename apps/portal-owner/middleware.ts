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

  const protectedPaths = ['/projects', '/project', '/payments', '/documents', '/messages', '/twin']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  // Protect the deliverables LIST (exact) but NOT detail pages (/deliverables/:id) — those stay
  // public so owners can share a concept URL directly with contractors without requiring login.
  const isDeliverablesList = request.nextUrl.pathname === '/deliverables'

  if ((isProtectedPath || isDeliverablesList) && !session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isAuthPath && session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/projects'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/projects/:path*', '/project/:path*', '/payments/:path*',
    '/documents/:path*', '/messages/:path*', '/twin/:path*',
    '/deliverables',   // list page only — NOT /deliverables/:path*
    '/login', '/signup',
  ],
}
