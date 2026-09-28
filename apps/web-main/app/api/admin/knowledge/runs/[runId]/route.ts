/**
 * A person's decision on a generation — the gate between a bot's output and
 * the internal model's training data.
 *
 *   GET  /api/admin/knowledge/runs/:runId   → the run, its inputs and outputs
 *   POST /api/admin/knowledge/runs/:runId   { disposition, note? }
 *        disposition: accepted | corrected | rejected | superseded
 *
 * `accepted` moves the run's outputs to HUMAN_APPROVED, which the registry's
 * policy turns into TRAINING_CANDIDATE (training/qwen/ exports those).
 * `rejected` keeps them as evaluation data only. Nothing becomes training data
 * without this call. Recorded against the reviewer's own identity.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getClerkUser } from '@kealee/auth'
import { verifyOpsBearer } from '@kealee/auth/ops-api-auth'
import { knowledge } from '@/lib/knowledge'

export const dynamic = 'force-dynamic'

const DISPOSITIONS = ['accepted', 'corrected', 'rejected', 'superseded'] as const
type Disposition = (typeof DISPOSITIONS)[number]

async function authorize(req: NextRequest): Promise<{ actorId: string } | NextResponse> {
  if (verifyOpsBearer(req)) return { actorId: 'ops-api' }
  const user = await getClerkUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'super_admin', 'ops'].includes(user.role?.toLowerCase() ?? '')) {
    return NextResponse.json({ error: 'Knowledge disposition requires an administrator or operations role.' }, { status: 403 })
  }
  return { actorId: user.id }
}

export async function GET(req: NextRequest, { params }: { params: { runId: string } }) {
  const access = await authorize(req)
  if (access instanceof NextResponse) return access
  const { runId } = params
  const run = await knowledge().generation.getRun(runId)
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  return NextResponse.json({ run })
}

export async function POST(req: NextRequest, { params }: { params: { runId: string } }) {
  const access = await authorize(req)
  if (access instanceof NextResponse) return access
  const body = (await req.json().catch(() => ({}))) as { disposition?: string; note?: string }
  if (!DISPOSITIONS.includes(body.disposition as Disposition)) {
    return NextResponse.json({ error: `disposition must be one of ${DISPOSITIONS.join(', ')}` }, { status: 400 })
  }
  const { runId } = params
  try {
    const run = await knowledge().generation.disposeGeneration(runId, body.disposition as Disposition, {
      id: access.actorId, note: typeof body.note === 'string' ? body.note.slice(0, 2000) : undefined,
    })
    return NextResponse.json({ run })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Disposition failed' }, { status: 500 })
  }
}
