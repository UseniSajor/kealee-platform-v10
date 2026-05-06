'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Shield, Loader2, FileText, Image as ImageIcon,
  LayoutTemplate, Table2, Layers, Video, Check, Lock, Zap, X,
} from 'lucide-react'
import { SERVICE_MAP } from '@/lib/services-config'

// ── Condensed tier deliverables ───────────────────────────────────────────────

interface DeliverableItem {
  icon: React.ElementType
  label: string
  color: string   // icon circle bg
}

const TIER_ITEMS: Record<1 | 2 | 3, DeliverableItem[]> = {
  1: [
    { icon: FileText,      label: 'PDF Design Report — 15–20 pages',          color: 'bg-blue-100 text-blue-600' },
    { icon: ImageIcon,     label: '3–5 Concept Renderings (1920×1080)',        color: 'bg-purple-100 text-purple-600' },
    { icon: Table2,        label: 'Budget Comparison — Basic · Standard · Luxury', color: 'bg-green-100 text-green-600' },
    { icon: FileText,      label: 'Quick Reference Sheet (print-ready)',       color: 'bg-amber-100 text-amber-600' },
    { icon: LayoutTemplate,label: 'Web Portal — lifetime access & sharing',   color: 'bg-sky-100 text-sky-600' },
    { icon: Zap,           label: '1 revision included · Email support',       color: 'bg-slate-100 text-slate-500' },
  ],
  2: [
    { icon: Video,         label: '60-Second AI Transformation Video',         color: 'bg-orange-100 text-orange-600' },
    { icon: Layers,        label: '2D Architectural Floor Plan with MEP',      color: 'bg-blue-100 text-blue-600' },
    { icon: ImageIcon,     label: '6–8 Enhanced Renderings (2560×1440)',       color: 'bg-purple-100 text-purple-600' },
    { icon: LayoutTemplate,label: 'Interactive Portal — video, floor plan, docs', color: 'bg-sky-100 text-sky-600' },
    { icon: Table2,        label: 'Itemized Bill of Materials (editable)',     color: 'bg-green-100 text-green-600' },
    { icon: FileText,      label: 'Everything in Basic · 3 revisions · 30-day support', color: 'bg-slate-100 text-slate-500' },
  ],
  3: [
    { icon: Video,         label: '4 Video Formats — 60s · 30s · 15s · 10s', color: 'bg-orange-100 text-orange-600' },
    { icon: Layers,        label: 'Multi-Layer 3D Floor Plan + CAD files',    color: 'bg-blue-100 text-blue-600' },
    { icon: ImageIcon,     label: '12–15 Renderings in 4K resolution',        color: 'bg-purple-100 text-purple-600' },
    { icon: LayoutTemplate,label: 'Enhanced Portal — virtual walkthrough',    color: 'bg-sky-100 text-sky-600' },
    { icon: FileText,      label: 'Everything in Premium · 3 revisions · 90-day support', color: 'bg-slate-100 text-slate-500' },
  ],
}

const TIER_META: Record<1 | 2 | 3, { tagline: string; accent: string; badge?: string }> = {
  1: { tagline: 'PDF report, renders & budget comparison — perfect for planning and contractor quotes.',  accent: 'from-slate-700 to-slate-900' },
  2: { tagline: 'Video tour + floor plan — the standard for HOA approvals and lender presentations.',    accent: 'from-[#E8724B] to-[#c75c35]', badge: 'Most Popular' },
  3: { tagline: '4-video production, 4K renders, and CAD files — built for financing and premium builds.', accent: 'from-[#1A2B4A] to-[#0f1c30]' },
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

  const service        = SERVICE_MAP[serviceSlug]
  const availableTiers = service?.tiers.filter((t) => t.available) ?? []
  const defaultTier    = availableTiers.find((t) => t.tier === 2) ? 2 : (availableTiers[0]?.tier ?? 1)

  const [tier,       setTier]       = useState<1 | 2 | 3>(defaultTier as 1 | 2 | 3)
  const [agreed,     setAgreed]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [promoCode,  setPromoCode]  = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  // Payment status banners (set from URL params)
  const [showCanceled,    setShowCanceled]    = useState(searchParams.get('canceled') === 'true')
  const [showFailed,      setShowFailed]      = useState(searchParams.get('payment_failed') === 'true')
  const [showExpired,     setShowExpired]     = useState(searchParams.get('session_expired') === 'true')

  const selectedTier = service?.tiers.find((t) => t.tier === tier)
  const price        = selectedTier?.price ?? 0

  const detailsParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip, style, priority, timeline, sqft })
  const contactParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip, style, priority, timeline, sqft, firstName, lastName, email, phone, address })

  const projectPath = service?.intakePath ?? serviceSlug

  async function createIntakeRecord(): Promise<string> {
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
        formData: { description: scope, budget, zip, tier, style, priority, timeline, sqft },
      }),
    })
    if (!intakeRes.ok) {
      const b = await intakeRes.json().catch(() => ({}))
      throw new Error(b.error ?? 'Failed to save intake.')
    }
    const { intakeId } = await intakeRes.json()
    return intakeId as string
  }

  async function handleSubmit() {
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    setError('')
    setSubmitting(true)

    // Fire-and-forget soft capture
    fetch('/api/intake/soft-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: `${firstName} ${lastName}`.trim(), service: serviceSlug, source: 'concept-confirm' }),
    }).catch(() => {})

    try {
      const intakeId = await createIntakeRecord()

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
          // Invalid code → fall through to Stripe below
          if (b.error === 'Invalid promo code') {
            setError('Promo code not recognised. Please check the code and try again, or proceed to payment.')
            setSubmitting(false)
            return
          }
          // Other redeem error → still try Stripe
        } else {
          // Promo accepted — go straight to deliverable
          window.location.href = `${window.location.origin}/concept/deliverable?intakeId=${intakeId}&redeemed=true`
          return
        }
      }

      // ── Standard Stripe checkout path ─────────────────────────────────────
      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath,
          amount: price * 100,
          successUrl: `${window.location.origin}/concept/deliverable?intakeId=${intakeId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/concept/confirm?${searchParams.toString()}&canceled=true`,
        }),
      })
      if (!checkoutRes.ok) {
        const b = await checkoutRes.json().catch(() => ({}))
        const msg = b.error ?? 'Could not create checkout.'
        // Surface actionable message for missing Stripe config
        if (msg.includes('not configured') || msg.includes('Stripe')) {
          throw new Error('Payment is not yet configured on this account. Use promo code KEALEE-ALLIN-2026 to access for free, or contact hello@kealee.com.')
        }
        throw new Error(msg)
      }
      const { url } = await checkoutRes.json()
      if (url) window.location.href = url
      else throw new Error('No checkout URL returned.')
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  // Escape hatch URL shown alongside inline errors
  const gotYouUrl = `/got-you?${new URLSearchParams({ service: serviceSlug, email, name: `${firstName} ${lastName}`.trim(), source: 'concept-confirm' }).toString()}`

  if (!serviceSlug || !email) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">Session expired or incomplete.</p>
        <Link href="/concept" className="text-[#E8724B] font-semibold">← Start over</Link>
      </div>
    )
  }

  const tierName = availableTiers.find((t) => t.tier === tier)?.name ?? 'Basic'

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

      {/* ── Tier cards ────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-5">Select your package</h2>
        <div className={`grid gap-5 ${availableTiers.length === 3 ? 'lg:grid-cols-3' : availableTiers.length === 2 ? 'sm:grid-cols-2' : ''}`}>
          {availableTiers.map((t) => {
            const isSelected = tier === t.tier
            const meta       = TIER_META[t.tier as 1 | 2 | 3]
            const items      = TIER_ITEMS[t.tier as 1 | 2 | 3] ?? []

            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => setTier(t.tier as 1 | 2 | 3)}
                className={`relative flex flex-col text-left rounded-2xl overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E8724B] focus:ring-offset-2 ${
                  isSelected
                    ? 'ring-2 ring-[#E8724B] shadow-xl shadow-orange-100/60'
                    : 'border border-slate-200 hover:border-slate-300 hover:shadow-lg shadow-sm'
                }`}
              >
                {/* Popular badge */}
                {meta.badge && (
                  <span className="absolute top-4 right-4 rounded-full bg-[#E8724B] text-white text-[10px] font-bold px-2.5 py-0.5 z-10">
                    {meta.badge}
                  </span>
                )}

                {/* Gradient header */}
                <div className={`bg-gradient-to-br ${meta.accent} px-6 pt-7 pb-6`}>
                  {/* Round tier icon */}
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

                {/* Select indicator */}
                <div className={`border-t px-6 py-4 flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'
                }`}>
                  <span className={`text-sm font-semibold ${isSelected ? 'text-[#E8724B]' : 'text-slate-400'}`}>
                    {isSelected ? 'Selected' : 'Select package'}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-[#E8724B] bg-[#E8724B]' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Checkout section ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Selected summary */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#E8724B]/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-[#E8724B]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Selected Package</p>
              <p className="font-bold text-slate-900">{tierName} — {service?.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
            {promoApplied ? (
              <div className="flex items-center gap-2 justify-end">
                <p className="text-lg font-bold text-slate-400 line-through">${price.toLocaleString()}</p>
                <p className="text-2xl font-black text-green-600">$0</p>
              </div>
            ) : (
              <p className="text-2xl font-black text-slate-900">${price.toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          {[
            { icon: Lock,   label: 'SSL Encrypted',    sub: '256-bit secure' },
            { icon: Shield, label: 'Stripe Payments',  sub: 'PCI compliant' },
            { icon: Zap,    label: 'Instant Delivery',  sub: '3–5 business days' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">{label}</p>
                <p className="text-[11px] text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Terms + CTA */}
        <div className="px-6 py-5 space-y-4">

          {/* Promo code */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Promo Code</p>
            {promoApplied ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5">
                <Check className="w-4 h-4 text-green-600 shrink-0" strokeWidth={3} />
                <span className="text-sm font-semibold text-green-700">Code applied — payment waived</span>
                <button
                  type="button"
                  onClick={() => { setPromoCode(''); setPromoApplied(false) }}
                  className="ml-auto text-green-400 hover:text-green-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8724B] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => promoCode.trim() && setPromoApplied(true)}
                  disabled={!promoCode.trim()}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-slate-700 transition"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setAgreed(!agreed)}
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

          <button
            onClick={handleSubmit}
            disabled={!agreed || submitting}
            className="w-full flex items-center justify-center gap-3 bg-[#E8724B] hover:bg-[#D45C33] active:bg-[#C04820] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl text-base transition-all duration-200 shadow-lg shadow-orange-200 hover:shadow-xl"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
            ) : promoApplied ? (
              <><Check className="w-5 h-5" strokeWidth={3} /> Redeem Free Access — Start My Concept</>
            ) : (
              <><Shield className="w-5 h-5" /> Pay ${price.toLocaleString()} — Start My Concept</>
            )}
          </button>

          <div className="flex items-center justify-between">
            <Link
              href={`/concept/contact?${contactParams}`}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <p className="text-xs text-slate-400">Redirects to Stripe — no card stored on Kealee</p>
          </div>
        </div>
      </div>
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
