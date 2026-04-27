'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, ArrowRight, CheckCircle2, Clock, Shield, Zap } from 'lucide-react'

const AGENT_MAP: Record<string, string> = {
  exterior_concept: 'design', garden_concept: 'design', whole_home_concept: 'design',
  interior_reno_concept: 'design', developer_concept: 'land', kitchen_remodel: 'design',
  bathroom_remodel: 'design', whole_home_remodel: 'design', addition_expansion: 'design',
  permit_path_only: 'permit', cost_estimate: 'design', contractor_match: 'contractor',
  multi_unit_residential: 'land', mixed_use: 'land', commercial_office: 'land',
  development_feasibility: 'land', design_build: 'design', capture_site_concept: 'design',
  townhome_subdivision: 'land', single_family_subdivision: 'land', single_lot_development: 'land',
  interior_renovation: 'design',
}

const PRICE_MAP: Record<string, { label: string; amount: number; delivery: string }> = {
  exterior_concept: { label: 'Exterior Concept Package', amount: 39500, delivery: '3–5 days' },
  garden_concept: { label: 'Garden Concept', amount: 29500, delivery: '2–4 days' },
  whole_home_concept: { label: 'Whole Home Concept', amount: 59500, delivery: '4–6 days' },
  interior_reno_concept: { label: 'Interior Reno Concept', amount: 34500, delivery: '3–5 days' },
  kitchen_remodel: { label: 'Kitchen Design Package', amount: 39500, delivery: '3–5 days' },
  bathroom_remodel: { label: 'Bathroom Design Package', amount: 29500, delivery: '2–4 days' },
  permit_path_only: { label: 'Permit Package', amount: 49900, delivery: '3–5 days' },
  cost_estimate: { label: 'Cost Estimate Package', amount: 59500, delivery: '2–3 days' },
  contractor_match: { label: 'Contractor Match', amount: 19900, delivery: '1 day' },
  development_feasibility: { label: 'Feasibility Study', amount: 149900, delivery: '5–7 days' },
  design_build: { label: 'Design + Build Package', amount: 79500, delivery: '5–7 days' },
  capture_site_concept: { label: 'Site Capture + Concept', amount: 12500, delivery: '1–2 days' },
  multi_unit_residential: { label: 'Multi-Unit Residential', amount: 99900, delivery: '5–7 days' },
  mixed_use: { label: 'Mixed-Use Concept', amount: 129900, delivery: '6–8 days' },
  commercial_office: { label: 'Commercial Office', amount: 119900, delivery: '5–7 days' },
  townhome_subdivision: { label: 'Townhome Subdivision', amount: 169900, delivery: '7–10 days' },
  single_family_subdivision: { label: 'Single-Family Subdivision', amount: 149900, delivery: '6–8 days' },
  single_lot_development: { label: 'Single-Lot Development', amount: 89900, delivery: '4–6 days' },
  interior_renovation: { label: 'Interior Renovation', amount: 34500, delivery: '3–5 days' },
  whole_home_remodel: { label: 'Whole-Home Remodel', amount: 69500, delivery: '4–6 days' },
  addition_expansion: { label: 'Addition / Expansion', amount: 49500, delivery: '3–5 days' },
  developer_concept: { label: 'Developer Concept', amount: 79500, delivery: '5–7 days' },
}

interface AgentInsight {
  summary?: string
  confidence?: number
  risks?: string[]
  recommendation?: string
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepBar({ step }: { step: 'details' | 'review' }) {
  const steps = ['details', 'review'] as const
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                step === s
                  ? 'bg-orange-600 text-white'
                  : steps.indexOf(step) > i
                  ? 'bg-orange-200 text-orange-700'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {steps.indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded-full ${steps.indexOf(step) > i ? 'bg-orange-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className={`text-xs font-semibold ${step === 'details' ? 'text-orange-600' : 'text-slate-400'}`}>Your Details</span>
          <span className={`text-xs font-semibold ${step === 'review' ? 'text-orange-600' : 'text-slate-400'}`}>Review & Pay</span>
        </div>
      </div>
    </div>
  )
}

// ── Order summary sidebar ──────────────────────────────────────────────────────
function OrderSummary({
  priceInfo,
  agentInsight,
  insightLoading,
}: {
  priceInfo: { label: string; amount: number; delivery: string }
  agentInsight: AgentInsight | null
  insightLoading: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Package card */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-1">Your Order</p>
            <h3 className="text-base font-bold text-slate-900">{priceInfo.label}</h3>
          </div>
          <span className="text-xl font-black text-slate-900">{formatPrice(priceInfo.amount)}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4 text-orange-500" /> Delivered in {priceInfo.delivery}
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <Shield className="h-4 w-4 text-green-500" /> Secure checkout via Stripe
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-blue-500" /> 30-min consultation included
          </span>
        </div>
      </div>

      {/* AI insight panel */}
      <div className="rounded-xl bg-slate-900 p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400">AI Project Insight</span>
        </div>
        {insightLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing your project type...
          </div>
        ) : agentInsight ? (
          <div className="space-y-3">
            {agentInsight.summary && (
              <p className="text-sm text-slate-300 leading-relaxed">{agentInsight.summary}</p>
            )}
            {agentInsight.recommendation && (
              <p className="text-xs text-orange-300 font-medium leading-relaxed">
                💡 {agentInsight.recommendation}
              </p>
            )}
            {agentInsight.risks && agentInsight.risks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1.5">Key considerations:</p>
                <ul className="space-y-1">
                  {agentInsight.risks.slice(0, 2).map((r, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <span className="text-orange-500 mt-0.5">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400 leading-relaxed">
            Our team will review your project details and begin work immediately after payment.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function IntakePage() {
  const params = useParams()
  const router = useRouter()
  const projectPath = Array.isArray(params.projectPath) ? params.projectPath[0] : params.projectPath as string

  const [step, setStep] = useState<'details' | 'review'>('details')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // AI insight loads in background — does NOT block the form
  const [agentInsight, setAgentInsight] = useState<AgentInsight | null>(null)
  const [insightLoading, setInsightLoading] = useState(true)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    squareFootage: '',
    timeline: 'flexible',
  })

  const agentType = AGENT_MAP[projectPath] || 'design'
  const priceInfo = PRICE_MAP[projectPath] || { label: 'Project Package', amount: 39500, delivery: '3–5 days' }

  // Fetch AI insight in background — form is already visible
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    fetch(`/api/agents/${agentType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectType: projectPath, context: 'intake_funnel' }),
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled && data) setAgentInsight(data) })
      .catch(() => null)
      .finally(() => {
        clearTimeout(timeout)
        if (!cancelled) setInsightLoading(false)
      })

    return () => { cancelled = true; controller.abort() }
  }, [agentType, projectPath])

  // ── Unknown project path guard ─────────────────────────────────────────────
  if (!projectPath || !AGENT_MAP[projectPath]) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="rounded-xl bg-white shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Service Not Found</h1>
          <p className="text-slate-500 mb-6">We couldn't find that service. Please choose from our available packages.</p>
          <Link href="/gallery" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition">
            Browse Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  // ── Step: details ──────────────────────────────────────────────────────────
  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!formData.firstName.trim()) { setFormError('First name is required.'); return }
    if (!formData.email.trim()) { setFormError('Email is required.'); return }
    if (!formData.address.trim()) { setFormError('Project address is required.'); return }
    setStep('review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Step: payment ──────────────────────────────────────────────────────────
  async function handlePayment() {
    setSubmitting(true)
    setFormError('')
    try {
      // 1. Create intake record
      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          clientName: `${formData.firstName} ${formData.lastName}`.trim(),
          contactEmail: formData.email,
          contactPhone: formData.phone || null,
          projectAddress: formData.address,
          formData: {
            description: formData.description,
            squareFootage: formData.squareFootage,
            timeline: formData.timeline,
          },
        }),
      })

      if (!intakeRes.ok) {
        const body = await intakeRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save your intake. Please try again.')
      }
      const { intakeId } = await intakeRes.json()

      // 2. Create Stripe checkout session
      const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath,
          amount: priceInfo.amount,
          successUrl: `${appUrl}/intake/${projectPath}/success?session_id={CHECKOUT_SESSION_ID}&intakeId=${intakeId}`,
          cancelUrl: `${appUrl}/intake/${projectPath}?canceled=true`,
        }),
      })

      if (!checkoutRes.ok) {
        const body = await checkoutRes.json().catch(() => ({}))
        throw new Error(body.error || 'Could not create checkout session. Please try again.')
      }
      const { url } = await checkoutRes.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned from payment processor.')
      }
    } catch (err) {
      setFormError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StepBar step={step} />

      <div className="mx-auto max-w-5xl px-4 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Left: Form ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-3">

            {/* ── DETAILS FORM ─────────────────────────────────────────────── */}
            {step === 'details' && (
              <form onSubmit={handleDetailsSubmit} className="space-y-5" noValidate>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">Tell us about your project</h1>
                  <p className="text-slate-500 mt-1 text-sm">
                    Secure checkout via Stripe after submission.
                  </p>
                </div>

                {formError && (
                  <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-sm">{formError}</span>
                  </div>
                )}

                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={e => setFormData(d => ({ ...d, firstName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      placeholder="Jane"
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={e => setFormData(d => ({ ...d, lastName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      placeholder="Smith"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="jane@example.com"
                    autoComplete="email"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Phone (optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="(202) 555-0100"
                    autoComplete="tel"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Project Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData(d => ({ ...d, address: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="123 Main St, Bethesda, MD 20814"
                    autoComplete="street-address"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Describe Your Project
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                    placeholder="Tell us your goals, what's changing, any specific requirements or style preferences..."
                  />
                </div>

                {/* Sq ft + Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">Sq. Footage (optional)</label>
                    <input
                      type="number"
                      value={formData.squareFootage}
                      onChange={e => setFormData(d => ({ ...d, squareFootage: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      placeholder="e.g. 2,500"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">Timeline</label>
                    <select
                      value={formData.timeline}
                      onChange={e => setFormData(d => ({ ...d, timeline: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="asap">ASAP (1–2 weeks)</option>
                      <option value="month">Within 1 month</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 py-4 text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Review & Pay {formatPrice(priceInfo.amount)}
                  <ArrowRight className="h-5 w-5" />
                </button>

                <p className="text-center text-xs text-slate-400">
                  🔒 Secure payment powered by Stripe. You won't be charged until the next step.
                </p>
              </form>
            )}

            {/* ── REVIEW STEP ──────────────────────────────────────────────── */}
            {step === 'review' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">Review your order</h1>
                  <p className="text-slate-500 mt-1 text-sm">Confirm your details, then proceed to secure payment.</p>
                </div>

                {formError && (
                  <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-sm">{formError}</span>
                  </div>
                )}

                {/* Details summary */}
                <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100 shadow-sm">
                  {[
                    { label: 'Name', value: `${formData.firstName} ${formData.lastName}`.trim() || '—' },
                    { label: 'Email', value: formData.email },
                    { label: 'Address', value: formData.address },
                    formData.phone ? { label: 'Phone', value: formData.phone } : null,
                    formData.description ? { label: 'Project description', value: formData.description } : null,
                  ].filter(Boolean).map(row => (
                    <div key={row!.label} className="flex items-start gap-4 px-5 py-3">
                      <span className="text-xs font-semibold text-slate-400 w-28 shrink-0 pt-0.5">{row!.label}</span>
                      <span className="text-sm text-slate-800 leading-relaxed">{row!.value}</span>
                    </div>
                  ))}
                </div>

                {/* Price summary */}
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">{priceInfo.label}</span>
                    <span className="text-sm font-bold text-slate-900">{formatPrice(priceInfo.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Delivered in {priceInfo.delivery}</span>
                    <span>One-time payment</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Total due today</span>
                    <span className="text-2xl font-black text-blue-700">{formatPrice(priceInfo.amount)}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep('details'); setFormError('') }}
                    disabled={submitting}
                    className="flex-1 rounded-xl border-2 border-slate-200 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    ← Edit Details
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={submitting}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-slate-400 py-3.5 text-sm font-bold text-white transition"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Redirecting to payment...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Pay {formatPrice(priceInfo.amount)} Securely
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400">
                  🔒 You'll be redirected to Stripe to complete payment. Your data is encrypted.
                </p>
              </div>
            )}
          </div>

          {/* ── Right: Order summary + AI insight ───────────────────────────── */}
          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <OrderSummary
              priceInfo={priceInfo}
              agentInsight={agentInsight}
              insightLoading={insightLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
