'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Shield, Loader2, FileText, Image as ImageIcon,
  LayoutTemplate, Table2, Layers, Video, Check, Lock, Zap, X, Phone,
} from 'lucide-react'
import { SERVICE_MAP } from '@/lib/services-config'
import { StripeEmbeddedCheckoutModal } from '@/components/StripeEmbeddedCheckoutModal'

// True when pk is set at build time — activates embedded Stripe checkout
const USE_EMBEDDED_CHECKOUT = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

// ── Condensed tier deliverables ───────────────────────────────────────────────

interface DeliverableItem {
  icon: React.ElementType
  label: string
  color: string   // icon circle bg
}

// Service-specific tier items — avoids showing building content (MEP, floor plans)
// on landscape, exterior-only, or design-only services.
function getServiceTierItems(serviceSlug: string): Record<1 | 2 | 3, DeliverableItem[]> {

  // ── Garden / Landscape ────────────────────────────────────────────────────
  if (serviceSlug === 'garden') {
    return {
      1: [
        { icon: Layers,    label: 'Garden layout concept plan + site overview',        color: 'bg-green-100 text-green-700' },
        { icon: Table2,    label: 'Plant species guide with seasonal selection',        color: 'bg-emerald-100 text-emerald-600' },
        { icon: Zap,       label: 'Irrigation overview + smart controller spec',       color: 'bg-blue-100 text-blue-600' },
        { icon: ImageIcon, label: '3–5 Garden Concept Renderings (1920×1080)',         color: 'bg-purple-100 text-purple-600' },
        { icon: FileText,  label: 'Seasonal maintenance calendar + PDF report',        color: 'bg-sky-100 text-sky-600' },
        { icon: Video,     label: 'AI transformation video — Premium or Premium+ only', color: 'bg-slate-100 text-slate-500' },
        { icon: Zap,       label: '1 revision included · Email support',               color: 'bg-slate-100 text-slate-500' },
      ],
      2: [
        { icon: Video,     label: '60-Second AI Garden Transformation Video',          color: 'bg-orange-100 text-orange-600' },
        { icon: Layers,    label: 'Detailed landscape plan with zone breakdowns',      color: 'bg-green-100 text-green-700' },
        { icon: ImageIcon, label: '6–8 Enhanced Garden Renderings (2560×1440)',        color: 'bg-purple-100 text-purple-600' },
        { icon: Table2,    label: 'Full plant specification with quantities',          color: 'bg-emerald-100 text-emerald-600' },
        { icon: Shield,    label: 'Hardscape material palette + cost guide',           color: 'bg-amber-100 text-amber-600' },
        { icon: Zap,       label: 'Everything in Basic · 3 revisions · 30-day support', color: 'bg-slate-100 text-slate-500' },
      ],
      3: [
        { icon: Video,     label: '4 Video Formats — 60s · 30s · 15s · 10s',          color: 'bg-orange-100 text-orange-600' },
        { icon: Layers,    label: '3D Garden Overview + perspective views',            color: 'bg-green-100 text-green-700' },
        { icon: ImageIcon, label: '12–15 Garden Renderings in 4K',                    color: 'bg-purple-100 text-purple-600' },
        { icon: Table2,    label: 'Contractor-ready plant/material specification',     color: 'bg-emerald-100 text-emerald-600' },
        { icon: Phone,     label: '15-min landscape expert consultation call',         color: 'bg-teal-100 text-teal-600' },
        { icon: Zap,       label: 'Everything in Premium · 3 revisions · 90-day support', color: 'bg-slate-100 text-slate-500' },
      ],
    }
  }

  // ── Design Services only (mood board, palette — no MEP or floor plans) ────
  if (serviceSlug === 'design-services') {
    return {
      1: [
        { icon: LayoutTemplate, label: 'Mood board & design direction',                  color: 'bg-purple-100 text-purple-600' },
        { icon: ImageIcon,      label: 'Material & finish palette with curated picks',   color: 'bg-blue-100 text-blue-600' },
        { icon: Table2,         label: 'Furniture layout plan (to-scale)',               color: 'bg-green-100 text-green-600' },
        { icon: Layers,         label: 'Color scheme specification (4+ colorways)',      color: 'bg-amber-100 text-amber-600' },
        { icon: FileText,       label: 'PDF design report + shopping list with links',   color: 'bg-sky-100 text-sky-600' },
        { icon: Zap,            label: '1 revision included · Email support',            color: 'bg-slate-100 text-slate-500' },
      ],
      2: [
        { icon: Video,          label: '60-Second AI Style Transformation Video',        color: 'bg-orange-100 text-orange-600' },
        { icon: LayoutTemplate, label: 'Enhanced design board + 3D furniture layout',   color: 'bg-purple-100 text-purple-600' },
        { icon: ImageIcon,      label: '6–8 Enhanced Interior Renders (2560×1440)',      color: 'bg-blue-100 text-blue-600' },
        { icon: Table2,         label: 'Editable material board with product links',     color: 'bg-green-100 text-green-600' },
        { icon: Zap,            label: 'Everything in Basic · 3 revisions · 30-day support', color: 'bg-slate-100 text-slate-500' },
      ],
      3: [
        { icon: Video,          label: '4 Video Formats — 60s · 30s · 15s · 10s',       color: 'bg-orange-100 text-orange-600' },
        { icon: LayoutTemplate, label: '3D room walkthroughs + style direction',         color: 'bg-purple-100 text-purple-600' },
        { icon: ImageIcon,      label: '12–15 Interior Design Renders in 4K',            color: 'bg-blue-100 text-blue-600' },
        { icon: Phone,          label: '15-min interior design consultation call',       color: 'bg-teal-100 text-teal-600' },
        { icon: Zap,            label: 'Everything in Premium · 3 revisions · 90-day support', color: 'bg-slate-100 text-slate-500' },
      ],
    }
  }

  // ── Exterior services (facade, deck/patio — no interior floor plans/MEP) ──
  if (serviceSlug === 'facade' || serviceSlug === 'deck') {
    return {
      1: [
        { icon: ImageIcon, label: '3–5 Exterior Concept Renderings (front, side, rear)', color: 'bg-purple-100 text-purple-600' },
        { icon: Table2,    label: 'Material palette (siding, roofing, trim, windows)',   color: 'bg-amber-100 text-amber-600' },
        { icon: Shield,    label: 'Permit scope brief + AHJ checklist',                  color: 'bg-blue-100 text-blue-600' },
        { icon: Layers,    label: 'Elevation concept + site overview sketch',            color: 'bg-green-100 text-green-600' },
        { icon: FileText,  label: 'Cost estimate framework + PDF report',                color: 'bg-sky-100 text-sky-600' },
        { icon: Video,     label: 'AI transformation video — Premium or Premium+ only',  color: 'bg-slate-100 text-slate-500' },
        { icon: Zap,       label: '1 revision included · Email support',                 color: 'bg-slate-100 text-slate-500' },
      ],
      2: [
        { icon: Video,     label: '60-Second AI Exterior Transformation Video',          color: 'bg-orange-100 text-orange-600' },
        { icon: ImageIcon, label: '6–8 Enhanced Exterior Renderings (2560×1440)',        color: 'bg-purple-100 text-purple-600' },
        { icon: Table2,    label: 'Detailed material spec with product references',      color: 'bg-amber-100 text-amber-600' },
        { icon: Shield,    label: 'Permit-ready exterior scope pack',                    color: 'bg-blue-100 text-blue-600' },
        { icon: Layers,    label: 'Hardscape + softscape overview concept',              color: 'bg-green-100 text-green-600' },
        { icon: Zap,       label: 'Everything in Basic · 3 revisions · 30-day support', color: 'bg-slate-100 text-slate-500' },
      ],
      3: [
        { icon: Video,     label: '4 Video Formats — 60s · 30s · 15s · 10s',            color: 'bg-orange-100 text-orange-600' },
        { icon: ImageIcon, label: '12–15 Exterior Renderings in 4K',                     color: 'bg-purple-100 text-purple-600' },
        { icon: Table2,    label: 'Contractor-ready material + scope specification',     color: 'bg-amber-100 text-amber-600' },
        { icon: Lock,      label: 'Permit package credit toward stamped drawings',       color: 'bg-teal-100 text-teal-600' },
        { icon: Phone,     label: '15-min expert consultation call',                     color: 'bg-green-100 text-green-600' },
        { icon: Zap,       label: 'Everything in Premium · 3 revisions · 90-day support', color: 'bg-slate-100 text-slate-500' },
      ],
    }
  }

  // ── Default: building services (kitchen, bathroom, interior, whole-house, addition, new-construction) ──
  return {
    1: [
      { icon: Shield,    label: 'Permit scope brief + path-to-stamps roadmap',          color: 'bg-amber-100 text-amber-600' },
      { icon: Layers,    label: 'Floor Plan Overview + Layout Direction',               color: 'bg-blue-100 text-blue-600' },
      { icon: ImageIcon, label: '3–5 Concept Renderings (1920×1080)',                   color: 'bg-purple-100 text-purple-600' },
      { icon: Table2,    label: 'Itemized Cost Estimate (Bill of Materials)',            color: 'bg-green-100 text-green-600' },
      { icon: FileText,  label: 'PDF Design Report',                                    color: 'bg-sky-100 text-sky-600' },
      { icon: Video,     label: 'AI transformation video — Premium or Premium+ only',   color: 'bg-slate-100 text-slate-500' },
      { icon: Zap,       label: '1 revision included · Email support',                  color: 'bg-slate-100 text-slate-500' },
    ],
    2: [
      { icon: Video,     label: '60-Second AI Transformation Video',                    color: 'bg-orange-100 text-orange-600' },
      { icon: Layers,    label: '2D Architectural Floor Plan with MEP layers',          color: 'bg-blue-100 text-blue-600' },
      { icon: ImageIcon, label: '6–8 Enhanced Renderings (2560×1440)',                  color: 'bg-purple-100 text-purple-600' },
      { icon: Shield,    label: 'Permit-ready scope pack — AHJ / HOA / lender checklist', color: 'bg-amber-100 text-amber-600' },
      { icon: Table2,    label: 'Editable Bill of Materials',                           color: 'bg-green-100 text-green-600' },
      { icon: Zap,       label: 'Everything in Basic · 3 revisions · 30-day support',  color: 'bg-slate-100 text-slate-500' },
    ],
    3: [
      { icon: Video,     label: '4 Video Formats — 60s · 30s · 15s · 10s',             color: 'bg-orange-100 text-orange-600' },
      { icon: Layers,    label: '3D Floor Plan + CAD files (DWG export)',               color: 'bg-blue-100 text-blue-600' },
      { icon: ImageIcon, label: '12–15 Renderings in 4K resolution',                   color: 'bg-purple-100 text-purple-600' },
      { icon: Lock,      label: 'Permit package credit — credited toward stamped plans or filing', color: 'bg-teal-100 text-teal-600' },
      { icon: Phone,     label: '15-min expert consultation call',                      color: 'bg-green-100 text-green-600' },
      { icon: Zap,       label: 'Everything in Premium · 3 revisions · 90-day support', color: 'bg-slate-100 text-slate-500' },
    ],
  }
}

const TIER_META: Record<1 | 2 | 3, { tagline: string; accent: string; badge?: string }> = {
  1: { tagline: 'Permit roadmap, renders, and estimates in Basic — upgrade to Premium for the 60s AI transformation video and deeper plan sheets.',  accent: 'from-slate-700 to-slate-900' },
  2: { tagline: 'Includes the 60s AI transformation video plus permit-ready documentation for HOA boards and lender packages.',    accent: 'from-[#E8724B] to-[#c75c35]', badge: 'Most Popular' },
  3: { tagline: 'Full video suite (60s–10s), 4K renders, CAD — plus permit package credit toward stamped drawings or filing.', accent: 'from-[#1A2B4A] to-[#0f1c30]' },
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
        formData: {
          description: scope, budget, zip, tier, style, priority, timeline, sqft,
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
      })
      const successUrl = `${window.location.origin}/concept/success?${successParams.toString()}`
      const cancelUrl  = `${window.location.origin}/concept/confirm?${searchParams.toString()}&canceled=true`

      if (USE_EMBEDDED_CHECKOUT) {
        const returnUrl  = `${successUrl}&session_id={CHECKOUT_SESSION_ID}`
        const checkoutRes = await fetch('/api/intake/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intakeId, projectPath, embedded: true, returnUrl }),
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

            return (
              <div key={t.tier} className="relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200">
                {/* Popular badge */}
                {meta.badge && (
                  <span className="absolute top-4 right-4 rounded-full bg-[#E8724B] text-white text-[10px] font-bold px-2.5 py-0.5 z-10">
                    {meta.badge}
                  </span>
                )}

                {/* Gradient header */}
                <div className={`bg-gradient-to-br ${meta.accent} px-6 pt-7 pb-6`}>
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
                    onClick={() => handleTierPay(t.tier as 1 | 2 | 3)}
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
