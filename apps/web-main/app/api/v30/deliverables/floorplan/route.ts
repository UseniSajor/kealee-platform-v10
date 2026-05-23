import { NextRequest, NextResponse } from 'next/server'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { finalizeV30FloorplanDeliverables } from '@/lib/v30-floorplan-deliverables'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** POST /api/v30/deliverables/floorplan — GIS lot + Recraft site plan + CAD export */
export async function POST(req: NextRequest) {
  if (!isV30Enabled()) {
    return NextResponse.json({ error: 'v30 disabled' }, { status: 503 })
  }

  const body = await req.json() as {
    intakeId?: string
    projectPath?: string
    floorplanOutput?: Record<string, unknown>
    tier?: 1 | 2 | 3
    features?: string[]
    address?: string
  }

  if (!body.intakeId) {
    return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
  }

  const deliverables = await finalizeV30FloorplanDeliverables({
    intakeId: body.intakeId,
    projectPath: body.projectPath ?? 'garden_concept',
    floorplanOutput: body.floorplanOutput,
    tier: body.tier,
    features: body.features,
    address: body.address,
  })

  return NextResponse.json({ ok: true, deliverables })
}
