/**
 * POST /api/admin/site-plan/:workflowId/revision
 *   { description, responses: [{ approvalId, response }], formDataPatch: {…} }
 *
 * The drafter's answer to a professional's redlines — the act that closes the
 * revision loop. See `lib/site-plan-revision.ts`.
 *
 * GET /api/admin/site-plan/:workflowId/revision
 *   The withheld subjects (redlines) a revision must answer, and the inputs
 *   the workflow currently draws from.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getClerkUser } from '@kealee/auth'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import { prisma } from '@kealee/database'
import { submitSitePlanRevision } from '@/lib/site-plan-revision'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { workflowId: string } }) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied
  const wf = await prisma.sitePlanWorkflow.findUnique({ where: { id: params.workflowId }, select: { id: true, metadata: true } })
  if (!wf) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  const [withheld, sheets, revisions] = await Promise.all([
    prisma.sitePlanScopedApproval.findMany({
      where: { workflowId: wf.id, supersededById: null, decision: { in: ['CHANGES_REQUESTED', 'REJECTED'] } },
      select: { id: true, subject: true, discipline: true, comment: true, decidedByName: true, decidedAt: true },
    }),
    prisma.sitePlanSheet.findMany({ where: { workflowId: wf.id }, select: { sheetNumber: true, currentRevision: true, status: true } }),
    prisma.sitePlanSheetRevision.findMany({ where: { workflowId: wf.id }, orderBy: { revisionNumber: 'desc' }, take: 10, select: { revisionNumber: true, description: true, issuedBy: true, revisionDate: true, changes: true } }),
  ])
  return NextResponse.json({ redlines: withheld, sheets, revisions, inputs: wf.metadata ?? {} })
}

export async function POST(req: NextRequest, { params }: { params: { workflowId: string } }) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied
  const user = await getClerkUser().catch(() => null)
  const body = (await req.json().catch(() => ({}))) as {
    description?: unknown; responses?: unknown; formDataPatch?: unknown
  }
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const responses = Array.isArray(body.responses)
    ? (body.responses as unknown[]).flatMap(r => {
        const o = (r ?? {}) as { approvalId?: unknown; response?: unknown }
        return typeof o.approvalId === 'string' && typeof o.response === 'string' ? [{ approvalId: o.approvalId, response: o.response }] : []
      })
    : []
  const formDataPatch = body.formDataPatch && typeof body.formDataPatch === 'object' && !Array.isArray(body.formDataPatch)
    ? (body.formDataPatch as Record<string, unknown>) : {}
  try {
    const out = await submitSitePlanRevision({
      workflowId: params.workflowId,
      actor: { id: user?.id ?? 'ops', name: user?.email ?? 'Kealee staff' },
      description, responses, formDataPatch,
    })
    return NextResponse.json(out, { status: out.enqueued ? 200 : 500 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
