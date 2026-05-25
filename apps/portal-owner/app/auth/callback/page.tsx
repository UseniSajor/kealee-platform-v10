'use client'

/**
 * Fallback when Supabase redirects with hash tokens (#access_token=) — invisible to route.ts.
 * PKCE ?code= and ?token_hash= are handled by ./route.ts (cookies on redirect response).
 */
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

function parseHashTokens(): { access_token: string; refresh_token: string } | null {
  if (typeof window === 'undefined' || !window.location.hash) return null
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (access_token && refresh_token) return { access_token, refresh_token }
  return null
}

function AuthCallbackInner() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Signing you in…')

  useEffect(() => {
    let cancelled = false

    async function finish() {
      const next = searchParams.get('next') ?? '/deliverables'
      const safeNext = next.startsWith('/') ? next : '/deliverables'

      const code = searchParams.get('code')
      const tokenHash = searchParams.get('token_hash')
      if (code || tokenHash) {
        return
      }

      const hashTokens = parseHashTokens()
      if (hashTokens) {
        setMessage('Confirming your link…')
        const { error } = await supabase.auth.setSession(hashTokens)
        if (!error) {
          if (!cancelled) window.location.assign(safeNext)
          return
        }
        console.error('[auth/callback] setSession from hash:', error.message)
      }

      setMessage('Loading your session…')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (!cancelled) window.location.assign(safeNext)
        return
      }

      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 2500)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
          if (event === 'SIGNED_IN' && s) {
            window.clearTimeout(timeout)
            subscription.unsubscribe()
            resolve()
          }
        })
      })

      const { data: { session: afterWait } } = await supabase.auth.getSession()
      if (afterWait && !cancelled) {
        window.location.assign(safeNext)
        return
      }

      if (!cancelled) {
        const q = new URLSearchParams({ error: 'auth_callback_failed', next: safeNext })
        const errParam = searchParams.get('error_description') ?? searchParams.get('error')
        if (errParam) q.set('detail', errParam.slice(0, 120))
        window.location.assign(`/login?${q.toString()}`)
      }
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ color: 'rgba(255,255,255,0.8)' }}
    >
      <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#2ABFBF' }} />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#2ABFBF' }} />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
