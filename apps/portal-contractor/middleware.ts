import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth()

  const protectedPaths = ['/leads', '/bids', '/projects', '/payments', '/credentials', '/profile', '/services', '/permits']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !userId) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isAuthPath && userId) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/leads'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next({ request: { headers: request.headers } })
})

export const config = {
  matcher: ['/leads/:path*', '/bids/:path*', '/projects/:path*', '/payments/:path*', '/credentials/:path*', '/profile/:path*', '/services/:path*', '/services', '/permits/:path*', '/permits', '/login', '/signup'],
}
