import { NextRequest, NextResponse } from 'next/server'

/** Preserve legacy magic-link URLs while Clerk remains the sole session authority. */
export function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next')
  const safeNext = next?.startsWith('/') ? next : '/'
  const destination = new URL('/sign-in', request.url)
  destination.searchParams.set('redirect_url', safeNext)
  destination.searchParams.set('legacy_callback', '1')
  return NextResponse.redirect(destination)
}
