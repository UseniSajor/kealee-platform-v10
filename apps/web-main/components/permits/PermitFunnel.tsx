'use client'

import { useState, useRef } from 'react'

interface PermitFunnelProps {
  countySlug?: string
}

type ProjectType = 'residential' | 'addition' | 'new-construction' | 'commercial'
type PlansAnswer = 'yes' | 'no'
type PermitTier = 'simple' | 'package' | 'coordination' | 'expediting'

interface FunnelState {
  step: 1 | 2 | 3 | 4
  projectType: ProjectType | null
  hasPlans: PlansAnswer | null
  // Step 2 — has plans
  uploadedFiles: File[]
  // Step 2 — no plans
  projectDescription: string
  squareFootage: string
  address: string
  // Step 3 — contact
  name: string
  email: string
  contactAddress: string
  // Step 4 — package selection
  intakeId: string | null
}

const PROJECT_TYPES: { id: ProjectType; label: string; sub: string }[] = [
  { id: 'residential', label: 'Residential Project', sub: 'Interior remodel, deck, fence, ADU' },
  { id: 'addition', label: 'Addition or Renovation', sub: 'Structural changes, room additions' },
  { id: 'new-construction', label: 'New Construction', sub: 'Ground-up build on vacant land' },
  { id: 'commercial', label: 'Commercial / Multifamily', sub: 'Mixed-use, multifamily, retail, office' },
]

const PERMIT_PACKAGES: {
  tier: PermitTier
  name: string
  price: string
  description: string
  includes: string[]
  highlight?: boolean
}[] = [
  {
    tier: 'simple',
    name: 'Permit Research',
    price: '$297',
    description: 'Know exactly what you need before you start',
    includes: [
      'Jurisdiction requirements report',
      'Complete document checklist',
      'Fee schedule + timeline estimate',
      'Common rejection reasons for your project type',
    ],
  },
  {
    tier: 'package',
    name: 'Full Permit Package',
    price: '$497',
    description: 'Everything prepared for first-cycle approval',
    includes: [
      'Everything in Permit Research',
      'Complete submission package review',
      'Setback + code compliance check',
      'Cover letter drafted for your jurisdiction',
      '2 revision rounds',
    ],
    highlight: true,
  },
  {
    tier: 'coordination',
    name: 'Permit Coordination',
    price: '$997',
    description: 'We manage the entire process for you',
    includes: [
      'Everything in Full Permit Package',
      'Direct examiner communication',
      'Correction responses handled',
      'Status tracking + weekly updates',
      'Unlimited revisions',
    ],
  },
  {
    tier: 'expediting',
    name: 'Expedited Filing',
    price: '$1,997',
    description: 'Priority processing — fastest path to approval',
    includes: [
      'Everything in Permit Coordination',
      'Priority queue placement',
      'Direct jurisdiction contact',
      'Same-day issue response',
      'Guaranteed first submission within 5 business days',
    ],
  },
]

export function PermitFunnel({ countySlug }: PermitFunnelProps) {
  const [state, setState] = useState<FunnelState>({
    step: 1,
    projectType: null,
    hasPlans: null,
    uploadedFiles: [],
    projectDescription: '',
    squareFootage: '',
    address: '',
    name: '',
    email: '',
    contactAddress: '',
    intakeId: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [checkingOut, setCheckingOut] = useState<PermitTier | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<FunnelState>) =>
    setState((prev) => ({ ...prev, ...patch }))

  const handleProjectTypeSelect = (type: ProjectType) => {
    set({ projectType: type, step: 2 })
  }

  const handlePlansAnswer = (answer: PlansAnswer) => {
    set({ hasPlans: answer })
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(pdf|dwg|zip)$/i.test(f.name)
    )
    set({ uploadedFiles: [...state.uploadedFiles, ...files] })
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    set({ uploadedFiles: [...state.uploadedFiles, ...files] })
  }

  // Step 3 → submit contact info → get intakeId → advance to step 4
  const handleSubmit = async () => {
    if (!state.name || !state.email) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/permits/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          address: state.contactAddress || state.address,
          projectType: state.projectType,
          hasPlans: state.hasPlans,
          projectDescription: state.projectDescription,
          squareFootage: state.squareFootage,
          countySlug,
        }),
      })
      const data = await res.json()
      if (data.intakeId) {
        set({ intakeId: data.intakeId, step: 4 })
      } else {
        // Fallback: still advance (intake will be recovered from email)
        set({ step: 4 })
      }
    } catch {
      // Still advance — don't block user
      set({ step: 4 })
    } finally {
      setSubmitting(false)
    }
  }

  // Step 4 → select package → Stripe checkout
  const handleCheckout = async (tier: PermitTier) => {
    setCheckingOut(tier)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    try {
      const res = await fetch('/api/permits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId: state.intakeId ?? 'pending',
          tier,
          successUrl: `${origin}/permits/success?tier=${tier}&email=${encodeURIComponent(state.email)}&intake_id=${state.intakeId ?? ''}`,
          cancelUrl: `${origin}/permits`,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No Stripe URL returned', data)
        setCheckingOut(null)
      }
    } catch (err) {
      console.error('Checkout failed', err)
      setCheckingOut(null)
    }
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  const stepLabels = ['Project Type', 'Plans', 'Contact', 'Package']

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Progress */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          {stepLabels.map((label, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3 | 4
            const active = state.step === stepNum
            const done = state.step > stepNum
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: done ? '#2ABFBF' : active ? '#1A2B4A' : '#E5E7EB',
                      color: done || active ? '#fff' : '#9CA3AF',
                    }}
                  >
                    {done ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className="text-xs font-medium hidden sm:block"
                    style={{ color: active ? '#1A2B4A' : done ? '#2ABFBF' : '#9CA3AF' }}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className="flex-1 h-0.5 rounded"
                    style={{ backgroundColor: done ? '#2ABFBF' : '#E5E7EB' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="px-6 pb-8">

        {/* ── Step 1 ─────────────────────────────────────────────────────── */}
        {state.step === 1 && (
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#1A2B4A' }}>
              What type of project do you have?
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              Select the category that best describes your project
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROJECT_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => handleProjectTypeSelect(pt.id)}
                  className="text-left p-4 rounded-xl border-2 transition-all hover:border-teal-400 hover:shadow-sm"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <p className="font-semibold text-sm" style={{ color: '#1A2B4A' }}>{pt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pt.sub}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2 ─────────────────────────────────────────────────────── */}
        {state.step === 2 && (
          <div>
            <button
              onClick={() => set({ step: 1 })}
              className="flex items-center gap-1 text-sm mb-4 transition-opacity hover:opacity-70"
              style={{ color: '#2ABFBF' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#1A2B4A' }}>
              Do you have existing plans or drawings?
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              This helps us understand what your submission will need
            </p>

            {state.hasPlans === null && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {(['yes', 'no'] as const).map((ans) => (
                  <button
                    key={ans}
                    onClick={() => handlePlansAnswer(ans)}
                    className="p-5 rounded-xl border-2 font-semibold text-center transition-all hover:border-teal-400"
                    style={{ borderColor: '#E5E7EB', color: '#1A2B4A' }}
                  >
                    {ans === 'yes' ? '✓ Yes, I have plans' : '✗ No plans yet'}
                  </button>
                ))}
              </div>
            )}

            {/* Has plans — file upload */}
            {state.hasPlans === 'yes' && (
              <div className="space-y-4">
                <button
                  onClick={() => set({ hasPlans: null })}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Change answer
                </button>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
                  style={{ borderColor: dragOver ? '#2ABFBF' : '#E5E7EB' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.dwg,.zip"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DWG, ZIP — up to 50 MB</p>
                  {state.uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {state.uploadedFiles.map((f, i) => (
                        <p key={i} className="text-xs text-teal-600 font-medium">{f.name}</p>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => set({ step: 3 })}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1A2B4A' }}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* No plans — Design Services gate */}
            {state.hasPlans === 'no' && (
              <div className="space-y-4">
                <button
                  onClick={() => set({ hasPlans: null })}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Change answer
                </button>
                <div
                  className="rounded-xl border border-orange-200 p-4 text-sm"
                  style={{ backgroundColor: 'rgba(232,121,58,0.06)' }}
                >
                  <p className="font-semibold mb-1" style={{ color: '#C05621' }}>
                    Most projects require architect-stamped plans to get a permit.
                  </p>
                  <p className="text-gray-600 text-xs leading-relaxed mb-3">
                    Without permit-ready drawings, your permit application will be rejected. Our Design
                    Services team produces stamped, permit-ready plans starting at $1,200.
                  </p>
                  <a
                    href="/design-services"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#E8793A' }}
                  >
                    Get Design Services First →
                  </a>
                </div>
                <p className="text-xs text-gray-400 text-center">Or continue to learn more about permits for your jurisdiction:</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                      Describe your project
                    </label>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
                      rows={3}
                      placeholder="e.g. Adding a 400 sq ft primary suite above the existing garage..."
                      value={state.projectDescription}
                      onChange={(e) => set({ projectDescription: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                      Square footage estimate
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="e.g. 400 sq ft"
                      value={state.squareFootage}
                      onChange={(e) => set({ squareFootage: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                      Project address
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="123 Main St, City, State"
                      value={state.address}
                      onChange={(e) => set({ address: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  onClick={() => set({ step: 3 })}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1A2B4A' }}
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3 ─────────────────────────────────────────────────────── */}
        {state.step === 3 && (
          <div>
            <button
              onClick={() => set({ step: 2 })}
              className="flex items-center gap-1 text-sm mb-4 transition-opacity hover:opacity-70"
              style={{ color: '#2ABFBF' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#1A2B4A' }}>
              Your contact info
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              We'll use this to send your permit package and updates
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                  Your name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="First and last name"
                  value={state.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                  Email address
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="you@example.com"
                  value={state.email}
                  onChange={(e) => set({ email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                  Project address
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="123 Main St, City, State"
                  value={state.contactAddress}
                  onChange={(e) => set({ contactAddress: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !state.name || !state.email}
              className="w-full py-4 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#E8793A' }}
            >
              {submitting ? 'Saving…' : 'See Packages & Pricing →'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              No spam. No sales calls. Cancel anytime.
            </p>
          </div>
        )}

        {/* ── Step 4: Package selection ─────────────────────────────────── */}
        {state.step === 4 && (
          <div>
            <button
              onClick={() => set({ step: 3 })}
              className="flex items-center gap-1 text-sm mb-4 transition-opacity hover:opacity-70"
              style={{ color: '#2ABFBF' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#1A2B4A' }}>
              Choose your permit package
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              All packages include a 100% money-back guarantee if we can't help
            </p>
            <div className="space-y-3">
              {PERMIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.tier}
                  className="rounded-xl border-2 p-4 transition-all"
                  style={{
                    borderColor: pkg.highlight ? '#2ABFBF' : '#E5E7EB',
                    backgroundColor: pkg.highlight ? '#F0FAFA' : '#fff',
                  }}
                >
                  {pkg.highlight && (
                    <div
                      className="inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2"
                      style={{ backgroundColor: '#2ABFBF', color: '#fff' }}
                    >
                      Most Popular
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-base" style={{ color: '#1A2B4A' }}>{pkg.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg" style={{ color: '#1A2B4A' }}>{pkg.price}</p>
                      <p className="text-xs text-gray-400">one-time</p>
                    </div>
                  </div>
                  <ul className="space-y-1 mb-3">
                    {pkg.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#2ABFBF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleCheckout(pkg.tier)}
                    disabled={checkingOut !== null}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: pkg.highlight ? '#2ABFBF' : '#1A2B4A',
                      color: '#fff',
                    }}
                  >
                    {checkingOut === pkg.tier ? 'Redirecting to checkout…' : `Get ${pkg.name} →`}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Secure payment via Stripe. You'll be redirected to complete your order.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
