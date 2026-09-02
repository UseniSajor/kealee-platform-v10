import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Clock3 } from 'lucide-react'
import { claimReview, createProfessionalProfile } from './actions'
import { displayProject, getEngineerIdentity, reviewDb } from '@/lib/engineer-review'

export const dynamic = 'force-dynamic'

export default async function EngineerReviewQueuePage() {
  const identity = await getEngineerIdentity()
  if (!identity) return null

  if (!identity.profile) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Professional onboarding</p>
          <h1 className="mt-2 text-3xl font-semibold">Create your review profile</h1>
          <p className="mt-3 text-slate-600">Your profile remains inactive until Kealee verifies the licence. Registration never grants approval authority automatically.</p>
          <form action={createProfessionalProfile} className="mt-8 grid gap-5 sm:grid-cols-2">
            <Field name="displayName" label="Professional name" required />
            <Field name="firmName" label="Firm" />
            <Field name="licenseNumber" label="PE licence number" required />
            <Field name="licenseState" label="Licence state" maxLength={2} required />
            <button className="sm:col-span-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">Submit for verification</button>
          </form>
        </div>
      </main>
    )
  }

  const [assignments, allActiveAssignments] = await Promise.all([
    reviewDb.sitePlanReviewAssignment.findMany({
      where: { professionalProfileId: identity.profile.id },
      orderBy: { updatedAt: 'desc' },
    }),
    reviewDb.sitePlanReviewAssignment.findMany({
      where: { status: { in: ['ACTIVE', 'REVISION_REQUIRED'] } },
      select: { workflowId: true },
    }),
  ])
  const assignmentIds = assignments.map((item: any) => item.workflowId)
  const claimedWorkflowIds = allActiveAssignments.map((item: any) => item.workflowId)
  const [assignedWorkflows, availableWorkflows] = await Promise.all([
    reviewDb.sitePlanWorkflow.findMany({ where: { id: { in: assignmentIds } }, orderBy: { updatedAt: 'desc' } }),
    identity.profile.isLicensed
      ? reviewDb.sitePlanWorkflow.findMany({
          where: {
            professionalReviewRequired: true,
            status: 'ACTIVE',
            currentStage: { in: ['PROFESSIONAL_REVIEW', 'COMPLIANCE_AUDIT'] },
            NOT: { id: { in: claimedWorkflowIds } },
          },
          orderBy: { updatedAt: 'asc' },
          take: 20,
        })
      : [],
  ])
  const assignedById = new Map(assignedWorkflows.map((item: any) => [item.id, item]))

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-6 py-10">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Professional review</p>
          <h1 className="mt-1 text-3xl font-semibold">Site-plan review queue</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Review generated sheets against cited evidence. Approval applies only to the listed subject and exact revision—not to the entire project.</p>
        </div>
        <StatusBadge verified={identity.profile.isLicensed} />
      </section>

      {!identity.profile.isLicensed && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p><strong>Licence verification pending.</strong> You can view your profile, but cannot claim or decide reviews until an administrator verifies your credentials.</p>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">My assignments</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {assignments.map((assignment: any) => {
            const workflow = assignedById.get(assignment.workflowId) as any
            if (!workflow) return null
            return (
              <Link key={assignment.id} href={`/engineer/review/${workflow.id}`} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-400">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{displayProject(workflow.metadata, `Site plan ${workflow.id.slice(0, 8)}`)}</p>
                    <p className="mt-1 text-sm text-slate-500">{workflow.productId ?? 'Site-plan review'} · {assignment.discipline.replaceAll('_', ' ')}</p>
                  </div>
                  <AssignmentState status={assignment.status} />
                </div>
                <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                  <span>Due {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'not set'}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">Open review <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </div>
              </Link>
            )
          })}
          {!assignments.length && <EmptyState text="No site plans are assigned to you." />}
        </div>
      </section>

      {identity.profile.isLicensed && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Available for review</h2>
          <div className="space-y-3">
            {availableWorkflows.map((workflow: any) => (
              <div key={workflow.id} className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold">{displayProject(workflow.metadata, `Site plan ${workflow.id.slice(0, 8)}`)}</p>
                  <p className="text-sm text-slate-500">{workflow.productId ?? 'Site plan'} · waiting since {new Date(workflow.updatedAt).toLocaleDateString()}</p>
                </div>
                <form action={claimReview}>
                  <input type="hidden" name="workflowId" value={workflow.id} />
                  <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Claim review</button>
                </form>
              </div>
            ))}
            {!availableWorkflows.length && <EmptyState text="No unassigned plans currently require review." />}
          </div>
        </section>
      )}
    </main>
  )
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props
  return <label className="grid gap-2 text-sm font-medium text-slate-700">{label}<input {...inputProps} className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600" /></label>
}

function StatusBadge({ verified }: { verified: boolean }) {
  return <span className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold ${verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{verified ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}{verified ? 'Licence verified' : 'Verification pending'}</span>
}

function AssignmentState({ status }: { status: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : status === 'REVISION_REQUIRED' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-800'}`}>{status.replaceAll('_', ' ')}</span>
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500"><ClipboardCheck className="mx-auto mb-2 h-6 w-6" />{text}</div>
}
