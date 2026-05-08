/**
 * GET /api/command-center/marketing
 *
 * Marketing lead stats + lead list for the CC marketing page.
 * Queries public_intake_leads where source = 'marketing_bot' (or any bot source).
 *
 * GET /api/command-center/marketing/sequences is handled in ./sequences/route.ts
 */

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'


export const runtime = 'nodejs'

const MARKETING_SOURCES = ['marketing_bot', 'facebook_bot', 'instagram_dm', 'email_bot', 'chatbot', 'reddit']
const CONVERTED_STATUSES = ['paid', 'concept_ready', 'processing']

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Fetch all marketing-sourced leads
    const { data: leads, error } = await supabase
      .from('public_intake_leads')
      .select('id, contact_email, client_name, project_path, status, created_at, form_data, budget_range, project_address')
      .in('source', MARKETING_SOURCES)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const all = leads ?? []

    // Stats
    const bySource: Record<string, number> = {}
    const byService: Record<string, number> = {}

    for (const lead of all) {
      const src = (lead.form_data as any)?.source ?? 'unknown'
      bySource[src]             = (bySource[src] ?? 0) + 1
      byService[lead.project_path] = (byService[lead.project_path] ?? 0) + 1
    }

    const converted    = all.filter(l => CONVERTED_STATUSES.includes(l.status)).length
    const conversionRate = all.length > 0
      ? `${Math.round((converted / all.length) * 100)}%`
      : '0%'

    // Drip queue count (graceful if table doesn't exist)
    let sequencesPending = 0
    try {
      const { count } = await supabase
        .from('marketing_drip_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      sequencesPending = count ?? 0
    } catch { /* table may not exist yet */ }

    return NextResponse.json({
      live: true,
      leads: all,
      stats: {
        totalLeads:      all.length,
        bySource,
        byService,
        converted,
        conversionRate,
        sequencesPending,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ live: false, error: e.message, leads: [], stats: null }, { status: 500 })
  }
}
