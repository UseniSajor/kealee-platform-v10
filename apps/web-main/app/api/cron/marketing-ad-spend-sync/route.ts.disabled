/**
 * POST /api/cron/marketing-ad-spend-sync
 * Sync Meta/Google/SaaS spend into marketing_channel_spend (daily).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { parseDateRange, syncAdSpendToDatabase, toDateOnly } from '@/lib/marketing/ad-spend'
import { verifyCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const cronDenied = verifyCronRequest(req)
  if (cronDenied) return cronDenied

  try {
    const { searchParams } = new URL(req.url)
    const range = parseDateRange(
      searchParams.get('from'),
      searchParams.get('to') ?? toDateOnly(new Date()),
    )

    const supabase = getSupabaseAdmin()
    const result = await syncAdSpendToDatabase(supabase, range)

    return NextResponse.json({
      ok: true,
      range: { from: toDateOnly(range.from), to: toDateOnly(range.to) },
      ...result,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
