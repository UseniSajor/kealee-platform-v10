'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'

type Mode = 'magic' | 'password' | 'create'

function safeNext(raw: string | null): string {
  if (!raw?.trim()) return 'https://owner.kealee.com/deliverables'
  const n = raw.trim()
  if (n.startsWith('http://') || n.startsWith('https://')) {
    try {
      const u = new URL(n)
      if (u.hostname.endsWith('kealee.com') || u.hostname === 'localhost') return n
    } catch { /* fall through */ }
  }
  if (n.startsWith('/')) return n
  return `/${n}`
}

function isMarketingPath(path: string): boolean {
  return path.startsWith('/marketing') || path.startsWith('/admin/marketing')
}

function AuthHubLoginForm() {
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next') ?? searchParams.get('redirectTo'))
  const emailParam = searchParams.get('email') ?? ''
  const welcomeMode = searchParams.get('welcome') === '1'
  const authError = searchParams.get('error')
  const marketingLogin = isMarketingPath(next)

  const [mode, setMode] = useState<Mode>(welcomeMode ? 'create' : 'password')
  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callback },
      })
      if (err) throw err
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
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      window.location.href = next
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

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
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { persona: 'homeowner', source: 'auth_hub' },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (err) throw err
      if (data.session) {
        window.location.href = next
        return
      }
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#1A2B4A] p-8 shadow-2xl max-w-md w-full">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#2ABFBF]">
          <Home className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          {mode === 'create'
            ? 'Create your Kealee account'
            : marketingLogin
              ? 'Sign in to Marketing Workspace'
              : 'Sign in to Kealee'}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {marketingLogin
            ? 'Use the email and password provided by Kealee. You will land in the marketing workspace after sign-in.'
            : 'One account for concepts, estimates, permits, and your project portal.'}
        </p>
      </div>

      {authError === 'unauthorized' && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          Your account does not have access to this area. Contact Kealee if you need marketing workspace access.
        </div>
      )}

      {sent && (
        <div className="rounded-lg border border-[#2ABFBF]/30 bg-[#2ABFBF]/10 p-4 text-center text-sm text-white">
          <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-[#2ABFBF]" />
          Check your inbox at <strong>{email}</strong>
        </div>
      )}

      {!sent && (
        <>
          {!marketingLogin && (
          <div className="mb-4 flex rounded-lg overflow-hidden border border-slate-600">
            {(['magic', 'password', ...(welcomeMode ? ['create'] as const : [])] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError('') }}
                className="flex-1 py-2 text-xs font-semibold capitalize"
                style={{
                  backgroundColor: mode === m ? '#2ABFBF' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {m === 'magic' ? 'Email link' : m}
              </button>
            ))}
          </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-200">{error}</div>
          )}

          <form
            onSubmit={
              mode === 'magic' ? handleMagicLink : mode === 'password' ? handlePasswordLogin : handleCreateAccount
            }
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm text-white/70">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={welcomeMode && mode === 'create' && !!emailParam}
                  className="w-full rounded-lg border border-slate-600 bg-[#0F1A2E] py-2.5 pl-10 pr-4 text-sm text-white"
                  required
                />
              </div>
            </div>

            {mode !== 'magic' && (
              <>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-[#0F1A2E] py-2.5 pl-10 pr-10 text-sm text-white"
                      minLength={8}
                      required
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {mode === 'create' && (
                  <div>
                    <label className="mb-1 block text-sm text-white/70">Confirm password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white"
                      required
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8793A] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'magic' ? 'Send access link' : mode === 'create' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-xs text-white/40">
        <Link href="/" className="text-[#2ABFBF] hover:underline">Back to kealee.com</Link>
      </p>
    </div>
  )
}

export default function AuthLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-[#2ABFBF]" />}>
        <AuthHubLoginForm />
      </Suspense>
    </div>
  )
}
