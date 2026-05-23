/**
 * POST /api/cron/send-daily-campaigns — Daily 9 AM ET
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTodaysCampaigns } from '@/lib/marketing/campaign-runner'

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

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 503 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    const result = await sendTodaysCampaigns(supabase)
    return NextResponse.json({ status: 'sent', ...result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
