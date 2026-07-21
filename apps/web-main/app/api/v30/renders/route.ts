import { NextRequest, NextResponse } from 'next/server'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { queueV30DesignRenders } from '@/lib/v30-replicate-renders'

export const dynamic = 'force-dynamic'

/** POST /api/v30/renders — queue Replicate Flux jobs from DesignBot imagePrompts */
export async function POST(req: NextRequest) {
  if (!isV30Enabled()) {
    return NextResponse.json({ error: 'v30 disabled' }, { status: 503 })
  }

  const body = await req.json() as {
    intakeId?: string
    imagePrompts?: string[]
    roomType?: string
  }

  if (!body.intakeId || !body.imagePrompts?.length) {
    return NextResponse.json({ error: 'intakeId and imagePrompts required' }, { status: 400 })
  }

  const predictionIds = await queueV30DesignRenders(
    body.intakeId,
    body.imagePrompts,
    body.roomType ?? 'kitchen',
  )

  return NextResponse.json({
    provider: 'replicate',
    predictionIds,
    note: 'Poll Replicate or use /api/concept/renders/[id] for status',
  })
}
