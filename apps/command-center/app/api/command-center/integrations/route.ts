/**
 * GET /api/command-center/integrations
 *
 * Returns:
 * - Real HTTP ping status + latency for external services
 * - Real intake counts from public_intake_leads for context
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

  // Run intake query + pings in parallel
  const [intakesRes, pingsRes] = await Promise.allSettled([
    supabase
      .from('public_intake_leads')
      .select('id, status, created_at')
      .order('created_at', { ascending: false }),

    Promise.allSettled([
      pingUrl('https://api.stripe.com').then(r => ({ name: 'Stripe',           key: 'stripe',    category: 'Payments',        ...r })),
      pingUrl(supabaseUrl + '/rest/v1/').then(r => ({ name: 'Supabase',         key: 'supabase',  category: 'Auth & Database', ...r })),
      pingUrl('https://api.anthropic.com').then(r => ({ name: 'Anthropic (Claude)', key: 'anthropic', category: 'AI',              ...r })),
      pingUrl('https://api.resend.com').then(r => ({ name: 'Resend',            key: 'resend',    category: 'Email',           ...r })),
      pingUrl('https://api.twilio.com').then(r => ({ name: 'Twilio',            key: 'twilio',    category: 'SMS',             ...r })),
    ]),
  ])

  // ── Process intakes ─────────────────────────────────────────────────────────

  const intakes = intakesRes.status === 'fulfilled' && !intakesRes.value.error
    ? (intakesRes.value.data ?? [])
    : []

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const totalIntakes  = intakes.length
  const todayIntakes  = intakes.filter(i => i.created_at >= todayStart.toISOString()).length
  const paidIntakes   = intakes.filter(i => i.status === 'paid' || i.status === 'concept_ready').length

  // ── External service pings ──────────────────────────────────────────────────

  type PingResult = { name: string; key: string; category: string; status: string; latencyMs: number }
  const externalServices: PingResult[] = []

  if (pingsRes.status === 'fulfilled') {
    for (const result of pingsRes.value) {
      if (result.status === 'fulfilled') {
        const { name, key, category, ok, latencyMs } = result.value as {
          name: string; key: string; category: string; ok: boolean; latencyMs: number
        }
        externalServices.push({ name, key, category, status: ok ? 'operational' : 'degraded', latencyMs })
      }
    }
  }

  // Non-pingable services
  externalServices.push({ name: 'GoHighLevel', key: 'ghl',   category: 'CRM',             status: 'unknown', latencyMs: 0 })
  externalServices.push({ name: 'Redis',       key: 'redis', category: 'Cache & Queue',    status: 'unknown', latencyMs: 0 })

  // ── Response ─────────────────────────────────────────────────────────────────

  return NextResponse.json({
    live: true,
    intake: { total: totalIntakes, today: todayIntakes, paid: paidIntakes },
    externalServices,
    generatedAt: new Date().toISOString(),
  })
}
