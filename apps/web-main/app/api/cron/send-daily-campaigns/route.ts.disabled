/**
 * POST /api/cron/send-daily-campaigns — Daily 9 AM ET
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTodaysCampaigns } from '@/lib/marketing/campaign-runner'
import { verifyCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const cronDenied = verifyCronRequest(req)
  if (cronDenied) return cronDenied

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 503 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const result = await sendTodaysCampaigns(supabase)
  return NextResponse.json(result)
}
