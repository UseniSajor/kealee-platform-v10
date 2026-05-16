/**
 * GET /auth/callback
 *
 * Supabase PKCE magic-link callback.
 * Exchanges the one-time `code` for a session, sets the auth cookie,
 * then redirects the user to the `next` param (typically /concept/[uuid]).
 *
 * This URL must be whitelisted in Supabase Dashboard →
 * Authentication → URL Configuration → Redirect URLs.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  // Exchange failed (expired or missing code) — back to access gate with an error flag
  const accessUrl = new URL('/concept/access', origin)
  if (next !== '/') accessUrl.searchParams.set('next', next)
  accessUrl.searchParams.set('error', 'link-expired')
  return NextResponse.redirect(accessUrl.toString())
}
