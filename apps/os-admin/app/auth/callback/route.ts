/**
 * OAuth callback handler for Supabase auth (Google OAuth, etc.)
 * Exchanges the authorization code for a session, then redirects to dashboard.
 *
 * Security: the `redirect` param is validated to ensure it is a relative path
 * (starts with "/") to prevent open-redirect attacks.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

function safeRedirectPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback
  // Only allow relative paths — block protocol-relative ("//evil.com") and absolute URLs
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  return fallback
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const redirectTo = safeRedirectPath(requestUrl.searchParams.get('redirect'), '/dashboard')

  // Handle OAuth provider errors (e.g. user denied consent)
  if (error) {
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'auth_callback_failed')
    loginUrl.searchParams.set(
      'error_description',
      errorDescription || 'Authentication was cancelled or failed.'
    )
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
    }
  }

  // If code exchange failed or no code was provided, redirect to login with error
  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('error', 'auth_callback_failed')
  loginUrl.searchParams.set(
    'error_description',
    'Could not complete sign-in. Please try again.'
  )
  return NextResponse.redirect(loginUrl)
}
