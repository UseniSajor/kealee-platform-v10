'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, CheckCircle2, Clock, DollarSign, Loader2,
  Droplets, Wind, Lightbulb, Zap, ChevronDown, ChevronUp, Video,
  Download, Share2, Sparkles,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BOMItem {
  item: string
  quantity: number
  unit: string
  estimatedCost: number
  description: string
}

interface ConceptOutput {
  designConcept?: {
    style?: string
    colorPalette?: string[]
    keyFeatures?: string[]
  }
  mepSystem?: {
    electrical?: string
    plumbing?: string
    hvac?: string
    lighting?: string
  }
  billOfMaterials?: BOMItem[]
  estimatedCost?: number
  projectTimeline?: string
  description?: string
  includes?: string[]
  renderUrls?: string[]
}

interface Intake {
  id: string
  project_path: string
  client_name: string
  status: string
  created_at: string
  budget_range: string | null
  project_address: string | null
  form_data: {
    tier?: number
    conceptOutput?: ConceptOutput
    [key: string]: unknown
  } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#2ABFBF'
const CORAL  = '#E8724B'
const NAVY   = '#1A2B4A'

function projectLabel(projectPath: string): string {
  return projectPath.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function MEPRow({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | undefined; color: string
}) {
  if (!value || value === 'N/A') return null
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConceptViewerPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const intakeId = params.intakeId as string
  const isWelcome = searchParams.get('welcome') === '1'

  const [intake, setIntake] = useState<Intake | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFullBOM, setShowFullBOM] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`https://kealee.com/api/intake?intakeId=${intakeId}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setIntake(data)

        // If concept not ready yet, start polling
        if (data.status !== 'concept_ready') {
          setPolling(true)
        }
      } catch {
        // leave null
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [intakeId])

  // Poll for concept_ready
  useEffect(() => {
    if (!polling || pollCount >= 12) return
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://kealee.com/api/intake?intakeId=${intakeId}`)
        if (res.ok) {
          const data = await res.json()
          setIntake(data)
          if (data.status === 'concept_ready') setPolling(false)
          else setPollCount((c) => c + 1)
        }
      } catch {
        setPollCount((c) => c + 1)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [polling, pollCount, intakeId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: ACCENT }} />
          <p className="text-slate-500 text-sm">Loading your concept…</p>
        </div>
      </div>
    )
  }

  if (!intake) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <p className="text-slate-500 mb-4">Concept not found or access denied.</p>
        <Link href="/concepts" className="text-sm font-semibold" style={{ color: CORAL }}>← Back to Concepts</Link>
      </div>
    )
  }

  const formData = intake.form_data ?? {}
  const tier = typeof formData.tier === 'number' ? formData.tier : 1
  const tierLabel = tier === 3 ? 'Premium+' : tier === 2 ? 'Premium' : 'Basic'
  const conceptOutput: ConceptOutput = (formData.conceptOutput as ConceptOutput) ?? {}
  const isReady = intake.status === 'concept_ready'

  const dc = conceptOutput.designConcept ?? {}
  const mep = conceptOutput.mepSystem ?? {}
  const bom = conceptOutput.billOfMaterials ?? []
  const renderUrls = conceptOutput.renderUrls ?? []
  const displayedBOM = showFullBOM ? bom : bom.slice(0, 4)
  const totalBOM = bom.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Welcome banner */}
      {isWelcome && (
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3.5">
          <span className="text-xl">🎉</span>
          <p className="text-sm text-teal-800">
            <span className="font-bold">Your concept package is confirmed!</span>{' '}
            {isReady
              ? 'Your concept is ready to view below.'
              : 'We\'re generating your design concept — this page updates automatically.'}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/concepts" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 mb-2 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Concepts
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: isReady ? ACCENT : '#94A3B8' }}>
              {isReady ? 'Concept Ready' : 'Generating…'}
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border"
              style={{ borderColor: `${CORAL}40`, color: CORAL, backgroundColor: `${CORAL}0F` }}>
              Tier {tier} — {tierLabel}
            </span>
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: NAVY }}>
            {projectLabel(intake.project_path)}
          </h1>
          {conceptOutput.description && (
            <p className="mt-1 text-sm text-gray-500 max-w-xl">{conceptOutput.description}</p>
          )}
        </div>

        {(conceptOutput.estimatedCost ?? 0) > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-400 mb-0.5">Estimated Cost</p>
            <p className="text-3xl font-bold" style={{ color: NAVY }}>
              ${(conceptOutput.estimatedCost ?? 0).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Polling state */}
      {!isReady && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-amber-500" />
          <h3 className="font-bold text-amber-900 mb-1">Generating Your Concept</h3>
          <p className="text-sm text-amber-700">
            Our AI is preparing your design package. This usually takes 1–3 minutes.{' '}
            {pollCount > 0 && `(Check ${pollCount}/12)`}
          </p>
          <p className="text-xs text-amber-500 mt-2">This page updates automatically.</p>
        </div>
      )}

      {isReady && (
        <>
          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-b border-gray-100 pb-4">
            {conceptOutput.projectTimeline && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                {conceptOutput.projectTimeline}
              </span>
            )}
            {intake.budget_range && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-gray-400" />
                Budget: {intake.budget_range}
              </span>
            )}
            {intake.project_address && (
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-gray-400" />
                {intake.project_address}
              </span>
            )}
          </div>

          {/* Render Gallery */}
          {renderUrls.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CORAL }} />
                <h2 className="text-base font-bold" style={{ color: NAVY }}>Concept Renderings</h2>
                <span className="ml-auto text-xs text-gray-400">{renderUrls.length} render{renderUrls.length !== 1 ? 's' : ''}</span>
              </div>
              <div className={`p-4 grid gap-3 ${renderUrls.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {renderUrls.map((url, i) => (
                  <div key={i}
                    className={`relative overflow-hidden rounded-xl bg-gray-100 ${i === 0 && renderUrls.length > 3 ? 'col-span-2 row-span-2' : ''}`}
                    style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={url}
                      alt={`Concept render ${i + 1}`}
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
            </section>
          )}

          {/* Video placeholder (tier 2+) */}
          {tier >= 2 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${CORAL} 0%, #c75c35 100%)` }}>
              <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-base mb-1">
                    {tier >= 3 ? '4 Video Formats — In Production' : 'AI Transformation Video — In Production'}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {tier >= 3
                      ? 'Your 60s, 30s, 15s, and 10s AI transformation videos are being produced and will be delivered within your package window.'
                      : 'Your 60-second AI transformation video is being produced — estimated delivery within your package window.'}
                  </p>
                </div>
                <a
                  href="mailto:hello@kealee.com?subject=Video%20Status%20Inquiry"
                  className="shrink-0 rounded-xl bg-white/15 hover:bg-white/25 transition-colors px-4 py-2.5 text-sm font-semibold text-white border border-white/20"
                >
                  Check status →
                </a>
              </div>
            </div>
          )}

          {/* What's Included */}
          {(conceptOutput.includes ?? []).length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                <h2 className="text-base font-bold" style={{ color: NAVY }}>What's Included</h2>
              </div>
              <div className="p-6">
                <ul className="grid sm:grid-cols-2 gap-2">
                  {(conceptOutput.includes ?? []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-teal-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Design Concept */}
          {(dc.keyFeatures ?? []).length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CORAL }} />
                <h2 className="text-base font-bold" style={{ color: NAVY }}>Design Concept</h2>
                <span className="ml-auto text-xs text-gray-400 font-medium">{dc.style}</span>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Features</p>
                  <ul className="space-y-2">
                    {(dc.keyFeatures ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  {(dc.colorPalette ?? []).length > 0 && (
                    <>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Color Palette</p>
                      <div className="flex flex-wrap gap-2">
                        {(dc.colorPalette ?? []).map((c) => (
                          <span key={c} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {conceptOutput.projectTimeline && (
                    <>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-5 mb-2">Timeline</p>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                        <span className="font-semibold text-gray-900">{conceptOutput.projectTimeline}</span>
                        <span className="text-gray-500 ml-2">estimated duration</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* MEP Systems */}
          {(mep.electrical || mep.plumbing || mep.lighting) && (
            <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#7C3AED' }} />
                <h2 className="text-base font-bold" style={{ color: NAVY }}>MEP Systems Specification</h2>
              </div>
              <div className="px-6 py-2">
                <MEPRow icon={Zap}       label="Electrical" value={mep.electrical} color={CORAL} />
                <MEPRow icon={Droplets}  label="Plumbing"   value={mep.plumbing}   color="#3B82F6" />
                <MEPRow icon={Wind}      label="HVAC"       value={mep.hvac}        color={ACCENT} />
                <MEPRow icon={Lightbulb} label="Lighting"   value={mep.lighting}    color="#F59E0B" />
              </div>
            </section>
          )}

          {/* Bill of Materials */}
          {bom.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#38A169' }} />
                <h2 className="text-base font-bold" style={{ color: NAVY }}>Bill of Materials</h2>
                <span className="ml-auto text-xs text-gray-400">{bom.length} line items</span>
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
                      <td className="px-4 py-3 text-right text-base font-bold" style={{ color: NAVY }}>
                        ${totalBOM.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {bom.length > 4 && (
                <button
                  onClick={() => setShowFullBOM((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-gray-500 hover:text-gray-700 border-t border-gray-100 transition-colors"
                >
                  {showFullBOM
                    ? <><ChevronUp className="h-4 w-4" /> Show less</>
                    : <><ChevronDown className="h-4 w-4" /> Show all {bom.length} items</>}
                </button>
              )}
            </section>
          )}

          {/* Permit credit callout */}
          <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3.5">
            <span className="text-xl">💡</span>
            <p className="text-sm text-teal-800">
              <span className="font-bold">This concept cost is credited toward your permit drawing plans.</span>{' '}
              When you proceed to permits, the amount you paid today is deducted from your permit package price.
            </p>
            <a
              href="https://kealee.com/intake/permit_path_only"
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Start permits →
            </a>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pb-4">
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Share2 className="h-4 w-4" />
              Share with Contractor
            </button>
            <Link
              href="/projects/new"
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Create Project from Concept
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
