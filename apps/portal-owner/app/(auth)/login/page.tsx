'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, Mail, Lock, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  // mode: 'magic' = send magic link (default for concept clients), 'password' = classic login
  const [mode, setMode]               = useState<'magic' | 'password'>('magic')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [rateLimit, setRateLimit]     = useState(false)
  const [sent, setSent]               = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setRateLimit(false)
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRateLimit(!!data.rateLimit)
        throw new Error(data.error ?? 'Failed to send link')
      }
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send link')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      window.location.href = '/deliverables'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border p-8 shadow-2xl" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: '#2ABFBF' }}>
          <Home className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Owner Portal</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {mode === 'magic' ? 'Enter your email to access your concept package' : 'Sign in with your password'}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex rounded-lg overflow-hidden mb-6 border" style={{ borderColor: '#2A3D5F' }}>
        <button
          onClick={() => { setMode('magic'); setError(''); setSent(false) }}
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: mode === 'magic' ? '#2ABFBF' : 'transparent',
            color: mode === 'magic' ? '#fff' : 'rgba(255,255,255,0.5)',
          }}
        >
          Magic Link
        </button>
        <button
          onClick={() => { setMode('password'); setError(''); setSent(false) }}
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: mode === 'password' ? '#2A3D5F' : 'transparent',
            color: mode === 'password' ? '#fff' : 'rgba(255,255,255,0.5)',
          }}
        >
          Password
        </button>
      </div>

      {/* Magic link sent confirmation */}
      {sent && (
        <div className="rounded-lg p-4 text-sm text-center space-y-2" style={{ backgroundColor: 'rgba(42,191,191,0.15)', border: '1px solid rgba(42,191,191,0.3)' }}>
          <CheckCircle2 className="h-6 w-6 mx-auto" style={{ color: '#2ABFBF' }} />
          <p className="font-semibold text-white">Check your inbox</p>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            We sent a sign-in link to <strong className="text-white">{email}</strong>.
            Click it to open your deliverables.
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Can&apos;t find it? Check your spam folder. Link expires in 1 hour.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-xs underline hover:no-underline"
            style={{ color: '#2ABFBF' }}
          >
            Send again
          </button>
        </div>
      )}

      {!sent && mode === 'magic' && (
        <form onSubmit={handleMagicLink} className="space-y-4">
          {error && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                backgroundColor: rateLimit ? 'rgba(234,179,8,0.15)' : 'rgba(220,38,38,0.2)',
                color: rateLimit ? '#FDE68A' : '#FCA5A5',
                border: rateLimit ? '1px solid rgba(234,179,8,0.3)' : undefined,
              }}
            >
              {error}
            </div>
          )}
          <div>
            <label htmlFor="magic-email" className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                id="magic-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E', '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                placeholder="The email you used at intake"
                required
              />
            </div>
            <p className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Use the same email you provided when ordering your concept package.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#E8793A' }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Sending…' : 'Send Access Link'}
          </button>
        </form>
      )}

      {!sent && mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.2)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E', '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E', '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                placeholder="Enter your password"
                required
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
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#E8793A' }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        New to Kealee?{' '}
        <Link href="/signup" className="font-medium hover:underline" style={{ color: '#2ABFBF' }}>
          Create an account
        </Link>
      </p>
    </div>
  )
}
