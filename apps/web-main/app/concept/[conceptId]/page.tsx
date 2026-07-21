'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Video, CheckCircle2, Loader2, Lock, Calendar, Download, AlertCircle, Mail, RefreshCw } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { VideoPlayer } from '@/components/content/VideoPlayer'
import { FloorPlan } from '@/components/content/FloorPlan'
import { SpecificationTabs } from '@/components/content/SpecificationTabs'
import { BillOfMaterials } from '@/components/content/BillOfMaterials'
import { DownloadShare } from '@/components/content/DownloadShare'
import type { Concept } from '@/lib/types'

// ── Polling intervals ──────────────────────────────────────────────────────────
const CONCEPT_POLL_MS  = 3_000   // while intake is processing
const RENDER_POLL_MS   = 5_000   // Flux jobs typically complete in 5–15 s
const VIDEO_POLL_MS    = 6_000   // video providers take 30–120 s

const RENDER_RESOLVE_AFTER_MS = 90_000

// ── Layout direction (Essential tier) ─────────────────────────────────────────

function LayoutDirectionSection({ concept }: { concept: Concept }) {
  const dc = concept.designConcept
  const lp = concept.layoutPlan

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Layout Direction</h2>
        <p className="text-slate-500">
          Spatial guidance and design direction for your scoped rooms — included with Essential.
        </p>
      </div>

      {dc && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Style &amp; Finishes</p>
            <p className="text-sm font-semibold text-slate-800 mb-2">{dc.style}</p>
            <div className="flex flex-wrap gap-2">
              {dc.colorPalette.map((material, i) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                  {material}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Key Layout Features</p>
            <ul className="space-y-1.5">
              {dc.keyFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-[#E8724B] mt-0.5 shrink-0">✓</span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {lp?.rooms && lp.rooms.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Room Zones</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lp.rooms.map((room) => (
              <div key={room.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-slate-800 text-sm">{room.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {room.widthFt}′ × {room.depthFt}′ · {room.areaFt2} sq ft
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {concept.mepSystem && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">MEP Scope Brief</p>
          {(['electrical', 'plumbing', 'hvac', 'lighting'] as const).map((key) => {
            const val = concept.mepSystem?.[key]
            if (!val) return null
            return (
              <div key={key}>
                <p className="text-xs font-semibold text-slate-600 capitalize">{key}</p>
                <p className="text-sm text-slate-700">{val}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Project coordinator CTA (all tiers) ───────────────────────────────────────

function ProjectCoordinatorCTA({ tier }: { tier: 1 | 2 | 3 }) {
  if (tier === 3) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-[#1A2B4A] to-[#243B63] p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">Premium+ Exclusive</p>
            <h3 className="text-lg font-bold text-white mb-1">Complimentary 15-Min Design Consultation</h3>
            <p className="text-sm text-slate-300">
              Review your concept with a Kealee design consultant. Your $200 permit filing credit is included.
            </p>
          </div>
          <Link
            href="/book-a-call"
            className="shrink-0 inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <Calendar className="w-4 h-4" /> Book Consultation
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#2ABFBF] mb-1">Included Support</p>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Questions About Your Package?</h3>
          <p className="text-sm text-slate-600">
            Email our project team — we respond within 1 business day to help you plan next steps.
          </p>
        </div>
        <Link
          href="/contact"
          className="shrink-0 inline-flex items-center gap-2 border-2 border-[#1A2B4A] text-[#1A2B4A] hover:bg-[#1A2B4A] hover:text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          <Mail className="w-4 h-4" /> Contact Support
        </Link>
      </div>
    </div>
  )
}

function HomeownerOverview({ concept }: { concept: Concept }) {
  const likelyPermit = (concept.permits?.length ?? 0) > 0
  const low = concept.estimatedCost ? Math.round(concept.estimatedCost * 0.85) : undefined
  const high = concept.estimatedCost ? Math.round(concept.estimatedCost * 1.2) : undefined
  const statusLabel = concept.status === 'completed' ? 'Your homeowner report is ready' : concept.status === 'error' ? 'We need to review part of your report' : 'We’re preparing your homeowner report'
  return (
    <section aria-labelledby="project-overview-heading" className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600">Project overview</p>
            <h2 id="project-overview-heading" className="mt-2 text-2xl font-bold text-slate-900">Here’s what you’re planning</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{concept.scope || concept.description || 'Your submitted project details will appear here as the report is prepared.'}</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${concept.status === 'completed' ? 'bg-green-100 text-green-800' : concept.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{statusLabel}</span>
        </div>
        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div><dt className="text-xs font-semibold text-slate-500">Property</dt><dd className="mt-1 text-sm text-slate-900">{concept.location}</dd></div>
          <div><dt className="text-xs font-semibold text-slate-500">Project type</dt><dd className="mt-1 text-sm text-slate-900">{concept.service}</dd></div>
          <div><dt className="text-xs font-semibold text-slate-500">Desired timing</dt><dd className="mt-1 text-sm text-slate-900">{concept.timeline || 'To be confirmed'}</dd></div>
        </dl>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Expected cost</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">A planning range you can use</h2>
          {concept.estimatedCost ? <p className="mt-4 text-2xl font-black text-slate-900">${low?.toLocaleString()} – ${high?.toLocaleString()} <span className="text-sm font-normal text-slate-500">likely ${concept.estimatedCost.toLocaleString()}</span></p> : <p className="mt-4 text-sm text-slate-600">Your cost range is still being prepared.</p>}
          <details className="mt-4 rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500">What may change the price</summary><p className="mt-3 text-sm leading-6 text-slate-600">Site conditions, product selections, structural work, trade availability, design and professional fees, permits, contingency, and optional upgrades are confirmed separately before construction.</p></details>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Permits and approvals</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Do I likely need a permit?</h2>
          <p className="mt-4 text-lg font-bold text-slate-900">{likelyPermit ? 'Likely yes — verify before work begins' : 'Not identified yet — verification is still required'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">This is preliminary guidance, not an approval. The local agency makes the final determination; filing responsibility must be agreed with your contractor or permit professional.</p>
          {concept.permits?.length ? <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500">View likely approval checklist</summary><ul className="mt-3 space-y-2">{concept.permits.map(p => <li key={p.name} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />{p.name} — {p.jurisdiction}</li>)}</ul></details> : null}
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Recommended next steps</p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">What happens from here</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          <li className="rounded-xl bg-slate-50 p-4"><strong className="text-sm text-slate-900">1. Review your concept</strong><p className="mt-1 text-sm text-slate-600">Check that the goals, must-keep items, and visual direction feel right.</p></li>
          <li className="rounded-xl bg-slate-50 p-4"><strong className="text-sm text-slate-900">2. Confirm cost and approvals</strong><p className="mt-1 text-sm text-slate-600">A qualified estimator and your jurisdiction should confirm assumptions before you commit.</p></li>
          <li className="rounded-xl bg-slate-50 p-4"><strong className="text-sm text-slate-900">3. Prepare for construction</strong><p className="mt-1 text-sm text-slate-600">Engage any required architect, engineer, contractor, estimator, or permit specialist.</p></li>
        </ol>
      </article>
    </section>
  )
}

// ── Design Concept Hero (all tiers) ───────────────────────────────────────────

function DesignConceptHero({ concept }: { concept: Concept }) {
  const dc = concept.designConcept
  
  if (!dc || concept.status === 'processing') {
    return (
      <section className="bg-gradient-to-br from-slate-900 to-[#1A2B4A] rounded-2xl p-8 text-white animate-pulse">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="h-6 w-28 bg-white/10 rounded-full" />
          <div className="h-6 w-36 bg-white/10 rounded-full" />
        </div>
        <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
        <div className="h-4 bg-white/10 rounded w-1/2 mb-6" />
        <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
          <div>
            <div className="h-3 bg-white/10 rounded w-24 mb-3" />
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-20 bg-white/10 rounded-lg" />
              <div className="h-6 w-24 bg-white/10 rounded-lg" />
              <div className="h-6 w-16 bg-white/10 rounded-lg" />
            </div>
          </div>
          <div>
            <div className="h-3 bg-white/10 rounded w-24 mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-white/10 rounded w-5/6" />
              <div className="h-4 bg-white/10 rounded w-4/5" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  const buildabilityMeta: Record<string, { label: string; cls: string }> = {
    'feasible':               { label: '✓ Feasible',        cls: 'bg-green-100 text-green-800 border-green-200' },
    'feasible-with-variance': { label: '⚠ Variance Needed', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    'challenging':            { label: '⚡ Complex Scope',   cls: 'bg-red-100 text-red-800 border-red-200' },
  }
  const bm = buildabilityMeta[concept.buildabilityFlag ?? 'feasible'] ?? buildabilityMeta['feasible']

  return (
    <section className="bg-gradient-to-br from-slate-900 to-[#1A2B4A] rounded-2xl p-8 text-white shadow-xl">
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="inline-flex items-center gap-1.5 bg-[#E8724B]/20 border border-[#E8724B]/40 text-[#E8724B] text-sm font-bold px-3 py-1.5 rounded-full">
          ✦ {dc.style}
        </span>
        <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${bm.cls}`}>
          {bm.label}
        </span>
        {concept.readinessScore !== undefined && (
          <span className="text-xs font-semibold text-slate-300">
            Permit Readiness: {concept.readinessScore}/100
          </span>
        )}
      </div>

      {/* Description */}
      {concept.description && (
        <p className="text-slate-300 text-base leading-relaxed mb-6 max-w-3xl">{concept.description}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Materials & finishes */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Materials &amp; Finishes</p>
          <div className="flex flex-wrap gap-2">
            {dc.colorPalette.map((material, i) => (
              <span key={i} className="bg-white/10 border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                {material}
              </span>
            ))}
          </div>
        </div>

        {/* Key features */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Key Features</p>
          <ul className="space-y-1.5">
            {dc.keyFeatures.slice(0, 5).map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                <span className="text-[#E8724B] mt-0.5 shrink-0">✓</span>
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Permit readiness progress bar */}
      {concept.readinessScore !== undefined && (
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Permit Readiness</p>
            <p className="text-xs font-bold text-white">{concept.readinessScore}%</p>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E8724B] rounded-full transition-all"
              style={{ width: `${concept.readinessScore}%` }}
            />
          </div>
        </div>
      )}
    </section>
  )
}

// ── Locked feature card (tier 1) ───────────────────────────────────────────────

function LockedFeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="print:hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>
      <Link
        href="/concept"
        className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
      >
        Upgrade to Premium <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

// ── Upgrade banner (tier 1 & 2) ───────────────────────────────────────────────

function UpgradeBanner({ currentTier }: { currentTier: 1 | 2 | 3 }) {
  if (currentTier === 3) return null
  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#E8724B] flex items-center justify-center shrink-0">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 mb-1">
            {currentTier === 1 ? 'Upgrade to Premium — Add Video + Floor Plan' : 'Upgrade to Premium+ — Multi-angle Videos & MEP Layers'}
          </p>
          <p className="text-sm text-slate-600 mb-4">
            {currentTier === 1
              ? 'Get a 60-second AI transformation video and 2D architectural floor plan.'
              : 'Add 4 video formats, interactive multi-layer floor plans with MEP systems, and CAD download.'}
          </p>
          <Link
            href="/concept"
            className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            Upgrade Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Single render slot ─────────────────────────────────────────────────────────

function RenderSlot({ url, index, failed }: { url: string | null; index: number; failed?: boolean }) {
  if (url) {
    return (
      <div className="group relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
        <img src={url} alt={`Rendering ${index + 1}`} className="w-full h-full object-cover" />
        {/* Download button — visible on hover */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download={`kealee-render-${index + 1}.jpg`}
          onClick={(e) => e.stopPropagation()}
          className="print:hidden absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title={`Download render ${index + 1}`}
        >
          <Download className="w-4 h-4 text-white" />
        </a>
      </div>
    )
  }
  if (failed) {
    return (
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-red-50 border border-red-200/60 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <p className="text-xs text-red-600 font-medium">Render {index + 1} could not be generated</p>
        <p className="text-[10px] text-red-400">We&apos;re retrying automatically — refresh if this persists.</p>
      </div>
    )
  }
  return (
    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-center gap-2 shadow-inner">
      <Loader2 className="w-6 h-6 text-[#E8724B] animate-spin" />
      <p className="text-xs text-slate-400">Rendering {index + 1} generating…</p>
    </div>
  )
}

// ── Status Timeline Indicator ───────────────────────────────────────────────

function StatusTimeline({ status }: { status: 'processing' | 'completed' | 'error' }) {
  const steps = [
    { label: 'Draft', done: true },
    { label: 'Submitted', done: true },
    { label: 'Paid', done: true },
    { 
      label: status === 'error' ? 'Analysis Failed' : 'Generating', 
      done: status === 'completed', 
      active: status === 'processing',
      failed: status === 'error'
    },
    { 
      label: status === 'error' ? 'Failed' : 'Ready', 
      done: status === 'completed',
      active: status === 'completed',
      failed: status === 'error'
    }
  ]

  return (
    <div className="bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 mt-4">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const isDone = s.done
          const isActive = s.active
          const isFailed = s.failed

          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
                    isFailed
                      ? 'bg-red-500 text-white shadow-md shadow-red-950/20'
                      : isDone
                      ? 'bg-green-500 text-white shadow-md shadow-green-950/20'
                      : isActive
                      ? 'bg-[#E8724B] text-white ring-4 ring-[#E8724B]/30 animate-pulse shadow-md shadow-orange-950/20'
                      : 'bg-white/10 text-slate-400 border border-white/10'
                  }`}
                >
                  {isFailed ? (
                    '✕'
                  ) : isDone ? (
                    <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold mt-2 tracking-wide uppercase transition-colors duration-300 ${
                    isActive ? 'text-[#E8724B]' : isFailed ? 'text-red-400' : isDone ? 'text-green-400' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 mx-3 -mt-6">
                  <div
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      isFailed ? 'bg-red-500' : isDone ? 'bg-green-500' : isActive ? 'bg-slate-700' : 'bg-white/10'
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ConceptDeliverablePage() {
  const params    = useParams()
  const router    = useRouter()
  const conceptId = params.conceptId as string

  const [concept,   setConcept]   = useState<Concept | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  // Local render slots: null = pending / loading, string = final URL
  const [renderSlots,  setRenderSlots]  = useState<(string | null)[]>([])
  const [failedSlots,  setFailedSlots]  = useState<Set<number>>(new Set())
  // Live video URL once polling resolves it
  const [liveVideoUrl, setLiveVideoUrl] = useState<string | undefined>(undefined)
  const [videoFailed,  setVideoFailed]  = useState(false)
  const [genRetrying,  setGenRetrying]  = useState(false)
  const [videoRetryKey, setVideoRetryKey] = useState(0)

  // Ref flags to prevent duplicate interval registrations
  const renderPollStarted = useRef(false)
  const resolveKicked     = useRef(false)
  const generateRetried   = useRef(false)
  const renderPollStartAt = useRef<number | null>(null)

  // ── 1. Load concept (poll while processing) ──────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    async function fetchConcept() {
      try {
        const res = await fetch(`/api/concepts/${conceptId}`)
        if (res.status === 401 || res.status === 403) {
          router.replace(`/login?redirectTo=/concept/${conceptId}`)
          return
        }
        if (res.status === 404) { setNotFound(true); setLoading(false); return }
        if (!res.ok) throw new Error('Fetch failed')
        const data: Concept = await res.json()
        setConcept(data)
        setLoading(false)

        // Initialise render slots from whatever renderUrls we already have
        setRenderSlots(() => {
          const existing  = data.renderings ?? []
          const jobCount  = data.renderJobs?.length ?? 0
          const slotCount = Math.max(existing.length, jobCount, data.tier === 3 ? 12 : data.tier === 2 ? 6 : 3)
          return Array.from({ length: slotCount }, (_, i) => existing[i] || null)
        })

        // Retry generation if payment succeeded but concept never materialized
        if (
          data.status === 'processing' &&
          !data.designConcept &&
          !generateRetried.current
        ) {
          generateRetried.current = true
          setGenRetrying(true)
          fetch('/api/concept/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intakeId: conceptId }),
          })
            .catch(() => {})
            .finally(() => setGenRetrying(false))
        }

        if (data.status === 'processing') {
          interval = setInterval(async () => {
            try {
              const r = await fetch(`/api/concepts/${conceptId}`)
              if (!r.ok) return
              const updated: Concept = await r.json()
              setConcept(updated)
              if (updated.renderings?.length) {
                setRenderSlots((prev) => {
                  const slotCount = Math.max(prev.length, updated.renderings!.length)
                  return Array.from({ length: slotCount }, (_, i) => updated.renderings![i] || prev[i] || null)
                })
              }
              if (updated.status !== 'processing') clearInterval(interval)
            } catch {}
          }, CONCEPT_POLL_MS)
        }
      } catch {
        setLoading(false)
        setNotFound(true)
      }
    }

    fetchConcept()
    return () => clearInterval(interval)
  }, [conceptId])

  // ── 2. Poll individual Replicate render jobs ──────────────────────────────────
  useEffect(() => {
    if (!concept || !concept.renderJobs?.length || renderPollStarted.current) return
    renderPollStarted.current = true
    renderPollStartAt.current = Date.now()

    const jobs      = concept.renderJobs
    const completed = new Set<number>()

    async function kickRenderResolve() {
      if (resolveKicked.current) return
      resolveKicked.current = true
      try {
        await fetch('/api/concept/renders/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intakeId: conceptId }),
        })
        const r = await fetch(`/api/concepts/${conceptId}`)
        if (r.ok) {
          const updated: Concept = await r.json()
          setConcept(updated)
          if (updated.renderings?.length) {
            setRenderSlots((prev) => {
              const slotCount = Math.max(prev.length, updated.renderings!.length)
              return Array.from({ length: slotCount }, (_, i) => updated.renderings![i] || prev[i] || null)
            })
            setFailedSlots(new Set())
          }
        }
      } catch {
        resolveKicked.current = false
      }
    }

    // Fill any existing render URLs into slots
    setRenderSlots((prev) => {
      const existing = concept.renderings ?? []
      const slots    = Array.from({ length: jobs.length }, (_, i) => existing[i] || null)
      // Mark already-present slots as done
      slots.forEach((url, i) => { if (url) completed.add(i) })
      return slots
    })

    if (completed.size === jobs.length) return  // all already done

    const interval = setInterval(async () => {
      if (completed.size === jobs.length) { clearInterval(interval); return }

      const elapsed = Date.now() - (renderPollStartAt.current ?? Date.now())
      if (elapsed > RENDER_RESOLVE_AFTER_MS && !resolveKicked.current) {
        void kickRenderResolve()
      }

      await Promise.allSettled(
        jobs.map(async (predictionId, i) => {
          if (completed.has(i)) return
          try {
            const r = await fetch(`/api/concept/renders/${predictionId}`)
            if (!r.ok) return
            const data = await r.json()
            if (data.status === 'completed' && data.outputUrl) {
              completed.add(i)
              setFailedSlots((prev) => {
                const next = new Set(prev)
                next.delete(i)
                return next
              })
              setRenderSlots((prev) => {
                const next = [...prev]
                next[i]   = data.outputUrl as string
                return next
              })
            } else if (data.status === 'failed') {
              completed.add(i)
              setFailedSlots((prev) => new Set(prev).add(i))
              if (!resolveKicked.current) void kickRenderResolve()
            }
          } catch {}
        })
      )

      if (completed.size === jobs.length) clearInterval(interval)
    }, RENDER_POLL_MS)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept?.id, concept?.renderJobs?.length])

  // ── 3. Poll video status for tier 2+ ─────────────────────────────────────────
  useEffect(() => {
    if (!concept || concept.tier < 2) return
    // If video URL is already populated, nothing to poll
    if (concept.videoUrl && !concept.videoUrl.includes('ForBiggerBlazes')) {
      setLiveVideoUrl(concept.videoUrl)
      return
    }

    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/concept/video?intakeId=${conceptId}`)
        if (!r.ok) return
        const data = await r.json()
        if (data.status === 'completed' && data.outputUrl) {
          setLiveVideoUrl(data.outputUrl as string)
          setVideoFailed(false)
          clearInterval(interval)
        } else if (data.status === 'failed') {
          setVideoFailed(true)
          clearInterval(interval)
        }
      } catch {}
    }, VIDEO_POLL_MS)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept?.id, concept?.tier, videoRetryKey])

  // ── Sync renders from DB after background resolve completes ─────────────────
  useEffect(() => {
    if (!concept || concept.status !== 'completed') return
    const jobs = concept.renderJobs?.length ?? 0
    const urls = concept.renderings?.length ?? 0
    if (jobs === 0 || urls >= jobs) return

    if (!resolveKicked.current) {
      resolveKicked.current = true
      fetch('/api/concept/renders/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId: conceptId }),
      }).catch(() => { resolveKicked.current = false })
    }

    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/concepts/${conceptId}`)
        if (!r.ok) return
        const updated: Concept = await r.json()
        if (updated.renderings?.length) {
          setConcept(updated)
          setRenderSlots((prev) => {
            const slotCount = Math.max(prev.length, updated.renderings!.length)
            return Array.from({ length: slotCount }, (_, i) => updated.renderings![i] || prev[i] || null)
          })
        }
        const done = updated.renderings?.filter(Boolean).length ?? 0
        if (done >= jobs) clearInterval(interval)
      } catch {}
    }, 8_000)

    return () => clearInterval(interval)
  }, [concept?.id, concept?.status, concept?.renderJobs?.length, concept?.renderings?.length, conceptId])

  // ── Loading / error states ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Spinner size="lg" />
        <p className="text-slate-600 font-medium">Loading your concept…</p>
      </div>
    )
  }

  if (notFound || !concept) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <h2 className="text-2xl font-bold text-slate-900">Concept Not Found</h2>
        <p className="text-slate-500">This concept doesn't exist or may still be generating.</p>
        <Link href="/concept" className="text-[#E8724B] font-semibold hover:underline">Start a new concept →</Link>
      </div>
    )
  }

  // ── Concept ready or processing — render the deliverable ────────────────────────────────────

  const displayVideoUrl = liveVideoUrl ?? concept.videoUrl
  const hasRenderJobs   = (concept.renderJobs?.length ?? 0) > 0
  const rendersComplete = renderSlots.every(Boolean)
  const showRenderSection = renderSlots.length > 0 || hasRenderJobs

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1A2B4A] to-slate-900 py-12 px-4 border-b border-white/5 shadow-lg">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#E8724B] mb-2">
                Homeowner project report
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Your {concept.service}
              </h1>
              <p className="text-slate-400 text-sm mt-1.5">
                Created on {new Date(concept.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            {concept.status === 'completed' && (
              <div className="flex flex-wrap items-center gap-3">
                <DownloadShare conceptId={conceptId} pdfUrl={concept.pdfUrl} />
              </div>
            )}
          </div>
          
          {/* Status Timeline */}
          <StatusTimeline status={concept.status} />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 space-y-16">
        <HomeownerOverview concept={concept} />
        {(concept.status === 'processing' || genRetrying) && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-pulse">
            <Loader2 className="w-5 h-5 text-[#E8724B] animate-spin shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                {genRetrying ? 'Starting Concept Generation…' : 'Advisory Concept Generating'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                We’re preparing your design direction, visuals, cost range, and permit roadmap.
                This dashboard updates live — typically 1–3 minutes.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="note">
          Your design concept is preliminary and intended for planning. It is not permit-ready, stamped, or professionally certified unless a qualified professional has explicitly supplied and signed that document.
        </div>

        {/* Design Concept Hero — all tiers */}
        <DesignConceptHero concept={concept} />

        {/* Before & After — shown when client uploaded photos during intake */}
        {concept.beforeUrls && concept.beforeUrls.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Before &amp; After</h2>
            <p className="text-slate-500 mb-6">
              Your uploaded photos alongside the AI-generated design vision.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {concept.beforeUrls.map((beforeUrl, i) => (
                <div key={i} className="space-y-3">
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-sm">
                    <img src={beforeUrl} alt={`Before ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-md">Before</span>
                  </div>
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-sm">
                    {renderSlots[i] ? (
                      <>
                        <img src={renderSlots[i]!} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-[#E8724B]/90 text-white text-xs font-semibold px-2 py-1 rounded-md">After</span>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-50 shadow-inner">
                        <Loader2 className="w-6 h-6 text-[#E8724B] animate-spin" />
                        <p className="text-xs text-slate-400">AI render generating…</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI Render Gallery — all tiers (3 / 6 / 12 based on tier) */}
        {showRenderSection && (
          <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  AI Project Renderings
                  <span className="ml-3 text-sm font-normal text-slate-400">
                    ({concept.tier === 3 ? '12 renders' : concept.tier === 2 ? '6 renders' : '3 renders'})
                  </span>
                </h2>
                {!rendersComplete && hasRenderJobs && (
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    AI renders generating — images appear as they complete
                  </p>
                )}
              </div>
              {rendersComplete && concept.status === 'completed' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> All renders complete
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderSlots.map((url, i) => (
                <RenderSlot key={i} url={url} index={i} failed={!url && failedSlots.has(i)} />
              ))}
            </div>
          </section>
        )}

        {/* Video — tier 2+ active, tier 1 locked */}
        {concept.tier >= 2 ? (
          <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Transformation Video</h2>
            <p className="text-slate-500 mb-6">
              {concept.tier === 3
                ? 'Four format cuts: full reveal, 30s mobile, 15s social, 10s preview'
                : 'AI-generated 60-second before/after transformation'}
            </p>
            {displayVideoUrl && !displayVideoUrl.includes('ForBiggerBlazes') ? (
              <VideoPlayer
                videoUrl={displayVideoUrl}
                duration={concept.videoDuration}
                tier={concept.tier}
                videoFormatUrls={liveVideoUrl ? undefined : concept.videoFormatUrls}
              />
            ) : videoFailed ? (
              <div className="rounded-2xl bg-red-50 border border-red-200/60 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <p className="text-slate-700 font-medium text-sm mb-1">Video generation encountered an issue</p>
                <p className="text-slate-500 text-xs mb-4">Your renders and design brief are still available. Contact support if this persists.</p>
                <button
                  type="button"
                  onClick={() => {
                    setVideoFailed(false)
                    fetch('/api/concept/video', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ intakeId: conceptId, regenerate: true }),
                    })
                      .catch(() => {})
                      .finally(() => setVideoRetryKey((k) => k + 1))
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#E8724B] hover:underline"
                >
                  <RefreshCw className="w-4 h-4" /> Retry video generation
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-12 text-center shadow-inner">
                <Loader2 className="w-8 h-8 text-[#E8724B] animate-spin mx-auto mb-3" />
                <p className="text-slate-600 font-medium text-sm mb-1">Video generating</p>
                <p className="text-slate-400 text-xs">AI video generation typically takes 1–3 minutes. This page updates automatically.</p>
              </div>
            )}
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Transformation Video</h2>
            <LockedFeatureCard
              icon={<Video className="w-6 h-6 text-slate-400" />}
              title="60-Second AI Transformation Video"
              description="See your space transformed — a cinematic before/after reveal generated by AI, ready to share with family or contractors."
            />
          </section>
        )}

        {/* Layout direction — Essential tier */}
        {concept.tier === 1 && <LayoutDirectionSection concept={concept} />}

        {/* Floor Plan — Premium & Premium+ */}
        {concept.tier >= 2 ? (
          <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {concept.tier === 3 ? 'Interactive Multi-Layer Floor Plan' : '2D Architectural Floor Plan'}
            </h2>
            <p className="text-slate-500 mb-6">
              {concept.tier === 3
                ? 'Toggle MEP system layers — electrical, plumbing, HVAC — with CAD download'
                : 'Architectural layout with room dimensions and scale'}
            </p>
            <FloorPlan
              tier={concept.tier}
              floorPlanUrl={concept.floorPlanUrl}
              floorplanSvgInline={concept.floorplanSvgInline}
              mepSchematic={concept.mepSchematic}
              conceptId={conceptId}
              cadDownloadUrl={concept.cadDxfInline ? `/api/concept/cad/${conceptId}` : undefined}
            />
          </section>
        ) : null}

        {/* Specification Tabs — all tiers */}
        <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
          <SpecificationTabs concept={concept} tier={concept.tier} />
        </section>

        {/* Bill of Materials — all tiers when data exists */}
        {concept.billOfMaterials && concept.billOfMaterials.length > 0 ? (
          <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Detailed Cost Breakdown</h2>
            <p className="text-slate-500 mb-6">Line-item materials and estimated costs</p>
            <BillOfMaterials items={concept.billOfMaterials} />
          </section>
        ) : concept.tier === 1 ? (
          <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Cost Estimate</h2>
            {concept.estimatedCost ? (
              <p className="text-3xl font-bold text-[#E8724B]">
                ${concept.estimatedCost.toLocaleString('en-US')}
                <span className="text-sm font-normal text-slate-500 ml-2">estimated project cost</span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">Cost breakdown will appear when generation completes.</p>
            )}
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Detailed Cost Breakdown</h2>
            <p className="text-sm text-slate-500">Bill of materials will appear when generation completes.</p>
          </section>
        )}

        {/* Project coordinator / consultation — all tiers */}
        <div className="print:hidden"><ProjectCoordinatorCTA tier={concept.tier} /></div>

        {/* Upgrade banner (tier 1 & 2) */}
        <div className="print:hidden"><UpgradeBanner currentTier={concept.tier} /></div>

        {/* Final CTA */}
        <section className="print:hidden bg-gradient-to-r from-[#E8724B] to-[#D45C33] rounded-2xl p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Build?</h2>
          <p className="text-orange-100 mb-6">Connect with a Kealee-vetted contractor in your area.</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-white text-[#E8724B] hover:bg-orange-50 font-bold px-7 py-3 rounded-xl transition-all shadow"
          >
            Find a Contractor <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  )
}
