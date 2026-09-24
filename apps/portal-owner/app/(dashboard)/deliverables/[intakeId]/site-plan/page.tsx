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
  parseSitePlanReview,
  reviewSubjectLabel,
  sitePlanDocumentUrl,
  sitePlanOrderStage,
  SITE_PLAN_PACKAGE_GUIDES,
  SITE_PLAN_LABELS,
  type SitePlanDeliverable, sitePlanDataExportUrl } from '@/lib/site-plan-deliverable'

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

function fmtDeliveryDate(value: unknown): string | null {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
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
  const packageGuide = isSitePlanProjectPath(path) ? SITE_PLAN_PACKAGE_GUIDES[path] : null
  const address = intake.project_address ?? (intake.form_data?.address as string | undefined) ?? ''
  const slaCommitment = intake.form_data?.sitePlanSlaCommitment as string | undefined
  const deliveryDue = fmtDeliveryDate(intake.form_data?.sitePlanDeliveryDueAt)
  const summaryComplete = Boolean(intake.form_data?.sitePlanSummaryCompletedAt)

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
          {/* Progress, not method. A step-by-step narration of how the plan
              is produced gives the customer nothing they can act on and gives
              away how the engine works. What they want to know is that it is
              moving and when it lands. The provenance of the FINISHED plan is
              a different matter and is disclosed on the delivered page — that
              is a sold feature and a liability disclosure, not a leak. */}
          <p className="text-sm text-slate-600 leading-relaxed">
            Your site plan is being prepared. This page updates itself the moment it is
            ready, and we&apos;ll email you as well.
          </p>
          {slaCommitment && (
            <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Your delivery commitment</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{slaCommitment}</p>
              <p className="mt-1 text-xs text-slate-600">
                {summaryComplete ? 'Property and requirements summary complete' : 'Property summary in progress'}
                {' · '}
                {deliveryDue ? `Package due by ${deliveryDue}` : 'Drawing schedule follows survey review'}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const d = state.deliverable
  const stage = sitePlanOrderStage(intake.form_data)
  const review = parseSitePlanReview(intake.form_data)
  const pending = d.qc.pendingSeal
  const p = d.property
  const pdfUrl = sitePlanDocumentUrl(intake.id)
  // Orders delivered before the exports existed have no such field.
  const exports = d.dataExports ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/deliverables" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> My packages
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
            {stage === 'delivered' ? 'Delivered'
              : stage === 'professional_review' ? 'Drafted — professional review next'
              : stage === 'revision' ? 'Reviewer requested changes — revising'
              : stage === 'staff_review' ? 'Reviewed — Kealee preparing the submission'
              : 'In progress'}
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

      {packageGuide && (
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
              {packageGuide.level}
            </p>
            <h2 className="mt-1 text-lg font-bold" style={{ color: NAVY }}>How to read your package</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">{packageGuide.summary}</p>
          </div>
          <div className="grid gap-px bg-slate-100 md:grid-cols-2 xl:grid-cols-5">
            {packageGuide.sections.map(section => (
              <div key={section.number} className="bg-white px-6 py-5">
                <p className="text-xs font-bold" style={{ color: TEAL }}>{section.number}</p>
                <h3 className="mt-1 text-sm font-bold" style={{ color: NAVY }}>{section.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{section.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Professional review notice — full/detailed products */}
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
          {exports.length > 0 && (
            <Card title="Engineering files" icon={<Download className="h-4 w-4" style={{ color: TEAL }} />}>
              <p className="mb-4 text-xs text-gray-500">
                Give these to your engineer, surveyor or architect. They open the drawing
                directly rather than redrawing it from the PDF.
              </p>
              <ul className="space-y-3">
                {exports.map(x => (
                  <li key={x.format} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: NAVY }}>{x.label}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{x.note}</p>
                      </div>
                      {x.available && x.documentId ? (
                        <a
                          href={sitePlanDataExportUrl(intake.id, x.documentId)}
                          download
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {x.byteLength ? `${Math.max(1, Math.round(x.byteLength / 1024))} KB` : 'Download'}
                        </a>
                      ) : (
                        <span className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                          Not available
                        </span>
                      )}
                    </div>
                    {!x.available && x.unavailableReason && (
                      // A file the engine tried and could not produce is a fact
                      // the customer is entitled to. Silence would read as
                      // "this plan has no CAD".
                      <p className="mt-2 text-xs text-amber-800">{x.unavailableReason}</p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-gray-500">
                These files are preliminary and not sealed. The status is stamped inside
                each file so it travels with the drawing.
              </p>
            </Card>
          )}

          {/* Was "What the county records established". The title named the
              source, which the customer neither needs nor should be told:
              "preliminary site plan" already means not-survey-based, and the
              disclaimer says so outright. The FACTS stay — they are on the
              drawing anyway and a customer checking zone or lot area should
              not have to open a PDF — under a title about the property rather
              than about where Kealee looked. */}
          <Card title="Your property" icon={<MapPin className="h-4 w-4" style={{ color: TEAL }} />}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Fact label="Zone" value={p.zoneCode ?? 'Not established'} />
              <Fact label="Lot area" value={fmtSqFt(p.parcelAreaSqFt)} />
              <Fact label="Parcel" value={p.parcelId ?? 'Not established'} />
              <Fact label="Street frontage" value={p.hasStreetFrontage == null ? 'Not established' : p.hasStreetFrontage ? 'Yes' : 'None found'} />
              <Fact label="Municipality"
                value={p.incorporated == null ? 'Not determined' : p.incorporated ? (p.municipality ?? 'Incorporated') : 'Unincorporated county'} />
            </dl>

            {/* SURVEY-AWARE. A preliminary plan is not survey-based, and the
                product name says it. But a customer who supplied a plat, or
                bought the survey add-on, gets a plan resting on something
                stronger — and saying the same thing either way undersells
                theirs and overstates everyone else's. */}
            {d.basis && (
              <div className={`mt-4 rounded-xl border px-4 py-3 ${
                d.basis.kind === 'field_survey'
                  ? 'border-emerald-200 bg-emerald-50'
                  : d.basis.kind === 'recorded_plat'
                    ? 'border-sky-200 bg-sky-50'
                    : 'border-slate-200 bg-slate-50'
              }`}>
                <p className={`text-[11px] font-bold uppercase tracking-wide ${
                  d.basis.kind === 'field_survey' ? 'text-emerald-800'
                    : d.basis.kind === 'recorded_plat' ? 'text-sky-800' : 'text-slate-600'
                }`}>
                  {d.basis.label}
                </p>
                <p className="mt-1 text-sm text-slate-700">{d.basis.statement}</p>
                {d.basis.surveyedOn && (
                  <p className="mt-1 text-xs text-slate-500">
                    Surveyed {new Date(d.basis.surveyedOn).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </p>
                )}
                {d.basis.notEstablished.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {d.basis.notEstablished.map((n, i) => (
                      <li key={i} className="text-xs text-slate-600">· {n}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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

          {review && (
            <Card title="Professional review" icon={<ShieldCheck className="h-4 w-4" style={{ color: TEAL }} />}>
              <p className="text-sm font-semibold" style={{ color: review.state === 'APPROVED' ? '#276749' : '#744210' }}>
                {review.state === 'APPROVED' ? 'Approved on every reviewed subject' : 'Changes requested'}
              </p>
              {review.reviewer && (
                <p className="mt-1 text-sm text-slate-700">
                  {review.reviewer.displayName}
                  {review.reviewer.licenceNumber
                    ? ` — ${[review.reviewer.licenceState, review.reviewer.licenceNumber].filter(Boolean).join(' ')}`
                    : ''}
                </p>
              )}
              <ul className="mt-3 space-y-1.5">
                {review.approvals.map(a => (
                  <li key={a.subject} className="flex items-center gap-2 text-sm text-slate-700">
                    {a.decision === 'APPROVED'
                      ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: TEAL }} />
                      : <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />}
                    <span>{reviewSubjectLabel(a.subject)}</span>
                    <span className="ml-auto text-xs text-gray-400">{a.decision.toLowerCase().replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
              {review.redlines.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                  {review.redlines.map((r, i) => (
                    <li key={`${r.subject}-${i}`} className="text-sm text-slate-700">
                      <span className="font-medium">{reviewSubjectLabel(r.subject)}:</span> {r.comment}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-gray-400">{review.note}</p>
            </Card>
          )}

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
