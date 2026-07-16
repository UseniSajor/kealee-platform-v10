import { NextRequest, NextResponse } from 'next/server'
import { processOutreachQueue } from '@/lib/marketing/parcel-outreach/queue'
import { verifyCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

/** POST /api/cron/parcel-outreach — send queued parcel owner outreach */
export async function POST(req: NextRequest) {
  const cronDenied = verifyCronRequest(req)
  if (cronDenied) return cronDenied

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
