/**
 * GET /api/command-center/overview
 *
 * Queries Supabase directly (service role) to return real platform metrics:
 * - Intake counts + distribution by project_path
 * - Unique user (contact_email) count
 * - Status distribution (proxy for lifecycle phases)
 * - Integration health pings
 *
 * Falls back gracefully for any section that fails.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 0

// ── Integration health ping ───────────────────────────────────────────────────

async function pingUrl(url: string, timeoutMs = 4000): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)
    return { ok: res.ok || res.status < 500, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

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

  // Run all queries in parallel
  const [intakesRes, authRes, integrationPings] = await Promise.allSettled([
    // All intake leads
    supabase
      .from('public_intake_leads')
      .select('id, project_path, status, contact_email, created_at')
      .order('created_at', { ascending: false }),

    // Auth users count via admin API
    supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),

    // Ping integrations
    Promise.allSettled([
      pingUrl('https://api.stripe.com').then(r => ({ name: 'Stripe', ...r })),
      pingUrl(supabaseUrl + '/rest/v1/').then(r => ({ name: 'Supabase', ...r })),
      pingUrl('https://api.anthropic.com').then(r => ({ name: 'Anthropic AI', ...r })),
      pingUrl('https://api.resend.com').then(r => ({ name: 'Resend', ...r })),
      pingUrl('https://api.twilio.com').then(r => ({ name: 'Twilio', ...r })),
    ]),
  ])

  // ── Process intakes ─────────────────────────────────────────────────────────

  const intakes = intakesRes.status === 'fulfilled' && !intakesRes.value.error
    ? (intakesRes.value.data ?? [])
    : []

  const totalIntakes   = intakes.length
  const uniqueEmails   = new Set(intakes.map((i: { contact_email: string }) => i.contact_email)).size
  const paidIntakes    = intakes.filter((i: { status: string }) => i.status === 'paid' || i.status === 'concept_ready').length
  const activeIntakes  = intakes.filter((i: { status: string }) => i.status === 'new' || i.status === 'processing').length

  // Distribution by project_path (for phase chart)
  const pathCounts: Record<string, number> = {}
  for (const intake of intakes) {
    const path = (intake as { project_path: string }).project_path || 'unknown'
    pathCounts[path] = (pathCounts[path] ?? 0) + 1
  }

  const pathDistribution = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([path, count]) => ({
      key: path,
      name: path.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
    }))

  // Status distribution (recent 30 days only for events)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recentIntakes = intakes.filter((i: { created_at: string }) => i.created_at >= thirtyDaysAgo)

  // Recent events (last 20 intakes as event feed)
  const recentEvents = intakes.slice(0, 20).map((intake: {
    id: string; project_path: string; client_name?: string; status: string; created_at: string; contact_email: string
  }) => {
    const label = (intake.project_path ?? '').replace(/_/g, ' ')
    const name  = intake.client_name ?? intake.contact_email ?? 'Unknown'
    const isPaid = intake.status === 'paid' || intake.status === 'concept_ready'
    return {
      id: intake.id,
      timestamp: intake.created_at,
      message: isPaid
        ? `New concept purchase: ${label} · ${name}`
        : `New intake: ${label} · ${name}`,
      type: isPaid ? 'success' : 'info',
      module: 'web-main',
    }
  })

  // ── Auth user count ─────────────────────────────────────────────────────────

  let authUserTotal = 0
  if (authRes.status === 'fulfilled' && authRes.value.data) {
    authUserTotal = (authRes.value.data as { total?: number }).total ?? 0
  }

  // Combine: prefer auth count, fall back to unique emails
  const totalUsers = authUserTotal > 0 ? authUserTotal : uniqueEmails

  // ── Integration health ──────────────────────────────────────────────────────

  const integrations: Array<{ name: string; status: string; latencyMs: number }> = []

  if (integrationPings.status === 'fulfilled') {
    for (const result of integrationPings.value) {
      if (result.status === 'fulfilled') {
        const { name, ok, latencyMs } = result.value as { name: string; ok: boolean; latencyMs: number }
        integrations.push({
          name,
          status: ok ? 'operational' : 'degraded',
          latencyMs,
        })
      }
    }
  }

  // GoHighLevel — not publicly pingable, report as unknown
  integrations.push({ name: 'GoHighLevel', status: 'unknown', latencyMs: 0 })
  // Redis — internal, can't ping externally
  integrations.push({ name: 'Redis', status: 'unknown', latencyMs: 0 })

  // ── Response ────────────────────────────────────────────────────────────────

  return NextResponse.json({
    live: true,
    stats: {
      totalIntakes,
      totalUsers,
      paidIntakes,
      activeIntakes,
      recentIntakes30d: recentIntakes.length,
    },
    pathDistribution,
    recentEvents,
    integrations,
    generatedAt: new Date().toISOString(),
  })
}
