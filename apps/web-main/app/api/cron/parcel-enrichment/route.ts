import { NextRequest, NextResponse } from 'next/server'
import { enrichParcelTarget, applyEnrichment } from '@/lib/marketing/parcel-outreach/enrichment'
import { queueOutreachForTarget } from '@/lib/marketing/parcel-outreach/queue'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function authorize(req: NextRequest): boolean {
  const secret = process.env.KEALEE_OPS_SECRET || process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('Authorization')
  const ops = req.headers.get('x-kealee-ops')
  return auth === `Bearer ${secret}` || ops === secret
}

/** POST /api/cron/parcel-enrichment — enrich pending parcel targets */
export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data: targets } = await supabase
    .from('parcel_outreach_targets')
    .select('*')
    .eq('enrichment_status', 'pending')
    .lt('enrichment_attempts', 3)
    .eq('opted_out', false)
    .is('converted_intake_id', null)
    .limit(40)

  let enriched = 0
  let queued = 0

  for (const target of targets ?? []) {
    const result = await enrichParcelTarget(target)
    await applyEnrichment(target.id, result)
    enriched++

    if (result.status !== 'no_contact') {
      const q = await queueOutreachForTarget(target.id)
      queued += q.queued
    }
  }

  return NextResponse.json({ enriched, queued, pending: targets?.length ?? 0 })
}
