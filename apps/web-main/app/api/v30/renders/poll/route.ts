import { NextRequest, NextResponse } from 'next/server'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { pollV30RenderPredictions, pollV30RendersUntilDone } from '@/lib/v30-replicate-poll'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** POST /api/v30/renders/poll — poll Replicate jobs and fill renderUrls */
export async function POST(req: NextRequest) {
  if (!isV30Enabled()) {
    return NextResponse.json({ error: 'v30 disabled' }, { status: 503 })
  }

  const body = await req.json() as { intakeId?: string; wait?: boolean }
  if (!body.intakeId) {
    return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
  }

  const urls = body.wait
    ? await pollV30RendersUntilDone(body.intakeId)
    : await pollV30RenderPredictions(body.intakeId)

  return NextResponse.json({ renderUrls: urls, count: urls.length })
}
