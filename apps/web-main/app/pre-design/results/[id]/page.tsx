'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Download, FileText, CheckCircle, AlertCircle, Loader2,
  DollarSign, MapPin, Wrench, Zap, ArrowRight, ExternalLink,
} from 'lucide-react'
import { ProcessingLoader } from '../loading-processing'
import { ResultsReadyBanner } from '../results-ready-banner'
import { FallbackOutput } from '../fallback-output'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectOutput {
  id: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  type: string
  serviceType?: 'concept' | 'estimation' | 'permit'
  deliveryStatus?: 'pending' | 'generating' | 'persisted' | 'failed'
  summary?: string
  resultJson?: any
  pdfUrl?: string
  downloadUrl?: string
  conceptImageUrls?: string[]
  estimationPdfUrl?: string
  permitFileUrls?: string[]
  fileMetadata?: Record<string, any>
  nextStep?: string
  confidence?: string
  updatedAt?: string
  completedAt?: string
  isProcessing?: boolean
  isCompleted?: boolean
  fallback?: boolean
  estimatedHours?: number
}

interface PreDesignSession {
  id: string
  status: string
  tier: string
  projectType: string
  executionRoute?: string
  confidenceScore?: number
  complexityScore?: number
  requiresArchitect?: boolean
  conceptSummary?: {
    title?: string
    description?: string
    styleDirection?: string
    primaryMaterials?: string[]
    keyChanges?: string[]
  }
  styleProfile?: {
    style?: string
    palette?: string[]
    mood?: string
  }
  budgetRange?: {
    low?: number
    mid?: number
    high?: number
    currency?: string
    notes?: string
  }
  feasibilitySummary?: {
    overallScore?: number
    zoning?: string
    setbacks?: string
    heightLimit?: string
    notes?: string
  }
  zoningSummary?: {
    jurisdiction?: string
    zone?: string
    summary?: string
  }
  buildabilitySummary?: {
    score?: number
    notes?: string
    flags?: string[]
  }
  scopeOfWork?: {
    phases?: Array<{ phase: string; items: string[] }>
    estimatedWeeks?: number
  }
  systemsImpact?: {
    electrical?: string
    plumbing?: string
    hvac?: string
    structural?: string
  }
  estimateFramework?: {
    softCosts?: number
    hardCosts?: number
    contingency?: number
    totalLow?: number
    totalHigh?: number
  }
  outputImages?: Array<{ url: string; label?: string; caption?: string }>
  outputPdfUrl?: string
  outputJsonUrl?: string
  outputDxfUrl?: string
  createdAt?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(n?: number) {
  if (!n) return '—'
  return `$${n.toLocaleString()}`
}

function confidenceColor(score?: number) {
  if (!score) return '#9CA3AF'
  if (score >= 0.8) return '#38A169'
  if (score >= 0.6) return '#E8793A'
  return '#EF4444'
}

function confidenceLabel(score?: number) {
  if (!score) return 'Calculating…'
  if (score >= 0.8) return 'High confidence'
  if (score >= 0.6) return 'Moderate confidence'
  return 'Low confidence — architect review recommended'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConfidenceMeter({ score }: { score?: number }) {
  const pct = score ? Math.round(score * 100) : 0
  const color = confidenceColor(score)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">AI Confidence</h3>
      <div className="flex items-end gap-3 mb-2">
        <span className="text-4xl font-bold font-display" style={{ color }}>{pct}%</span>
        <span className="text-sm text-gray-500 pb-1">{confidenceLabel(score)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function ExecutionPathCard({ route, requiresArchitect }: { route?: string; requiresArchitect?: boolean }) {
  const isAiOnly = route === 'AI_ONLY'
  const isRequired = route === 'ARCHITECT_REQUIRED' || requiresArchitect
  const isRecommended = route === 'ARCHITECT_RECOMMENDED'

  const color = isAiOnly ? '#38A169' : isRequired ? '#E8793A' : '#2ABFBF'
  const label = isAiOnly ? 'AI-Only Delivery' : isRequired ? 'Architect Required' : 'Architect Recommended'
  const desc = isAiOnly
    ? 'Your project scope falls within AI-deliverable parameters. No architect engagement required.'
    : isRequired
    ? 'Your project complexity requires architect involvement. We have matched you to licensed architects in your area.'
    : 'An architect review is recommended for this project. We can connect you with one or you can proceed with AI outputs only.'

  return (
    <div className="rounded-2xl border-2 bg-white p-5" style={{ borderColor: color }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-bold uppercase tracking-widest" style={{ color }}>
          {label}
        </span>
      </div>
      <p className="text-sm text-gray-600">{desc}</p>
      {(isRequired || isRecommended) && (
        <Link
          href="/architects"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          Connect with an architect <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Revenue CTA Bar Component
// ---------------------------------------------------------------------------

function RevenueCtaBar({ route, requiresArchitect, projectId }: { route?: string; requiresArchitect?: boolean; projectId?: string }) {
  const isAiOnly = route === 'AI_ONLY'
  const isRequired = route === 'ARCHITECT_REQUIRED' || requiresArchitect

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps</h3>
      <div className="space-y-3 flex flex-col">
        {/* Cost Estimation CTA */}
        <Link
          href={`/estimate?projectId=${projectId || ''}`}
          className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300 hover:bg-gray-50 transition"
        >
          <div>
            <p className="text-sm font-bold text-gray-900">Get Cost Estimate</p>
            <p className="text-xs text-gray-500">Trade-by-trade breakdown from RSMeans</p>
          </div>
          <span className="text-sm font-bold text-gray-900">from $595</span>
        </Link>

        {/* Permit Package CTA */}
        <Link
          href={`/intake/permit_path_only/payment?amount=79900${projectId ? `&projectId=${projectId}` : ''}`}
          className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300 hover:bg-gray-50 transition"
        >
          <div>
            <p className="text-sm font-bold text-gray-900">Order Permit Package</p>
            <p className="text-xs text-gray-500">Get started with permits</p>
          </div>
          <span className="text-sm font-bold text-gray-900">from $299</span>
        </Link>

        {/* Contractor Match CTA */}
        <Link
          href={`/intake/contractor_match/payment?amount=19900${projectId ? `&projectId=${projectId}` : ''}`}
          className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300 hover:bg-gray-50 transition"
        >
          <div>
            <p className="text-sm font-bold text-gray-900">Match with Verified Contractor</p>
            <p className="text-xs text-gray-500">Connect with qualified builders</p>
          </div>
          <span className="text-sm font-bold text-gray-900">$199</span>
        </Link>

        {/* Architect Consultation CTA (only if needed) */}
        {(isRequired || !isAiOnly) && (
          <Link
            href={`/intake/design_build/payment?amount=14900${projectId ? `&projectId=${projectId}` : ''}`}
            className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300 hover:bg-gray-50 transition"
          >
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isRequired ? 'Connect with Architect' : 'Architect Consultation'}
              </p>
              <p className="text-xs text-gray-500">Expert guidance for your project</p>
            </div>
            <span className="text-sm font-bold text-gray-900">$149</span>
          </Link>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PreDesignResultsPage() {
  const params = useParams()
  const id = params?.id as string

  const [session, setSession] = useState<PreDesignSession | null>(null)
  const [projectOutput, setProjectOutput] = useState<ProjectOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // STEP 4: Implement status polling
  const pollProjectOutput = async (outputId: string) => {
    try {
      const res = await fetch(`/api/project-output/${outputId}`)
      if (!res.ok) return
      
      const data: ProjectOutput = await res.json()
      setProjectOutput(data)
      
      // [polling] active
      console.log('[polling] active', { status: data.status, type: data.type })

      // Stop polling when completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
          pollingInterval.current = null
          setIsPolling(false)
        }
      }
    } catch (err) {
      console.error('[polling] error', err)
    }
  }

  useEffect(() => {
    if (!id) return

    // Initial load: fetch pre-design session
    fetch(`/api/pre-design/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Session not found')
        return r.json()
      })
      .then((sess) => {
        setSession(sess)

        // After loading session, start polling for ProjectOutput
        // Assume outputId = id for now (can be mapped differently)
        setIsPolling(true)
        pollProjectOutput(id)

        // Poll every 3 seconds
        pollingInterval.current = setInterval(() => {
          pollProjectOutput(id)
        }, 3000)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
      .finally(() => setLoading(false))

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#E8793A' }} />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <p className="text-gray-500">{error ?? 'Session not found'}</p>
        </div>
      </div>
    )
  }

  // STEP 2: Render processing state while polling
  if (projectOutput?.isProcessing) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <ProcessingLoader
            estimatedHours={projectOutput.estimatedHours}
            status={projectOutput.status}
          />
        </div>
      </div>
    )
  }

  // STEP 2: Render fallback UI if failed
  if (projectOutput?.fallback || projectOutput?.status === 'failed') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* [fallback] triggered */}
          <FallbackOutput
            projectId={id}
            projectType={session.projectType}
            failureReason={projectOutput?.status === 'failed' ? 'Processing encountered an issue' : undefined}
          />
        </div>
      </div>
    )
  }

  // STEP 3: Render completed results (original layout)
  // STEP 3.5: Calculate deliverables status with persisted sources
  const concept = session.conceptSummary
  const budget = session.budgetRange
  const feasibility = session.feasibilitySummary
  const zoning = session.zoningSummary
  const buildability = session.buildabilitySummary
  const scope = session.scopeOfWork
  const systems = session.systemsImpact
  const estimate = session.estimateFramework

  // Use persisted deliverables from ProjectOutput, fall back to session data
  const persistedConceptImages = projectOutput?.resultJson?.conceptImageUrls || projectOutput?.resultJson?.images || []
  const persistedPdfUrl = projectOutput?.pdfUrl || session.outputPdfUrl
  const persistedDownloadUrl = projectOutput?.downloadUrl || persistedPdfUrl
  const images = (persistedConceptImages && persistedConceptImages.length > 0)
    ? persistedConceptImages.map((url: string, i: number) => ({
        url,
        label: `Concept ${i + 1}`,
        caption: 'From persisted deliverable'
      }))
    : session.outputImages ?? []

  const deliverablesStatus = {
    concept: (images && images.length > 0) || !!(concept?.description && concept?.keyChanges?.length),
    budget: !!(budget && (budget.low || budget.mid || budget.high)),
    feasibility: !!(feasibility || zoning),
    permit: !!(scope || systems || estimate),
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>
                {concept?.title ?? 'Your Pre-Design Package'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 capitalize">
                {session.projectType?.replace('_', ' ')} · {session.tier} tier
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(persistedDownloadUrl || session.outputPdfUrl) && (
                <a
                  href={persistedDownloadUrl || session.outputPdfUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              )}
              {session.outputDxfUrl && (
                <a
                  href={session.outputDxfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300"
                >
                  <FileText className="h-4 w-4" /> DXF Export
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Results Ready Banner */}
        <ResultsReadyBanner
          projectId={id}
          status={projectOutput?.status ?? 'completed'}
          deliverables={deliverablesStatus}
          confidence={session.confidenceScore}
        />
        {/* Concept images */}
        {images.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img: { url: string; label?: string; caption?: string }, i: number) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.label ?? `Concept ${i + 1}`} className="w-full h-48 object-cover" />
                {img.caption && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{img.label}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No images placeholder */}
        {images.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-gray-400 text-sm">Concept images will appear here once processing is complete.</p>
          </div>
        )}

        {/* Top row: concept summary + confidence */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Concept Summary</h2>
            {concept?.description ? (
              <p className="text-gray-700 text-sm leading-relaxed">{concept.description}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">Generating concept summary…</p>
            )}
            {concept?.keyChanges && concept.keyChanges.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {concept.keyChanges.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ConfidenceMeter score={session.confidenceScore} />
        </div>

        {/* Execution path */}
        <ExecutionPathCard route={session.executionRoute} requiresArchitect={session.requiresArchitect} />

        {/* Budget + Feasibility */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Budget */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Budget Range</h3>
            </div>
            {budget ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-400 mb-1">Low</div>
                  <div className="font-bold text-gray-700">{formatCurrency(budget.low)}</div>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: '#E8793A15' }}>
                  <div className="text-xs mb-1" style={{ color: '#E8793A' }}>Likely</div>
                  <div className="font-bold" style={{ color: '#E8793A' }}>{formatCurrency(budget.mid)}</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-400 mb-1">High</div>
                  <div className="font-bold text-gray-700">{formatCurrency(budget.high)}</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Budget analysis pending…</p>
            )}
            {budget?.notes && <p className="mt-3 text-xs text-gray-400">{budget.notes}</p>}
          </div>

          {/* Feasibility */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Zoning & Feasibility</h3>
            </div>
            {zoning ? (
              <div className="space-y-1.5 text-sm">
                {zoning.jurisdiction && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Jurisdiction</span>
                    <span className="font-medium text-gray-700">{zoning.jurisdiction}</span>
                  </div>
                )}
                {zoning.zone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Zone</span>
                    <span className="font-medium text-gray-700">{zoning.zone}</span>
                  </div>
                )}
                {feasibility?.zoning && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Compliance</span>
                    <span className="font-medium text-gray-700">{feasibility.zoning}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Zoning analysis pending…</p>
            )}
            {zoning?.summary && <p className="mt-3 text-xs text-gray-500">{zoning.summary}</p>}
          </div>
        </div>

        {/* Scope of Work */}
        {scope?.phases && scope.phases.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Scope of Work</h3>
              {scope.estimatedWeeks && (
                <span className="ml-auto text-xs text-gray-400">
                  Est. {scope.estimatedWeeks} weeks
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {scope.phases.map((phase) => (
                <div key={phase.phase}>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{phase.phase}</div>
                  <ul className="space-y-1">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Systems Impact */}
        {systems && Object.values(systems).some(Boolean) && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Systems Impact</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(systems).filter(([, v]) => v).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5 capitalize">{key}</div>
                  <div className="text-sm text-gray-700">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downloads */}
        {(persistedDownloadUrl || session.outputPdfUrl || session.outputJsonUrl || session.outputDxfUrl) && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Downloads</h3>
            <div className="flex flex-wrap gap-3">
              {(persistedDownloadUrl || session.outputPdfUrl) && (
                <a href={persistedDownloadUrl || session.outputPdfUrl || '#'} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300"
                >
                  <Download className="h-4 w-4" /> PDF Package
                </a>
              )}
              {session.outputJsonUrl && (
                <a href={session.outputJsonUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300"
                >
                  <ExternalLink className="h-4 w-4" /> JSON Manifest
                </a>
              )}
              {session.outputDxfUrl && (
                <a href={session.outputDxfUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300"
                >
                  <FileText className="h-4 w-4" /> DXF Export
                </a>
              )}
            </div>
          </div>
        )}

        {/* Revenue CTAs */}
        <RevenueCtaBar
          route={session?.executionRoute}
          requiresArchitect={session?.requiresArchitect}
          projectId={id}
        />

        {/* Next steps CTA */}
        <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #1e3a5f 100%)' }}>
          <h3 className="text-xl font-bold text-white font-display mb-2">Ready to move forward?</h3>
          <p className="text-gray-300 text-sm mb-5">
            Connect with a licensed contractor or architect to take your concept into construction.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contractors"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: '#E8793A' }}
            >
              Find a Contractor <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/architects"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white hover:border-white/40"
            >
              Find an Architect
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
