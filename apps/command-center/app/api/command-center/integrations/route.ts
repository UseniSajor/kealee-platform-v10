/**
 * GET /api/command-center/integrations
 *
 * Returns:
 * - Real HTTP ping status + latency for external services
 * - Real intake counts from public_intake_leads for context
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkPlatformIntegrations } from '@/lib/integration-health'

export const runtime = 'nodejs'
export const revalidate = 0

// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ live: false, error: 'Supabase env vars not set' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // Run intake query + pings in parallel
  const [intakesRes, pingsRes] = await Promise.allSettled([
    supabase
      .from('public_intake_leads')
      .select('id, status, created_at')
      .order('created_at', { ascending: false }),

    checkPlatformIntegrations(),
  ])

  // ── Process intakes ─────────────────────────────────────────────────────────

  const intakes = intakesRes.status === 'fulfilled' && !intakesRes.value.error
    ? (intakesRes.value.data ?? [])
    : []

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const totalIntakes  = intakes.length
  const todayIntakes  = intakes.filter(i => i.created_at >= todayStart.toISOString()).length
  const paidIntakes   = intakes.filter(i => i.status === 'paid' || (i.status === 'concept_ready' || i.status === 'delivered')).length

  // ── External service pings ──────────────────────────────────────────────────

  const externalServices = pingsRes.status === 'fulfilled' ? pingsRes.value : []

  // ── Response ─────────────────────────────────────────────────────────────────

  return NextResponse.json({
    live: true,
    intake: { total: totalIntakes, today: todayIntakes, paid: paidIntakes },
    externalServices,
    generatedAt: new Date().toISOString(),
  })
}
