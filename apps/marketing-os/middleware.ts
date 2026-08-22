import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const ALLOWED_ROLES = new Set(['admin', 'super_admin', 'marketing_admin'])

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    const url = new URL(process.env.MARKETING_OS_LOGIN_URL ?? '/login', request.url)
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  const claims = sessionClaims as Record<string, unknown> | null
  const metadata = (claims?.metadata ?? claims?.publicMetadata ?? {}) as Record<string, unknown>
  const role = String(metadata.role ?? claims?.org_role ?? '').toLowerCase()
  if (!ALLOWED_ROLES.has(role)) return NextResponse.redirect(new URL('/unauthorized', request.url))
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!login|unauthorized|guides|sitemap.xml|robots.txt|api/health|api/webhooks|_next/static|_next/image|favicon.ico).*)'],
}
