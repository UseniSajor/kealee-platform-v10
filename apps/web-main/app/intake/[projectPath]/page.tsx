'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, ArrowRight, CheckCircle2, Clock, Shield, Zap, Package, ImagePlus, X, FileVideo, FileText } from 'lucide-react'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { uploadIntakeFilesSequentially, type IntakeUploadedFile } from '@/lib/intake-file-upload'
import { getIntakeCheckoutProjectDescriptionPlaceholder } from '@kealee/shared'
import { INTAKE_PRICE_CENTS, getBuildPathBundle } from '@kealee/core-rules'
import { trackEvent } from '@/lib/analytics'
import { utmForApiBody } from '@/lib/marketing/client-utm'

const AGENT_MAP: Record<string, string> = {
  exterior_concept: 'design', garden_concept: 'design', whole_home_concept: 'design',
  interior_reno_concept: 'design', developer_concept: 'land', kitchen_remodel: 'design',
  bathroom_remodel: 'design', whole_home_remodel: 'design', addition_expansion: 'design',
  permit_path_only: 'permit', cost_estimate: 'design', certified_estimate: 'design', contractor_match: 'contractor',
  design_estimate_permit_bundle: 'design', estimate_permit_bundle: 'design', professional_drawings: 'permit',
  multi_unit_residential: 'land', mixed_use: 'land', commercial_office: 'land',
  development_feasibility: 'land', design_build: 'design', capture_site_concept: 'design',
  townhome_subdivision: 'land', single_family_subdivision: 'land', single_lot_development: 'land',
  interior_renovation: 'design',
}

// Display shape matches what the rest of this file expects. Sourced from
// `INTAKE_PRICE_CENTS` in @kealee/core-rules — single source of truth.
// The server (api/intake/checkout) ignores any client-supplied amount and
// re-reads the same map, so even tampering with this object does nothing.
const PRICE_MAP: Record<string, { label: string; amount: number; delivery: string }> =
  Object.fromEntries(
    Object.entries(INTAKE_PRICE_CENTS).map(([key, entry]) => [
      key,
      { label: entry.label, amount: entry.cents, delivery: entry.deliveryDays },
    ]),
  )

interface AgentInsight {
  summary?: string
  confidence?: number
  risks?: string[]
  recommendation?: string
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function BundleUpsellBanner({
  bundle,
  sourcePath,
}: {
  bundle: NonNullable<ReturnType<typeof getBuildPathBundle>>
  sourcePath: string
}) {
  const sourceLabel = sourcePath.replace(/_/g, ' ')
  return (
    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-white p-5 mb-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100">
          <Package className="h-5 w-5 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-1">
            Package deal from your {sourceLabel}
          </p>
          <h2 className="text-lg font-bold text-slate-900 mb-1">{bundle.label}</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">{bundle.description}</p>
          <ul className="space-y-1 mb-3">
            {bundle.includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-black text-orange-700">{bundle.priceLabel}</span>
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(bundle.retailCents)}
            </span>
            <span className="text-xs font-semibold text-green-700">{bundle.savingsLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function deliverableForPath(projectPath: string) {
  return projectPath in SERVICE_DELIVERABLES
    ? SERVICE_DELIVERABLES[projectPath as keyof typeof SERVICE_DELIVERABLES]
    : undefined
}

/** At least one still image of the project area (videos alone do not satisfy). */
function intakeRequiresAreaPhoto(projectPath: string): boolean {
  if (projectPath === 'certified_estimate') return true
  const d = deliverableForPath(projectPath)
  if (d?.generatesConcept) return true
  if (d?.category === 'estimate' || d?.category === 'permit') return true
  return false
}

/**
 * Paths where a rough floor plan sketch meaningfully improves concept output.
 * Not required — but Q9 copy is upgraded to strongly prompt for it.
 */
function intakeBenefitsFromFloorplanSketch(projectPath: string): boolean {
  return [
    'whole_home_remodel',
    'whole_home_concept',
    'addition_expansion',
    'interior_renovation',
    'interior_reno_concept',
  ].includes(projectPath)
}

/** PDF (or other document upload) required for estimate / permit style intakes. */
function intakeRequiresConstructionDocuments(projectPath: string): boolean {
  if (projectPath === 'certified_estimate' || projectPath === 'cost_estimate' || projectPath === 'permit_path_only') return true
  if (projectPath === 'design_estimate_permit_bundle') return true
  const d = deliverableForPath(projectPath)
  if (d?.category === 'estimate' || d?.category === 'permit') return true
  return false
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
  includes,
  agentInsight,
  insightLoading,
}: {
  priceInfo: { label: string; amount: number; delivery: string }
  includes: string[]
  agentInsight: AgentInsight | null
  insightLoading: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Package card */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-1">Your Package</p>
            <h3 className="text-base font-bold text-slate-900">{priceInfo.label}</h3>
          </div>
          <span className="text-xl font-black text-slate-900">{formatPrice(priceInfo.amount)}</span>
        </div>
        <div className="flex flex-col gap-2 mb-4">
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

        {/* What's included */}
        {includes.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">What's Included</p>
            </div>
            <ul className="space-y-1.5">
              {includes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100">
          <Link href="/gallery" className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
            Browse all packages →
          </Link>
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
  const searchParams = useSearchParams()
  const projectPath = Array.isArray(params.projectPath) ? params.projectPath[0] : params.projectPath as string

  // Pascal Design Studio handoff — sceneId forwarded from /editor/[sceneId]
  const sceneId = searchParams.get('sceneId') ?? ''
  const sqftFromUrl = searchParams.get('sqft') ?? ''
  const upsellFromIntake = searchParams.get('fromIntake') ?? ''
  const upsellSourcePath = searchParams.get('sourcePath') ?? ''

  const [step, setStep] = useState<'details' | 'review'>('details')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // AI insight loads in background — does NOT block the form
  const [agentInsight, setAgentInsight] = useState<AgentInsight | null>(null)
  const [insightLoading, setInsightLoading] = useState(true)

  // Blocker checks for contractor matching
  const projectId = searchParams.get('projectId') ?? ''
  const [showBlocker, setShowBlocker] = useState(false)
  const [checkingProject, setCheckingProject] = useState(true)
  const [projectData, setProjectData] = useState<any>(null)

  useEffect(() => {
    if (projectPath !== 'contractor_match') {
      setCheckingProject(false)
      return
    }

    if (!projectId) {
      setShowBlocker(true)
      setCheckingProject(false)
      return
    }

    let active = true
    setCheckingProject(true)

    fetch(`/api/intake?intakeId=${projectId}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(data => {
        if (active) {
          setProjectData(data)
          if (!data.contractorMatchingUnlocked) {
            setShowBlocker(true)
          } else {
            setShowBlocker(false)
          }
        }
      })
      .catch(() => {
        if (active) {
          setShowBlocker(true)
        }
      })
      .finally(() => {
        if (active) {
          setCheckingProject(false)
        }
      })

    return () => {
      active = false
    }
  }, [projectPath, projectId])

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    propertyDetails: '',
    stylePreferences: '',
    priorities: [] as string[],
    mustStay: '',
    problemsToSolve: '',
    budgetComfort: '',
    squareFootage: sqftFromUrl,
    timeline: 'flexible',
  })

  // Pre-fill squareFootage from Pascal estimate context stored in sessionStorage
  useEffect(() => {
    if (sqftFromUrl || !sceneId) return
    try {
      const ctx = sessionStorage.getItem('pascal_estimate_context')
      if (ctx) {
        const parsed = JSON.parse(ctx)
        if (parsed?.totalSqFt) {
          setFormData(prev => ({ ...prev, squareFootage: String(Math.round(parsed.totalSqFt)) }))
        }
      }
    } catch { /* ignore */ }
  }, [sceneId, sqftFromUrl])

  // File upload state — Q8: project photos / videos
  const [uploadedFiles, setUploadedFiles] = useState<IntakeUploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Q9: construction documents (PDF / DWG / DOCX)
  const [uploadedDocs, setUploadedDocs] = useState<IntakeUploadedFile[]>([])
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const docInputRef = useRef<HTMLInputElement>(null)

  // Session storage persistence
  const [isPersistedDataLoaded, setIsPersistedDataLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`intake_form_${projectPath}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.formData) {
          setFormData(prev => ({ ...prev, ...parsed.formData }))
        }
        if (parsed.uploadedFiles) {
          setUploadedFiles(parsed.uploadedFiles)
        }
        if (parsed.uploadedDocs) {
          setUploadedDocs(parsed.uploadedDocs)
        }
        if (parsed.step) {
          setStep(parsed.step)
        }
      }
    } catch (e) {
      console.error('Failed to load persisted intake form:', e)
    } finally {
      setIsPersistedDataLoaded(true)
    }
  }, [projectPath])

  useEffect(() => {
    if (!isPersistedDataLoaded) return
    try {
      sessionStorage.setItem(
        `intake_form_${projectPath}`,
        JSON.stringify({ formData, uploadedFiles, uploadedDocs, step })
      )
    } catch (e) {
      console.error('Failed to persist intake form:', e)
    }
  }, [formData, uploadedFiles, uploadedDocs, step, projectPath, isPersistedDataLoaded])

  const needsAreaPhoto = intakeRequiresAreaPhoto(projectPath)
  const needsConstructionDocs = intakeRequiresConstructionDocuments(projectPath)
  const benefitsFromFloorplan = intakeBenefitsFromFloorplanSketch(projectPath)

  const agentType = AGENT_MAP[projectPath] || 'design'
  const bundlePreview = upsellSourcePath
    ? getBuildPathBundle({ sourceProjectPath: upsellSourcePath, fromIntakeId: upsellFromIntake || undefined })
    : null
  const priceInfo = bundlePreview && (projectPath === bundlePreview.productKey)
    ? { label: bundlePreview.label, amount: bundlePreview.bundleCents, delivery: bundlePreview.deliveryDays }
    : (PRICE_MAP[projectPath] || { label: 'Project Package', amount: 39500, delivery: '3–5 days' })
  const deliverable = SERVICE_DELIVERABLES[projectPath]
  const includes = deliverable?.includes ?? []

  useEffect(() => {
    if (!upsellFromIntake || !upsellSourcePath || !bundlePreview) return
    if (projectPath !== bundlePreview.productKey) return
    fetch('/api/marketing/bundle-interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intakeId: upsellFromIntake,
        bundleProjectPath: projectPath,
        sourcePath: upsellSourcePath,
      }),
    }).catch(() => {})
  }, [upsellFromIntake, upsellSourcePath, projectPath, bundlePreview])

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

  // ── Contractor Match Blocker Guard ─────────────────────────────────────────
  if (projectPath === 'contractor_match' && checkingProject) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-600 mb-4" />
        <p className="text-sm text-slate-500 font-semibold">Verifying design and permit status...</p>
      </div>
    )
  }

  if (projectPath === 'contractor_match' && showBlocker) {
    const hasDesign = projectData?.hasDesign ?? false
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Lock/Workflow Icon */}
            <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-200">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full mb-3">
              Lifecycle Coordination Gate
            </span>
            
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4 animate-fade-in">
              Bidding Requires Plans & Permits
            </h1>
            
            <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-lg text-slate-600">
              To guarantee construction quality and eliminate cost uncertainty, Kealee operates as a unified workflow that coordinates design, estimating, permit filing, and build execution. 
              Licensed contractors cannot submit accurate, binding bids without completed architectural drawings and municipal permit filings. By coordinating these phases in order, we protect your project from zoning violations and expensive change orders.
            </p>
            
            {/* Next Steps cards */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
              <div className={`p-5 rounded-2xl border transition-all duration-300 ${!hasDesign ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white'}`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phase 1: Design & Estimate</span>
                <h3 className="font-bold text-slate-900 mt-1">Design Concepts</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Visualize your layout, capture site dimensions, and get a trade-by-trade cost estimate.
                </p>
                {!hasDesign && (
                  <Link 
                    href="/intake/whole_home_concept" 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 mt-4"
                  >
                    Start Design Concept <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {hasDesign && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 mt-4">
                    ✓ Completed
                  </span>
                )}
              </div>
              
              <div className={`p-5 rounded-2xl border transition-all duration-300 ${hasDesign ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white'}`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phase 2: Permitting</span>
                <h3 className="font-bold text-slate-900 mt-1">Permit Preparation</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Convert drawings to permit plans and file with local building agencies before bidding.
                </p>
                {hasDesign ? (
                  <Link 
                    href={`/intake/permit_path_only?projectId=${projectId}`} 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 mt-4"
                  >
                    File Permit Package <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 mt-4">
                    Requires Design
                  </span>
                )}
              </div>
            </div>
            
            {/* Primary Action Button */}
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              {!hasDesign ? (
                <Link
                  href="/intake/whole_home_concept"
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-8 text-sm transition-all hover:shadow-md text-center"
                >
                  Start Your Design Concept
                </Link>
              ) : (
                <Link
                  href={`/intake/permit_path_only?projectId=${projectId}`}
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-8 text-sm transition-all hover:shadow-md text-center"
                >
                  File Your Permit Package
                </Link>
              )}
              <Link
                href="/gallery"
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-8 text-sm transition-all text-center"
              >
                Browse All Services
              </Link>
            </div>
            
            <p className="text-xs text-slate-400 mt-6">
              Already have stamped drawings and approved permits? Contact us at <a href="mailto:hello@kealee.com" className="text-orange-600 hover:underline font-semibold">hello@kealee.com</a> to verify and unlock matching.
            </p>
          </div>
        </div>
      </div>
    )
  }

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

  // ── Q8: Photo / video upload handler ──────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    if (uploadedFiles.length + selected.length > 10) {
      setFormError('You can upload a maximum of 10 photos / videos.')
      return
    }
    // 10 MB per image limit
    const oversized = selected.filter(f => f.size > 10 * 1024 * 1024)
    if (oversized.length > 0) {
      setFormError(`File too large: "${oversized[0].name}". Photos must be under 10 MB each.`)
      return
    }
    setFormError('')
    setUploading(true)
    try {
      const newFiles = await uploadIntakeFilesSequentially(selected)
      if (newFiles.length === 0) {
        setFormError('Upload failed. Check file type (JPG or PNG) and size (max 10 MB each), then try again.')
        return
      }
      if (newFiles.length < selected.length) {
        setFormError('Some files could not be uploaded. Others were saved.')
      }
      setUploadedFiles(prev => [...prev, ...newFiles])
    } catch {
      setFormError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Q9: Construction document upload handler ───────────────────────────────
  async function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    if (uploadedDocs.length + selected.length > 5) {
      setFormError('You can upload a maximum of 5 construction documents.')
      return
    }
    // 25 MB per document limit
    const oversized = selected.filter(f => f.size > 25 * 1024 * 1024)
    if (oversized.length > 0) {
      setFormError(`File too large: "${oversized[0].name}". Documents must be under 25 MB each.`)
      return
    }
    setFormError('')
    setUploadingDocs(true)
    try {
      const newFiles = await uploadIntakeFilesSequentially(selected)
      if (newFiles.length === 0) {
        setFormError('Upload failed. Check file type (PDF, DWG, or DOCX) and size (max 25 MB each), then try again.')
        return
      }
      if (newFiles.length < selected.length) {
        setFormError('Some documents could not be uploaded. Others were saved.')
      }
      setUploadedDocs(prev => [...prev, ...newFiles])
    } catch {
      setFormError('Document upload failed. Please try again.')
    } finally {
      setUploadingDocs(false)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  // Fire-and-forget soft capture — never blocks user flow
  function softCapture() {
    if (!formData.email) return
    fetch('/api/intake/soft-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:   formData.email,
        name:    `${formData.firstName} ${formData.lastName}`.trim(),
        service: projectPath,
        source:  'intake',
      }),
    }).catch(() => {})
  }

  // ── Step: details ──────────────────────────────────────────────────────────
  function validateUploadRequirements(): boolean {
    if (needsAreaPhoto) {
      const hasStillImage = uploadedFiles.some(f => f.type === 'image')
      if (!hasStillImage) {
        setFormError('Please upload at least one photo of the project area (JPG or PNG).')
        return false
      }
    }
    if (needsConstructionDocs) {
      // Check Q9 doc section first; fall back to checking Q8 for backwards compat
      const hasDoc =
        uploadedDocs.some(f => f.type === 'document') ||
        uploadedFiles.some(f => f.type === 'document')
      if (!hasDoc) {
        setFormError('Please upload at least one construction document (PDF, DWG, or DOCX) in the Documents section.')
        return false
      }
    }
    return true
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!formData.firstName.trim()) { setFormError('First name is required.'); return }
    if (!formData.email.trim()) { setFormError('Email is required.'); return }
    if (!formData.address.trim()) { setFormError('Project address is required.'); return }
    if (!validateUploadRequirements()) return
    softCapture() // capture lead before payment step
    setStep('review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Step: payment ──────────────────────────────────────────────────────────
  async function handlePayment() {
    setSubmitting(true)
    setFormError('')
    if (!validateUploadRequirements()) {
      setSubmitting(false)
      return
    }
    try {
      // 1. Create intake record
      const attribution = utmForApiBody()
      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          clientName: `${formData.firstName} ${formData.lastName}`.trim(),
          contactEmail: formData.email,
          contactPhone: formData.phone || null,
          projectAddress: formData.address,
          attribution,
          formData: {
            description: formData.description,
            propertyDetails: formData.propertyDetails,
            stylePreferences: formData.stylePreferences,
            priorities: formData.priorities,
            mustStay: formData.mustStay,
            problemsToSolve: formData.problemsToSolve,
            budgetComfort: formData.budgetComfort,
            squareFootage: formData.squareFootage,
            timeline: formData.timeline,
            uploadedFiles: [...uploadedFiles, ...uploadedDocs].map(f => f.url),
            ...attribution,
            ...(sceneId ? { sceneId } : {}),
            ...(upsellFromIntake ? { upsellSourceIntakeId: upsellFromIntake, upsellSourcePath: upsellSourcePath } : {}),
          },
        }),
      })

      if (!intakeRes.ok) {
        const body = await intakeRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save your intake. Please try again.')
      }
      const { intakeId } = await intakeRes.json()

      trackEvent('lead_submitted', {
        project_path: projectPath,
        intake_id: intakeId,
        ...attribution,
      })

      // 2. Create Stripe checkout session
      const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath,
          amount: priceInfo.amount,
          sourcePath: upsellSourcePath || undefined,
          upsellSourceIntakeId: upsellFromIntake || undefined,
          successUrl: `${appUrl}/intake/${projectPath}/success?session_id={CHECKOUT_SESSION_ID}&intakeId=${intakeId}`,
          cancelUrl: `${appUrl}/intake/${projectPath}?canceled=true`,
        }),
      })

      if (!checkoutRes.ok) {
        const body = await checkoutRes.json().catch(() => ({}))
        throw new Error(body.error || 'Could not create checkout session. Please try again.')
      }
      const { url } = await checkoutRes.json()

      trackEvent('checkout_started', {
        project_path: projectPath,
        intake_id: intakeId,
        value: priceInfo.amount / 100,
      })

      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned from payment processor.')
      }
    } catch {
      // Non-recoverable — redirect to soft landing so no one hits a dead end
      const params = new URLSearchParams({
        source:  projectPath,
        service: projectPath,
        email:   formData.email,
        name:    `${formData.firstName} ${formData.lastName}`.trim(),
        status:  'payment_failed',
      })
      router.push(`/got-you?${params.toString()}`)
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
                {bundlePreview && projectPath === bundlePreview.productKey && (
                  <BundleUpsellBanner bundle={bundlePreview} sourcePath={upsellSourcePath} />
                )}
                {/* Package context — visible on mobile (sidebar is hidden) */}
                <div className="lg:hidden rounded-xl bg-orange-50 border border-orange-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-0.5">Ordering</p>
                    <p className="text-sm font-bold text-slate-900">{priceInfo.label}</p>
                    <p className="text-xs text-slate-500">Delivered in {priceInfo.delivery}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">{formatPrice(priceInfo.amount)}</p>
                    <Link href="/gallery" className="text-xs text-orange-600 font-semibold">change</Link>
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">Tell us what you’re hoping to change</h1>
                  <p className="text-slate-500 mt-1 text-sm">
                    Answer in your own words. Your progress saves on this device, and you can review everything before payment.
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
                    What are you hoping to change?
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                    placeholder={getIntakeCheckoutProjectDescriptionPlaceholder(projectPath)}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">Why we ask: this becomes the plain-language project brief used across your concept, estimate, and permit roadmap.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Tell us about the property</label>
                  <textarea value={formData.propertyDetails} onChange={e => setFormData(d => ({ ...d, propertyDetails: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" placeholder="For example: 1960s two-story home, occupied during construction, narrow side access…" />
                  <p className="mt-1.5 text-xs text-slate-500">This helps us flag site conditions that may affect layout, cost, or approvals.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Show us styles or examples you like</label>
                  <textarea value={formData.stylePreferences} onChange={e => setFormData(d => ({ ...d, stylePreferences: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" placeholder="Describe colors, materials, rooms, or links that feel right. You can also add inspiration images below." />
                </div>

                <fieldset>
                  <legend className="block text-sm font-semibold text-slate-800 mb-1.5">What matters most?</legend>
                  <p className="text-xs text-slate-500 mb-3">Choose all that apply. We use this to explain tradeoffs in the concept.</p>
                  <div className="flex flex-wrap gap-2">
                    {['Budget', 'Appearance', 'More space', 'Speed', 'Accessibility', 'Resale value'].map(priority => {
                      const selected = formData.priorities.includes(priority)
                      return <button key={priority} type="button" aria-pressed={selected} onClick={() => setFormData(d => ({ ...d, priorities: selected ? d.priorities.filter(p => p !== priority) : [...d.priorities, priority] }))} className={`rounded-full border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 ${selected ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-slate-300 bg-white text-slate-700 hover:border-orange-300'}`}>{priority}</button>
                    })}
                  </div>
                </fieldset>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">What must stay?</label>
                    <textarea value={formData.mustStay} onChange={e => setFormData(d => ({ ...d, mustStay: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" placeholder="Walls, trees, appliances, furniture, features…" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">What problems should this solve?</label>
                    <textarea value={formData.problemsToSolve} onChange={e => setFormData(d => ({ ...d, problemsToSolve: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" placeholder="Poor storage, dark room, difficult access, awkward flow…" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Budget comfort range</label>
                  <select value={formData.budgetComfort} onChange={e => setFormData(d => ({ ...d, budgetComfort: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    <option value="">I’m not sure yet</option><option value="under-25k">Under $25,000</option><option value="25k-50k">$25,000–$50,000</option><option value="50k-100k">$50,000–$100,000</option><option value="100k-250k">$100,000–$250,000</option><option value="250k-plus">$250,000+</option>
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">This is a planning comfort range—not a commitment or a contractor quote.</p>
                </div>

                {/* Q8 — Project Photos */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-800">
                      {needsAreaPhoto ? (
                        <>Project photos <span className="text-red-500">*</span></>
                      ) : (
                        <>Project photos <span className="text-slate-400 font-normal">(optional)</span></>
                      )}
                    </label>
                    {uploadedFiles.length > 0 && (
                      <span className="text-xs text-slate-400">{uploadedFiles.length}/10 uploaded</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    {needsAreaPhoto
                      ? 'Upload at least one clear photo of the project area. Accepted: JPG, PNG (max 10 MB each, up to 10 photos).'
                      : 'For best output, upload a photo of your space or reference images. Accepted: JPG, PNG (max 10 MB each, up to 10 photos).'}
                  </p>

                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                          <ImagePlus className="h-3.5 w-3.5 text-green-500 shrink-0" />
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
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="sr-only"
                    id="intake-file-upload"
                  />
                  {uploadedFiles.length < 10 && (
                    <label
                      htmlFor="intake-file-upload"
                      className={`flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-4 py-4 text-sm font-medium transition cursor-pointer ${
                        uploading
                          ? 'border-orange-300 bg-orange-50 text-orange-500'
                          : 'border-slate-300 bg-white text-slate-500 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {uploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><ImagePlus className="h-4 w-4" /> Add project photos (JPG / PNG)</>
                      )}
                    </label>
                  )}
                </div>

                {/* Q9 — Floor plan sketch / construction documents (path-aware) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-800">
                      {needsConstructionDocs ? (
                        <>Construction documents <span className="text-red-500">*</span></>
                      ) : benefitsFromFloorplan ? (
                        <>
                          Floor plan sketch or existing drawings{' '}
                          <span className="text-amber-600 font-normal">(recommended)</span>
                        </>
                      ) : (
                        <>Documents <span className="text-slate-400 font-normal">(optional)</span></>
                      )}
                    </label>
                    {uploadedDocs.length > 0 && (
                      <span className="text-xs text-slate-400">{uploadedDocs.length}/5 uploaded</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    {needsConstructionDocs
                      ? 'Upload at least one construction document — existing plans, specs, or drawings. Accepted: PDF, DWG, DOCX (max 25 MB each, up to 5 files).'
                      : benefitsFromFloorplan
                        ? 'A rough hand-drawn sketch or photo of your existing floor plan helps us match your actual room dimensions and layout — especially useful for multi-room and addition projects. Accepted: PDF, DWG, DOCX (max 25 MB each, up to 5 files).'
                        : 'Optionally upload existing plans, specs, or reference drawings. Accepted: PDF, DWG, DOCX (max 25 MB each, up to 5 files).'}
                  </p>

                  {uploadedDocs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {uploadedDocs.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                          <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="max-w-[120px] truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setUploadedDocs(prev => prev.filter((_, j) => j !== i))}
                            className="ml-0.5 text-slate-400 hover:text-red-500 transition"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    ref={docInputRef}
                    type="file"
                    multiple
                    accept="application/pdf,.dwg,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleDocChange}
                    className="sr-only"
                    id="intake-doc-upload"
                  />
                  {uploadedDocs.length < 5 && (
                    <label
                      htmlFor="intake-doc-upload"
                      className={`flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-4 py-4 text-sm font-medium transition cursor-pointer ${
                        uploadingDocs
                          ? 'border-amber-300 bg-amber-50 text-amber-600'
                          : 'border-slate-300 bg-white text-slate-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      {uploadingDocs ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Uploading document...</>
                      ) : benefitsFromFloorplan ? (
                        <><FileText className="h-4 w-4" /> Add floor plan sketch or drawings (PDF / DWG / DOCX)</>
                      ) : (
                        <><FileText className="h-4 w-4" /> Add plans, specs, or drawings (PDF / DWG / DOCX)</>
                      )}
                    </label>
                  )}
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
                {bundlePreview && projectPath === bundlePreview.productKey && (
                  <BundleUpsellBanner bundle={bundlePreview} sourcePath={upsellSourcePath} />
                )}
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
                    formData.propertyDetails ? { label: 'About the property', value: formData.propertyDetails } : null,
                    formData.stylePreferences ? { label: 'Style direction', value: formData.stylePreferences } : null,
                    formData.priorities.length ? { label: 'Top priorities', value: formData.priorities.join(', ') } : null,
                    formData.mustStay ? { label: 'Must stay', value: formData.mustStay } : null,
                    formData.problemsToSolve ? { label: 'Problems to solve', value: formData.problemsToSolve } : null,
                    formData.budgetComfort ? { label: 'Budget comfort', value: formData.budgetComfort.replace(/-/g, ' ') } : null,
                    (uploadedFiles.length > 0 || uploadedDocs.length > 0) ? { label: 'Files', value: [uploadedFiles.length > 0 ? `${uploadedFiles.length} photo${uploadedFiles.length > 1 ? 's' : ''}` : null, uploadedDocs.length > 0 ? `${uploadedDocs.length} document${uploadedDocs.length > 1 ? 's' : ''}` : null].filter(Boolean).join(', ') + ' uploaded' } : null,
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
                  {bundlePreview && projectPath === bundlePreview.productKey && (
                    <p className="text-xs text-green-700 font-medium mb-2">{bundlePreview.savingsLabel}</p>
                  )}
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
              includes={includes}
              agentInsight={agentInsight}
              insightLoading={insightLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
