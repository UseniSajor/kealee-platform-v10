'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, CheckCircle, CheckCircle2, Clock, DollarSign,
  Zap, Wrench, Droplets, Wind, Lightbulb, Download, Share2,
  ChevronDown, ChevronUp, Loader2, Video, ShieldCheck,
  AlertTriangle, MapPin, TrendingUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Render stubs ─────────────────────────────────────────────────────────────

const RENDER_STUBS: Record<string, string[]> = {
  kitchen_remodel: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1920&q=80',
    'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1920&q=80',
    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1920&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&q=80',
  ],
  bathroom_remodel: [
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566752734-2a0cd0e0da49?w=1920&q=80',
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=1920&q=80',
    'https://images.unsplash.com/photo-1620626011761-996317702574?w=1920&q=80',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&q=80',
  ],
  exterior_concept: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80',
  ],
}

function getStubRenders(projectPath: string, tier: number): string[] {
  const stubs = RENDER_STUBS[projectPath] ?? RENDER_STUBS.default
  const count = tier >= 3 ? stubs.length : tier === 2 ? Math.min(6, stubs.length) : 3
  return stubs.slice(0, count)
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BOMItem {
  item: string
  quantity: number
  unit: string
  estimatedCost: number
  description: string
}

interface PermitScope {
  requiresPermit: boolean
  permitTypes: string[]
  estimatedPermitFee: number
  estimatedProcessingDays: number
  requiresPE: boolean
  notes: string
}

interface ConceptData {
  conceptId: string
  projectType: string
  scope: string
  budget: number
  location: string
  estimatedCost: number
  projectTimeline: string
  tier: number
  renderUrls: string[]
  designConcept: {
    style: string
    colorPalette: string[]
    keyFeatures: string[]
  }
  mepSystem: {
    electrical: string
    plumbing: string
    hvac: string
    lighting: string
  }
  billOfMaterials: BOMItem[]
  permitScope: PermitScope | null
  zoningNotes: string
  buildabilityFlag: 'feasible' | 'feasible-with-variance' | 'challenging'
  readinessScore: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MEPRow({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string
}) {
  if (!value || value === 'N/A') return null
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
      </div>
    </div>
  )
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function LoadingState({ label }: { label: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#E8724B' }} />
        <p className="text-slate-500 text-sm">{label}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConceptDeliverablePage() {
  const params  = useParams()
  const intakeId = params.intakeId as string

  const [data,       setData]       = useState<ConceptData | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'polling' | 'ready' | 'error'>('loading')
  const [pollCount,  setPollCount]  = useState(0)
  const [showFullBOM, setShowFullBOM] = useState(false)

  const fetchData = useCallback(async (): Promise<boolean> => {
    try {
      const { data: intake, error } = await supabase
        .from('public_intake_leads')
        .select('*')
        .eq('id', intakeId)
        .single()

      if (error || !intake) return false

      const formData = (intake.form_data as Record<string, unknown>) ?? {}
      if (!formData.conceptOutput || intake.status !== 'concept_ready') return false

      const co = formData.conceptOutput as Record<string, unknown>
      const projectPath = (intake.project_path as string) ?? 'default'
      const tier = typeof formData.tier === 'number' ? formData.tier : 1

      const dc  = (co.designConcept as Record<string, unknown>) ?? {}
      const mep = (co.mepSystem as Record<string, unknown>) ?? {}
      const bom = (co.billOfMaterials as BOMItem[]) ?? []
      const renderUrls = Array.isArray(co.renderUrls) && (co.renderUrls as string[]).length > 0
        ? co.renderUrls as string[]
        : getStubRenders(projectPath, tier)

      setData({
        conceptId:       `concept_${intakeId.slice(0, 8)}`,
        projectType:     (intake.project_path as string)?.replace(/_/g, ' ') ?? 'Concept Package',
        scope:           (co.description as string) ?? (formData.description as string) ?? '',
        budget:          typeof intake.budget_range === 'number' ? intake.budget_range : 0,
        location:        (intake.project_address as string) ?? '',
        estimatedCost:   (co.estimatedCost as number) ?? 0,
        projectTimeline: (co.projectTimeline as string) ?? '4–6 weeks',
        tier,
        renderUrls,
        designConcept: {
          style:        (dc.style as string) ?? 'Modern Contemporary',
          colorPalette: (dc.colorPalette as string[]) ?? [],
          keyFeatures:  (dc.keyFeatures as string[]) ?? [],
        },
        mepSystem: {
          electrical: (mep.electrical as string) ?? '',
          plumbing:   (mep.plumbing as string)   ?? 'N/A',
          hvac:       (mep.hvac as string)        ?? 'N/A',
          lighting:   (mep.lighting as string)    ?? '',
        },
        billOfMaterials: bom,
        permitScope: co.permitScope ? co.permitScope as PermitScope : null,
        zoningNotes:     (co.zoningNotes as string) ?? '',
        buildabilityFlag: ((co.buildabilityFlag as string) ?? 'feasible') as ConceptData['buildabilityFlag'],
        readinessScore:  (co.readinessScore as number) ?? 70,
      })
      return true
    } catch {
      return false
    }
  }, [intakeId])

  useEffect(() => {
    fetchData().then(found => {
      if (found) setLoadStatus('ready')
      else setLoadStatus('polling')
    })
  }, [fetchData])

  // Poll up to 60s for concept to be ready
  useEffect(() => {
    if (loadStatus !== 'polling') return
    if (pollCount >= 12) { setLoadStatus('error'); return }
    const timer = setTimeout(async () => {
      const found = await fetchData()
      if (found) setLoadStatus('ready')
      else setPollCount(c => c + 1)
    }, 5000)
    return () => clearTimeout(timer)
  }, [loadStatus, pollCount, fetchData])

  if (loadStatus === 'loading' || loadStatus === 'polling') {
    return <LoadingState label={loadStatus === 'polling'
      ? `Generating your concept package… (check ${pollCount + 1}/12)`
      : 'Loading your concept package…'} />
  }

  if (loadStatus === 'error' || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-slate-700 font-semibold mb-2">Concept not ready yet</p>
          <p className="text-slate-500 text-sm mb-4">
            Your package is still being generated. Check back in a few minutes or contact support.
          </p>
          <Link href="/deliverables"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#1A2B4A' }}>
            <ArrowLeft className="h-4 w-4" /> Back to Deliverables
          </Link>
        </div>
      </div>
    )
  }

  const displayedBOM = showFullBOM ? data.billOfMaterials : data.billOfMaterials.slice(0, 4)
  const totalBOM     = data.billOfMaterials.reduce((s, r) => s + r.estimatedCost, 0)
  const withinBudget = data.budget > 0 ? data.estimatedCost <= data.budget : true
  const requiresDrawings = data.permitScope?.requiresPermit || data.permitScope?.requiresPE

  return (
    <div className="mx-auto max-w-4xl">

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/deliverables" className="hover:text-gray-600 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Deliverables
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate">{data.projectType}</span>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white overflow-hidden mb-6"
        style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #E8724B, #2ABFBF)' }} />
        <div className="px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: '#2ABFBF' }}>
                  Concept Ready
                </span>
                <span className="text-xs text-gray-400">{data.conceptId}</span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl capitalize" style={{ color: '#1A2B4A' }}>
                {data.projectType}
              </h1>
              {data.scope && (
                <p className="mt-1 text-sm text-gray-500 max-w-xl">{data.scope}</p>
              )}
            </div>
            {data.estimatedCost > 0 && (
              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-400 mb-0.5">Estimated Cost</p>
                <p className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>
                  ${data.estimatedCost.toLocaleString()}
                </p>
                {data.budget > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: withinBudget ? '#38A169' : '#E53E3E' }}>
                    {withinBudget
                      ? `$${(data.budget - data.estimatedCost).toLocaleString()} under budget`
                      : `$${(data.estimatedCost - data.budget).toLocaleString()} over budget`}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              {data.projectTimeline}
            </span>
            {data.budget > 0 && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-gray-400" />
                Budget: ${data.budget.toLocaleString()}
              </span>
            )}
            {data.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                {data.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Concept Renderings ───────────────────────────────────────────── */}
        {data.renderUrls.length > 0 && (
          <section className="rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#E8724B' }} />
                <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>Concept Renderings</h2>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {data.renderUrls.length} render{data.renderUrls.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-4">
              <div className={`grid gap-3 ${data.renderUrls.length === 1 ? 'grid-cols-1' : data.renderUrls.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {data.renderUrls.map((url, i) => (
                  <div key={i}
                    className={`relative overflow-hidden rounded-xl bg-gray-100 ${i === 0 && data.renderUrls.length > 3 ? 'col-span-2 row-span-2' : ''}`}
                    style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={url}
                      alt={`${data.projectType} concept render ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-white text-[10px] font-bold uppercase tracking-widest opacity-70">
                      Render {i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400 text-center">
                AI-curated concept images — final renders delivered in your package within 3–5 business days
              </p>
            </div>
          </section>
        )}

        {/* ── Video Production Card (tier 2+) ─────────────────────────────── */}
        {data.tier >= 2 && (
          <section>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #E8724B 0%, #c75c35 100%)' }}>
              <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-base mb-1">
                    {data.tier >= 3 ? '4 Video Formats — In Production' : 'AI Transformation Video — In Production'}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {data.tier >= 3
                      ? 'Your 60s, 30s, 15s, and 10s AI transformation videos are being produced and will be delivered within your package window.'
                      : 'Your 60-second AI transformation video is being produced — estimated delivery within your package window.'}
                  </p>
                </div>
                <a href="mailto:hello@kealee.com?subject=Video%20Status%20Inquiry"
                  className="shrink-0 rounded-xl bg-white/15 hover:bg-white/25 transition-colors px-4 py-2.5 text-sm font-semibold text-white border border-white/20">
                  Check status →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── Design Concept ───────────────────────────────────────────────── */}
        {data.designConcept.keyFeatures.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#E8793A' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>Design Concept</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">{data.designConcept.style}</span>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Features</p>
                <ul className="space-y-2">
                  {data.designConcept.keyFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {data.designConcept.colorPalette.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Color Palette</p>
                    <div className="flex flex-wrap gap-2">
                      {data.designConcept.colorPalette.map((c, i) => (
                        <span key={i} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-5 mb-2">Timeline</p>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-gray-900">{data.projectTimeline}</span>
                  <span className="text-gray-500 ml-2">estimated project duration</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── MEP Systems ─────────────────────────────────────────────────── */}
        {(data.mepSystem.electrical || data.mepSystem.plumbing || data.mepSystem.lighting) && (
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#7C3AED' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>MEP Systems Specification</h2>
            </div>
            <div className="px-6 py-2">
              <MEPRow icon={Zap}       label="Electrical" value={data.mepSystem.electrical} color="#E8793A" />
              <MEPRow icon={Droplets}  label="Plumbing"   value={data.mepSystem.plumbing}   color="#3B82F6" />
              <MEPRow icon={Wind}      label="HVAC"       value={data.mepSystem.hvac}        color="#2ABFBF" />
              <MEPRow icon={Lightbulb} label="Lighting"   value={data.mepSystem.lighting}    color="#F59E0B" />
            </div>
          </section>
        )}

        {/* ── Bill of Materials ────────────────────────────────────────────── */}
        {data.billOfMaterials.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#38A169' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>Bill of Materials</h2>
              <span className="ml-auto text-xs text-gray-400">{data.billOfMaterials.length} line items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBOM.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">{row.item}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{row.description}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{row.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">{row.unit}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        ${row.estimatedCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={3} className="px-6 py-3 text-sm font-bold text-gray-700">Total Estimated Cost</td>
                    <td className="px-4 py-3 text-right text-base font-bold" style={{ color: '#1A2B4A' }}>
                      ${totalBOM.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {data.billOfMaterials.length > 4 && (
              <button
                onClick={() => setShowFullBOM(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-gray-500 hover:text-gray-700 border-t border-gray-100 transition-colors">
                {showFullBOM
                  ? <><ChevronUp className="h-4 w-4" /> Show less</>
                  : <><ChevronDown className="h-4 w-4" /> Show all {data.billOfMaterials.length} items</>}
              </button>
            )}
          </section>
        )}

        {/* ── Permit & Zoning ─────────────────────────────────────────────── */}
        {(data.permitScope || data.zoningNotes) && (
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#6B46C1' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>Permit &amp; Zoning Assessment</h2>
              <span className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{
                  backgroundColor: data.readinessScore >= 80 ? '#C6F6D5' : data.readinessScore >= 60 ? '#FEFCBF' : '#FED7D7',
                  color: data.readinessScore >= 80 ? '#276749' : data.readinessScore >= 60 ? '#744210' : '#9B2C2C',
                }}>
                {data.readinessScore}% Ready
              </span>
            </div>
            <div className="p-6 space-y-5">
              {/* Readiness bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Permit Readiness Score</p>
                  <p className="text-xs text-gray-500">{data.readinessScore}/100</p>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-2 rounded-full transition-all" style={{
                    width: `${data.readinessScore}%`,
                    backgroundColor: data.readinessScore >= 80 ? '#38A169' : data.readinessScore >= 60 ? '#D69E2E' : '#E53E3E',
                  }} />
                </div>
              </div>

              {/* Buildability */}
              <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{
                borderColor: data.buildabilityFlag === 'feasible' ? '#C6F6D5' : data.buildabilityFlag === 'feasible-with-variance' ? '#FEFCBF' : '#FED7D7',
                backgroundColor: data.buildabilityFlag === 'feasible' ? '#F0FFF4' : data.buildabilityFlag === 'feasible-with-variance' ? '#FFFFF0' : '#FFF5F5',
              }}>
                {data.buildabilityFlag === 'feasible'
                  ? <TrendingUp className="h-5 w-5 shrink-0" style={{ color: '#38A169' }} />
                  : <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: data.buildabilityFlag === 'feasible-with-variance' ? '#D69E2E' : '#E53E3E' }} />}
                <p className="text-sm font-semibold" style={{
                  color: data.buildabilityFlag === 'feasible' ? '#276749' : data.buildabilityFlag === 'feasible-with-variance' ? '#744210' : '#9B2C2C',
                }}>
                  {data.buildabilityFlag === 'feasible'
                    ? 'Buildable — no special approvals needed'
                    : data.buildabilityFlag === 'feasible-with-variance'
                      ? 'Feasible with zoning variance'
                      : 'Challenging — additional review required'}
                </p>
              </div>

              {/* Permit types */}
              {data.permitScope && (
                <div>
                  {data.permitScope.requiresPermit ? (
                    <>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Required Permits</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {data.permitScope.permitTypes.map(pt => (
                          <span key={pt} className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-800">
                            <ShieldCheck className="h-3 w-3" />{pt}
                          </span>
                        ))}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        {data.permitScope.estimatedPermitFee > 0 && (
                          <div className="rounded-lg bg-gray-50 px-4 py-3">
                            <p className="text-xs text-gray-400 mb-0.5">Estimated Permit Fee</p>
                            <p className="font-bold text-gray-900">${data.permitScope.estimatedPermitFee.toLocaleString()}</p>
                          </div>
                        )}
                        {data.permitScope.estimatedProcessingDays > 0 && (
                          <div className="rounded-lg bg-gray-50 px-4 py-3">
                            <p className="text-xs text-gray-400 mb-0.5">Est. Processing Time</p>
                            <p className="font-bold text-gray-900">{data.permitScope.estimatedProcessingDays} days</p>
                          </div>
                        )}
                      </div>
                      {data.permitScope.requiresPE && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                          <p className="text-sm text-amber-800">
                            <span className="font-semibold">PE stamp required.</span> This project requires drawings stamped by a licensed Professional Engineer.
                          </p>
                        </div>
                      )}
                      {data.permitScope.notes && (
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{data.permitScope.notes}</p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">No permit required</span> for this scope. {data.permitScope.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Zoning notes */}
              {data.zoningNotes && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Zoning Notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{data.zoningNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Continue Your Project ────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: '#1A2B4A' }}>Continue Your Project</h2>
          <div className={`grid gap-3 ${requiresDrawings ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
            <Link href="/projects"
              className="flex flex-col rounded-xl p-4 text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A2B4A' }}>
              <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Recommended</span>
              <span className="text-sm font-semibold mb-auto">View Your Project</span>
              <ArrowRight className="h-4 w-4 mt-3" />
            </Link>

            {requiresDrawings && (
              <a href="https://kealee.com/intake/permit_package"
                className="flex flex-col rounded-xl p-4 transition-all hover:shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6B46C120 0%, #6B46C108 100%)', border: '1px solid #6B46C130' }}>
                <span className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6B46C1' }}>
                  {data.permitScope?.requiresPE ? 'PE Required' : 'Permit Filing'}
                </span>
                <span className="text-sm font-semibold text-gray-900 mb-auto">
                  {data.permitScope?.requiresPE ? 'Get Permit-Ready Drawings' : 'File Your Permit'}
                </span>
                <span className="text-xs font-semibold mt-3" style={{ color: '#6B46C1' }}>From $799 →</span>
              </a>
            )}

            <a href="https://kealee.com/intake/cost_estimate"
              className="flex flex-col rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Estimate</span>
              <span className="text-sm font-semibold text-gray-900 mb-auto">Get Detailed Cost Estimate</span>
              <span className="text-xs text-[#E8793A] mt-3 font-semibold">$595 →</span>
            </a>
            <a href="https://kealee.com/intake/contractor_match"
              className="flex flex-col rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Find Help</span>
              <span className="text-sm font-semibold text-gray-900 mb-auto">Match with a Contractor</span>
              <span className="text-xs text-[#2ABFBF] mt-3 font-semibold">$199 →</span>
            </a>
          </div>
        </section>

        {/* ── Download / Share ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 pb-8">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            Download Concept PDF
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Share2 className="h-4 w-4" />
            Share with Contractor
          </button>
          <a href="https://kealee.com/marketplace"
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Wrench className="h-4 w-4" />
            Browse Contractors
          </a>
        </div>

      </div>
    </div>
  )
}
