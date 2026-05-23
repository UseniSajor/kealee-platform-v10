/**
 * POST /api/cron/generate-weekly-campaigns — Monday 8 AM ET (schedule in Vercel)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateWeeklyCampaigns } from '@/lib/marketing/campaign-runner'

export const dynamic = 'force-dynamic'

function authorize(req: NextRequest): boolean {
  const secret = process.env.KEALEE_OPS_SECRET || process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('Authorization')
  const ops = req.headers.get('x-kealee-ops')
  return auth === `Bearer ${secret}` || ops === secret
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    const result = await generateWeeklyCampaigns(supabase)
    return NextResponse.json({ status: 'generated', ...result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
