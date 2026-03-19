'use client'

import { useState, useRef } from 'react'

interface PermitFunnelProps {
  countySlug?: string
}

type ProjectType = 'residential' | 'addition' | 'new-construction' | 'commercial'
type PlansAnswer = 'yes' | 'no'

interface FunnelState {
  step: 1 | 2 | 3
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
}

const PROJECT_TYPES: { id: ProjectType; label: string; sub: string }[] = [
  { id: 'residential', label: 'Residential Project', sub: 'Interior remodel, deck, fence, ADU' },
  { id: 'addition', label: 'Addition or Renovation', sub: 'Structural changes, room additions' },
  { id: 'new-construction', label: 'New Construction', sub: 'Ground-up build on vacant land' },
  { id: 'commercial', label: 'Commercial / Multifamily', sub: 'Mixed-use, multifamily, retail, office' },
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
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
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

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('countySlug', countySlug || '')
      formData.append('projectType', state.projectType || '')
      formData.append('hasPlans', state.hasPlans || '')
      formData.append('projectDescription', state.projectDescription)
      formData.append('squareFootage', state.squareFootage)
      formData.append('address', state.address)
      formData.append('name', state.name)
      formData.append('email', state.email)
      formData.append('contactAddress', state.contactAddress)
      state.uploadedFiles.forEach((f) => formData.append('files', f))

      await fetch('/api/v1/permits/estimate-request', {
        method: 'POST',
        body: formData,
      }).catch(() => {})
    } catch {
      // silent
    } finally {
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-12 px-6">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ backgroundColor: '#2ABFBF20' }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: '#2ABFBF' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>
          Your estimate is being prepared
        </h3>
        <p className="text-gray-600 mb-1">
          You'll receive a concept + pricing within 48 hours
        </p>
        {state.email && (
          <p className="text-gray-500 text-sm">
            Check your email at <span className="font-medium">{state.email}</span>
          </p>
        )}
      </div>
    )
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  const stepLabels = ['Project Type', 'Plans', 'Contact']

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Progress */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          {stepLabels.map((label, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3
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
                    className="flex-1 h-0.5 transition-colors"
                    style={{ backgroundColor: done ? '#2ABFBF' : '#E5E7EB' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* ── Step 1 ─────────────────────────────────────────────────────── */}
        {state.step === 1 && (
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#1A2B4A' }}>
              What are you trying to build?
            </h3>
            <p className="text-gray-500 text-sm mb-5">Select your project type to get started</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROJECT_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => handleProjectTypeSelect(pt.id)}
                  className="text-left p-4 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: state.projectType === pt.id ? '#2ABFBF' : '#E5E7EB',
                    backgroundColor: state.projectType === pt.id ? '#F0FAFA' : '#FAFAFA',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2ABFBF'
                  }}
                  onMouseLeave={(e) => {
                    if (state.projectType !== pt.id) {
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'
                    }
                  }}
                >
                  <span className="font-semibold block text-sm" style={{ color: '#1A2B4A' }}>
                    {pt.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">{pt.sub}</span>
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
              Do you already have plans?
            </h3>
            <p className="text-gray-500 text-sm mb-5">This helps us prepare the right strategy</p>

            {/* Plans answer selector */}
            {!state.hasPlans && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => handlePlansAnswer('yes')}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2ABFBF'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'
                  }}
                >
                  <span className="font-semibold block text-sm" style={{ color: '#1A2B4A' }}>
                    Yes, I have plans
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    Upload your drawings for review
                  </span>
                </button>
                <button
                  onClick={() => handlePlansAnswer('no')}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2ABFBF'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'
                  }}
                >
                  <span className="font-semibold block text-sm" style={{ color: '#1A2B4A' }}>
                    No, I need help
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    We'll generate a free concept for you
                  </span>
                </button>
              </div>
            )}

            {/* Has plans — upload */}
            {state.hasPlans === 'yes' && (
              <div className="space-y-4">
                <button
                  onClick={() => set({ hasPlans: null })}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-2"
                >
                  Change answer
                </button>
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
                  style={{
                    borderColor: dragOver ? '#2ABFBF' : '#D1D5DB',
                    backgroundColor: dragOver ? '#F0FAFA' : '#FAFAFA',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  <svg
                    className="w-10 h-10 mx-auto mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-600 mb-1">
                    Drag and drop your files here, or{' '}
                    <button
                      className="font-medium underline transition-opacity hover:opacity-70"
                      style={{ color: '#2ABFBF' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-gray-400">Accepts .pdf, .dwg, .zip</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.dwg,.zip"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
                {state.uploadedFiles.length > 0 && (
                  <ul className="space-y-1.5">
                    {state.uploadedFiles.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: '#2ABFBF' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-gray-700">{f.name}</span>
                        <button
                          className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-xs"
                          onClick={() =>
                            set({ uploadedFiles: state.uploadedFiles.filter((_, j) => j !== i) })
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => set({ step: 3 })}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1A2B4A' }}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* No plans — 3 questions */}
            {state.hasPlans === 'no' && (
              <div className="space-y-4">
                <button
                  onClick={() => set({ hasPlans: null })}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Change answer
                </button>
                <div
                  className="rounded-xl p-4 text-sm"
                  style={{ backgroundColor: '#F0FAFA', color: '#1A2B4A' }}
                >
                  We'll generate a free concept from 3 quick questions
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                      Describe your project
                    </label>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
                      rows={3}
                      placeholder="e.g. Adding a 400 sq ft primary suite above the existing garage, with new staircase access from the hallway..."
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
              Where should we send your estimate?
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              You'll receive a concept + pricing breakdown within 48 hours
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
              disabled={submitting}
              className="w-full py-4 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#E8793A' }}
            >
              {submitting ? 'Submitting…' : 'Get My Free 48-Hour Estimate →'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              No spam. No sales calls. Just your estimate.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
