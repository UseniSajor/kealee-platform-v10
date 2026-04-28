'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, AlertCircle, Shield } from 'lucide-react'
import { SERVICES, getConceptServices } from '@/lib/services-config'

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  serviceSlug: string
  // Step 2
  scope: string
  budget: string
  zipCode: string
  // Step 3
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  // Step 4
  tier: 1 | 2 | 3
  agreed: boolean
}

const EMPTY: FormData = {
  serviceSlug: '',
  scope: '', budget: '', zipCode: '',
  firstName: '', lastName: '', email: '', phone: '', address: '',
  tier: 1,
  agreed: false,
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const labels = ['Service', 'Details', 'Contact', 'Confirm']
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center">
          {labels.map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={label} className="flex items-center flex-1">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  done ? 'bg-[#E8724B] text-white' : active ? 'bg-[#E8724B] text-white ring-4 ring-orange-100' : 'bg-slate-100 text-slate-400'
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : n}
                </div>
                {i < labels.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all ${done ? 'bg-[#E8724B]' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          {labels.map((label, i) => (
            <span key={label} className={`text-[11px] font-semibold ${step === i + 1 ? 'text-[#E8724B]' : 'text-slate-400'}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 1: Service Selection ──────────────────────────────────────────────────

function Step1({ data, onChange, onNext }: { data: FormData; onChange: (d: Partial<FormData>) => void; onNext: () => void }) {
  const conceptServices = getConceptServices()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Choose Your Project</h1>
        <p className="mt-2 text-slate-500">What would you like to design or renovate?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {conceptServices.map((svc) => {
          const selected = data.serviceSlug === svc.slug
          const minPrice = svc.tiers.find(t => t.available)?.price ?? 0
          return (
            <button
              key={svc.slug}
              type="button"
              onClick={() => onChange({ serviceSlug: svc.slug })}
              className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                selected
                  ? 'border-[#E8724B] bg-orange-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                <Image src={svc.heroImage} alt={svc.label} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bold ${selected ? 'text-[#E8724B]' : 'text-slate-900'}`}>{svc.label}</p>
                  {selected && <CheckCircle2 className="w-4 h-4 text-[#E8724B] shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{svc.description.slice(0, 80)}…</p>
                <p className="text-xs font-semibold text-[#E8724B] mt-1">From ${minPrice}</p>
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!data.serviceSlug}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#E8724B] hover:bg-[#D45C33] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 text-sm transition"
      >
        Continue to Details <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Step 2: Project Details ────────────────────────────────────────────────────

function Step2({ data, onChange, onNext, onBack }: { data: FormData; onChange: (d: Partial<FormData>) => void; onNext: () => void; onBack: () => void }) {
  const [error, setError] = useState('')

  function validate() {
    if (data.scope.trim().length < 20) { setError('Please describe your project in at least 20 characters.'); return }
    if (!data.budget.trim()) { setError('Please enter an estimated budget.'); return }
    if (data.zipCode.length !== 5) { setError('Please enter a valid 5-digit ZIP code.'); return }
    setError('')
    onNext()
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-[#E8724B] focus:outline-none focus:ring-2 focus:ring-orange-200 transition"

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Tell Us About Your Project</h1>
        <p className="mt-2 text-slate-500">Help our AI generate the best concept for your space.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          Describe Your Project <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.scope}
          onChange={e => onChange({ scope: e.target.value })}
          rows={4}
          className={inputCls + ' resize-none'}
          placeholder="E.g., Modern kitchen with island, quartz counters, LED lighting, and open plan to dining room..."
        />
        <p className="text-xs text-slate-400 mt-1">Include style, features, and any specific requirements</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          Estimated Budget <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
          <input
            type="number"
            value={data.budget}
            onChange={e => onChange({ budget: e.target.value })}
            className={inputCls + ' pl-8'}
            placeholder="50000"
            min={0}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">Estimated total project budget (helps calibrate cost estimate)</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          ZIP Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={data.zipCode}
          onChange={e => onChange({ zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
          className={inputCls}
          placeholder="20814"
        />
        <p className="text-xs text-slate-400 mt-1">Used to determine jurisdiction, permits, and regional costs</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={validate} className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold py-3.5 text-sm transition">
          Continue to Contact <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Contact Info ───────────────────────────────────────────────────────

function Step3({ data, onChange, onNext, onBack }: { data: FormData; onChange: (d: Partial<FormData>) => void; onNext: () => void; onBack: () => void }) {
  const [error, setError] = useState('')

  function validate() {
    if (!data.firstName.trim()) { setError('First name is required.'); return }
    if (!data.email.trim() || !data.email.includes('@')) { setError('A valid email is required.'); return }
    setError('')
    onNext()
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-[#E8724B] focus:outline-none focus:ring-2 focus:ring-orange-200 transition"

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How Should We Reach You?</h1>
        <p className="mt-2 text-slate-500">We'll send your concept to this email once it's ready.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">First Name <span className="text-red-500">*</span></label>
          <input type="text" value={data.firstName} onChange={e => onChange({ firstName: e.target.value })} className={inputCls} placeholder="Jane" autoComplete="given-name" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">Last Name</label>
          <input type="text" value={data.lastName} onChange={e => onChange({ lastName: e.target.value })} className={inputCls} placeholder="Smith" autoComplete="family-name" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">Email <span className="text-red-500">*</span></label>
        <input type="email" value={data.email} onChange={e => onChange({ email: e.target.value })} className={inputCls} placeholder="jane@example.com" autoComplete="email" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">Phone (optional)</label>
        <input type="tel" value={data.phone} onChange={e => onChange({ phone: e.target.value })} className={inputCls} placeholder="(202) 555-0100" autoComplete="tel" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">Project Address (optional)</label>
        <input type="text" value={data.address} onChange={e => onChange({ address: e.target.value })} className={inputCls} placeholder="123 Main St, Bethesda, MD 20814" autoComplete="street-address" />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={validate} className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold py-3.5 text-sm transition">
          Review My Concept <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Review & Submit ────────────────────────────────────────────────────

function Step4({
  data, onChange, onBack, onSubmit, submitting, error,
}: {
  data: FormData
  onChange: (d: Partial<FormData>) => void
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
  error: string
}) {
  const service = SERVICES.find(s => s.slug === data.serviceSlug)
  const availableTiers = service?.tiers.filter(t => t.available) ?? []

  const selectedTier = service?.tiers.find(t => t.tier === data.tier)
  const price = selectedTier?.price ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Review Your Concept</h1>
        <p className="mt-2 text-slate-500">Confirm your details and choose your package.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100 shadow-sm">
        {[
          { label: 'Service', value: service?.label ?? '—', step: 1 },
          { label: 'Scope', value: data.scope.slice(0, 120) + (data.scope.length > 120 ? '…' : ''), step: 2 },
          { label: 'Budget', value: data.budget ? `$${Number(data.budget).toLocaleString()}` : '—', step: 2 },
          { label: 'ZIP Code', value: data.zipCode, step: 2 },
          { label: 'Name', value: `${data.firstName} ${data.lastName}`.trim() || '—', step: 3 },
          { label: 'Email', value: data.email, step: 3 },
          data.phone ? { label: 'Phone', value: data.phone, step: 3 } : null,
        ].filter(Boolean).map(row => (
          <div key={row!.label} className="flex items-start gap-4 px-5 py-3">
            <span className="text-xs font-semibold text-slate-400 w-20 shrink-0 pt-0.5">{row!.label}</span>
            <span className="text-sm text-slate-800 flex-1 leading-relaxed">{row!.value}</span>
          </div>
        ))}
      </div>

      {/* Tier selector */}
      {service && (
        <div>
          <p className="text-sm font-bold text-slate-900 mb-3">Select Your Package</p>
          <div className="space-y-2.5">
            {availableTiers.map((t) => {
              const selected = data.tier === t.tier
              return (
                <button
                  key={t.tier}
                  type="button"
                  onClick={() => onChange({ tier: t.tier })}
                  className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    selected ? 'border-[#E8724B] bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    selected ? 'border-[#E8724B] bg-[#E8724B]' : 'border-slate-300'
                  }`}>
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${selected ? 'text-[#E8724B]' : 'text-slate-900'}`}>
                        {t.name} — ${t.price}
                      </span>
                      {t.badge && (
                        <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {t.badge}
                        </span>
                      )}
                    </div>
                    {t.video ? (
                      <p className="text-xs text-slate-500 mt-0.5">Includes transformation video · All concept deliverables</p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-0.5">Concept renderings, cost estimate, permits, MEP — no video</p>
                    )}
                    {t.videoDeliverables && selected && (
                      <ul className="mt-2 space-y-0.5">
                        {t.videoDeliverables.slice(0, 4).map(item => (
                          <li key={item} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" /> {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Total + agree */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-slate-700">{service?.label} — {selectedTier?.name}</span>
          <span className="text-xl font-black text-slate-900">${price}</span>
        </div>
        <p className="text-xs text-slate-500">Delivered in {service?.deliveryDays} · One-time payment via Stripe</p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={data.agreed}
          onChange={e => onChange({ agreed: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#E8724B]"
        />
        <span className="text-xs text-slate-600 leading-relaxed">
          I agree to Kealee's{' '}
          <Link href="/terms" className="text-[#E8724B] hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#E8724B] hover:underline">Privacy Policy</Link>.
        </span>
      </label>

      <div className="flex gap-3">
        <button onClick={onBack} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || !data.agreed || price === 0}
          className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-3.5 text-sm transition"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          ) : (
            <><Shield className="w-4 h-4" /> Create My Concept — ${price}</>
          )}
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        🔒 Secure payment via Stripe. You'll be redirected to complete payment.
      </p>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

function ConceptIntakeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(() => {
    const serviceParam = searchParams.get('service') ?? ''
    const tierParam = parseInt(searchParams.get('tier') ?? '1', 10) as 1 | 2 | 3
    return {
      ...EMPTY,
      serviceSlug: serviceParam,
      tier: ([1, 2, 3] as (1 | 2 | 3)[]).includes(tierParam) ? tierParam : 1,
    }
  })

  // Skip to step 2 if service is pre-selected via URL param
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
      if (searchParams.get('service')) setStep(2)
    }
  }, [initialized, searchParams])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function update(partial: Partial<FormData>) {
    setForm(prev => ({ ...prev, ...partial }))
  }

  function next() {
    setStep(s => Math.min(s + 1, 4))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function back() {
    setStep(s => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const service = SERVICES.find(s => s.slug === form.serviceSlug)

      // 1. Create intake record
      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: service?.intakePath ?? form.serviceSlug,
          clientName: `${form.firstName} ${form.lastName}`.trim(),
          contactEmail: form.email,
          contactPhone: form.phone || null,
          projectAddress: form.address || `ZIP: ${form.zipCode}`,
          formData: {
            description: form.scope,
            budget: form.budget,
            zipCode: form.zipCode,
            tier: form.tier,
          },
        }),
      })

      if (!intakeRes.ok) {
        const body = await intakeRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save your intake. Please try again.')
      }
      const { intakeId } = await intakeRes.json()

      // 2. Create Stripe checkout session
      const tier = service?.tiers.find(t => t.tier === form.tier)
      const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath: service?.intakePath ?? form.serviceSlug,
          amount: (tier?.price ?? 0) * 100,
          successUrl: `${appUrl}/concept/deliverable?intakeId=${intakeId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${appUrl}/concept?canceled=true`,
        }),
      })

      if (!checkoutRes.ok) {
        const body = await checkoutRes.json().catch(() => ({}))
        throw new Error(body.error || 'Could not create checkout. Please try again.')
      }
      const { url } = await checkoutRes.json()
      if (url) window.location.href = url
      else throw new Error('No checkout URL returned.')
    } catch (err) {
      setSubmitError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ProgressBar step={step} />

      <div className="mx-auto max-w-2xl px-4 py-10 lg:py-14">
        {step === 1 && <Step1 data={form} onChange={update} onNext={next} />}
        {step === 2 && <Step2 data={form} onChange={update} onNext={next} onBack={back} />}
        {step === 3 && <Step3 data={form} onChange={update} onNext={next} onBack={back} />}
        {step === 4 && (
          <Step4
            data={form}
            onChange={update}
            onBack={back}
            onSubmit={submit}
            submitting={submitting}
            error={submitError}
          />
        )}
      </div>
    </div>
  )
}

export default function ConceptIntakePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" /></div>}>
      <ConceptIntakeInner />
    </Suspense>
  )
}
