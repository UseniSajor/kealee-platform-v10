'use client'

/**
 * Site-plan deliverable view.
 *
 * `/deliverables/[intakeId]` is the concept package page and keys everything
 * on `conceptOutput`, which a site-plan order never has. This page reads the
 * engine's `sitePlanDeliverable` record instead: the PDF, what the county
 * sources established, and — because the product promises it — the list of
 * items a licensed professional still has to confirm.
 *
 * The plan is shown the moment the engine renders it. Pending-seal items are
 * reported, never a reason to withhold the drawing.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertCircle, ArrowLeft, CheckCircle2, ClipboardList, Download, FileText,
  Loader2, MapPin, Mountain, ShieldCheck,
} from 'lucide-react'
import {
  isSitePlanProjectPath,
  parseSitePlanDeliverable,
  sitePlanDocumentUrl,
  sitePlanOrderStage,
  SITE_PLAN_LABELS,
  type SitePlanDeliverable,
} from '@/lib/site-plan-deliverable'

const NAVY = '#1A2B4A'
const TEAL = '#2ABFBF'
const ACCENT = '#E8793A'

interface IntakeRow {
  id: string
  project_path: string
  project_address: string | null
  client_name: string | null
  status: string
  form_data: Record<string, unknown> | null
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'in_progress'; intake: IntakeRow }
  | { kind: 'ready'; intake: IntakeRow; deliverable: SitePlanDeliverable }

function fmtSqFt(n: number | null): string {
  return typeof n === 'number' ? `${Math.round(n).toLocaleString('en-US')} sq ft` : 'Not established'
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium" style={{ color: NAVY }}>{value}</dd>
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold" style={{ color: NAVY }}>{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

export default function SitePlanDeliverablePage() {
  const params = useParams<{ intakeId: string }>()
  const intakeId = params?.intakeId ?? ''
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [polls, setPolls] = useState(0)

  const load = useCallback(async () => {
    if (!intakeId) return
    try {
      const res = await fetch(`/api/intake/${encodeURIComponent(intakeId)}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setState({ kind: 'error', message: body.error ?? 'Could not open this order.' })
        return
      }
      const { intake } = (await res.json()) as { intake: IntakeRow }
      const deliverable = parseSitePlanDeliverable(intake.form_data)
      setState(deliverable ? { kind: 'ready', intake, deliverable } : { kind: 'in_progress', intake })
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not open this order.' })
    }
  }, [intakeId])

  useEffect(() => { void load() }, [load])

  // While the engine runs, poll. A stage is a minute or two; the whole chain
  // is usually under ten.
  useEffect(() => {
    if (state.kind !== 'in_progress' || polls >= 60) return
    const t = setTimeout(() => { setPolls(p => p + 1); void load() }, 15_000)
    return () => clearTimeout(t)
  }, [state.kind, polls, load])

  if (state.kind === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: TEAL }} />
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-slate-700 font-semibold mb-2">We couldn&apos;t open this order</p>
          <p className="text-slate-500 text-sm mb-4">{state.message}</p>
          <Link href="/deliverables" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: ACCENT }}>
            <ArrowLeft className="h-4 w-4" /> Back to my packages
          </Link>
        </div>
      </div>
    )
  }

  const { intake } = state
  const path = intake.project_path
  const label = isSitePlanProjectPath(path) ? SITE_PLAN_LABELS[path] : 'Site Plan'
  const address = intake.project_address ?? (intake.form_data?.address as string | undefined) ?? ''

  if (state.kind === 'in_progress') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/deliverables" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> My packages
        </Link>
        <div className="rounded-2xl bg-white p-8" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: TEAL }} />
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>Drafting your {label.toLowerCase()}</h1>
          </div>
          {address && <p className="text-sm text-gray-500 mb-4"><MapPin className="inline h-3.5 w-3.5 mr-1" />{address}</p>}
          <p className="text-sm text-slate-600 leading-relaxed">
            Kealee is locating the parcel, reading the county zoning and contour layers, drawing the
            setbacks and a proposed footprint, and running the drawing through QC. This page updates
            itself when the plan is ready, and we&apos;ll email you too.
          </p>
        </div>
      </div>
    )
  }

  const d = state.deliverable
  const stage = sitePlanOrderStage(intake.form_data)
  const pending = d.qc.pendingSeal
  const p = d.property
  const pdfUrl = sitePlanDocumentUrl(intake.id)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/deliverables" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> My packages
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
            {stage === 'delivered' ? 'Delivered' : stage === 'professional_review' ? 'Drafted — professional review next' : 'In progress'}
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: NAVY }}>{label}</h1>
          {(p.matchedAddress || address) && (
            <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {p.matchedAddress ?? address}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: ACCENT }}>
            <FileText className="h-4 w-4" /> Open plan
          </a>
          <a href={pdfUrl} download
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <Download className="h-4 w-4" /> PDF
          </a>
        </div>
      </div>

      {/* Professional review notice — higher tiers */}
      {stage === 'professional_review' && (
        <div className="mb-6 rounded-2xl border px-5 py-4 flex gap-3" style={{ borderColor: `${TEAL}40`, backgroundColor: '#F1FCFC' }}>
          <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#1A8F8F' }} />
          <div className="text-sm text-slate-700 leading-relaxed">
            <span className="font-semibold" style={{ color: NAVY }}>Your preliminary plan is ready to open now.</span>{' '}
            Your package includes professional review; a Kealee reviewer will work through the items
            below and you&apos;ll be notified when the reviewed plan is released.
          </div>
        </div>
      )}

      {p.internalStaffReviewRequired && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
          <div className="text-sm text-amber-900 leading-relaxed">
            This parcel is inside {p.municipality ? `the ${p.municipality}` : 'a municipal'} boundary.
            Kealee routes incorporated parcels to internal staff review before any permit step.
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Preview */}
        <div className="lg:col-span-3">
          <section className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>Your site plan</h2>
              <span className="text-xs text-gray-400">
                {d.document.pageCount ? `${d.document.pageCount} sheet${d.document.pageCount === 1 ? '' : 's'}` : ''}
              </span>
            </div>
            <iframe
              title="Site plan"
              src={`${pdfUrl}#view=FitH`}
              className="w-full bg-gray-100"
              style={{ height: 'min(70vh, 720px)' }}
            />
            <p className="px-6 py-3 text-xs text-gray-500 border-t border-gray-100">{d.disclaimer}</p>
          </section>
        </div>

        {/* Facts */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="What the county records established" icon={<MapPin className="h-4 w-4" style={{ color: TEAL }} />}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Fact label="Zone" value={p.zoneCode ?? 'Not established'} />
              <Fact label="Lot area" value={fmtSqFt(p.parcelAreaSqFt)} />
              <Fact label="Parcel" value={p.parcelId ?? 'Not established'} />
              <Fact label="Street frontage" value={p.hasStreetFrontage == null ? 'Not established' : p.hasStreetFrontage ? 'Yes' : 'None found'} />
              <Fact label="Municipality"
                value={p.incorporated == null ? 'Not determined' : p.incorporated ? (p.municipality ?? 'Incorporated') : 'Unincorporated county'} />
              <Fact label="Address match" value={p.locatorScore != null ? `${p.locatorScore}/100` : 'Not established'} />
            </dl>
          </Card>

          <Card title="Terrain" icon={<Mountain className="h-4 w-4" style={{ color: TEAL }} />}>
            {d.terrain.contourCount > 0 ? (
              <p className="text-sm text-slate-700">
                {d.terrain.contourCount} contour lines at {d.terrain.intervalFt ?? '?'} ft interval
                {d.terrain.verticalDatum ? `, ${d.terrain.verticalDatum}` : ''}. Existing grade only —
                spot and finished-floor elevations need a field survey.
              </p>
            ) : (
              <p className="text-sm text-slate-700">
                No contour data was available for this parcel. The plan shows the lot and footprint
                without existing grade.
              </p>
            )}
          </Card>

          <Card title="Items still requiring confirmation" icon={<ClipboardList className="h-4 w-4" style={{ color: TEAL }} />}>
            {pending.length === 0 ? (
              <p className="text-sm text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" style={{ color: TEAL }} /> Nothing is outstanding on this plan.
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  A Maryland-licensed professional must confirm these before the plan is used for permit
                  or construction. They do not hold up your preliminary plan.
                </p>
                <ul className="space-y-2">
                  {pending.map(item => (
                    <li key={item.code} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ACCENT }} />
                      <span>{item.message}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {d.qc.summary && <p className="mt-4 text-xs text-gray-400">{d.qc.summary}</p>}
          </Card>
        </div>
      </div>
    </div>
  )
}
