'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, Loader2, Check, Zap, X } from 'lucide-react'
import { SERVICE_MAP } from '@/lib/services-config'
import { StripeEmbeddedCheckoutModal } from '@/components/StripeEmbeddedCheckoutModal'
import { isV30EnabledClient } from '@/lib/v30'
import { buildV30AnswersFromConceptConfirm } from '@/lib/v30-concept-confirm'
import {
  getServiceTierItemsForUi,
  TIER_META,
  withConsultationIcon,
} from '@/lib/concept-package-deliverables-ui'

// True when pk is set at build time — activates embedded Stripe checkout
const USE_EMBEDDED_CHECKOUT = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

// Tier deliverables: @kealee/core-rules — see docs/system/concept-package-deliverables.md
function getServiceTierItems(serviceSlug: string) {
  const items = getServiceTierItemsForUi(serviceSlug)
  return {
    1: items[1],
    2: items[2],
    3: withConsultationIcon(items[3]),
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function ConfirmInner() {
  const searchParams = useSearchParams()

  const serviceSlug = searchParams.get('service') ?? ''
  const scope       = searchParams.get('scope') ?? ''
  const budget      = searchParams.get('budget') ?? ''
  const zip         = searchParams.get('zip') ?? ''
  const style       = searchParams.get('style') ?? ''
  const priority    = searchParams.get('priority') ?? ''
  const timeline    = searchParams.get('timeline') ?? ''
  const sqft        = searchParams.get('sqft') ?? ''
  const firstName   = searchParams.get('firstName') ?? ''
  const lastName    = searchParams.get('lastName') ?? ''
  const email       = searchParams.get('email') ?? ''
  const phone       = searchParams.get('phone') ?? ''
  const address     = searchParams.get('address') ?? ''
  const attachments = searchParams.get('attachments') ?? ''

  const service        = SERVICE_MAP[serviceSlug]
  const availableTiers = service?.tiers.filter((t) => t.available) ?? []
  const defaultTier    = availableTiers.find((t) => t.tier === 2) ? 2 : (availableTiers[0]?.tier ?? 1)

  const [tier,       setTier]       = useState<1 | 2 | 3>(defaultTier as 1 | 2 | 3)
  const [agreed,     setAgreed]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [promoCode,       setPromoCode]       = useState('')
  const [promoApplied,    setPromoApplied]    = useState(false)
  const [promoError,      setPromoError]      = useState('')
  const [showPromo,       setShowPromo]       = useState(false)
  // Embedded checkout state — clientSecret signals modal should open
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null)

  // Payment status banners (set from URL params)
  const [showCanceled,    setShowCanceled]    = useState(searchParams.get('canceled') === 'true')
  const [showFailed,      setShowFailed]      = useState(searchParams.get('payment_failed') === 'true')
  const [showExpired,     setShowExpired]     = useState(searchParams.get('session_expired') === 'true')

  const selectedTier = service?.tiers.find((t) => t.tier === tier)
  const price        = selectedTier?.price ?? 0

  const detailsParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip, style, priority, timeline, sqft })
  const contactParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip, style, priority, timeline, sqft, firstName, lastName, email, phone, address })

  const projectPath = service?.intakePath ?? serviceSlug
  const v30Enabled = isV30EnabledClient()

  async function createIntakeRecord(checkoutTier: 1 | 2 | 3): Promise<string> {
    const intakeRes = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectPath,
        clientName: `${firstName} ${lastName}`.trim(),
        contactEmail: email,
        contactPhone: phone || null,
        projectAddress: address || `ZIP: ${zip}`,
        budgetRange: budget || 'Not provided',
        formData: {
          description: scope, budget, zip, tier: checkoutTier, style, priority, timeline, sqft,
          ...(v30Enabled && { v30: true }),
          ...(attachments && { attachments }),
        },
      }),
    })
    if (!intakeRes.ok) {
      const b = await intakeRes.json().catch(() => ({}))
      throw new Error(b.error ?? 'Failed to save intake.')
    }
    const { intakeId } = await intakeRes.json()
    return intakeId as string
  }

  function handleTierPay(selectedTier: 1 | 2 | 3) {
    setTier(selectedTier)
    if (!agreed) {
      setError('Please agree to the Terms of Service above before selecting a package.')
      document.getElementById('terms-checkbox')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    handleSubmitForTier(selectedTier)
  }

  async function handleSubmit() {
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    setError('')
    setSubmitting(true)
    await runCheckout(tier)
    setSubmitting(false)
  }

  async function handleSubmitForTier(selectedTier: 1 | 2 | 3) {
    setError('')
    setSubmitting(true)
    await runCheckout(selectedTier)
    setSubmitting(false)
  }

  async function runCheckout(selectedTier: 1 | 2 | 3) {
    const selectedTierPrice = service?.tiers.find((t) => t.tier === selectedTier)?.price ?? price

    // Fire-and-forget soft capture
    fetch('/api/intake/soft-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: `${firstName} ${lastName}`.trim(), service: serviceSlug, source: 'concept-confirm' }),
    }).catch(() => {})

    try {
      const intakeId = await createIntakeRecord(selectedTier)

      if (v30Enabled) {
        const v30Answers = buildV30AnswersFromConceptConfirm({
          projectPath,
          scope,
          budget,
          zip,
          timeline,
          sqft,
          address: address || undefined,
        })
        const v30Res = await fetch('/api/v30/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intakeId,
            projectPath,
            tier: selectedTier,
            answers: v30Answers,
          }),
        })
        if (!v30Res.ok) {
          const b = await v30Res.json().catch(() => ({}))
          throw new Error((b as { error?: string }).error ?? 'Could not build v30 package quote.')
        }
      }

      // ── Free promo code path — bypass Stripe entirely ──────────────────────
      const code = promoCode.trim()
      if (code) {
        const redeemRes = await fetch('/api/intake/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intakeId, projectPath, promoCode: code }),
        })
        if (!redeemRes.ok) {
          const b = await redeemRes.json().catch(() => ({}))
          if (b.error === 'Invalid promo code') {
            setError('Promo code not recognised. Please check the code and try again, or proceed to payment.')
            return
          }
          // Other redeem error → fall through to Stripe
        } else {
          const conceptPath  = `/concept/${intakeId}`
          const accessParams = new URLSearchParams({ next: conceptPath, email })
          window.location.href = `/concept/access?${accessParams.toString()}`
          return
        }
      }

      // ── Stripe checkout path ───────────────────────────────────────────────
      const successParams = new URLSearchParams({
        intakeId,
        email,
        name:    `${firstName} ${lastName}`.trim(),
        service: service?.label ?? serviceSlug,
        amount:  String(selectedTierPrice),
        ...(v30Enabled && { v30: '1' }),
      })
      const successUrl = `${window.location.origin}/concept/success?${successParams.toString()}`
      const cancelUrl  = `${window.location.origin}/concept/confirm?${searchParams.toString()}&canceled=true`

      if (USE_EMBEDDED_CHECKOUT) {
        const returnUrl  = `${successUrl}&session_id={CHECKOUT_SESSION_ID}`
        const checkoutRes = await fetch('/api/intake/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intakeId,
            projectPath,
            embedded: true,
            returnUrl,
            ...(v30Enabled && { useV30Pricing: true }),
          }),
        })
        if (!checkoutRes.ok) {
          const b = await checkoutRes.json().catch(() => ({}))
          throw new Error(b.error ?? 'Could not create checkout.')
        }
        const { clientSecret } = await checkoutRes.json()
        if (!clientSecret) throw new Error('No client secret returned.')
        setCheckoutClientSecret(clientSecret)
        return
      }

      // ── Hosted checkout — redirect to Stripe's page ────────────────────────
      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath,
          successUrl: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl,
          ...(v30Enabled && { useV30Pricing: true }),
        }),
      })
      if (!checkoutRes.ok) {
        const b = await checkoutRes.json().catch(() => ({}))
        throw new Error(b.error ?? 'Could not create checkout.')
      }
      const { url } = await checkoutRes.json()
      if (url) window.location.href = url
      else throw new Error('No checkout URL returned.')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  // Escape hatch URL shown alongside inline errors
  const gotYouUrl = `/got-you?${new URLSearchParams({ service: serviceSlug, email, name: `${firstName} ${lastName}`.trim(), source: 'concept-confirm', status: 'payment_failed' }).toString()}`

  if (!serviceSlug || !email) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">Session expired or incomplete.</p>
        <Link href="/concept" className="text-[#E8724B] font-semibold">← Start over</Link>
      </div>
    )
  }

  const tierName        = availableTiers.find((t) => t.tier === tier)?.name ?? 'Basic'
  const serviceTierItems = getServiceTierItems(serviceSlug)

  return (
    <div className="space-y-10">

      {/* ── Payment status banners ────────────────────────── */}
      {showCanceled && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3.5 text-sm text-amber-800">
          <span className="flex-1">
            <span className="font-bold">Payment Paused</span> — nothing was charged. Your details are saved. Select your package below and try again.
          </span>
          <button onClick={() => setShowCanceled(false)} className="shrink-0 text-amber-400 hover:text-amber-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showFailed && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3.5 text-sm text-red-800">
          <span className="flex-1">
            <span className="font-bold">Payment Unsuccessful</span> — this is usually caused by insufficient funds, a bank hold, or an expired card. Nothing was charged.{' '}
            <button onClick={handleSubmit} className="font-semibold underline hover:no-underline">Try Again</button>
            {' or '}
            <a href="mailto:hello@kealee.com" className="font-semibold underline hover:no-underline">Contact Support</a>.
          </span>
          <button onClick={() => setShowFailed(false)} className="shrink-0 text-red-400 hover:text-red-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showExpired && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3.5 text-sm text-amber-800">
          <span className="flex-1">
            <span className="font-bold">Your Checkout Link Expired</span> — sessions expire after 24 hours. Your details are saved. Click Pay below for a fresh checkout link.
          </span>
          <button onClick={() => setShowExpired(false)} className="shrink-0 text-amber-400 hover:text-amber-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 4 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">Choose your package</h1>
        <p className="text-slate-500 text-sm">Select a tier — all packages deliver in 3–5 business days.</p>
      </div>

      {/* ── Summary bar ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
          {[
            { label: 'Service',  value: service?.label ?? serviceSlug, href: `/concept?service=${serviceSlug}` },
            { label: 'Budget',   value: budget ? `$${Number(budget).toLocaleString()}` : '—', href: `/concept/details?${detailsParams}` },
            { label: 'Location', value: address ? `${address}, ${zip}` : `ZIP ${zip}`, href: `/concept/details?${detailsParams}` },
            { label: 'Contact',  value: `${firstName} ${lastName}`, href: `/concept/contact?${contactParams}` },
          ].map(({ label, value, href }) => (
            <div key={label} className="px-5 py-4 group relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
              <Link href={href} className="absolute top-3 right-3 text-[10px] font-semibold text-slate-400 hover:text-[#E8724B] opacity-0 group-hover:opacity-100 transition">
                Edit
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── Permit credit banner ─────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl bg-teal-50 border border-teal-200 px-5 py-3.5">
        <span className="text-xl">💡</span>
        <p className="text-sm text-teal-800">
          <span className="font-bold">Your design concept cost is credited in full toward permit drawing plans.</span>{' '}
          When you proceed to permits, the amount you pay today is deducted from your permit package price.
        </p>
      </div>

      {/* ── Pre-flight: terms + optional promo ───────────── */}
      <div id="terms-checkbox" className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => { setAgreed(!agreed); setError('') }}
            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer ${
              agreed ? 'bg-[#E8724B] border-[#E8724B]' : 'border-slate-300'
            }`}
          >
            {agreed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
          <span className="text-sm text-slate-600 leading-relaxed">
            I agree to Kealee's{' '}
            <Link href="/terms" className="font-semibold text-[#E8724B] hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-semibold text-[#E8724B] hover:underline">Privacy Policy</Link>.
          </span>
        </label>

        {/* Promo code — collapsible */}
        {promoApplied ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5">
            <Check className="w-4 h-4 text-green-600 shrink-0" strokeWidth={3} />
            <span className="text-sm font-semibold text-green-700">Promo applied — payment waived</span>
            <button type="button" onClick={() => { setPromoCode(''); setPromoApplied(false); setShowPromo(false) }}
              className="ml-auto text-green-400 hover:text-green-700 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <button type="button" onClick={() => setShowPromo(!showPromo)}
              className="text-sm text-slate-400 hover:text-[#E8724B] transition font-medium">
              {showPromo ? '↑ Hide promo code' : '+ Have a promo code?'}
            </button>
            {showPromo && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && promoCode.trim().length >= 6) { setPromoApplied(true); setPromoError('') } }}
                  placeholder="Enter promo code"
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8724B] focus:border-transparent font-mono uppercase tracking-widest"
                />
                <button type="button"
                  onClick={() => { if (promoCode.trim().length < 6) { setPromoError('Enter a valid promo code.'); return } setPromoApplied(true); setPromoError('') }}
                  disabled={!promoCode.trim()}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-slate-700 transition">
                  Apply
                </button>
              </div>
            )}
            {promoError && <p className="text-xs text-red-600 font-medium mt-1">{promoError}</p>}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <p>{error}</p>
            <p className="mt-2">
              <Link href={gotYouUrl} className="font-semibold underline hover:no-underline">
                Let our team follow up instead →
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* ── Tier cards ────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Select your package</h2>
        <p className="text-sm text-slate-500 mb-5">Click a package below to go directly to checkout.</p>
        <div className={`grid gap-5 ${availableTiers.length === 3 ? 'lg:grid-cols-3' : availableTiers.length === 2 ? 'sm:grid-cols-2' : ''}`}>
          {availableTiers.map((t) => {
            const meta  = TIER_META[t.tier as 1 | 2 | 3]
            const items = serviceTierItems[t.tier as 1 | 2 | 3] ?? []
            // Only the selected card lights up — clicking any card selects just that one.
            const isSelected = tier === t.tier

            return (
              <div
                key={t.tier}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => setTier(t.tier as 1 | 2 | 3)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setTier(t.tier as 1 | 2 | 3)
                  }
                }}
                className={`relative flex flex-col rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E8724B] focus:ring-offset-2 ${
                  isSelected
                    ? 'border-[#E8724B] ring-2 ring-[#E8724B] shadow-lg -translate-y-0.5'
                    : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                }`}
              >
                {/* Popular badge — muted unless this card is the selected one */}
                {meta.badge && (
                  <span className={`absolute top-4 right-4 rounded-full text-white text-[10px] font-bold px-2.5 py-0.5 z-10 transition-colors duration-200 ${isSelected ? 'bg-[#E8724B]' : 'bg-slate-400'}`}>
                    {meta.badge}
                  </span>
                )}

                {/* Gradient header — tier accent shows only when selected, so exactly one card is lit */}
                <div className={`bg-gradient-to-br ${isSelected ? meta.accent : 'from-slate-500 to-slate-700'} px-6 pt-7 pb-6 transition-colors duration-200`}>
                  <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mb-4">
                    <span className="text-white font-black text-lg">{t.tier}</span>
                  </div>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{t.name}</p>
                  <p className="text-white font-black text-4xl mb-1">${t.price.toLocaleString()}</p>
                  <p className="text-white/60 text-xs leading-relaxed">{meta.tagline}</p>
                </div>

                {/* Deliverables */}
                <div className="bg-white flex-1 px-6 py-5 space-y-3">
                  {items.map((item, i) => {
                    const Icon = item.icon
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-sm text-slate-700 leading-snug">{item.label}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Permit credit badge */}
                <div className="bg-teal-50 border-t border-teal-100 px-6 py-2.5 flex items-center gap-2">
                  <span className="text-teal-600 text-xs">💡</span>
                  <span className="text-xs text-teal-700 font-medium">Cost credited toward permit drawing plans</span>
                </div>

                {/* Pay CTA */}
                <div className="bg-white border-t border-slate-100 px-6 py-4">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={(e) => { e.stopPropagation(); handleTierPay(t.tier as 1 | 2 | 3) }}
                    className="w-full flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] active:bg-[#C04820] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-md shadow-orange-100 hover:shadow-lg"
                  >
                    {submitting && tier === t.tier ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : promoApplied ? (
                      <><Check className="w-4 h-4" strokeWidth={3} /> Redeem Free Access</>
                    ) : (
                      <><Shield className="w-4 h-4" /> Pay ${t.price.toLocaleString()} — Start My Concept</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Back link */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href={`/concept/contact?${contactParams}`}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <p className="text-xs text-slate-400">Redirects to Stripe — no card stored on Kealee</p>
      </div>

      {/* ── Embedded Stripe checkout modal ────────────────── */}
      {checkoutClientSecret && (
        <StripeEmbeddedCheckoutModal
          clientSecret={checkoutClientSecret}
          onClose={() => setCheckoutClientSecret(null)}
        />
      )}
    </div>
  )
}

export default function ConceptConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" />
      </div>
    }>
      <ConfirmInner />
    </Suspense>
  )
}
