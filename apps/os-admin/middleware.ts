import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Mock session verification - replace with actual implementation
async function verifySession(sessionValue: string) {
  // TODO: Implement actual session verification
  // This should check Supabase session or your auth system
  return { role: 'admin', id: 'user-id' }
}

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')

  // Require authentication
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify user has ADMIN role ONLY
  try {
    const user = await verifySession(session.value)

    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  } catch (error) {
    // Session invalid, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!login|unauthorized|_next/static|_next/image|favicon.ico|api).*)',
  ],
}
