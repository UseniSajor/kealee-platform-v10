'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Home, Mail, Lock, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Mode = 'magic' | 'password' | 'create'

function LoginForm() {
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/deliverables'
  const authError    = searchParams.get('error')
  const authDetail   = searchParams.get('detail')
  const emailParam   = searchParams.get('email') ?? ''
  const welcomeMode  = searchParams.get('welcome') === '1'

  const authInfo     = searchParams.get('info')

  const [mode, setMode]                   = useState<Mode>(welcomeMode ? 'create' : 'magic')
  const [email, setEmail]                 = useState(emailParam)
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [rateLimit, setRateLimit]         = useState(false)
  const [sent, setSent]                   = useState(false)

  // ── Magic link ──────────────────────────────────────────────────────────────
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setRateLimit(false)
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next }),
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

  // ── Password sign-in ────────────────────────────────────────────────────────
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr
      window.location.href = next
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  // ── Create account ──────────────────────────────────────────────────────────
  async function handleCreateAccount(e: React.FormEvent) {
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
      const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })

      if (signUpErr) {
        // Account already exists — switch to password sign-in
        const alreadyExists = /already registered|already exists/i.test(signUpErr.message)
        if (alreadyExists) {
          setError('You already have an account. Enter your password below to sign in.')
          setMode('password')
          setPassword('')
          setConfirmPassword('')
          return
        }
        throw signUpErr
      }

      if (data.session) {
        // Email confirmation is off — session returned immediately
        window.location.href = next
        return
      }

      // Email confirmation is on — tell the user to check inbox
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setSent(false)
    setPassword('')
    setConfirmPassword('')
  }

  const emailLocked = welcomeMode && mode === 'create' && !!emailParam

  return (
    <div className="rounded-2xl border p-8 shadow-2xl" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>

      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: '#2ABFBF' }}>
          <Home className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          {mode === 'create' ? 'Create your account' : 'Owner Portal'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {mode === 'create'
            ? 'Set a password to access your concept package'
            : mode === 'password'
            ? 'Sign in with your password'
            : 'Enter your email to access your concept package'}
        </p>
      </div>

      {/* Expired link info banner (amber) */}
      {authInfo === 'link_expired' && (
        <div
          className="mb-4 rounded-lg p-3 text-sm"
          style={{ backgroundColor: 'rgba(234,179,8,0.15)', color: '#FDE68A', border: '1px solid rgba(234,179,8,0.3)' }}
        >
          <p className="font-medium">Your access link has expired</p>
          <p className="mt-1 text-xs opacity-90">
            {emailParam
              ? 'Your email is filled in below — click "Send Access Link" to get a new one instantly.'
              : 'Enter your email below to receive a fresh access link.'}
          </p>
        </div>
      )}

      {/* Auth callback error banner */}
      {authError && authError !== 'auth_callback_failed' && (
        <div
          className="mb-4 rounded-lg p-3 text-sm"
          style={{ backgroundColor: 'rgba(220,38,38,0.2)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.3)' }}
        >
          <p className="font-medium">
            {authError === 'token_expired'
              ? 'Your access link has expired'
              : authError === 'invalid_token'
              ? 'This link is invalid or has already been used'
              : 'Sign-in failed'}
          </p>
          <p className="mt-1 text-xs opacity-90">
            {authDetail ?? 'Use the form below to sign in with your email and password.'}
          </p>
        </div>
      )}

      {authError === 'auth_callback_failed' && (
        <div
          className="mb-4 rounded-lg p-3 text-sm"
          style={{ backgroundColor: 'rgba(220,38,38,0.2)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.3)' }}
        >
          <p className="font-medium">Sign-in link expired or invalid</p>
          <p className="mt-1 text-xs opacity-90">
            {authDetail ?? 'Request a new magic link below using the same email you used at checkout.'}
          </p>
        </div>
      )}

      {/* ── Create account mode ───────────────────────────────────────────── */}
      {mode === 'create' && (
        <>
          {sent ? (
            <div className="rounded-lg p-4 text-sm text-center space-y-2" style={{ backgroundColor: 'rgba(42,191,191,0.15)', border: '1px solid rgba(42,191,191,0.3)' }}>
              <CheckCircle2 className="h-6 w-6 mx-auto" style={{ color: '#2ABFBF' }} />
              <p className="font-semibold text-white">Check your inbox</p>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                We sent a confirmation link to <strong className="text-white">{email}</strong>.
                Click it to activate your account and view your concept.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              {error && (
                <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.2)', color: '#FCA5A5' }}>
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    type="email"
                    value={email}
                    readOnly={emailLocked}
                    onChange={(e) => { if (!emailLocked) setEmail(e.target.value) }}
                    className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
                    style={{
                      borderColor: '#2A3D5F',
                      backgroundColor: emailLocked ? 'rgba(255,255,255,0.05)' : '#0F1A2E',
                      '--tw-ring-color': '#2ABFBF',
                      cursor: emailLocked ? 'default' : undefined,
                    } as React.CSSProperties}
                    required
                  />
                </div>
                {emailLocked && (
                  <p className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    This is the email you used at checkout.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Create a password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
                    style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E', '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
                    placeholder="At least 8 characters"
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
                {loading ? 'Creating account…' : 'Create Account & View My Concept →'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Already have an account?{' '}
            <button onClick={() => switchMode('password')} className="font-medium hover:underline" style={{ color: '#2ABFBF' }}>
              Sign in
            </button>
          </p>
        </>
      )}

      {/* ── Magic link + Password modes ───────────────────────────────────── */}
      {mode !== 'create' && (
        <>
          {/* Mode tabs */}
          <div className="flex rounded-lg overflow-hidden mb-6 border" style={{ borderColor: '#2A3D5F' }}>
            <button
              onClick={() => switchMode('magic')}
              className="flex-1 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: mode === 'magic' ? '#2ABFBF' : 'transparent',
                color: mode === 'magic' ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
            >
              Magic Link
            </button>
            <button
              onClick={() => switchMode('password')}
              className="flex-1 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: mode === 'password' ? '#2A3D5F' : 'transparent',
                color: mode === 'password' ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
            >
              Password
            </button>
          </div>

          {/* Magic link sent */}
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

          {/* Magic link form */}
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

          {/* Password form */}
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
        </>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="rounded-2xl border p-8 shadow-2xl flex items-center justify-center" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A', minHeight: 300 }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
