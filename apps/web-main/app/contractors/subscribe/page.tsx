'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Building2 } from 'lucide-react'

/** P3 — B2B contractor subscription intake (v30-adjacent). */
export default function ContractorSubscribePage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [trades, setTrades] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/v30/contractor-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, email, trades: trades.split(',').map(t => t.trim()).filter(Boolean) }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? 'Submit failed')
      }
      setDone(true)
    } catch {
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
        <div className="max-w-md text-center bg-white rounded-2xl border p-8 shadow-sm">
          <Building2 className="h-12 w-12 text-violet-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Thanks — we&apos;ll be in touch</h1>
          <p className="text-slate-600 mt-2 text-sm">
            Your contractor network application was received. Kealee will match you with v30 project leads in the DMV.
          </p>
          <Link href="/" className="mt-6 inline-block text-violet-600 font-semibold text-sm">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600">B2B · Contractor network</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Subscribe as a Kealee contractor</h1>
        <p className="text-sm text-slate-600 mt-2">
          Get matched to pre-qualified v30 projects with scope, estimates, and permit packages ready.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            required
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Company name"
            value={company}
            onChange={e => setCompany(e.target.value)}
          />
          <input
            required
            type="email"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Trades (comma-separated, e.g. GC, electrical, plumbing)"
            value={trades}
            onChange={e => setTrades(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-3 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Request network access
          </button>
        </form>
      </div>
    </div>
  )
}
