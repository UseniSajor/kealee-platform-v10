'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'

function CompleteAccountForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? 'https://owner.kealee.com/deliverables'
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
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
      const { error: err } = await supabase.auth.updateUser({
        password,
        data: { persona: 'homeowner', accountCompletedAt: new Date().toISOString() },
      })
      if (err) throw err
      const { data: { user } } = await supabase.auth.getUser()
      fetch('/api/marketing/portal-activated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email ?? email, userId: user?.id }),
      }).catch(() => {})
      setDone(true)
      setTimeout(() => { window.location.href = next }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not set password — sign in with email link first.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center text-white">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#2ABFBF]" />
        <p className="font-semibold">Account saved — redirecting…</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#1A2B4A] p-8 shadow-2xl max-w-md w-full">
      <h1 className="text-xl font-bold text-white mb-1">Save your project</h1>
      <p className="text-sm text-white/50 mb-6">
        Create a password to access your deliverables, estimates, and permits anytime.
        {email ? <> Signed in as <strong className="text-white">{email}</strong>.</> : null}
      </p>
      {error && <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-200">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-white/70">New password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-[#0F1A2E] py-2.5 pl-10 pr-4 text-sm text-white" minLength={8} required />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/70">Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white" required />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#E8793A] py-2.5 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save & continue
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-white/40">
        <Link href={`/auth/login?next=${encodeURIComponent(next)}${email ? `&email=${encodeURIComponent(email)}` : ''}`} className="text-[#2ABFBF]">Sign in with email link instead</Link>
      </p>
    </div>
  )
}

export default function AuthCompletePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-[#2ABFBF]" />}>
        <CompleteAccountForm />
      </Suspense>
    </div>
  )
}
