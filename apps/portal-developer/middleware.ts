import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth()

  const protectedPaths = ['/pipeline', '/feasibility', '/capital', '/portfolio', '/reports']
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
    redirectUrl.pathname = '/pipeline'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next({ request: { headers: request.headers } })
})

export const config = {
  matcher: ['/pipeline/:path*', '/feasibility/:path*', '/capital/:path*', '/portfolio/:path*', '/reports/:path*', '/login', '/signup'],
}
