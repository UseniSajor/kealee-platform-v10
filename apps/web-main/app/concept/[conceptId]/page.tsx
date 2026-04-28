'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Share2, ArrowRight, Video, CheckCircle2, Loader2 } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { VideoPlayer } from '@/components/content/VideoPlayer'
import { FloorPlan } from '@/components/content/FloorPlan'
import { SpecificationTabs } from '@/components/content/SpecificationTabs'
import { BillOfMaterials } from '@/components/content/BillOfMaterials'
import { DownloadShare } from '@/components/content/DownloadShare'
import type { Concept } from '@/lib/types'

// Sample BOM for display when real data isn't available
const SAMPLE_BOM = [
  { category: 'Cabinetry', item: 'Upper cabinets', quantity: 12, unit: 'LF', unitCost: 180, total: 2160 },
  { category: 'Cabinetry', item: 'Base cabinets', quantity: 18, unit: 'LF', unitCost: 220, total: 3960 },
  { category: 'Countertops', item: 'Quartz countertop', quantity: 45, unit: 'SF', unitCost: 85, total: 3825 },
  { category: 'Flooring', item: 'Hardwood flooring', quantity: 200, unit: 'SF', unitCost: 12, total: 2400 },
  { category: 'Flooring', item: 'Tile (entry)', quantity: 50, unit: 'SF', unitCost: 8, total: 400 },
  { category: 'Appliances', item: 'Professional range', quantity: 1, unit: 'EA', unitCost: 3200, total: 3200 },
  { category: 'Appliances', item: 'Built-in refrigerator', quantity: 1, unit: 'EA', unitCost: 4500, total: 4500 },
]

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

export default function ConceptDeliverablePage() {
  const params = useParams()
  const conceptId = params.conceptId as string

  const [concept, setConcept] = useState<Concept | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let polling: ReturnType<typeof setInterval>

    async function load() {
      try {
        const res = await fetch(`/api/concepts/${conceptId}`)
        if (res.status === 404) { setNotFound(true); setLoading(false); return }
        if (!res.ok) throw new Error('Fetch failed')
        const data: Concept = await res.json()
        setConcept(data)
        setLoading(false)

        if (data.status === 'processing') {
          polling = setInterval(async () => {
            try {
              const r = await fetch(`/api/concepts/${conceptId}`)
              if (!r.ok) return
              const updated: Concept = await r.json()
              setConcept(updated)
              if (updated.status !== 'processing') clearInterval(polling)
            } catch {}
          }, 3000)
        }
      } catch {
        setLoading(false)
        setNotFound(true)
      }
    }

    load()
    return () => clearInterval(polling)
  }, [conceptId])

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A2B4A] to-[#1A2B4A]/90 py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">Your Concept is Ready</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{concept.service} Concept</h1>
          <p className="text-slate-400 mb-8">Generated {new Date(concept.createdAt).toLocaleDateString()}</p>
          <DownloadShare conceptId={conceptId} />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 space-y-16">

        {/* Video (Tier 2+) */}
        {concept.tier >= 2 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Transformation Video</h2>
            <p className="text-slate-500 mb-6">AI-generated before/after transformation</p>
            {concept.videoUrl ? (
              <VideoPlayer videoUrl={concept.videoUrl} duration={concept.videoDuration} tier={concept.tier} />
            ) : (
              <div className="rounded-2xl bg-slate-100 border border-slate-200 p-12 text-center">
                <Loader2 className="w-8 h-8 text-[#E8724B] animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Video generating — check back shortly</p>
              </div>
            )}
          </section>
        )}

        {/* Floor Plan (Tier 2+) */}
        {concept.tier >= 2 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {concept.tier === 3 ? 'Interactive Multi-Layer Floor Plan' : '2D Architectural Floor Plan'}
            </h2>
            <p className="text-slate-500 mb-6">
              {concept.tier === 3 ? 'Toggle MEP system layers — electrical, plumbing, HVAC' : 'Architectural layout with room dimensions and scale'}
            </p>
            <FloorPlan tier={concept.tier} floorPlanUrl={concept.floorPlanUrl} mepSchematic={concept.mepSchematic} conceptId={conceptId} />
          </section>
        )}

        {/* Specification Tabs */}
        <section>
          <SpecificationTabs concept={concept} tier={concept.tier} />
        </section>

        {/* Image Gallery (if renderings available) */}
        {concept.renderings && concept.renderings.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Project Renderings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {concept.renderings.map((url, i) => (
                <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                  <img src={url} alt={`Rendering ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bill of Materials (Tier 2+) */}
        {concept.tier >= 2 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Detailed Cost Breakdown</h2>
            <p className="text-slate-500 mb-6">Line-item materials and estimated costs</p>
            <BillOfMaterials items={concept.billOfMaterials?.length ? concept.billOfMaterials : SAMPLE_BOM} />
          </section>
        )}

        {/* Upgrade banner */}
        <UpgradeBanner currentTier={concept.tier} />

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-[#E8724B] to-[#D45C33] rounded-2xl p-8 text-center">
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
