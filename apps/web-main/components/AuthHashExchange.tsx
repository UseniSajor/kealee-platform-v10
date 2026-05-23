'use client'

/**
 * AuthHashExchange
 *
 * Handles the Supabase implicit-flow token that arrives as a URL hash fragment
 * (#access_token=...) when the OTP email fallback is used. The hash is
 * browser-only — the server never sees it — so PKCE callback route.ts can't
 * process it. This component runs on every page and exchanges the token for a
 * session cookie so the middleware picks it up on the next navigation.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export function AuthHashExchange() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.hash.includes('access_token')) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // createBrowserClient auto-detects and processes the #access_token= hash.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Clean the hash from the URL without a hard navigation.
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        // Refresh server components so middleware sees the new session cookie.
        router.refresh()
      }
    })
  }, [router])

  return null
}
