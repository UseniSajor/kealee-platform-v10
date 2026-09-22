'use client'

/**
 * Site-plan operations desk.
 *
 * One screen for the things a person does to a site-plan order that the
 * engine cannot do for itself: activate a paid order that has no workflow,
 * re-run a stage after revising inputs, enter the County's comment letter,
 * and see exactly where a workflow stands. Every action goes through the
 * admin API — nothing here writes workflow tables directly.
 */

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, Play, RefreshCw, Zap } from 'lucide-react'

interface Row {
  intakeId: string
  productKey: string
  clientName: string | null
  contactEmail: string | null
  projectAddress: string | null
  status: string
  orderStatus: string | null
  fulfillmentStatus: string | null
  paidAt: string | null
  workflowId: string | null
  workflowDisposition: string | null
  currentStage: string | null
  workflowStatus: string | null
  delivered: boolean
  reviewState: string | null
  submissionState: string | null
  countyCommentCount: number
  countyCommentsIngested: number
}

interface Detail {
  workflow: { id: string; orderId: string; productId: string | null; currentStage: string; status: string }
  stages: { job: string; group: string; status: string; attempt: number; blockers: unknown[]; completedAt: string | null; runnable: boolean; deliverable: boolean }[]
  queue: { jobId: string; jobName: string | null; status: string; attempts: number; error: string | null; result: unknown; createdAt: string }[]
  review: {
    assignment: { status: string; discipline: string } | null
    assignments: { status: string; discipline: string }[]
    approvals: { id: string; subject: string; discipline: string; decision: string; comment: string | null; decidedByName: string | null }[]
    redlines: { id: string; subject: string; discipline: string; decision: string; comment: string | null; decidedByName: string | null }[]
    evidenceCount: number
  }
  order: {
    orderStatus: string | null; orderStatusReason: string | null; fulfillmentStatus: string | null
    countyComments: { id: string; sheet?: string; reviewer: string; comment: string; receivedAt: string }[]
    countyCommentsIngested: string[]
  } | null
  staffRunnable: string[]
}

const PRODUCT_LABEL: Record<string, string> = {
  preliminary_site_plan: 'Preliminary Site Plan',
  verified_site_feasibility: 'Verified Site Feasibility',
  permit_site_plan: 'Permit Site Plan',
}

const STAGE_HINT: Record<string, string> = {
  'siteplan.compose_sheets': 'Re-run the drawing chain after revising inputs (redlines or county comments).',
  'siteplan.route_review': 'Re-read the professional’s decision.',
  'siteplan.ingest_comments': 'Ingest county comments entered below and reopen the chain.',
  'siteplan.run_issuance_qc': 'Re-evaluate the evidence gate after attaching evidence.',
}

function fmt(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'ok' | 'warn' | 'bad' | 'muted' }) {
  const cls = {
    ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warn: 'bg-amber-50 text-amber-900 border-amber-200',
    bad: 'bg-red-50 text-red-800 border-red-200',
    muted: 'bg-slate-100 text-slate-600 border-slate-200',
  }[tone]
  return <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>
}

export function AdminSitePlanClient() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [detail, setDetail] = useState<Record<string, Detail>>({})
  const [notice, setNotice] = useState('')
  const [comment, setComment] = useState({ sheet: '', reviewer: 'DPIE Site/Road Plan Review', comment: '' })

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/site-plan', { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
      setRows(body.rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load site-plan orders')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (workflowId: string) => {
    const res = await fetch(`/api/admin/site-plan/${workflowId}`, { cache: 'no-store' })
    const body = await res.json()
    if (res.ok) setDetail(d => ({ ...d, [workflowId]: body }))
    else setNotice(body.error ?? `HTTP ${res.status}`)
  }, [])

  useEffect(() => { void load() }, [load])

  async function activate(intakeId: string) {
    setBusy(intakeId); setNotice('')
    try {
      const res = await fetch('/api/admin/site-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intakeId }),
      })
      const body = await res.json()
      setNotice(`${body.disposition ?? 'ERROR'}: ${body.summary ?? body.error ?? ''}`)
      await load()
    } finally { setBusy('') }
  }

  async function run(workflowId: string, job: string) {
    setBusy(`${workflowId}:${job}`); setNotice('')
    try {
      const res = await fetch(`/api/admin/site-plan/${workflowId}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job }),
      })
      const body = await res.json()
      setNotice(res.ok ? `Enqueued ${job} (${body.jobKey}). The worker drains the queue within a minute.` : body.error ?? `HTTP ${res.status}`)
      await loadDetail(workflowId)
    } finally { setBusy('') }
  }

  // The drafter's revision: a response per redline, a description, and the input changes (JSON).
  const [revision, setRevision] = useState<{ description: string; responses: Record<string, string>; patch: string }>({ description: '', responses: {}, patch: '{}' })
  async function submitRevision(workflowId: string) {
    setBusy(`${workflowId}:revision`); setNotice('')
    try {
      let formDataPatch: Record<string, unknown>
      try { formDataPatch = JSON.parse(revision.patch || '{}') } catch { setNotice('The input changes must be valid JSON.'); return }
      const res = await fetch(`/api/admin/site-plan/${workflowId}/revision`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: revision.description,
          responses: Object.entries(revision.responses).map(([approvalId, response]) => ({ approvalId, response })),
          formDataPatch,
        }),
      })
      const body = await res.json()
      setNotice(res.ok
        ? `Revision ${body.sheetRevision} submitted: ${body.supersededApprovals} redline(s) reset to PENDING, ${body.reactivatedAssignments} reviewer(s) reactivated, compose_sheets enqueued (${body.jobKey}). The chain re-renders, the customer record is refreshed and the plan is re-routed for review.`
        : body.error ?? `HTTP ${res.status}`)
      if (res.ok) setRevision({ description: '', responses: {}, patch: '{}' })
      await loadDetail(workflowId)
    } finally { setBusy('') }
  }

  async function addComment(workflowId: string) {
    if (!comment.comment.trim()) return
    setBusy(`${workflowId}:comment`); setNotice('')
    try {
      const res = await fetch(`/api/admin/site-plan/${workflowId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countyComments: [comment] }),
      })
      const body = await res.json()
      setNotice(res.ok ? `Comment recorded (${body.total} on the order). Run ingest_comments when the letter is fully entered.` : body.error ?? `HTTP ${res.status}`)
      setComment(c => ({ ...c, sheet: '', comment: '' }))
      await Promise.all([loadDetail(workflowId), load()])
    } finally { setBusy('') }
  }

  function toggle(row: Row) {
    if (!row.workflowId) return
    const next = open === row.workflowId ? null : row.workflowId
    setOpen(next)
    if (next && !detail[next]) void loadDetail(next)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Administration</p>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Site plan orders</h1>
          <button onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Paid site-plan orders and their engine workflows. Activate an order that has none; open a workflow to
          re-run a stage or enter county comments. The engine never approves, seals, or marks a comment addressed.
        </p>

        {notice && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800">{notice}</div>
        )}
        {error && (
          <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 w-6"></th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2">Order status</th>
                <th className="px-3 py-2">Workflow</th>
                <th className="px-3 py-2">Delivered</th>
                <th className="px-3 py-2">Review</th>
                <th className="px-3 py-2">County</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400"><Loader2 className="inline h-4 w-4 animate-spin" /> Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400">No paid site-plan orders.</td></tr>
              )}
              {rows.map(r => {
                const d = r.workflowId ? detail[r.workflowId] : undefined
                const isOpen = open === r.workflowId
                return (
                  <SitePlanRow key={r.intakeId} r={r} d={d} isOpen={isOpen} busy={busy}
                    onToggle={() => toggle(r)} onActivate={() => void activate(r.intakeId)}
                    onRun={(job) => r.workflowId && void run(r.workflowId, job)}
                    comment={comment} setComment={setComment}
                    onAddComment={() => r.workflowId && void addComment(r.workflowId)}
                    revision={revision} setRevision={setRevision}
                    onSubmitRevision={() => r.workflowId && void submitRevision(r.workflowId)} />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

function SitePlanRow(props: {
  r: Row; d?: Detail; isOpen: boolean; busy: string
  onToggle: () => void; onActivate: () => void; onRun: (job: string) => void
  comment: { sheet: string; reviewer: string; comment: string }
  setComment: (u: (c: { sheet: string; reviewer: string; comment: string }) => { sheet: string; reviewer: string; comment: string }) => void
  onAddComment: () => void
  revision: { description: string; responses: Record<string, string>; patch: string }
  setRevision: (u: (v: { description: string; responses: Record<string, string>; patch: string }) => { description: string; responses: Record<string, string>; patch: string }) => void
  onSubmitRevision: () => void
}) {
  const { r, d, isOpen, busy } = props
  return (
    <>
      <tr className="border-t border-slate-100 align-top">
        <td className="px-3 py-2">
          {r.workflowId && (
            <button onClick={props.onToggle} className="text-slate-500 hover:text-slate-900" aria-label="Toggle detail">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </td>
        <td className="px-3 py-2">
          <div className="font-medium text-slate-900">{r.clientName ?? '—'}</div>
          <div className="text-xs text-slate-500">{r.projectAddress ?? '—'}</div>
          <div className="text-[11px] font-mono text-slate-400">{r.intakeId}</div>
        </td>
        <td className="px-3 py-2">{PRODUCT_LABEL[r.productKey] ?? r.productKey}</td>
        <td className="px-3 py-2 whitespace-nowrap">{fmt(r.paidAt)}</td>
        <td className="px-3 py-2">
          <div>{r.orderStatus ?? <span className="text-slate-400">{r.status}</span>}</div>
          {r.fulfillmentStatus && <div className="text-xs text-slate-500">{r.fulfillmentStatus}</div>}
        </td>
        <td className="px-3 py-2">
          {r.workflowId
            ? <><Badge tone={r.workflowStatus === 'ACTIVE' ? 'ok' : 'muted'}>{r.currentStage}</Badge><div className="text-[11px] font-mono text-slate-400 mt-1">{r.workflowId.slice(0, 8)}</div></>
            : <Badge tone="bad">{r.workflowDisposition ?? 'none'}</Badge>}
        </td>
        <td className="px-3 py-2">{r.delivered ? <Badge tone="ok">yes</Badge> : <Badge tone="warn">no</Badge>}</td>
        <td className="px-3 py-2">
          {r.reviewState ? <Badge tone={r.reviewState === 'APPROVED' ? 'ok' : 'warn'}>{r.reviewState}</Badge> : <span className="text-slate-300">—</span>}
          {r.submissionState && <div className="mt-1"><Badge tone={r.submissionState === 'SUBMISSION_READY' ? 'ok' : 'warn'}>{r.submissionState.replace('SUBMISSION_', '')}</Badge></div>}
        </td>
        <td className="px-3 py-2 text-xs text-slate-600">
          {r.countyCommentCount > 0 ? `${r.countyCommentsIngested}/${r.countyCommentCount} ingested` : '—'}
        </td>
        <td className="px-3 py-2 text-right">
          {!r.workflowId && (
            <button onClick={props.onActivate} disabled={busy === r.intakeId}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
              {busy === r.intakeId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Activate
            </button>
          )}
        </td>
      </tr>
      {isOpen && r.workflowId && (
        <tr className="border-t border-slate-100 bg-slate-50/60">
          <td></td>
          <td colSpan={9} className="px-3 py-4">
            {!d ? <span className="text-slate-400 text-xs"><Loader2 className="inline h-3.5 w-3.5 animate-spin" /> Loading workflow…</span> : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Stages</h3>
                  <table className="w-full text-xs">
                    <tbody>
                      {d.stages.map(s => (
                        <tr key={s.job} className="border-t border-slate-100">
                          <td className="py-1 pr-2 font-mono text-slate-700">{s.job.replace('siteplan.', '')}{s.deliverable ? ' ★' : ''}</td>
                          <td className="py-1 pr-2">
                            <Badge tone={s.status === 'COMPLETED' ? 'ok' : s.status === 'AWAITING_REVIEW' || s.status === 'READY' ? 'warn' : s.status === 'BLOCKED' ? 'bad' : 'muted'}>{s.status}</Badge>
                          </td>
                          <td className="py-1 pr-2 text-slate-500">{fmt(s.completedAt)}</td>
                          <td className="py-1 text-right">
                            {d.staffRunnable.includes(s.job) && (
                              <button onClick={() => props.onRun(s.job)} disabled={busy === `${r.workflowId}:${s.job}`}
                                title={STAGE_HINT[s.job]}
                                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] hover:bg-slate-100 disabled:opacity-50">
                                <Play className="h-3 w-3" /> run
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {d.stages.some(s => s.blockers.length > 0) && (
                    <div className="mt-2 text-xs text-red-700">
                      {d.stages.filter(s => s.blockers.length > 0).map(s => <div key={s.job}>{s.job}: {String(s.blockers[0])}</div>)}
                    </div>
                  )}
                </div>
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Order</h3>
                    <div className="text-xs text-slate-700">{d.order?.orderStatus ?? '—'} · {d.order?.fulfillmentStatus ?? '—'}</div>
                    {d.order?.orderStatusReason && <div className="text-xs text-slate-500 mt-1">{d.order.orderStatusReason}</div>}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Professional review</h3>
                    {d.review.assignments?.length
                      ? <div className="text-xs text-slate-700">
                          {d.review.assignments.map(a => <div key={a.discipline}>{a.discipline.replaceAll('_', ' ')} · {a.status}</div>)}
                          <ul className="mt-1">{d.review.approvals.map(a => <li key={a.id}>{a.subject} ({a.discipline.replaceAll('_', ' ')}): {a.decision}{a.decidedByName ? ` — ${a.decidedByName}` : ''}{a.comment ? ` · ${a.comment}` : ''}</li>)}</ul>
                        </div>
                      : <div className="text-xs text-slate-400">Unclaimed. Engineers claim at /engineer/review (OS Engineering); architects at /architect/review (OS Architecture).</div>}
                    <div className="text-xs text-slate-500 mt-1">{d.review.evidenceCount} evidence item(s) attached</div>
                  </div>
                  {d.review.redlines?.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900 mb-2">Drafter: answer the redlines and submit the revision</h3>
                      <p className="text-[11px] text-amber-900 mb-2">Each withheld subject needs a response. The input changes are what makes the next render different — the engine does not apply free-text redlines. Submitting bumps the sheet revision, resets the withheld subjects to PENDING, reactivates the reviewers, re-renders from compose_sheets, refreshes the customer record and re-routes for review.</p>
                      {d.review.redlines.map(rl => (
                        <div key={rl.id} className="mb-2">
                          <div className="text-xs text-slate-800"><span className="font-semibold">{rl.subject}</span> · {rl.discipline.replaceAll('_', ' ')} · {rl.decision}{rl.decidedByName ? ` — ${rl.decidedByName}` : ''}</div>
                          <div className="text-xs text-slate-600 italic">{rl.comment}</div>
                          <input value={props.revision.responses[rl.id] ?? ''} onChange={e => props.setRevision(v => ({ ...v, responses: { ...v.responses, [rl.id]: e.target.value } }))}
                            placeholder="What was done about it" className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs" />
                        </div>
                      ))}
                      <input value={props.revision.description} onChange={e => props.setRevision(v => ({ ...v, description: e.target.value }))}
                        placeholder="Revision description (printed in the sheet's revision block)" className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs" />
                      <textarea value={props.revision.patch} onChange={e => props.setRevision(v => ({ ...v, patch: e.target.value }))} rows={3}
                        placeholder='Input changes as JSON, merged over the workflow form data — e.g. {"frontSetbackFt": 25, "footprintWidthFt": 40}' className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs" />
                      <button onClick={props.onSubmitRevision} disabled={busy === `${r.workflowId}:revision` || !props.revision.description.trim()}
                        className="mt-2 inline-flex items-center gap-1 rounded bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                        {busy === `${r.workflowId}:revision` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Submit revision
                      </button>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">County comments</h3>
                    {d.order?.countyComments.length ? (
                      <ul className="text-xs text-slate-700 space-y-1 mb-2">
                        {d.order.countyComments.map(c => (
                          <li key={c.id}>
                            <span className="font-mono text-slate-400">{c.sheet ?? '—'}</span> {c.comment}
                            {d.order?.countyCommentsIngested.includes(c.id) ? <Badge tone="muted">ingested</Badge> : <Badge tone="warn">new</Badge>}
                          </li>
                        ))}
                      </ul>
                    ) : <div className="text-xs text-slate-400 mb-2">None recorded.</div>}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <input value={props.comment.sheet} onChange={e => props.setComment(c => ({ ...c, sheet: e.target.value }))}
                          placeholder="Sheet (C-100)" className="w-28 rounded border border-slate-300 px-2 py-1 text-xs" />
                        <input value={props.comment.reviewer} onChange={e => props.setComment(c => ({ ...c, reviewer: e.target.value }))}
                          placeholder="Reviewer" className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs" />
                      </div>
                      <textarea value={props.comment.comment} onChange={e => props.setComment(c => ({ ...c, comment: e.target.value }))}
                        placeholder="Comment, verbatim from the County letter" rows={2} className="rounded border border-slate-300 px-2 py-1 text-xs" />
                      <button onClick={props.onAddComment} disabled={!props.comment.comment.trim() || busy === `${r.workflowId}:comment`}
                        className="self-start rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50">
                        Record comment
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Queue</h3>
                    <ul className="text-[11px] font-mono text-slate-600 space-y-0.5 max-h-40 overflow-y-auto">
                      {d.queue.slice(-12).map(q => <li key={q.jobId}>{q.status.padEnd(9)} {q.jobName}{q.error ? ` — ${q.error.slice(0, 80)}` : ''}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
