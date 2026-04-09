'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { CreditCard, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

const SKU_META: Record<string, { name: string; price: number; description: string }> = {
  LAND_FEASIBILITY_BASIC: {
    name: 'Land Buildability & Cost Analysis',
    price: 195,
    description: 'Parcel review, zoning screen, buildability assessment, setback flags, cost band, and recommended next step.',
  },
  LAND_FEASIBILITY_PRO: {
    name: 'Land Feasibility Pro',
    price: 495,
    description: 'Everything in Basic plus build envelope analysis, use scenario modeling, quality-banded cost range, and design direction.',
  },
}

const USE_LABELS: Record<string, string> = {
  single_family: 'Single-family home',
  adu:           'ADU / accessory dwelling unit',
  duplex:        'Duplex or small multifamily',
  commercial:    'Commercial or mixed-use',
  not_sure:      'Not sure yet',
}

export default function LandCheckoutPage() {
  const params = useSearchParams()
  const router = useRouter()

  const sku     = params.get('sku') ?? 'LAND_FEASIBILITY_BASIC'
  const address = params.get('address') ?? ''
  const use     = params.get('use') ?? ''
  const product = SKU_META[sku] ?? SKU_META.LAND_FEASIBILITY_BASIC

  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return }
    setLoading(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
      const res = await fetch(`${apiUrl}/api/v1/orchestrate/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId:          `land_${Date.now()}`,
          intent:            'land_analysis',
          role:              'land_owner',
          phase:             'checkout',
          address,
          projectType:       use,
          currentProductSku: sku,
          extra: { name: name.trim(), email: email.trim(), phone: phone.trim() },
        }),
      })

      const data = await res.json() as { ok?: boolean; result?: { checkoutUrl?: string } }

      if (data.ok && data.result?.checkoutUrl) {
        window.location.href = data.result.checkoutUrl
      } else {
        // Stripe not yet configured — advance to success to unblock testing
        router.push('/land/success')
      }
    } catch {
      router.push('/land/success')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0F1A2E] px-4 py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#2ABFBF]">
            Secure Checkout
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Complete your order</h1>
        </div>

        {/* Order summary */}
        <div className="mb-6 rounded-xl border border-white/10 bg-[#1A2B4A] p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
            Order summary
          </h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-white">{product.name}</p>
              <p className="mt-1 text-sm text-white/50">{product.description}</p>
              {address && (
                <p className="mt-2 text-xs text-[#2ABFBF]">{decodeURIComponent(address)}</p>
              )}
              {use && USE_LABELS[use] && (
                <p className="mt-0.5 text-xs text-white/40">Intent: {USE_LABELS[use]}</p>
              )}
            </div>
            <p className="shrink-0 text-xl font-bold text-[#E8793A]">${product.price}</p>
          </div>

          <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
            {[
              'Parcel & zoning review',
              'Buildability assessment',
              'Recommended next step',
              sku === 'LAND_FEASIBILITY_PRO' ? 'Build envelope analysis' : 'Setback & overlay flags',
              sku === 'LAND_FEASIBILITY_PRO' ? 'Scenario modeling' : 'Cost-to-build band',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#2ABFBF]" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Contact + payment form */}
        <div className="rounded-2xl border border-white/10 bg-[#1A2B4A] p-8">
          <form onSubmit={handlePay} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-300">{error}</div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Full name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white placeholder-white/30 focus:border-[#2ABFBF] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
                className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white placeholder-white/30 focus:border-[#2ABFBF] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Phone <span className="text-white/40">optional</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(202) 555-0100"
                className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white placeholder-white/30 focus:border-[#2ABFBF] focus:outline-none"
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0F1A2E] p-4">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <CreditCard className="h-4 w-4" />
                <span>Payment handled securely via Stripe</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8793A] py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
              ) : (
                <><Lock className="h-4 w-4" /> Pay ${product.price} — Start Analysis <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-white/30">
            Your report will be delivered via email within 24–48 hours.
            Refundable within 24 hours if analysis cannot be completed.
          </p>
        </div>
      </div>
    </main>
  )
}
