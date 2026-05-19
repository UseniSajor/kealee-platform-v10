'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Video, CheckCircle2, Loader2, Lock, Calendar, Download } from 'lucide-react'
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

// Sample BOM for display when real data isn't available
const SAMPLE_BOM = [
  { category: 'Cabinetry',    item: 'Upper cabinets',       quantity: 12,  unit: 'LF',  unitCost: 180,  total: 2160 },
  { category: 'Cabinetry',    item: 'Base cabinets',        quantity: 18,  unit: 'LF',  unitCost: 220,  total: 3960 },
  { category: 'Countertops',  item: 'Quartz countertop',    quantity: 45,  unit: 'SF',  unitCost:  85,  total: 3825 },
  { category: 'Flooring',     item: 'Hardwood flooring',    quantity: 200, unit: 'SF',  unitCost:  12,  total: 2400 },
  { category: 'Flooring',     item: 'Tile (entry)',         quantity:  50, unit: 'SF',  unitCost:   8,  total:  400 },
  { category: 'Appliances',   item: 'Professional range',   quantity:   1, unit: 'EA',  unitCost: 3200, total: 3200 },
  { category: 'Appliances',   item: 'Built-in refrigerator',quantity:   1, unit: 'EA',  unitCost: 4500, total: 4500 },
]

// ── Design Concept Hero (all tiers) ───────────────────────────────────────────

function DesignConceptHero({ concept }: { concept: Concept }) {
  const dc = concept.designConcept
  if (!dc) return null

  const buildabilityMeta: Record<string, { label: string; cls: string }> = {
    'feasible':               { label: '✓ Feasible',        cls: 'bg-green-100 text-green-800 border-green-200' },
    'feasible-with-variance': { label: '⚠ Variance Needed', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    'challenging':            { label: '⚡ Complex Scope',   cls: 'bg-red-100 text-red-800 border-red-200' },
  }
  const bm = buildabilityMeta[concept.buildabilityFlag ?? 'feasible'] ?? buildabilityMeta['feasible']

  return (
    <section className="bg-gradient-to-br from-slate-900 to-[#1A2B4A] rounded-2xl p-8 text-white">
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

// ── Tier 3 consultation CTA ───────────────────────────────────────────────────

function Tier3ConsultationCTA() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#1A2B4A] to-[#243B63] p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">Premium+ Exclusive</p>
          <h3 className="text-lg font-bold text-white mb-1">Complimentary 30-min Design Consultation</h3>
          <p className="text-sm text-slate-300">Review your concept with a Kealee design consultant. Your $200 permit filing credit is included with this package.</p>
        </div>
        <Link
          href="/schedule"
          className="shrink-0 inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          <Calendar className="w-4 h-4" /> Book Consultation
        </Link>
      </div>
    </div>
  )
}

// ── Upgrade banner (tier 1 & 2) ───────────────────────────────────────────────

function UpgradeBanner({ currentTier }: { currentTier: 1 | 2 | 3 }) {
  if (currentTier === 3) return null
  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
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

function RenderSlot({ url, index }: { url: string | null; index: number }) {
  if (url) {
    return (
      <div className="group relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
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
  return (
    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center gap-2">
      <Loader2 className="w-6 h-6 text-[#E8724B] animate-spin" />
      <p className="text-xs text-slate-400">Rendering {index + 1} generating…</p>
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
  // Live video URL once polling resolves it
  const [liveVideoUrl, setLiveVideoUrl] = useState<string | undefined>(undefined)

  // Ref flags to prevent duplicate interval registrations
  const renderPollStarted = useRef(false)
  const videoPollStarted  = useRef(false)

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
        setRenderSlots((prev) => {
          const existing  = data.renderings ?? []
          const jobCount  = data.renderJobs?.length ?? 0
          const slotCount = Math.max(existing.length, jobCount)
          if (slotCount === 0) return prev
          return Array.from({ length: slotCount }, (_, i) => existing[i] || null)
        })

        if (data.status === 'processing') {
          interval = setInterval(async () => {
            try {
              const r = await fetch(`/api/concepts/${conceptId}`)
              if (!r.ok) return
              const updated: Concept = await r.json()
              setConcept(updated)
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

    const jobs      = concept.renderJobs
    const completed = new Set<number>()

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

      await Promise.allSettled(
        jobs.map(async (predictionId, i) => {
          if (completed.has(i)) return
          try {
            const r = await fetch(`/api/concept/renders/${predictionId}`)
            if (!r.ok) return
            const data = await r.json()
            if (data.status === 'completed' && data.outputUrl) {
              completed.add(i)
              setRenderSlots((prev) => {
                const next = [...prev]
                next[i]   = data.outputUrl as string
                return next
              })
            } else if (data.status === 'failed') {
              completed.add(i)   // stop retrying failed jobs
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
    if (!concept || concept.tier < 2 || videoPollStarted.current) return
    // If video URL is already populated, nothing to poll
    if (concept.videoUrl && !concept.videoUrl.includes('ForBiggerBlazes')) {
      setLiveVideoUrl(concept.videoUrl)
      return
    }
    videoPollStarted.current = true

    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/concept/video?intakeId=${conceptId}`)
        if (!r.ok) return
        const data = await r.json()
        if (data.status === 'completed' && data.outputUrl) {
          setLiveVideoUrl(data.outputUrl as string)
          clearInterval(interval)
        } else if (data.status === 'failed') {
          clearInterval(interval)
        }
      } catch {}
    }, VIDEO_POLL_MS)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept?.id, concept?.tier])

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

  if (concept.status === 'processing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 px-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#E8724B] animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Creating Your Concept</h2>
          <p className="text-slate-500 max-w-sm">Our AI is generating your renders, cost estimate, and permit analysis. This takes 2–5 minutes.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full">
          {['AI rendering generation', 'Cost estimation analysis', 'Zoning & permit research', 'MEP specification'].map((step, i) => (
            <div key={step} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
              <div className="w-5 h-5 rounded-full border-2 border-[#E8724B] border-t-transparent animate-spin shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
              <span className="text-sm text-slate-600">{step}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Concept ready — render the deliverable ────────────────────────────────────

  const displayVideoUrl = liveVideoUrl ?? concept.videoUrl
  const hasRenderJobs   = (concept.renderJobs?.length ?? 0) > 0
  const rendersComplete = renderSlots.every(Boolean)
  const showRenderSection = renderSlots.length > 0 || hasRenderJobs

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A2B4A] to-[#1A2B4A]/90 py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">
            {concept.tier === 3 ? 'Premium+ Concept Package' : concept.tier === 2 ? 'Premium Concept Package' : 'Concept Package'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{concept.service} Concept</h1>
          <p className="text-slate-400 mb-8">Generated {new Date(concept.createdAt).toLocaleDateString()}</p>
          <DownloadShare conceptId={conceptId} />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 space-y-16">

        {/* Design Concept Hero — all tiers */}
        <DesignConceptHero concept={concept} />

        {/* Before & After — shown when client uploaded photos during intake */}
        {concept.beforeUrls && concept.beforeUrls.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Before &amp; After</h2>
            <p className="text-slate-500 mb-6">
              Your uploaded photos alongside the AI-generated design vision.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {concept.beforeUrls.map((beforeUrl, i) => (
                <div key={i} className="space-y-3">
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
                    <img src={beforeUrl} alt={`Before ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-md">Before</span>
                  </div>
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
                    {renderSlots[i] ? (
                      <>
                        <img src={renderSlots[i]!} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-[#E8724B]/90 text-white text-xs font-semibold px-2 py-1 rounded-md">After</span>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
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
          <section>
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
              {rendersComplete && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> All renders complete
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderSlots.map((url, i) => (
                <RenderSlot key={i} url={url} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Video — tier 2+ active, tier 1 locked */}
        {concept.tier >= 2 ? (
          <section>
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
            ) : (
              <div className="rounded-2xl bg-slate-100 border border-slate-200 p-12 text-center">
                <Loader2 className="w-8 h-8 text-[#E8724B] animate-spin mx-auto mb-3" />
                <p className="text-slate-600 font-medium text-sm mb-1">Video generating</p>
                <p className="text-slate-400 text-xs">AI video generation typically takes 1–3 minutes. This page updates automatically.</p>
              </div>
            )}
          </section>
        ) : (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Transformation Video</h2>
            <LockedFeatureCard
              icon={<Video className="w-6 h-6 text-slate-400" />}
              title="60-Second AI Transformation Video"
              description="See your space transformed — a cinematic before/after reveal generated by AI, ready to share with family or contractors."
            />
          </section>
        )}

        {/* Floor Plan — tier 2+ active, tier 1 locked */}
        {concept.tier >= 2 ? (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {concept.tier === 3 ? 'Interactive Multi-Layer Floor Plan' : '2D Architectural Floor Plan'}
            </h2>
            <p className="text-slate-500 mb-6">
              {concept.tier === 3
                ? 'Toggle MEP system layers — electrical, plumbing, HVAC — with CAD download'
                : 'Architectural layout with room dimensions and scale'}
            </p>
            <FloorPlan tier={concept.tier} floorPlanUrl={concept.floorPlanUrl} mepSchematic={concept.mepSchematic} conceptId={conceptId} />
          </section>
        ) : (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Architectural Floor Plan</h2>
            <LockedFeatureCard
              icon={<Lock className="w-6 h-6 text-slate-400" />}
              title="2D Architectural Floor Plan"
              description="A scaled floor plan with room dimensions — the document your contractor needs to price and bid the job."
            />
          </section>
        )}

        {/* Specification Tabs — all tiers */}
        <section>
          <SpecificationTabs concept={concept} tier={concept.tier} />
        </section>

        {/* Bill of Materials — tier 2+ full, tier 1 locked */}
        {concept.tier >= 2 ? (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Detailed Cost Breakdown</h2>
            <p className="text-slate-500 mb-6">Line-item materials and estimated costs</p>
            <BillOfMaterials items={concept.billOfMaterials?.length ? concept.billOfMaterials : SAMPLE_BOM} />
          </section>
        ) : (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Detailed Bill of Materials</h2>
            <LockedFeatureCard
              icon={<Lock className="w-6 h-6 text-slate-400" />}
              title="Full Line-Item Cost Breakdown"
              description="A detailed BOM with quantities, unit costs, and totals for every material — ready to hand to a contractor for accurate bidding."
            />
          </section>
        )}

        {/* Tier 3: Consultation CTA */}
        {concept.tier === 3 && (
          <div className="print:hidden"><Tier3ConsultationCTA /></div>
        )}

        {/* Upgrade banner (tier 1 & 2) */}
        <div className="print:hidden"><UpgradeBanner currentTier={concept.tier} /></div>

        {/* Final CTA */}
        <section className="print:hidden bg-gradient-to-r from-[#E8724B] to-[#D45C33] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Build?</h2>
          <p className="text-orange-100 mb-6">Connect with a Kealee-vetted contractor in your area.</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-white text-[#E8724B] hover:bg-orange-50 font-bold px-7 py-3 rounded-xl transition-all"
          >
            Find a Contractor <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  )
}
