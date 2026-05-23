import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC = ['/login', '/api/auth/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('portal_admin_session')?.value
  const secret = process.env.PORTAL_ADMIN_SECRET || process.env.PORTAL_ADMIN_PASSWORD
  if (!secret || token !== secret) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
