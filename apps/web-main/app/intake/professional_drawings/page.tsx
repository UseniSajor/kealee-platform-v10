'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, AlertCircle, ArrowRight, CheckCircle2, Clock, Shield,
  Package, ImagePlus, X, FileVideo, PenTool,
} from 'lucide-react'
import {
  getDrawingsConfig,
  formatDrawingsPrice,
  type DrawingsServiceConfig,
} from '@/lib/professional-drawings-config'
import { PROFESSIONAL_DRAWINGS_SCOPE_PLACEHOLDER } from '@kealee/shared'

const INCLUDES = [
  'Licensed architect / PE assigned to your project',
  'AI concept review and integration',
  'Permit-ready drawing set (floor plan, elevations, site plan)',
  'PE stamp where required by jurisdiction',
  'Jurisdiction cover sheet and code compliance notes',
  'Building department coordination',
  'Portal support through permit submission',
]

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
                  ? 'bg-purple-700 text-white'
                  : steps.indexOf(step) > i
                  ? 'bg-purple-200 text-purple-700'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {steps.indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded-full ${steps.indexOf(step) > i ? 'bg-purple-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className={`text-xs font-semibold ${step === 'details' ? 'text-purple-700' : 'text-slate-400'}`}>Your Details</span>
          <span className={`text-xs font-semibold ${step === 'review' ? 'text-purple-700' : 'text-slate-400'}`}>Review & Pay</span>
        </div>
      </div>
    </div>
  )
}

function OrderSummary({ priceInfo }: { priceInfo: DrawingsServiceConfig }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-700 mb-1">Your Package</p>
            <h3 className="text-base font-bold text-slate-900">{priceInfo.label}</h3>
          </div>
          <span className="text-xl font-black text-slate-900">{formatDrawingsPrice(priceInfo.amount)}</span>
        </div>
        {priceInfo.note && (
          <p className="text-xs text-slate-500 mb-3 italic">{priceInfo.note}</p>
        )}
        <div className="flex flex-col gap-2 mb-4">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4 text-purple-500" /> Delivered in {priceInfo.delivery}
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <Shield className="h-4 w-4 text-green-500" /> Secure checkout via Stripe
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-blue-500" /> Licensed architect assigned
          </span>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">What&apos;s Included</p>
          </div>
          <ul className="space-y-1.5">
            {INCLUDES.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100">
          <Link href="/gallery" className="text-xs text-purple-700 hover:text-purple-800 font-semibold">
            Browse all packages →
          </Link>
        </div>
      </div>

      <div className="rounded-xl bg-purple-900 p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <PenTool className="h-4 w-4 text-purple-300" />
          <span className="text-xs font-bold uppercase tracking-widest text-purple-300">Why This Matters</span>
        </div>
        <p className="text-sm text-purple-200 leading-relaxed">
          Most DC, MD, and VA jurisdictions reject permit applications that lack stamped architectural drawings.
          Your AI concept identified this requirement — this service delivers the drawings you need to proceed.
        </p>
      </div>
    </div>
  )
}

function ProfessionalDrawingsForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const conceptId = searchParams.get('conceptId') ?? ''
  const serviceSlug = searchParams.get('service') ?? ''
  const priceInfo = getDrawingsConfig(serviceSlug || null)

  const [step, setStep] = useState<'details' | 'review'>('details')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [conceptLoading, setConceptLoading] = useState(!!conceptId)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    hasExistingDrawings: '' as '' | 'yes' | 'no',
    timeline: 'flexible',
  })

  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; type: 'image' | 'video' }[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-populate from concept if conceptId is provided
  useEffect(() => {
    if (!conceptId) return
    let cancelled = false

    fetch(`/api/intake/concept-prefill?conceptId=${encodeURIComponent(conceptId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data) {
          setFormData(prev => ({
            ...prev,
            address: data.projectAddress ?? prev.address,
            description: data.description ?? prev.description,
          }))
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setConceptLoading(false) })

    return () => { cancelled = true }
  }, [conceptId])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    if (uploadedFiles.length + selected.length > 5) {
      setFormError('You can upload a maximum of 5 files.')
      return
    }
    setUploading(true)
    try {
      const body = new FormData()
      selected.forEach(f => body.append('files', f))
      const res = await fetch('/api/intake/upload', { method: 'POST', body })
      if (!res.ok) return
      const { urls } = await res.json()
      const newFiles = selected.map((f, i) => ({
        name: f.name,
        url: urls[i] ?? '',
        type: f.type.startsWith('video/') ? 'video' as const : 'image' as const,
      })).filter(f => f.url)
      setUploadedFiles(prev => [...prev, ...newFiles])
    } catch {
      // non-blocking
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function softCapture() {
    if (!formData.email) return
    fetch('/api/intake/soft-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:   formData.email,
        name:    `${formData.firstName} ${formData.lastName}`.trim(),
        service: 'professional_drawings',
        source:  'intake',
      }),
    }).catch(() => {})
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!formData.firstName.trim()) { setFormError('First name is required.'); return }
    if (!formData.email.trim()) { setFormError('Email is required.'); return }
    if (!formData.address.trim()) { setFormError('Project address is required.'); return }
    softCapture()
    setStep('review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handlePayment() {
    setSubmitting(true)
    setFormError('')
    try {
      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: 'professional_drawings',
          clientName: `${formData.firstName} ${formData.lastName}`.trim(),
          contactEmail: formData.email,
          contactPhone: formData.phone || null,
          projectAddress: formData.address,
          formData: {
            description: formData.description,
            hasExistingDrawings: formData.hasExistingDrawings,
            timeline: formData.timeline,
            uploadedFiles: uploadedFiles.map(f => f.url),
            sourceConceptId: conceptId || null,
          },
        }),
      })

      if (!intakeRes.ok) {
        const body = await intakeRes.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || 'Failed to save your intake. Please try again.')
      }
      const { intakeId } = await intakeRes.json() as { intakeId: string }

      const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath: 'professional_drawings',
          amount: priceInfo.amount,
          successUrl: `${appUrl}/intake/professional_drawings/success?session_id={CHECKOUT_SESSION_ID}&intakeId=${intakeId}`,
          cancelUrl: `${appUrl}/intake/professional_drawings?canceled=true${conceptId ? `&conceptId=${conceptId}` : ''}${serviceSlug ? `&service=${serviceSlug}` : ''}`,
        }),
      })

      if (!checkoutRes.ok) {
        const body = await checkoutRes.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || 'Could not create checkout session. Please try again.')
      }
      const { url } = await checkoutRes.json() as { url?: string }
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned from payment processor.')
      }
    } catch {
      const params = new URLSearchParams({
        source:  'professional_drawings',
        service: 'professional_drawings',
        email:   formData.email,
        name:    `${formData.firstName} ${formData.lastName}`.trim(),
        status:  'payment_failed',
      })
      router.push(`/got-you?${params.toString()}`)
    }
  }

  if (conceptLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-purple-700" />
          <p className="text-sm text-slate-500">Loading your concept details…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StepBar step={step} />

      <div className="mx-auto max-w-5xl px-4 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Left: Form ── */}
          <div className="lg:col-span-3">

            {step === 'details' && (
              <form onSubmit={handleDetailsSubmit} className="space-y-5" noValidate>

                {/* Mobile package context */}
                <div className="lg:hidden rounded-xl bg-purple-50 border border-purple-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-0.5">Ordering</p>
                    <p className="text-sm font-bold text-slate-900">{priceInfo.label}</p>
                    <p className="text-xs text-slate-500">Delivered in {priceInfo.delivery}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">{formatDrawingsPrice(priceInfo.amount)}</p>
                    <Link href="/gallery" className="text-xs text-purple-700 font-semibold">change</Link>
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">Get Permit-Ready Drawings</h1>
                  <p className="text-slate-500 mt-1 text-sm">
                    A licensed architect will be assigned to your project within 1 business day.
                    {conceptId && (
                      <span className="ml-1 font-medium text-purple-700">Concept #{conceptId.slice(0, 8)} linked.</span>
                    )}
                  </p>
                </div>

                {formError && (
                  <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-sm">{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={e => setFormData(d => ({ ...d, firstName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    placeholder="123 Main St, Bethesda, MD 20814"
                    autoComplete="street-address"
                  />
                </div>

                {/* Existing drawings toggle */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Do you have existing drawings?
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Even partial or informal drawings help the architect understand your project faster.
                  </p>
                  <div className="flex gap-3">
                    {(['yes', 'no'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData(d => ({ ...d, hasExistingDrawings: val }))}
                        className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                          formData.hasExistingDrawings === val
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-purple-400'
                        }`}
                      >
                        {val === 'yes' ? 'Yes, I have drawings' : 'No, starting fresh'}
                      </button>
                    ))}
                  </div>
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                    placeholder={PROFESSIONAL_DRAWINGS_SCOPE_PLACEHOLDER}
                  />
                </div>

                {/* Photo upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-800">
                      Photos, Plans, or References <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    {uploadedFiles.length > 0 && (
                      <span className="text-xs text-slate-400">{uploadedFiles.length}/5 uploaded</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Upload photos of your space, existing plans, or reference images. Accepted: JPG, PNG, WEBP, HEIC, PDF, MP4, MOV (max 50 MB each).
                  </p>

                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                          {f.type === 'video'
                            ? <FileVideo className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            : <ImagePlus className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          }
                          <span className="max-w-[120px] truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}
                            className="ml-0.5 text-slate-400 hover:text-red-500 transition"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,application/pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                    id="drawings-file-upload"
                  />
                  {uploadedFiles.length < 5 && (
                    <label
                      htmlFor="drawings-file-upload"
                      className={`flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-4 py-4 text-sm font-medium transition cursor-pointer ${
                        uploading
                          ? 'border-purple-300 bg-purple-50 text-purple-500'
                          : 'border-slate-300 bg-white text-slate-500 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600'
                      }`}
                    >
                      {uploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><ImagePlus className="h-4 w-4" /> Add photos, plans, or references</>
                      )}
                    </label>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Timeline</label>
                  <select
                    value={formData.timeline}
                    onChange={e => setFormData(d => ({ ...d, timeline: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="asap">ASAP (permit filing imminent)</option>
                    <option value="month">Within 1 month</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-700 hover:bg-purple-800 py-4 text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Review & Pay {formatDrawingsPrice(priceInfo.amount)}
                  <ArrowRight className="h-5 w-5" />
                </button>

                <p className="text-center text-xs text-slate-400">
                  🔒 Secure payment powered by Stripe. You won&apos;t be charged until the next step.
                </p>
              </form>
            )}

            {/* ── Review step ── */}
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

                <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100 shadow-sm">
                  {[
                    { label: 'Name', value: `${formData.firstName} ${formData.lastName}`.trim() || '—' },
                    { label: 'Email', value: formData.email },
                    { label: 'Address', value: formData.address },
                    formData.phone ? { label: 'Phone', value: formData.phone } : null,
                    formData.description ? { label: 'Project description', value: formData.description } : null,
                    formData.hasExistingDrawings ? { label: 'Existing drawings', value: formData.hasExistingDrawings === 'yes' ? 'Yes' : 'No' } : null,
                    uploadedFiles.length > 0 ? { label: 'Files', value: `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded` } : null,
                    conceptId ? { label: 'Linked concept', value: `#${conceptId.slice(0, 8)}` } : null,
                  ].filter(Boolean).map(row => (
                    <div key={row!.label} className="flex items-start gap-4 px-5 py-3">
                      <span className="text-xs font-semibold text-slate-400 w-32 shrink-0 pt-0.5">{row!.label}</span>
                      <span className="text-sm text-slate-800 leading-relaxed">{row!.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-purple-200 bg-purple-50 px-5 py-4 text-sm text-purple-800">
                  <p className="font-semibold mb-1">What happens next</p>
                  <ul className="space-y-1 text-purple-700 text-xs list-disc list-inside">
                    <li>A licensed architect is assigned within 1 business day</li>
                    <li>They review your concept and contact you to confirm scope</li>
                    <li>Permit-ready drawings delivered in 7–14 business days</li>
                    <li>Use drawings to file your permit directly or via Kealee</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePayment}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-700 hover:bg-purple-800 py-4 text-sm font-bold text-white transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {submitting ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
                    ) : (
                      <>Pay {formatDrawingsPrice(priceInfo.amount)} &amp; Get Drawings <ArrowRight className="h-5 w-5" /></>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-sm text-slate-500 hover:text-slate-700 transition text-center"
                  >
                    ← Back to details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order summary ── */}
          <div className="lg:col-span-2 hidden lg:block">
            <OrderSummary priceInfo={priceInfo} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfessionalDrawingsIntakePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
      </div>
    }>
      <ProfessionalDrawingsForm />
    </Suspense>
  )
}
