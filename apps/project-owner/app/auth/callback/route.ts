/**
 * GET /auth/callback — server exchange for PKCE ?code= and ?token_hash= magic links.
 * Session cookies must be set on the redirect response (see web-main auth/callback).
 * Hash-only tokens (#access_token=) are handled by page.tsx in the same segment.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function safeNextPath(raw: string | null): string {
  const next = raw ?? '/deliverables'
  return next.startsWith('/') ? next : '/deliverables'
}

function loginRedirect(origin: string, next: string, detail?: string | null) {
  const url = new URL('/login', origin)
  url.searchParams.set('error', 'auth_callback_failed')
  url.searchParams.set('next', next)
  if (detail) url.searchParams.set('detail', detail.slice(0, 120))
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'))
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (!code && !(tokenHash && type)) {
    return NextResponse.next()
  }

  const redirectResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof redirectResponse.cookies.set>[2],
            ),
          )
        },
      },
    },
  )

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return redirectResponse
    console.error('[portal-owner/auth/callback] exchangeCodeForSession:', error.message)
    return loginRedirect(origin, next, error.message)
  }

  const otpType = type as 'magiclink' | 'email' | 'signup' | 'recovery' | 'invite'
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: otpType })
  if (!error) return redirectResponse

  console.error('[portal-owner/auth/callback] verifyOtp:', error.message)
  return loginRedirect(origin, next, error.message)
}
