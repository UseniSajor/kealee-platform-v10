import { NextRequest, NextResponse } from 'next/server'
import type { V30BotType } from '@kealee/kealee-agent-stack'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import { reconcileV30ProjectOnce } from '@/lib/v30-trigger'

export const dynamic = 'force-dynamic'
export const maxDuration = 800

/**
 * Durable worker callback for v30 -> customer deliverable reconciliation.
 *
 * Authentication uses the same ops bearer as the other internal recovery
 * routes. Replays are intentional and safe: every downstream write is keyed
 * by intake/project IDs and each assembly step records its own completion.
 */
export async function POST(req: NextRequest) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  const body = (await req.json().catch(() => ({}))) as {
    intakeId?: unknown
    projectId?: unknown
    requiredBotTypes?: unknown
  }
  const intakeId = typeof body.intakeId === 'string' ? body.intakeId : ''
  const projectId = typeof body.projectId === 'string' ? body.projectId : ''
  const requiredBotTypes = Array.isArray(body.requiredBotTypes)
    ? body.requiredBotTypes.filter((value): value is V30BotType => typeof value === 'string')
    : []

  if (!intakeId || !projectId) {
    return NextResponse.json({ error: 'intakeId and projectId are required' }, { status: 400 })
  }

  try {
    const result = await reconcileV30ProjectOnce(intakeId, projectId, requiredBotTypes)
    return NextResponse.json({ ok: true, intakeId, projectId, ...result })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 502 })
  }
}
