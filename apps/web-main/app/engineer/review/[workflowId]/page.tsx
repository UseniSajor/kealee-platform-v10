import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileCheck2, ShieldCheck } from 'lucide-react'
import { completeReview, recordScopedDecision } from '../actions'
import { displayProject, requireAssignedReview, reviewDb } from '@/lib/engineer-review'

export const dynamic = 'force-dynamic'

export default async function EngineerReviewPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params
  let identity
  try { identity = await requireAssignedReview(workflowId) } catch { notFound() }

  const [workflow, sheets, approvals, findings, evidence, issuance, audit] = await Promise.all([
    reviewDb.sitePlanWorkflow.findUnique({ where: { id: workflowId } }),
    reviewDb.sitePlanSheet.findMany({ where: { workflowId }, orderBy: { sheetNumber: 'asc' } }),
    reviewDb.sitePlanScopedApproval.findMany({ where: { workflowId }, orderBy: { subject: 'asc' } }),
    reviewDb.sitePlanQcFinding.findMany({ where: { workflowId, status: 'OPEN' }, orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }] }),
    reviewDb.sitePlanEvidence.findMany({ where: { workflowId, revokedAt: null }, orderBy: { attachedAt: 'desc' } }),
    reviewDb.sitePlanIssuance.findUnique({ where: { workflowId } }),
    reviewDb.sitePlanAuditEvent.findMany({ where: { workflowId }, orderBy: { sequence: 'desc' }, take: 12 }),
  ])
  if (!workflow) notFound()

  const planDocuments = await reviewDb.document.findMany({
    where: { projectId: workflow.projectId, category: { startsWith: 'site-plan' } },
    orderBy: { createdAt: 'desc' },
  })

  const engineeringApprovals = approvals.filter((item: any) => item.discipline === 'professional_engineer')
  const allApproved = engineeringApprovals.length > 0 && engineeringApprovals.every((item: any) =>
    item.decision === 'APPROVED' && item.contentHash && item.twinRevision !== null)
  const blocking = findings.filter((item: any) => item.severity === 'BLOCKING')

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <Link href="/engineer/review" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to queue</Link>

      <section className="rounded-2xl bg-slate-950 p-7 text-white">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Assigned professional review</p>
            <h1 className="mt-2 text-3xl font-semibold">{displayProject(workflow.metadata, `Site plan ${workflow.id.slice(0, 8)}`)}</h1>
            <p className="mt-2 text-slate-300">{workflow.productId ?? 'Site plan'} · workflow v{workflow.definitionVersion} · current stage {workflow.currentStage.replaceAll('_', ' ')}</p>
          </div>
          <div className="grid grid-cols-3 gap-5 text-center text-sm">
            <Metric value={sheets.length} label="Sheets" />
            <Metric value={approvals.filter((a: any) => a.decision === 'APPROVED').length} label={`of ${approvals.length} approved`} />
            <Metric value={blocking.length} label="Open blocks" warn={blocking.length > 0} />
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-semibold">Drawing set</h2>
            {planDocuments.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {planDocuments.map((document: any) => (
                  <a key={document.id} href={`/api/engineer/review/${workflowId}/documents/${document.id}`} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    <Download className="h-4 w-4" /> Download {document.name}
                  </a>
                ))}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {sheets.map((sheet: any) => (
                <div key={sheet.id} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="font-semibold">{sheet.sheetNumber} · {sheet.title}</p><p className="mt-1 text-sm text-slate-500">Revision {sheet.currentRevision} · twin {sheet.twinRevision}</p></div>
                    <FileCheck2 className="h-5 w-5 text-emerald-700" />
                  </div>
                  <p className="mt-4 text-sm text-slate-600">{sheet.scaleLabel ?? 'Scale not recorded'} · {sheet.sheetSize ?? 'Sheet size not recorded'}</p>
                  {sheet.disclosure && <p className="mt-3 border-t pt-3 text-xs text-slate-500">{sheet.disclosure}</p>}
                </div>
              ))}
              {!sheets.length && <Notice text="No persisted sheet records are available. Do not approve until the drawing package is attached." />}
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-xl font-semibold">Scoped professional decisions</h2>
            <p className="mb-4 text-sm text-slate-600">Decide only subjects within your competence. A decision is bound to the recorded twin revision and content hash.</p>
            <div className="space-y-4">
              {approvals.map((approval: any) => (
                <form key={approval.id} action={recordScopedDecision} className="rounded-xl border border-slate-200 bg-white p-5">
                  <input type="hidden" name="workflowId" value={workflowId} />
                  <input type="hidden" name="approvalId" value={approval.id} />
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <p className="font-semibold">{approval.subject.replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-sm text-slate-500">Sheets: {jsonList(approval.appearsOnSheets) || 'not recorded'} · revision {approval.twinRevision ?? 'unbound'}</p>
                    </div>
                    <DecisionBadge decision={approval.decision} />
                  </div>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Review basis or revision direction
                    <textarea name="comment" defaultValue={approval.comment ?? ''} placeholder="Basis, redline direction, or limitation of review" className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-emerald-600" />
                  </label>
                  {approval.discipline === 'professional_engineer' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <DecisionButton value="APPROVED" label="Approve subject" tone="green" />
                      <DecisionButton value="CHANGES_REQUESTED" label="Request revision" tone="amber" />
                      <DecisionButton value="REJECTED" label="Reject subject" tone="red" />
                    </div>
                  ) : (
                    <p className="mt-3 text-xs font-medium text-slate-500">Read only: assigned to {approval.discipline.replaceAll('_', ' ')}.</p>
                  )}
                </form>
              ))}
              {!approvals.length && <Notice text="No responsibility scopes have been created. Review routing must define subjects before professional approval." />}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 text-emerald-700" /><div><h2 className="font-semibold">Complete professional review</h2><p className="mt-1 text-sm text-slate-600">Completion confirms only the scoped decisions above. It does not apply a seal or represent jurisdiction approval.</p></div></div>
            <form action={completeReview} className="mt-5">
              <input type="hidden" name="workflowId" value={workflowId} />
              <button disabled={!allApproved || blocking.length > 0} className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Complete review</button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <Panel title="Open QC findings">
            {findings.map((finding: any) => <div key={finding.id} className="border-b py-3 last:border-0"><p className="text-sm font-semibold">{finding.severity} · {finding.code}</p><p className="mt-1 text-sm text-slate-600">{finding.message}</p><p className="mt-1 text-xs text-slate-500">Remedy: {finding.remedy}</p></div>)}
            {!findings.length && <Good text="No open QC findings." />}
          </Panel>
          <Panel title="Evidence register">
            {evidence.map((item: any) => <div key={item.id} className="border-b py-3 text-sm last:border-0"><p className="font-medium">{item.kind.replaceAll('_', ' ')}</p><p className="text-slate-500">{item.reference}</p></div>)}
            {!evidence.length && <Notice text="No evidence has been attached." compact />}
          </Panel>
          <Panel title="Issuance status">
            <dl className="space-y-3 text-sm"><Row label="State" value={issuance?.deliveryState?.replaceAll('_', ' ') ?? 'Not created'} /><Row label="Reliability" value={`Level ${issuance?.governingReliabilityLevel ?? 0}`} /><Row label="Issuable" value={issuance?.issuable ? 'Yes' : 'No'} /><Row label="Sealed" value={issuance?.sealedAt ? 'Yes' : 'No'} /></dl>
          </Panel>
          <Panel title="Recent audit trail">
            {audit.map((event: any) => <div key={event.id} className="border-b py-3 text-sm last:border-0"><p className="font-medium">{event.eventType}</p><p className="mt-1 text-slate-600">{event.summary}</p><p className="mt-1 text-xs text-slate-400">{new Date(event.occurredAt).toLocaleString()}</p></div>)}
          </Panel>
        </aside>
      </div>
    </main>
  )
}

function Metric({ value, label, warn = false }: { value: number; label: string; warn?: boolean }) { return <div><div className={`text-2xl font-semibold ${warn ? 'text-amber-400' : ''}`}>{value}</div><div className="text-xs text-slate-400">{label}</div></div> }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">{title}</h2><div className="mt-2">{children}</div></section> }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-right">{value}</dd></div> }
function Good({ text }: { text: string }) { return <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{text}</p> }
function Notice({ text, compact = false }: { text: string; compact?: boolean }) { return <div className={`flex gap-2 rounded-lg bg-amber-50 text-amber-950 ${compact ? 'p-3 text-sm' : 'p-5'}`}><AlertTriangle className="h-5 w-5 shrink-0" />{text}</div> }
function DecisionBadge({ decision }: { decision: string }) { return <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : decision === 'PENDING' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-900'}`}>{decision.replaceAll('_', ' ')}</span> }
function DecisionButton({ value, label, tone }: { value: string; label: string; tone: 'green' | 'amber' | 'red' }) { const styles = { green: 'bg-emerald-700 hover:bg-emerald-800', amber: 'bg-amber-600 hover:bg-amber-700', red: 'bg-red-700 hover:bg-red-800' }; return <button name="decision" value={value} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${styles[tone]}`}>{label}</button> }
function jsonList(value: unknown) { return Array.isArray(value) ? value.join(', ') : '' }
