'use client'

/**
 * Kealee v30 — intake BEFORE payment (/get-concept)
 * Spec: KEALEE-v30-IMPLEMENTATION-GUIDE.md
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { getConceptServices } from '@/lib/services-config'
import { V30AnalyzingOverlay } from '@/components/v30/V30AnalyzingOverlay'
import {
  isV30EnabledClient,
  V30_FEATURE_OPTIONS,
  V30_INTAKE_QUESTIONS,
  type V30IntakeAnswers,
  type V30QuoteResponse,
} from '@/lib/v30'

const PRICING_LABELS: Record<string, string> = {
  baseAmount: 'Base package',
  sqftComponent: 'Size (sq ft)',
  complexityFee: 'Complexity',
  urgencyMultiplier: 'Timeline multiplier',
  locationMultiplier: 'Location multiplier',
}

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
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
          formData: {
            ...answers,
            v30: true,
            v30Answers: answers,
            v30Features: features,
            squareFootage: answers.squareFeet,
          },
        }),
      })
      const intakeData = await intakeRes.json()
      const intakeId = intakeData.intakeId as string

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
          successUrl: `${window.location.origin}/concept/success?intakeId=${intakeId}&v30=1`,
          cancelUrl: `${window.location.origin}/get-concept`,
        }),
      })
      const checkout = await checkoutRes.json()
      if (!checkoutRes.ok) throw new Error(checkout.error ?? 'Checkout failed')
      if (checkout.url) window.location.href = checkout.url as string
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {loading && step === 'questions' && <V30AnalyzingOverlay />}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-1">Kealee v30</p>
          <h1 className="text-2xl font-bold text-slate-900">Get your concept — see price first</h1>
          <p className="text-slate-500 text-sm mt-1">Answer a few questions. We quote your package before checkout.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{error}</div>
        )}

        {step === 'service' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">What are you planning?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.slice(0, 8).map(s => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setProjectPath(s.slug)}
                  className={`text-left rounded-xl border-2 p-4 transition ${
                    projectPath === s.slug ? 'border-violet-600 bg-violet-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="font-semibold text-slate-900">{s.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!projectPath}
              onClick={() => {
                setQuestionIndex(0)
                setStep('questions')
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-white font-semibold disabled:opacity-50"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

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
            <div className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Question {questionIndex + 1} of {total}</span>
                <div className="h-1.5 w-32 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-violet-600 transition-all"
                    style={{ width: `${((questionIndex + 1) / total) * 100}%` }}
                  />
                </div>
              </div>
              <h2 className="font-semibold text-lg text-slate-900">{q.label}</h2>
              {q.type === 'select' && 'options' in q && (
                <div className="grid gap-2">
                  {q.options.map(o => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setAnswers(a => ({ ...a, [key]: o }))}
                      className={`text-left rounded-lg border-2 px-4 py-3 transition ${
                        value === o ? 'border-violet-600 bg-violet-50' : 'border-slate-200'
                      }`}
                    >
                      {o.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'text' && (
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="e.g. Washington DC or Montgomery County MD"
                  value={(value as string) ?? ''}
                  onChange={e => setAnswers(a => ({ ...a, [key]: e.target.value }))}
                />
              )}
              {q.type === 'number' && (
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={typeof value === 'number' ? value : ''}
                  onChange={e => setAnswers(a => ({ ...a, [key]: Number(e.target.value) }))}
                />
              )}
              {q.type === 'utilities' && (
                <div className="space-y-3">
                  {[
                    { k: 'naturalGas' as const, label: 'Natural gas on site' },
                    { k: 'waterSewer' as const, label: 'Municipal water & sewer' },
                  ].map(u => (
                    <label key={u.k} className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(answers.utilities?.[u.k])}
                        onChange={e =>
                          setAnswers(a => ({
                            ...a,
                            utilities: { ...a.utilities, [u.k]: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-violet-600"
                      />
                      <span className="text-sm font-medium text-slate-800">{u.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'multiselect' && 'options' in q && (
                <div className="grid gap-2 sm:grid-cols-2">
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
                        className={`text-left rounded-lg border-2 px-4 py-3 text-sm transition ${
                          selected ? 'border-violet-600 bg-violet-50' : 'border-slate-200'
                        }`}
                      >
                        {o.replace(/-/g, ' ')}
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                {questionIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuestionIndex(i => i - 1)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Back
                  </button>
                )}
                {questionIndex < total - 1 ? (
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => setQuestionIndex(i => i + 1)}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-white font-semibold disabled:opacity-50"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading || !canNext}
                    onClick={() => runQuote()}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-white font-semibold disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {loading ? 'Analyzing…' : 'Get my estimate'}
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {step === 'quote' && quote && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border-2 border-violet-200 p-6">
              <p className="text-sm text-slate-500">Your custom package</p>
              <p className="text-4xl font-bold text-slate-900 mt-1">
                ${quote.package.totalPrice.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {quote.analysis.estimatedDays} day delivery · {quote.analysis.scopeComplexity} scope · {quote.analysis.riskLevel} risk
              </p>
              {quote.analysis.pricingBreakdown && (
                <ul className="mt-4 space-y-1 text-sm text-slate-600 border-t border-slate-100 pt-4">
                  {Object.entries(quote.analysis.pricingBreakdown).map(([k, v]) => (
                    <li key={k} className="flex justify-between gap-4">
                      <span>{PRICING_LABELS[k] ?? k}</span>
                      <span className="font-medium text-slate-800">
                        {k.includes('Multiplier') ? `×${v}` : `$${Math.round(v).toLocaleString()}`}
                      </span>
                    </li>
                  ))}
                  {quote.package.featureAddons > 0 && (
                    <li className="flex justify-between gap-4">
                      <span>Feature add-ons</span>
                      <span className="font-medium">${quote.package.featureAddons.toLocaleString()}</span>
                    </li>
                  )}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {V30_FEATURE_OPTIONS.map(f => (
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                      features.includes(f)
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep('contact')}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-white font-semibold"
            >
              Continue to checkout
            </button>
          </div>
        )}

        {step === 'contact' && (
          <div className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-lg">Contact & pay</h2>
            <input className="w-full rounded-lg border px-3 py-2" placeholder="Full name" value={clientName} onChange={e => setClientName(e.target.value)} />
            <input className="w-full rounded-lg border px-3 py-2" placeholder="Email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            <input className="w-full rounded-lg border px-3 py-2" placeholder="Phone (optional)" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
            <input className="w-full rounded-lg border px-3 py-2" placeholder="Project address" value={projectAddress} onChange={e => setProjectAddress(e.target.value)} />
            <button
              type="button"
              disabled={loading || !clientName || !contactEmail}
              onClick={handleCheckout}
              className="w-full rounded-lg bg-[#E8724B] py-3 text-white font-bold disabled:opacity-50"
            >
              {loading ? 'Starting checkout…' : `Pay $${quote?.package.totalPrice.toLocaleString() ?? ''}`}
            </button>
            <p className="text-xs text-slate-500 text-center">
              Prefer the classic flow? <Link href={`/intake/${projectPath}`} className="text-violet-600 underline">Use standard intake</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
