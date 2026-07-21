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
import { getOwnerPortalBaseUrl } from '@/lib/owner-portal-urls'
import { mapNextPathToOwnerPortal } from '@/lib/owner-portal-next-path'

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
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id && user.email) {
        const { linkUserToIntakesAfterAuth } = await import('@/lib/link-intake-user')
        await linkUserToIntakesAfterAuth(user.id, user.email).catch((err: Error) => {
          console.warn('[auth/callback] link intakes:', err.message)
        })
      }
      return redirectResponse
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  // Legacy magic links may still hit web-main — send users to owner portal login
  const ownerLogin = new URL('/login', getOwnerPortalBaseUrl())
  ownerLogin.searchParams.set('next', mapNextPathToOwnerPortal(next))
  ownerLogin.searchParams.set('error', 'auth_callback_failed')
  return NextResponse.redirect(ownerLogin.toString())
}
