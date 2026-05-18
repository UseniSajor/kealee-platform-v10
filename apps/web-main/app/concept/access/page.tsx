'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, ArrowRight } from 'lucide-react'

function AccessInner() {
  const searchParams  = useSearchParams()
  const next          = searchParams.get('next') ?? '/'
  const defaultEmail  = searchParams.get('email') ?? ''
  const errorParam    = searchParams.get('error') ?? ''

  const [email,     setEmail]     = useState(defaultEmail)
  const [sent,      setSent]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [rateLimit, setRateLimit] = useState(false)
  const [error,     setError]     = useState(
    errorParam === 'link-expired' ? 'Your access link has expired. Request a new one below.' : ''
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    setRateLimit(false)
    try {
      const res  = await fetch('/api/auth/magic-link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.rateLimit) setRateLimit(true)
        throw new Error(data.error || 'Failed to send link')
      }
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 mb-2">
            <Mail className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Check your email</h1>
          <p className="text-slate-500 leading-relaxed">
            We sent a secure access link to{' '}
            <strong className="text-slate-800">{email}</strong>.
            Click the link in that email to view your concept package.
          </p>
          <p className="text-xs text-slate-400">
            Link expires in 1 hour. Check your spam folder if you don&apos;t see it.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm font-semibold text-[#E8724B] hover:underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full space-y-8">

        {/* Branding */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A2B4A] mb-4">
            <span className="text-xl font-extrabold text-white">K</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Access your concept package</h1>
          <p className="mt-2 text-slate-500 leading-relaxed">
            Enter the email you used to purchase your concept.
            We&apos;ll send you a secure, one-click access link.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {error && (
            <div className={`mb-4 p-3 rounded-xl border text-sm ${
              rateLimit
                ? 'bg-amber-50 border-amber-100 text-amber-800'
                : 'bg-red-50 border-red-100 text-red-600'
            }`}>
              <p>{error}</p>
              {rateLimit && (
                <p className="mt-2 text-amber-700">
                  Can&apos;t find it?{' '}
                  <a href="mailto:hello@kealee.com" className="font-semibold underline hover:no-underline">
                    Contact support
                  </a>{' '}
                  and we&apos;ll get you in.
                </p>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="access-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="access-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8724B]/30 focus:border-[#E8724B] transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all"
            >
              {loading ? 'Sending…' : 'Send access link'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">
          Questions?{' '}
          <a href="mailto:hello@kealee.com" className="text-[#E8724B] hover:underline font-medium">
            hello@kealee.com
          </a>
        </p>
      </div>
    </div>
  )
}

export default function ConceptAccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" />
      </div>
    }>
      <AccessInner />
    </Suspense>
  )
}
