'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Shield, Loader2, Check, Zap, X } from 'lucide-react'
import { SERVICE_MAP } from '@/lib/services-config'
import { StripeEmbeddedCheckoutModal } from '@/components/StripeEmbeddedCheckoutModal'
import { isV30EnabledClient } from '@/lib/v30'
import { buildV30AnswersFromConceptConfirm } from '@/lib/v30-concept-confirm'
import { getServicePackageItemsForUi } from '@/lib/concept-package-deliverables-ui'
import { ADD_ONS, type Quote } from '@kealee/core-rules'
import { QuoteBreakdown } from '@/components/quote/QuoteBreakdown'

// True when pk is set at build time — activates embedded Stripe checkout
const USE_EMBEDDED_CHECKOUT = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

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

  const service = SERVICE_MAP[serviceSlug]

  // One core package per product. The exact price is quoted after intake and
  // shown in full before Stripe — never a tier the customer has to decode.
  const [quote,      setQuote]      = useState<Quote | null>(null)
  const [quoteId,    setQuoteId]    = useState<string | null>(null)
  const [quoting,    setQuoting]    = useState(false)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
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

  const price = quote ? quote.totalCents / 100 : 0

  const detailsParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip, style, priority, timeline, sqft })
  const contactParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip, style, priority, timeline, sqft, firstName, lastName, email, phone, address })

  const projectPath = service?.intakePath ?? serviceSlug
  const v30Enabled = isV30EnabledClient()

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
          description: scope, budget, zip, style, priority, timeline, sqft,
          squareFootage: sqft,
          addOns: selectedAddOns,
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

  /**
   * Price this project. Creates the order record, then asks the server for a
   * quote computed from the intake facts. The browser never proposes a price.
   */
  async function handleGetPrice() {
    setError('')
    setQuoting(true)
    try {
      const intakeId = quoteId ?? (await createIntakeRecord())
      setQuoteId(intakeId)

      const v30Answers = buildV30AnswersFromConceptConfirm({
        projectPath, scope, budget, zip, timeline, sqft,
        address: address || undefined,
      })
      const res = await fetch('/api/v30/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId, projectPath, answers: v30Answers, addOns: selectedAddOns }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Your price could not be prepared. Try again in a moment.')
      if (body.scopingRequired) {
        setError('This project is quoted by our team. Kealee will send your fixed price — nothing is charged now.')
        return
      }
      const computed = body.quote?.quote as Quote | undefined
      if (!computed) throw new Error('Your price could not be prepared. Try again in a moment.')
      setQuote(computed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your price could not be prepared. Try again in a moment.')
    } finally {
      setQuoting(false)
    }
  }

  async function handleSubmit() {
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    setError('')
    setSubmitting(true)
    await runCheckout()
    setSubmitting(false)
  }

  async function runCheckout() {
    const selectedTierPrice = price

    // Fire-and-forget soft capture
    fetch('/api/intake/soft-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: `${firstName} ${lastName}`.trim(), service: serviceSlug, source: 'concept-confirm' }),
    }).catch(() => {})

    try {
      // The quote step already created the order and priced it; checkout
      // recomputes the amount server-side before charging.
      const intakeId = quoteId ?? (await createIntakeRecord())

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

  const packageItems = getServicePackageItemsForUi(serviceSlug)
  const offeredAddOns = ADD_ONS.filter(a =>
    service?.videoAddOnAvailable ? true : !['video_presentation', 'interactive_walk'].includes(a.id),
  )

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
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">Your project and price</h1>
        <p className="text-slate-500 text-sm">One package, priced from your project. No commitment until you pay.</p>
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
            I agree to Kealee&apos;s{' '}
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

      {/* ── Your package, then your exact price ──────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Your package</h2>
        <p className="text-sm text-slate-500 mb-5">
          {service?.priceDisplay ? `Typical price: ${service.priceDisplay}. ` : ''}
          Your exact price is calculated from this project and shown before any payment.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900">{service?.deliverableLabel ?? 'Design Concept Package'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Delivered in {service?.deliveryDays ?? '3–5 days'}</p>
          </div>
          <div className="px-6 py-5 space-y-3">
            {packageItems.map((item, i) => {
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

          {/* Optional add-ons — never bundled into the package price */}
          <div className="px-6 py-5 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Optional add-ons
            </p>
            <div className="space-y-2">
              {offeredAddOns.map(addOn => (
                <label key={addOn.id} className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.includes(addOn.id)}
                      onChange={e => {
                        setQuote(null)
                        setSelectedAddOns(prev =>
                          e.target.checked ? [...prev, addOn.id] : prev.filter(id => id !== addOn.id),
                        )
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-[#E8724B] focus:ring-[#E8724B]"
                    />
                    <span className="text-sm text-slate-700 truncate">{addOn.label}</span>
                  </span>
                  <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {addOn.cents == null ? 'Scoped' : `$${(addOn.cents / 100).toLocaleString()}`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── The quote ─────────────────────────────────────── */}
      {quote ? (
        <div className="space-y-4">
          <QuoteBreakdown quote={quote} projectType={projectPath} />
          <button
            type="button"
            disabled={submitting || quote.customQuoteRequired}
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] active:bg-[#C04820] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-md shadow-orange-100"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : promoApplied ? (
              <><Check className="w-4 h-4" strokeWidth={3} /> Redeem Free Access</>
            ) : (
              <><Shield className="w-4 h-4" /> Pay ${(quote.totalCents / 100).toLocaleString()} — Start My Concept</>
            )}
          </button>
          <button
            type="button"
            onClick={() => setQuote(null)}
            className="w-full text-xs text-slate-400 hover:text-slate-600 transition"
          >
            Change add-ons and re-price
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={quoting}
          onClick={handleGetPrice}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200"
        >
          {quoting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Calculating your exact price…</>
          ) : (
            <>Get my exact price <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      )}

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
