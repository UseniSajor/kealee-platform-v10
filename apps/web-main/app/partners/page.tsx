'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Users } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

/** P3 — white-label partner portal stub. */
export default function PartnersPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')

  async function register(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const base = API || ''
      const res = await fetch(`${base}/v30/white-label/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, companyName, companyEmail }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Registration failed')
      setMessage(`Partner ${json.companyName ?? companyName} registered. Configure branding in portal-admin.`)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'API unavailable — contact sales@kealee.com')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-4">
      <div className="max-w-xl mx-auto">
        <Users className="h-10 w-10 text-violet-400 mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-violet-300">White-label · Partners</p>
        <h1 className="text-3xl font-bold mt-2">Kealee partner portal</h1>
        <p className="text-slate-300 mt-3 text-sm leading-relaxed">
          Offer Kealee v30 intake, design, and estimates under your brand. API:{' '}
          <code className="text-violet-200">POST /v30/white-label/partners</code>
        </p>

        <form onSubmit={register} className="mt-8 space-y-3 bg-white/10 rounded-xl p-6 backdrop-blur">
          <input
            required
            className="w-full rounded-lg border-0 px-3 py-2 text-slate-900"
            placeholder="Partner ID (slug)"
            value={partnerId}
            onChange={e => setPartnerId(e.target.value)}
          />
          <input
            required
            className="w-full rounded-lg border-0 px-3 py-2 text-slate-900"
            placeholder="Company name"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
          />
          <input
            type="email"
            className="w-full rounded-lg border-0 px-3 py-2 text-slate-900"
            placeholder="Company email"
            value={companyEmail}
            onChange={e => setCompanyEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-500 py-3 font-bold disabled:opacity-50 flex justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Register partner
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-violet-200">{message}</p>}

        <p className="mt-8 text-sm text-slate-400">
          <Link href="/get-concept" className="underline text-violet-300">
            Customer intake demo
          </Link>
          {' · '}
          <Link href="/contractors/subscribe" className="underline text-violet-300">
            Contractor network
          </Link>
        </p>
      </div>
    </div>
  )
}
