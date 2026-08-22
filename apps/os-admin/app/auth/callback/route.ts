import { NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/login?legacy_callback=1', request.url))
}
