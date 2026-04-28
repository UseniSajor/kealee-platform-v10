'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Shield, Video, Play, Loader2 } from 'lucide-react'
import { SERVICE_MAP, SERVICES } from '@/lib/services-config'

function SummaryRow({ label, value, editHref }: { label: string; value: string; editHref: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm text-slate-800">{value}</p>
      </div>
      <Link href={editHref} className="text-xs font-semibold text-[#E8724B] hover:underline whitespace-nowrap shrink-0">
        Edit
      </Link>
    </div>
  )
}

function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const serviceSlug = searchParams.get('service') ?? ''
  const scope = searchParams.get('scope') ?? ''
  const budget = searchParams.get('budget') ?? ''
  const zip = searchParams.get('zip') ?? ''
  const firstName = searchParams.get('firstName') ?? ''
  const lastName = searchParams.get('lastName') ?? ''
  const email = searchParams.get('email') ?? ''
  const phone = searchParams.get('phone') ?? ''
  const address = searchParams.get('address') ?? ''

  const service = SERVICE_MAP[serviceSlug]
  const availableTiers = service?.tiers.filter((t) => t.available) ?? []
  const defaultTier = availableTiers.find((t) => t.tier === 2) ? 2 : (availableTiers[0]?.tier ?? 1)

  const [tier, setTier] = useState<1 | 2 | 3>(defaultTier as 1 | 2 | 3)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedTier = service?.tiers.find((t) => t.tier === tier)
  const price = selectedTier?.price ?? 0

  const detailsParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip })
  const contactParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip, firstName, lastName, email, phone, address })

  async function handleSubmit() {
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    setError('')
    setSubmitting(true)
    try {
      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: service?.intakePath ?? serviceSlug,
          clientName: `${firstName} ${lastName}`.trim(),
          contactEmail: email,
          contactPhone: phone || null,
          projectAddress: address || `ZIP: ${zip}`,
          formData: { description: scope, budget, zip, tier },
        }),
      })
      if (!intakeRes.ok) {
        const body = await intakeRes.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save intake.')
      }
      const { intakeId } = await intakeRes.json()

      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath: service?.intakePath ?? serviceSlug,
          amount: price * 100,
          successUrl: `${window.location.origin}/concept/deliverable?intakeId=${intakeId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/concept/confirm?${searchParams.toString()}&canceled=true`,
        }),
      })
      if (!checkoutRes.ok) {
        const body = await checkoutRes.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not create checkout.')
      }
      const { url } = await checkoutRes.json()
      if (url) window.location.href = url
      else throw new Error('No checkout URL returned.')
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  if (!serviceSlug || !email) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Session expired or incomplete.</p>
        <Link href="/concept" className="text-[#E8724B] font-semibold">← Start over</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 4 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Review Your Concept</h1>
        <p className="text-slate-500">Confirm your details and choose your package.</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
        <SummaryRow label="Service" value={service?.label ?? serviceSlug} editHref={`/concept?service=${serviceSlug}`} />
        <SummaryRow label="Project Scope" value={scope.length > 100 ? scope.slice(0, 100) + '…' : scope} editHref={`/concept/details?${detailsParams}`} />
        <SummaryRow label="Budget" value={budget ? `$${Number(budget).toLocaleString()}` : '—'} editHref={`/concept/details?${detailsParams}`} />
        <SummaryRow label="ZIP Code" value={zip} editHref={`/concept/details?${detailsParams}`} />
        <SummaryRow
          label="Contact"
          value={`${firstName} ${lastName} — ${email}`}
          editHref={`/concept/contact?${contactParams}`}
        />
      </div>

      {/* Tier Selector */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Select Your Package</h2>
        <div className={`grid gap-4 ${availableTiers.length === 3 ? 'md:grid-cols-3' : availableTiers.length === 2 ? 'md:grid-cols-2' : 'max-w-xs'}`}>
          {availableTiers.map((t) => {
            const isSelected = tier === t.tier
            const isPremium = t.tier === 2
            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => setTier(t.tier as 1 | 2 | 3)}
                className={`relative flex flex-col rounded-2xl border-2 p-5 text-left transition-all ${
                  isSelected
                    ? 'border-[#E8724B] bg-orange-50 shadow-md shadow-orange-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {t.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#E8724B] text-white text-[10px] font-bold px-2.5 py-0.5 whitespace-nowrap">
                    {t.badge}
                  </span>
                )}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className={`text-sm font-bold uppercase tracking-widest ${isSelected ? 'text-[#E8724B]' : 'text-slate-500'}`}>{t.name}</p>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-[#E8724B] bg-[#E8724B]' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900 mb-3">${t.price.toLocaleString()}</p>
                {t.video && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-orange-100 px-2.5 py-1.5 mb-3">
                    <Video className="w-3.5 h-3.5 text-[#E8724B]" />
                    <span className="text-[11px] font-semibold text-[#E8724B]">AI Video Included</span>
                  </div>
                )}
                {t.videoDeliverables && (
                  <ul className="space-y-1 mt-1">
                    {t.videoDeliverables.map((d) => (
                      <li key={d} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <Play className="w-3 h-3 text-[#E8724B] shrink-0 mt-0.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
                {!t.video && (
                  <p className="text-xs text-slate-500">Concept renders, cost estimate, permit scope — no video</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price total */}
      <div className="bg-slate-900 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
          <p className="text-2xl font-black text-white">${price.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5" /> Secure checkout via Stripe
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer mb-6">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#E8724B]"
        />
        <span className="text-sm text-slate-600">
          I agree to Kealee's{' '}
          <Link href="/terms" className="underline text-[#E8724B]">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline text-[#E8724B]">Privacy Policy</Link>.
        </span>
      </label>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link
          href={`/concept/contact?${contactParams}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <button
          onClick={handleSubmit}
          disabled={!agreed || submitting}
          className="flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-orange-200"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          ) : (
            <><Shield className="w-4 h-4" /> Pay ${price.toLocaleString()} & Create Concept</>
          )}
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-4">
        You'll be redirected to Stripe to complete your payment securely.
      </p>
    </div>
  )
}

export default function ConceptConfirmPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" /></div>}>
      <ConfirmInner />
    </Suspense>
  )
}
