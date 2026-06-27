import { NextRequest, NextResponse } from 'next/server'
import { processOutreachQueue } from '@/lib/marketing/parcel-outreach/queue'

export const dynamic = 'force-dynamic'

function authorize(req: NextRequest): boolean {
  const secret = process.env.KEALEE_OPS_SECRET || process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('Authorization')
  const ops = req.headers.get('x-kealee-ops')
  return auth === `Bearer ${secret}` || ops === secret
}

/** POST /api/cron/parcel-outreach — send queued parcel owner outreach */
export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processOutreachQueue()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
