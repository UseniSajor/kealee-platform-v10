'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Home, Lock, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // The recovery link from Supabase sets a session via /auth/callback.
  // Wait for the auth state to settle before allowing the password update.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true)
      }
    })

    // Also check for an existing session (arrived via /auth/callback redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr
      setDone(true)
      // Redirect to deliverables after a short delay so user sees the success state
      setTimeout(() => router.replace('/deliverables'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border p-8 shadow-2xl" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: '#2ABFBF' }}>
          <Home className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Set new password</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Choose a strong password for your Owner Portal account
        </p>
      </div>

      {done ? (
        <div className="rounded-lg p-4 text-sm text-center space-y-2" style={{ backgroundColor: 'rgba(42,191,191,0.15)', border: '1px solid rgba(42,191,191,0.3)' }}>
          <CheckCircle2 className="h-6 w-6 mx-auto" style={{ color: '#2ABFBF' }} />
          <p className="font-semibold text-white">Password updated</p>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Taking you to your deliverables…
          </p>
        </div>
      ) : !sessionReady ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Verifying reset link…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.2)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}

          {/* New password */}
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E', '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                placeholder="Min 8 chars — upper, lower, number, symbol"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E', '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                placeholder="Re-enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#E8793A' }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Updating…' : 'Set New Password →'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordUpdatePage() {
  return (
    <Suspense fallback={
      <div className="rounded-2xl border p-8 shadow-2xl flex items-center justify-center" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A', minHeight: 300 }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
