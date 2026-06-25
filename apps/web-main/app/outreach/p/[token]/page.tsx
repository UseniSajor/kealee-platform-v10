'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface TargetPreview {
  address: string
  zoning_code?: string
  lot_size_sqft?: number
  recommended_product?: string
  jurisdiction?: string
}

export default function ParcelOutreachPage() {
  const params = useParams()
  const token = params.token as string
  const [target, setTarget] = useState<TargetPreview | null>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'loading' | 'form' | 'done' | 'error'>('loading')
  const [result, setResult] = useState<{ intakeId?: string; landingPath?: string } | null>(null)

  useEffect(() => {
    fetch(`/api/marketing/parcel-outreach/claim?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setTarget(d.target)
        setStatus('form')
      })
      .catch(() => setStatus('error'))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/marketing/parcel-outreach/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, phone, name }),
    })
    const data = await res.json()
    if (!res.ok) {
      setStatus('error')
      return
    }
    setResult(data)
    setStatus('done')
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading property review…</p>
      </div>
    )
  }

  if (status === 'error' || !target) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-center text-gray-600">This outreach link is invalid or has expired.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 to-white px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-[#1A2B4A]">Property feasibility review</h1>
        <p className="mb-6 text-sm text-gray-600">{target.address}</p>
        {target.zoning_code && (
          <p className="mb-4 text-sm text-gray-500">
            Zoning: {target.zoning_code}
            {target.jurisdiction ? ` · ${target.jurisdiction}` : ''}
          </p>
        )}
        <p className="mb-6 text-sm text-gray-700">
          Kealee reviewed this property for renovation or ADU potential. Enter your contact info to
          receive a property-specific package — design concept includes RSMeans estimate; next step is
          permit-ready drawings.
        </p>

        {status === 'done' ? (
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
            <p className="font-medium">You&apos;re on the list.</p>
            <p className="mt-1">We&apos;ll follow up at {email} with next steps for this property.</p>
            {result?.landingPath && (
              <a
                href={result.landingPath}
                className="mt-3 inline-block font-medium text-indigo-700 underline"
              >
                Continue to your package →
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Email *</label>
              <input
                type="email"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Phone (optional)</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#1A2B4A] py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Get my property review
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
