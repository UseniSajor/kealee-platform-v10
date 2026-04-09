'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, DollarSign, HelpCircle, ArrowRight, Loader2 } from 'lucide-react'

const SKU_LABELS: Record<string, { name: string; price: string }> = {
  LAND_FEASIBILITY_BASIC: { name: 'Land Buildability & Cost Analysis', price: 'From $195' },
  LAND_FEASIBILITY_PRO:   { name: 'Land Feasibility Pro', price: 'From $495' },
}

const PROJECT_TYPES = [
  { value: 'single_family', label: 'Single-family home' },
  { value: 'adu',           label: 'ADU / accessory dwelling unit' },
  { value: 'duplex',        label: 'Duplex or small multifamily' },
  { value: 'commercial',    label: 'Commercial or mixed-use' },
  { value: 'not_sure',      label: 'Not sure yet' },
]

export default function LandIntakePage() {
  const params = useSearchParams()
  const router = useRouter()
  const sku = params.get('sku') ?? 'LAND_FEASIBILITY_BASIC'
  const product = SKU_LABELS[sku] ?? SKU_LABELS.LAND_FEASIBILITY_BASIC

  const [address, setAddress]           = useState('')
  const [parcelId, setParcelId]         = useState('')
  const [intendedUse, setIntendedUse]   = useState('')
  const [budgetRange, setBudgetRange]   = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  function validate(): string | null {
    if (!address.trim()) return 'Property address is required.'
    if (!intendedUse) return 'Please select what you intend to build.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
      const res = await fetch(`${apiUrl}/api/v1/orchestrate/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: `land_${Date.now()}`,
          intent: 'land_analysis',
          role: 'land_owner',
          phase: 'product_selection',
          address: address.trim(),
          projectType: intendedUse,
          currentProductSku: sku,
          extra: { parcelId: parcelId.trim(), budgetRange },
        }),
      })

      const data = await res.json() as { ok?: boolean; result?: { checkoutUrl?: string } }

      if (data.ok && data.result?.checkoutUrl) {
        window.location.href = data.result.checkoutUrl
      } else {
        // Fallback to checkout page with query params
        router.push(`/land/checkout?sku=${sku}&address=${encodeURIComponent(address)}&use=${intendedUse}`)
      }
    } catch {
      // Fallback routing
      router.push(`/land/checkout?sku=${sku}&address=${encodeURIComponent(address)}&use=${intendedUse}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0F1A2E] px-4 py-16">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#2ABFBF]">
            Land Feasibility
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">{product.name}</h1>
          <p className="mt-2 text-white/60">{product.price}</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-[#1A2B4A] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-300">{error}</div>
            )}

            {/* Address */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Property address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State ZIP"
                  className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-[#2ABFBF] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Parcel ID (optional) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Assessor Parcel Number (APN) <span className="text-white/40">optional</span>
              </label>
              <input
                type="text"
                value={parcelId}
                onChange={(e) => setParcelId(e.target.value)}
                placeholder="e.g. 123-456-789"
                className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white placeholder-white/30 focus:border-[#2ABFBF] focus:outline-none"
              />
            </div>

            {/* Intended use */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                What do you intend to build? <span className="text-red-400">*</span>
              </label>
              <select
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white focus:border-[#2ABFBF] focus:outline-none"
                required
              >
                <option value="">Select one…</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Budget (optional) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Rough budget range <span className="text-white/40">optional</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#2ABFBF] focus:outline-none"
                >
                  <option value="">Select a range…</option>
                  <option value="under_100k">Under $100K</option>
                  <option value="100k_250k">$100K – $250K</option>
                  <option value="250k_500k">$250K – $500K</option>
                  <option value="500k_1m">$500K – $1M</option>
                  <option value="over_1m">Over $1M</option>
                  <option value="unknown">Not sure yet</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8793A] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
              ) : (
                <>Continue to Checkout <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-white/40">
            Your information is used only for your land analysis. No spam.
          </p>
        </div>
      </div>
    </main>
  )
}
