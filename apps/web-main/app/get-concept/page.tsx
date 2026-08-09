'use client'

/**
 * Kealee v30 — intake BEFORE payment (/get-concept)
 * Spec: KEALEE-v30-IMPLEMENTATION-GUIDE.md
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowRight, Sparkles, Check, CheckCircle2, ChevronRight, Home, HelpCircle, FileText, Landmark, ShieldAlert, ArrowLeft } from 'lucide-react'
import { getConceptServices } from '@/lib/services-config'
import { V30AnalyzingOverlay } from '@/components/v30/V30AnalyzingOverlay'
import {
  isV30EnabledClient,
  V30_FEATURE_OPTIONS,
  V30_INTAKE_QUESTIONS,
  type V30IntakeAnswers,
  type V30QuoteResponse,
} from '@/lib/v30'
import { utmForApiBody } from '@/lib/marketing/client-utm'
import { trackEvent } from '@/lib/analytics'

const PRICING_LABELS: Record<string, string> = {
  baseAmount: 'Base package price',
  sqftComponent: 'Size adjustment (sq ft)',
  complexityFee: 'Scope complexity adjustment',
  urgencyMultiplier: 'Timeline multiplier',
  locationMultiplier: 'Location multiplier',
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#E8724B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8724B]/20 transition'

export default function GetConceptPage() {
  const router = useRouter()
  const v30 = isV30EnabledClient()
  const services = getConceptServices()

  const [step, setStep] = useState<'service' | 'questions' | 'quote' | 'contact'>('service')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [projectPath, setProjectPath] = useState('')
  const [answers, setAnswers] = useState<Partial<V30IntakeAnswers>>({
    utilities: {},
    codeConsiderations: ['none'],
  })
  const [features, setFeatures] = useState<string[]>([])
  const [quote, setQuote] = useState<V30QuoteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clientName, setClientName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [projectAddress, setProjectAddress] = useState('')

  useEffect(() => {
    if (!v30) router.replace('/concept')
  }, [v30, router])

  if (!v30) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8724B]" />
      </div>
    )
  }

  async function runQuote(selected?: string[]) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v30/intake', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           projectPath,
           answers,
           selectedFeatures: selected ?? features,
         }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Quote failed')
      setQuote(data)
      setFeatures(data.package.features)
      setStep('quote')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not analyze project')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckout() {
    if (!quote || !projectPath) return
    setLoading(true)
    setError(null)
    try {
      const attribution = utmForApiBody()

      // Soft capture before payment — fire-and-forget
      if (contactEmail) {
        fetch('/api/intake/soft-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: contactEmail,
            name: clientName,
            service: projectPath,
            source: 'get-concept',
            ...attribution,
          }),
        }).catch(() => {})
      }

      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          clientName,
          contactEmail,
          contactPhone,
          projectAddress: projectAddress || answers.location,
          budgetRange: answers.budgetRange,
          attribution,
          formData: {
            ...answers,
            v30: true,
            v30Answers: answers,
            v30Features: features,
            squareFootage: answers.squareFeet,
            ...attribution,
          },
        }),
      })
      const intakeData = await intakeRes.json()
      const intakeId = intakeData.intakeId as string

      trackEvent('lead_submitted', {
        project_path: projectPath,
        intake_id: intakeId,
        funnel: 'get-concept',
        ...attribution,
      })

      await fetch('/api/v30/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath,
          answers,
          selectedFeatures: features,
        }),
      })

      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath,
          useV30Pricing: true,
          attribution,
          successUrl: `${window.location.origin}/concept/success?intakeId=${intakeId}&v30=1`,
          cancelUrl: `${window.location.origin}/get-concept`,
        }),
      })
      const checkout = await checkoutRes.json()
      if (!checkoutRes.ok) throw new Error(checkout.error ?? 'Checkout failed')

      trackEvent('checkout_started', {
        project_path: projectPath,
        intake_id: intakeId,
        funnel: 'get-concept',
        value: quote.package.totalPrice,
        ...attribution,
      })

      if (checkout.url) window.location.href = checkout.url as string
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  const STEPS = [
    { n: 1, label: 'Planning', active: step === 'service' || step === 'questions' || step === 'quote' || step === 'contact', done: step !== 'service' },
    { n: 2, label: 'Questions', active: step === 'questions' || step === 'quote' || step === 'contact', done: step !== 'service' && step !== 'questions' },
    { n: 3, label: 'Estimate', active: step === 'quote' || step === 'contact', done: step === 'contact' },
    { n: 4, label: 'Checkout', active: step === 'contact', done: false },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {loading && step === 'questions' && <V30AnalyzingOverlay />}

      {/* Header Panel */}
      <div className="bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-30">
        <div className="mx-auto max-w-4xl px-4 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#E8724B]/10 text-[#E8724B] text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded">
                Kealee v30
              </span>
              <span className="text-slate-400 text-xs font-semibold">Pre-Payment Intake</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Get Your Custom Concept &amp; Quote
            </h1>
          </div>
          <div className="text-slate-500 text-xs md:text-right font-medium max-w-xs">
            See your exact package details and total cost upfront before check-out.
          </div>
        </div>

        {/* Dynamic Stepper */}
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const isActive = s.active
              const isDone = s.done
              return (
                <div key={s.n} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        isDone
                          ? 'bg-[#E8724B] text-white'
                          : isActive
                          ? 'bg-[#E8724B] text-white ring-4 ring-orange-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.n}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden sm:inline transition-colors ${
                        isActive ? 'text-slate-900 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div
                        className={`h-0.5 rounded-full transition-all duration-500 ${
                          isDone ? 'bg-[#E8724B]' : 'bg-slate-200'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-8 flex-1 flex flex-col justify-center">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-800 p-4 text-sm flex items-start gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="text-red-700/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* STEP 1: SERVICE */}
        {step === 'service' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto mb-4">
              <h2 className="text-xl font-bold text-slate-800">What service fits your project today?</h2>
              <p className="text-sm text-slate-500 mt-1">Select the main project area you want a design concept and price estimate for.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {services.map(s => {
                const isSelected = projectPath === s.slug
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => setProjectPath(s.slug)}
                    className={`text-left rounded-2xl border-2 p-5 transition-all duration-200 flex flex-col justify-between h-44 relative bg-white group shadow-sm hover:shadow-md ${
                      isSelected
                        ? 'border-[#E8724B] ring-2 ring-[#E8724B]/10 shadow-[#E8724B]/5'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isSelected ? 'bg-[#E8724B]/10 text-[#E8724B]' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/60'
                        }`}>
                          {s.shortLabel}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#E8724B] flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-[#E8724B] transition-colors">
                        {s.label}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3 mt-1.5 leading-relaxed">
                        {s.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                      <span className="text-xs font-semibold text-slate-700">{s.priceDisplay}</span>
                      <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded">{s.deliveryDays}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                disabled={!projectPath}
                onClick={() => {
                  setQuestionIndex(0)
                  setStep('questions')
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E8724B] hover:bg-[#D45C33] px-6 py-3.5 text-white font-bold transition shadow-md shadow-orange-100 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Continue to Questions <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: QUESTIONS */}
        {step === 'questions' && (() => {
          const q = V30_INTAKE_QUESTIONS[questionIndex]
          const total = V30_INTAKE_QUESTIONS.length
          const key = q.key as keyof V30IntakeAnswers
          const value = answers[key]
          const canNext =
            q.type === 'number'
              ? typeof value === 'number' && value > 0
              : q.type === 'utilities'
                ? true
                : q.type === 'multiselect'
                  ? Array.isArray(value)
                  : typeof value === 'string' && value.length > 0

          return (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xl max-w-2xl mx-auto w-full transition-all duration-300">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                <span>Question {questionIndex + 1} of {total}</span>
                <div className="h-1.5 w-32 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#E8724B] transition-all duration-500"
                    style={{ width: `${((questionIndex + 1) / total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {q.label}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Select or fill in your project specification details.</p>
              </div>

              <div className="space-y-4 min-h-[180px] flex flex-col justify-center">
                {q.type === 'select' && 'options' in q && (
                  <div className="grid gap-2.5">
                    {q.options.map(o => {
                      const isOptionSelected = value === o
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => setAnswers(a => ({ ...a, [key]: o }))}
                          className={`text-left rounded-xl border-2 px-5 py-4 transition-all duration-200 font-semibold text-sm flex items-center justify-between ${
                            isOptionSelected
                              ? 'border-[#E8724B] bg-orange-50/20 text-[#E8724B] shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="capitalize">{o.replace(/_/g, ' ').replace(/-/g, ' ')}</span>
                          {isOptionSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#E8724B] flex items-center justify-center text-white">
                              <Check className="w-3 h-3" strokeWidth={3.5} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {q.type === 'text' && (
                  <div>
                    <input
                      className={inputClass}
                      placeholder="e.g. Washington DC or Montgomery County MD"
                      value={(value as string) ?? ''}
                      onChange={e => setAnswers(a => ({ ...a, [key]: e.target.value }))}
                      autoFocus
                    />
                    <p className="text-xs text-slate-400 mt-2">Specify your county, city, or state for location multiplier and zoning laws.</p>
                  </div>
                )}

                {q.type === 'number' && (
                  <div>
                    <div className="relative">
                      <input
                        type="number"
                        className={inputClass}
                        placeholder="e.g. 1500"
                        value={typeof value === 'number' ? value : ''}
                        onChange={e => setAnswers(a => ({ ...a, [key]: Number(e.target.value) }))}
                        autoFocus
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">SQ FT</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Enter estimated square footage of the build scope.</p>
                  </div>
                )}

                {q.type === 'utilities' && (
                  <div className="space-y-3">
                    {[
                      { k: 'naturalGas' as const, label: 'Natural gas connection exists on site' },
                      { k: 'waterSewer' as const, label: 'Municipal water & sewer systems available' },
                    ].map(u => {
                      const checked = Boolean(answers.utilities?.[u.k])
                      return (
                        <label
                          key={u.k}
                          className={`flex items-center gap-3.5 rounded-xl border-2 px-5 py-4 cursor-pointer transition-all duration-200 ${
                            checked
                              ? 'border-[#E8724B] bg-orange-50/20 text-[#E8724B] font-semibold'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e =>
                              setAnswers(a => ({
                                ...a,
                                utilities: { ...a.utilities, [u.k]: e.target.checked },
                              }))
                            }
                            className="sr-only"
                          />
                          <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                            checked ? 'bg-[#E8724B] border-[#E8724B]' : 'border-slate-300 bg-white'
                          }`}>
                            {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                          </span>
                          <span className="text-sm font-semibold">{u.label}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.type === 'multiselect' && 'options' in q && (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {q.options.map(o => {
                      const selected = (answers.codeConsiderations ?? []).includes(o)
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() =>
                            setAnswers(a => {
                              const cur = a.codeConsiderations ?? []
                              const next = selected ? cur.filter(x => x !== o) : [...cur, o]
                              return { ...a, codeConsiderations: next.length ? next : ['none'] }
                            })
                          }
                          className={`text-left rounded-xl border-2 px-4 py-3.5 font-semibold text-xs transition-all duration-200 flex items-center justify-between ${
                            selected
                              ? 'border-[#E8724B] bg-orange-50/20 text-[#E8724B] shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="capitalize">{o.replace(/-/g, ' ')}</span>
                          {selected && (
                            <span className="w-4 h-4 rounded-full bg-[#E8724B] flex items-center justify-center text-white shrink-0 ml-2">
                              <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100 justify-between">
                {questionIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setQuestionIndex(i => i - 1)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep('service')}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Services
                  </button>
                )}

                {questionIndex < total - 1 ? (
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => setQuestionIndex(i => i + 1)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#E8724B] hover:bg-[#D45C33] px-6 py-3.5 text-white font-bold transition shadow-md shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Next Question <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading || !canNext}
                    onClick={() => runQuote()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#E8724B] hover:bg-[#D45C33] px-7 py-3.5 text-white font-bold transition shadow-md shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
                    {loading ? 'Analyzing Project…' : 'Generate Estimate'}
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {/* STEP 3: QUOTE */}
        {step === 'quote' && quote && (
          <div className="space-y-6 max-w-2xl mx-auto w-full">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-orange-100 p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-100/30 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#E8724B]">Your Custom Advisory Plan</p>
                  <p className="text-4xl font-extrabold text-slate-900 mt-1.5 tracking-tight font-sans">
                    ${quote.package.totalPrice.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100 shadow-sm">
                    {quote.analysis.estimatedDays} day delivery
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#E8724B] px-3 py-1 rounded-full text-xs font-bold border border-orange-100 shadow-sm">
                    {quote.analysis.scopeComplexity} Complexity
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                    quote.analysis.riskLevel.toLowerCase() === 'low'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {quote.analysis.riskLevel} Risk
                  </span>
                </div>
              </div>

              {quote.analysis.pricingBreakdown && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Cost Analysis &amp; Breakdown</h3>
                  <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-4 space-y-2.5">
                    {Object.entries(quote.analysis.pricingBreakdown).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">{PRICING_LABELS[k] ?? k}</span>
                        <span className="font-bold text-slate-800">
                          {k.includes('Multiplier') ? `×${v}` : `$${Math.round(v).toLocaleString()}`}
                        </span>
                      </div>
                    ))}
                    {quote.package.featureAddons > 0 && (
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200/60">
                        <span className="text-slate-600 font-semibold">Selected Add-ons</span>
                        <span className="font-bold text-[#E8724B]">${quote.package.featureAddons.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Included Advisory Deliverables</h3>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">Toggle add-ons</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {V30_FEATURE_OPTIONS.map(f => {
                    const isSelected = features.includes(f)
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          const next = features.includes(f)
                            ? features.filter(x => x !== f)
                            : [...features, f]
                          setFeatures(next)
                          runQuote(next)
                        }}
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition-all duration-150 flex items-center gap-1.5 shadow-sm ${
                          isSelected
                            ? 'bg-[#E8724B] text-white border-[#E8724B] shadow-[#E8724B]/10'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white text-[#E8724B]' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Check className="w-2.5 h-2.5" strokeWidth={4} />
                        </span>
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('questions')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep('contact')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E8724B] hover:bg-[#D45C33] px-7 py-3.5 text-white font-bold transition shadow-md shadow-orange-100 hover:shadow-lg"
              >
                Continue to Checkout <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONTACT & CHECKOUT */}
        {step === 'contact' && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xl max-w-md mx-auto w-full space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#E8724B] mb-1">Final Step</p>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">Contact &amp; Payment Details</h2>
              <p className="text-xs text-slate-500 mt-1">Provide contact details to receive your customized advisory plans.</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Client Full Name *</label>
                <input className={inputClass} placeholder="Full name" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email Address *</label>
                <input
                  className={inputClass}
                  placeholder="Email"
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  onBlur={() => {
                    if (!contactEmail.trim()) return
                    fetch('/api/intake/soft-capture', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: contactEmail,
                        name: clientName,
                        service: projectPath,
                        source: 'get-concept',
                        ...utmForApiBody(),
                      }),
                    }).catch(() => {})
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Phone Number (optional)</label>
                <input className={inputClass} placeholder="Phone" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Project Site Address *</label>
                <input className={inputClass} placeholder="Project address" value={projectAddress} onChange={e => setProjectAddress(e.target.value)} />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Advisory Package Price</p>
                <p className="text-lg font-extrabold text-slate-800">${quote?.package.totalPrice.toLocaleString()}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
                Secure checkout
              </span>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={loading || !clientName || !contactEmail || !projectAddress}
                onClick={handleCheckout}
                className="w-full rounded-xl bg-[#E8724B] hover:bg-[#D45C33] py-4 text-white font-bold transition shadow-md shadow-orange-100 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
                {loading ? 'Starting checkout…' : `Pay $${quote?.package.totalPrice.toLocaleString() ?? ''}`}
              </button>

              <button
                type="button"
                onClick={() => setStep('quote')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
              >
                Back to Quote Summary
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Prefer the classic flow?{' '}
                <Link href={`/intake/${projectPath}`} className="text-[#E8724B] hover:underline font-semibold">
                  Use standard intake
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

