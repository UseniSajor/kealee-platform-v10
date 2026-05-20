/**
 * GET /auth/callback
 *
 * Supabase PKCE magic-link callback.
 * Exchanges the one-time `code` for a session, sets the auth cookie,
 * then redirects the user to the `next` param (typically /concept/[uuid]).
 *
 * IMPORTANT: cookies must be set on the redirect response object itself.
 * Using next/headers cookieStore and then returning a new NextResponse.redirect()
 * silently drops the cookies — browser never receives the session cookie.
 *
 * This URL must be whitelisted in Supabase Dashboard →
 * Authentication → URL Configuration → Redirect URLs.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Build the redirect response first so cookies can be attached to it.
    const redirectResponse = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectResponse.cookies.set(name, value, options as Parameters<typeof redirectResponse.cookies.set>[2])
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirectResponse
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  // Exchange failed (expired or missing code) — back to access gate with an error flag
  const accessUrl = new URL('/concept/access', origin)
  if (next !== '/') accessUrl.searchParams.set('next', next)
  accessUrl.searchParams.set('error', 'link-expired')
  return NextResponse.redirect(accessUrl.toString())
}
