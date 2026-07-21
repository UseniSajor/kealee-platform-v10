/**
 * POST /api/marketing/campaign/start
 *
 * Ops endpoint: generate this week's campaigns + send today's emails (Resend).
 *
 * Auth: Bearer CRON_SECRET | KEALEE_OPS_SECRET | x-marketing-bot-key
 *
 * Body: { "generate": true, "send": true, "dryRun": false, "forceGenerate": false }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import {
  generateWeeklyCampaigns,
  sendTodaysCampaigns,
  getWeekNumber,
  getWeekCampaignKey,
} from '@/lib/marketing/campaign-runner'
import { WEEKLY_CAMPAIGN_ROTATION } from '@/lib/marketing/marketing-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorize(req: NextRequest): boolean {
  const secret =
    process.env.KEALEE_OPS_SECRET ??
    process.env.CRON_SECRET ??
    process.env.MARKETING_BOT_API_KEY

  if (!secret) return process.env.NODE_ENV === 'development'

  const auth = req.headers.get('authorization')
  const botKey = req.headers.get('x-marketing-bot-key')
  const ops = req.headers.get('x-kealee-ops')

  return (
    auth === `Bearer ${secret}` ||
    botKey === secret ||
    ops === secret
  )
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY required to send campaign emails' },
      { status: 503 },
    )
  }

  let body: {
    generate?: boolean
    send?: boolean
    dryRun?: boolean
    forceGenerate?: boolean
  } = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const generate = body.generate !== false
  const send = body.send !== false
  const dryRun = body.dryRun === true

  try {
    const supabase = getSupabaseAdmin()
    const weekNum = getWeekNumber()
    const weekKey = getWeekCampaignKey(weekNum)
    const focus = WEEKLY_CAMPAIGN_ROTATION[weekKey]

    const result: Record<string, unknown> = {
      weekNumber: weekNum,
      weekKey,
      theme: focus.theme,
      primaryProduct: focus.primary,
      persona: focus.persona,
      dryRun,
    }

    if (generate) {
      result.generate = await generateWeeklyCampaigns(supabase, {
        force: body.forceGenerate === true,
      })
    }

    if (send) {
      result.send = await sendTodaysCampaigns(supabase, { dryRun })
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[campaign/start]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  const weekNum = getWeekNumber()
  const weekKey = getWeekCampaignKey(weekNum)
  const focus = WEEKLY_CAMPAIGN_ROTATION[weekKey]
  const dayName = new Date().toLocaleString('en-US', { weekday: 'long' })

  return NextResponse.json({
    endpoint: 'POST /api/marketing/campaign/start',
    description: 'Generate weekly campaigns and send today’s scheduled emails',
    currentWeek: weekNum,
    weekKey,
    focus,
    today: dayName,
    auth: 'Bearer CRON_SECRET | x-marketing-bot-key | x-kealee-ops',
  })
}
