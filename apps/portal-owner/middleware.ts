import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth()

  const publicPaths = ['/auth/claim', '/auth/callback', '/account/complete', '/reset-password']
  if (publicPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  const protectedPaths = ['/', '/projects', '/project', '/payments', '/documents', '/messages', '/twin', '/concepts', '/deliverables', '/services']
  const isProtectedPath = protectedPaths.some(path =>
    path === '/' ? request.nextUrl.pathname === '/' : request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !userId) {
    const redirectUrl = request.nextUrl.clone()
    const next = request.nextUrl.pathname + request.nextUrl.search
    redirectUrl.pathname = '/login'
    redirectUrl.search = `?next=${encodeURIComponent(next)}`
    return NextResponse.redirect(redirectUrl)
  }

  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isAuthPath && userId) {
    const next = request.nextUrl.searchParams.get('next')
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = next && next.startsWith('/') ? next : '/deliverables'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next({ request: { headers: request.headers } })
})

export const config = {
  matcher: [
    '/',
    '/projects/:path*', '/project/:path*', '/payments/:path*',
    '/documents/:path*', '/messages/:path*', '/twin/:path*',
    '/concepts/:path*',
    '/deliverables/:path*', '/deliverables',
    '/services/:path*', '/services',
    '/login', '/signup',
    '/auth/claim',
    '/auth/callback',
    '/auth/callback/:path*',
    '/reset-password/:path*',
  ],
}
