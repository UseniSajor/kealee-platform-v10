/**
 * POST /api/cron/generate-weekly-campaigns
 * 
 * Generates and schedules all campaigns for the week
 * - Creates campaigns for each product
 * - Routes to correct personas
 * - Schedules deliveries
 * - Integrates with lead automation
 * 
 * Run: Every Monday at 8 AM ET
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  KEALEE_PRODUCTS,
  MARKETING_PERSONAS,
  CAMPAIGN_TYPES,
  WEEKLY_CAMPAIGN_ROTATION,
  CAMPAIGN_MESSAGE_TEMPLATES,
} from '@/lib/marketing/marketing-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const CRON_SECRET = process.env.CRON_SECRET
const KEALEE_OPS_SECRET = process.env.KEALEE_OPS_SECRET

export async function POST(req: NextRequest) {
  // ── Authenticate ─────────────────────────────────────────────────────────
  const auth = req.headers.get('Authorization')
  const xKealeeOps = req.headers.get('x-kealee-ops')

  const secret = KEALEE_OPS_SECRET || CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET or KEALEE_OPS_SECRET not set' },
      { status: 500 }
    )
  }

  const isValid =
    (auth && auth === `Bearer ${secret}`) ||
    (xKealeeOps && xKealeeOps === secret)

  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Get current week number
    const now = new Date()
    const weekNum = getWeekNumber(now)

    // Get this week's campaign focus
    const weekKey = `week${(weekNum % 52) + 1}`
    const weekCampaign = WEEKLY_CAMPAIGN_ROTATION[weekKey as keyof typeof WEEKLY_CAMPAIGN_ROTATION] || WEEKLY_CAMPAIGN_ROTATION.week1

    console.log(`Generating campaigns for week ${weekNum}: ${weekCampaign.primary}`)

    // ── Generate 7 daily campaigns ──────────────────────────────────────────

    const campaigns: any[] = []
    const days = Object.values(CAMPAIGN_TYPES)

    for (const day of days) {
      const primaryProduct = KEALEE_PRODUCTS[weekCampaign.primary as keyof typeof KEALEE_PRODUCTS]
      const primaryPersona = MARKETING_PERSONAS[weekCampaign.persona as keyof typeof MARKETING_PERSONAS]

      if (!primaryProduct || !primaryPersona) continue

      // Create campaign record
      const campaign: {
        id: string; week_number: number; product_id: string; secondary_product: string;
        campaign_type: string; persona_id: string; theme: string; scheduled_day: string;
        channels: string[]; status: string; created_at: string;
        email_subject?: string; email_body?: string; message_template?: string;
      } = {
        id: `${weekCampaign.primary}-w${weekNum}-${day.day.toLowerCase()}`,
        week_number: weekNum,
        product_id: weekCampaign.primary,
        secondary_product: weekCampaign.secondary,
        campaign_type: day.name.toLowerCase().replace(/\s+/g, '_'),
        persona_id: weekCampaign.persona,
        theme: weekCampaign.theme,
        scheduled_day: day.day,
        channels: day.channels,
        status: 'scheduled',
        created_at: new Date().toISOString(),
      }

      campaigns.push(campaign)

      // Get message template
      const messageTemplate = CAMPAIGN_MESSAGE_TEMPLATES[weekCampaign.primary as keyof typeof CAMPAIGN_MESSAGE_TEMPLATES]
      const dayKey = day.name.toLowerCase().replace(/\s+/g, '_')
      const templateMap = messageTemplate as Record<string, { subject: string; preview: string; body: string; targetPersona: string }> | undefined
      if (templateMap && templateMap[dayKey]) {
        const msg = templateMap[dayKey]
        campaign.email_subject = msg.subject
        campaign.email_body = msg.body
        campaign.message_template = day.name
      }
    }

    // ── Insert campaigns into database ──────────────────────────────────────

    if (campaigns.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('marketing_campaigns')
        .insert(campaigns)

      if (insertErr) {
        console.error('Campaign insert error:', insertErr)
        return NextResponse.json(
          { error: `Insert failed: ${insertErr.message}` },
          { status: 500 }
        )
      }

      console.log(`Inserted ${campaigns.length} campaigns`)
    }

    // ── Generate follow-up automation ──────────────────────────────────────

    // For leads generated this week, create nurture sequences
    // Phase 1 scores lead → Phase 2 qualifies → Phase 3 routes to product campaign

    const automationRules = {
      scoreToPersona: `If lead score >= 75 AND persona matches campaign → send campaign email`,
      personaToContent: `Route to ${weekCampaign.primary} campaign content`,
      attribution: `Track which campaign → which lead → which customer`,
    }

    // ── Summary ────────────────────────────────────────────────────────────

    const summary = {
      week_number: weekNum,
      primary_product: weekCampaign.primary,
      secondary_product: weekCampaign.secondary,
      persona_targeted: weekCampaign.persona,
      campaigns_created: campaigns.length,
      campaign_days: days.map((d) => d.day),
      expected_leads: campaigns.length * 5, // Assume 5 leads/campaign
      theme: weekCampaign.theme,
      automation: automationRules,
    }

    return NextResponse.json({
      status: 'generated',
      ...summary,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        day: c.scheduled_day,
        type: c.campaign_type,
        product: c.product_id,
      })),
    })
  } catch (err) {
    console.error('Campaign generation error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

/**
 * Get ISO week number (1-52)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
