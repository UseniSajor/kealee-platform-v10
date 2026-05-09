/**
 * GET /api/admin/marketing/dashboard
 * 
 * Real-time marketing automation dashboard
 * Shows Phase 1, 2, 3 metrics and lead status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const CRON_SECRET = process.env.CRON_SECRET
const KEALEE_OPS_SECRET = process.env.KEALEE_OPS_SECRET

export async function GET(req: NextRequest) {
  // Authenticate
  const auth = req.headers.get('Authorization')
  const xKealeeOps = req.headers.get('x-kealee-ops')

  const secret = KEALEE_OPS_SECRET || CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const isValid =
    (auth && auth === `Bearer ${secret}`) ||
    (xKealeeOps && xKealeeOps === secret)

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get time ranges
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)

    const thisMonth = new Date(today)
    thisMonth.setDate(1)

    // ── Phase 1 Metrics ────────────────────────────────────────────────────

    // Total leads today
    const { data: leadsToday, error: err1 } = await supabase
      .from('public_intake_leads')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString())

    // Hot leads today
    const { data: hotToday, error: err2 } = await supabase
      .from('public_intake_leads')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString())
      .eq('routing_tag', 'hot')

    // SMS alerts sent today
    const { data: smsToday, error: err3 } = await supabase
      .from('sms_alert_log')
      .select('id', { count: 'exact' })
      .gte('sent_at', today.toISOString())

    // GHL syncs today
    const { data: ghlToday, error: err4 } = await supabase
      .from('ghl_sync_log')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString())
      .eq('action', 'create')

    // ── Phase 2 Metrics ────────────────────────────────────────────────────

    // AI qualified leads
    const { data: aiQualified, error: err5 } = await supabase
      .from('public_intake_leads')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString())
      .eq('ai_qualification_recommendation', 'qualify')

    // Calendly events scheduled
    const { data: calendlyToday, error: err6 } = await supabase
      .from('calendly_events')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString())

    // ── Phase 3 Metrics ────────────────────────────────────────────────────

    // Leads by source
    const { data: bySource, error: err7 } = await supabase
      .from('public_intake_leads')
      .select('source_channel')
      .gte('created_at', today.toISOString())

    const sourceBreakdown: Record<string, number> = {}
    for (const lead of bySource || []) {
      const source = lead.source_channel || 'unknown'
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1
    }

    // ── Weekly Metrics ────────────────────────────────────────────────────

    const { data: leadsWeek, error: err8 } = await supabase
      .from('public_intake_leads')
      .select('id', { count: 'exact' })
      .gte('created_at', thisWeek.toISOString())

    const { data: hotWeek, error: err9 } = await supabase
      .from('public_intake_leads')
      .select('id', { count: 'exact' })
      .gte('created_at', thisWeek.toISOString())
      .eq('routing_tag', 'hot')

    // ── Monthly Metrics ────────────────────────────────────────────────────

    const { data: leadsMonth, error: err10 } = await supabase
      .from('public_intake_leads')
      .select('id', { count: 'exact' })
      .gte('created_at', thisMonth.toISOString())
      .eq('status', 'paid')

    // ── Error checking ────────────────────────────────────────────────────

    const errors = [err1, err2, err3, err4, err5, err6, err7, err8, err9, err10].filter(Boolean)
    if (errors.length > 0) {
      console.error('Dashboard query errors:', errors)
    }

    // ── Build dashboard response ──────────────────────────────────────────

    const dashboard = {
      timestamp: new Date().toISOString(),
      phase1: {
        leadsToday: leadsToday?.count || 0,
        hotLeadsToday: hotToday?.count || 0,
        hotPercentageToday: leadsToday?.count
          ? ((hotToday?.count || 0) / leadsToday.count * 100).toFixed(1) + '%'
          : '0%',
        smsAlertsSent: smsToday?.count || 0,
        ghlContactsCreated: ghlToday?.count || 0,
      },
      phase2: {
        aiQualifiedToday: aiQualified?.count || 0,
        calendlyEventsScheduled: calendlyToday?.count || 0,
      },
      phase3: {
        sourceBreakdown,
      },
      weekly: {
        totalLeads: leadsWeek?.count || 0,
        hotLeads: hotWeek?.count || 0,
        hotPercentage: leadsWeek?.count
          ? ((hotWeek?.count || 0) / leadsWeek.count * 100).toFixed(1) + '%'
          : '0%',
      },
      monthly: {
        paidLeads: leadsMonth?.count || 0,
      },
    }

    return NextResponse.json(dashboard)
  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
