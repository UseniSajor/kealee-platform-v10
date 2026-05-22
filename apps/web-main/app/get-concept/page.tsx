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
import {
  isV30EnabledClient,
  V30_FEATURE_OPTIONS,
  type V30IntakeAnswers,
  type V30QuoteResponse,
} from '@/lib/v30'

export default function GetConceptPage() {
  const router = useRouter()
  const v30 = isV30EnabledClient()
  const services = getConceptServices()

  const [step, setStep] = useState<'service' | 'questions' | 'quote' | 'contact'>('service')
  const [projectPath, setProjectPath] = useState('')
  const [answers, setAnswers] = useState<Partial<V30IntakeAnswers>>({
    utilities: {},
    codeConsiderations: [],
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
          successUrl: `${window.location.origin}/concept/confirm?intakeId=${intakeId}`,
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
              onClick={() => setStep('questions')}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-white font-semibold disabled:opacity-50"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 'questions' && (
          <div className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-lg">Project details</h2>
            {[
              { key: 'propertyType', label: 'Property type', options: ['single-family', 'multi-family', 'commercial'] },
              { key: 'primaryScope', label: 'Primary scope', options: ['kitchen_remodel', 'bath_remodel', 'addition', 'whole_house'] },
              { key: 'budgetRange', label: 'Budget', options: ['$25K-$50K', '$50K-$100K', '$100K-$250K', '$250K+'] },
              { key: 'timeline', label: 'Timeline', options: ['ASAP', '6-8 weeks', 'flexible'] },
            ].map(f => (
              <label key={f.key} className="block">
                <span className="text-sm font-medium text-slate-700">{f.label}</span>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={(answers as Record<string, string>)[f.key] ?? ''}
                  onChange={e => setAnswers(a => ({ ...a, [f.key]: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {f.options.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>
            ))}
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Location</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="e.g. Washington DC or Montgomery County MD"
                value={answers.location ?? ''}
                onChange={e => setAnswers(a => ({ ...a, location: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Square footage</span>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={answers.squareFeet ?? ''}
                onChange={e => setAnswers(a => ({ ...a, squareFeet: Number(e.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Year built</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={answers.yearBuilt ?? ''}
                onChange={e => setAnswers(a => ({ ...a, yearBuilt: e.target.value }))}
              >
                <option value="">Select…</option>
                {['pre-1950', '1950-1980', '1980-2000', '2000+'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={() => runQuote()}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-white font-semibold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Get my estimate
            </button>
          </div>
        )}

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
