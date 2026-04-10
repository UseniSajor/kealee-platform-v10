'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, FileText, HardHat, ArrowRight, Loader2, Info } from 'lucide-react'

const SKU_META: Record<string, { name: string; price: string; description: string }> = {
  PERMIT_SIMPLE: {
    name: 'Simple Filing',
    price: '$395',
    description: 'For straightforward permits where you already have the documents.',
  },
  PERMIT_PACKAGE: {
    name: 'Permit Package',
    price: '$695',
    description: 'Document prep, risk review, application submission, and 60-day tracking.',
  },
  PERMIT_COORDINATION: {
    name: 'Permit Coordination',
    price: '$1,495',
    description: 'Full-service multi-trade coordination with jurisdiction liaison.',
  },
  PERMIT_EXPEDITING: {
    name: 'Permit Expediting',
    price: '$2,495',
    description: 'Dedicated expeditor, direct reviewer contact, weekly calls.',
  },
}

const PROJECT_TYPES = [
  { value: 'single_family_addition', label: 'Single-family addition or ADU' },
  { value: 'interior_renovation',    label: 'Interior renovation (kitchen, bath, basement)' },
  { value: 'exterior_work',          label: 'Exterior work (deck, fence, siding, windows)' },
  { value: 'mechanical_electrical',  label: 'Mechanical, electrical, or plumbing' },
  { value: 'new_construction',       label: 'New construction' },
  { value: 'commercial',             label: 'Commercial or mixed-use' },
  { value: 'tenant_improvement',     label: 'Tenant improvement / build-out' },
  { value: 'not_sure',               label: 'Not sure yet' },
]

const JURISDICTIONS = [
  'Washington DC (DCRA)',
  'Montgomery County MD',
  "Prince George's County MD",
  'Fairfax County VA',
  'Arlington County VA',
  'City of Alexandria VA',
  'Prince William County VA',
  'Loudoun County VA',
  'Howard County MD',
  'Anne Arundel County MD',
  'Other DMV jurisdiction',
]

const PLAN_STATUS = [
  { value: 'have_stamped',    label: 'I have stamped / permit-ready plans' },
  { value: 'have_concept',    label: 'I have a concept or sketch (not stamped)' },
  { value: 'no_plans',        label: 'I don\'t have plans yet' },
  { value: 'not_sure',        label: 'Not sure what I have' },
]

export default function PermitsIntakePage() {
  const params   = useSearchParams()
  const router   = useRouter()
  const sku      = params.get('sku') ?? 'PERMIT_PACKAGE'
  const product  = SKU_META[sku] ?? SKU_META.PERMIT_PACKAGE

  const [address,      setAddress]      = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [projectType,  setProjectType]  = useState('')
  const [planStatus,   setPlanStatus]   = useState('')
  const [description,  setDescription]  = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const needsPlansWarning =
    planStatus === 'have_concept' || planStatus === 'no_plans' || planStatus === 'not_sure'

  function validate(): string | null {
    if (!address.trim())  return 'Property address is required.'
    if (!jurisdiction)    return 'Please select your jurisdiction.'
    if (!projectType)     return 'Please select the project type.'
    if (!planStatus)      return 'Please indicate your plan status.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
      const res = await fetch(`${apiUrl}/api/v1/orchestrate/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId:          `permit_${Date.now()}`,
          intent:            'buy_permit',
          role:              'homeowner',
          phase:             'product_selection',
          currentProductSku: sku,
          address:           address.trim(),
          projectType,
          extra: { jurisdiction, planStatus, description: description.trim() },
        }),
      })

      const data = await res.json() as { ok?: boolean; result?: { checkoutUrl?: string } }

      if (data.ok && data.result?.checkoutUrl) {
        window.location.href = data.result.checkoutUrl
      } else {
        router.push(`/permits/checkout?sku=${sku}&address=${encodeURIComponent(address)}&type=${projectType}`)
      }
    } catch {
      router.push(`/permits/checkout?sku=${sku}&address=${encodeURIComponent(address)}&type=${projectType}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0F1A2E] px-4 py-16">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#2ABFBF]">
            Permit Services
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">{product.name}</h1>
          <p className="mt-1 text-lg font-bold text-[#E8793A]">{product.price}</p>
          <p className="mt-1 text-sm text-white/50">{product.description}</p>
        </div>

        {/* Plans warning */}
        {needsPlansWarning && planStatus && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-200">
              {planStatus === 'have_concept'
                ? 'A concept or sketch is not permit-ready. If your permit requires stamped plans, we\'ll identify that and tell you what\'s needed.'
                : 'If your permit requires architectural drawings, we\'ll identify that during our review and tell you exactly what you need before we proceed.'}
            </p>
          </div>
        )}

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-[#1A2B4A] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-300">{error}</div>
            )}

            {/* Address */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Property address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State ZIP"
                  className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-[#2ABFBF] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Jurisdiction */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Jurisdiction <span className="text-red-400">*</span>
              </label>
              <select
                value={jurisdiction}
                onChange={e => setJurisdiction(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white focus:border-[#2ABFBF] focus:outline-none"
                required
              >
                <option value="">Select jurisdiction…</option>
                {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>

            {/* Project type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Project type <span className="text-red-400">*</span>
              </label>
              <select
                value={projectType}
                onChange={e => setProjectType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white focus:border-[#2ABFBF] focus:outline-none"
                required
              >
                <option value="">Select project type…</option>
                {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Plan status */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                What plans do you currently have? <span className="text-red-400">*</span>
              </label>
              <select
                value={planStatus}
                onChange={e => setPlanStatus(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white focus:border-[#2ABFBF] focus:outline-none"
                required
              >
                <option value="">Select one…</option>
                {PLAN_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Brief project description <span className="text-white/40">optional</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what you're building or renovating..."
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-[#0F1A2E] py-2.5 px-4 text-sm text-white placeholder-white/30 focus:border-[#2ABFBF] focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8793A] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
              ) : (
                <>Continue to Checkout <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-white/40">
            Your information is used only for your permit engagement. No spam.
          </p>
        </div>
      </div>
    </main>
  )
}
