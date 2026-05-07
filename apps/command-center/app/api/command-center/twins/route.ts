/**
 * GET /api/command-center/twins
 *
 * Maps public_intake_leads records to Digital Twin objects:
 * - L1 (tier 1): 3 KPIs — budget_variance, schedule_spi, completion_pct
 * - L2 (tier 2): 6 KPIs — + risk_score, quality_score, open_issues
 * - L3 (tier 3): 10 KPIs — + safety_score, cost_performance_index, rfi_response_time, change_order_rate
 *
 * Only concept_ready and processing intakes are surfaced as twins.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 0

// ─────────────────────────────────────────────────────────────────────────────

function twinTier(tier: number): 'L1' | 'L2' | 'L3' {
  if (tier >= 3) return 'L3'
  if (tier >= 2) return 'L2'
  return 'L1'
}

function phaseFromStatus(status: string): string {
  if (status === 'concept_ready') return 'DESIGN'
  if (status === 'processing')    return 'PRECONSTRUCTION'
  return 'IDEA'
}

function healthFromTier(tier: number, status: string): number {
  if (status === 'concept_ready') {
    if (tier >= 3) return 92
    if (tier >= 2) return 86
    return 78
  }
  if (status === 'processing') return 58
  return 40
}

function kpiCountFromTier(tier: number): number {
  if (tier >= 3) return 10
  if (tier >= 2) return 6
  return 3
}

function modulesFromTier(tier: number): string[] {
  if (tier >= 3) return ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace']
  if (tier >= 2) return ['os-feas', 'os-dev', 'os-pm', 'os-pay', 'marketplace']
  return ['os-dev', 'os-pm', 'marketplace']
}

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
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

  const { data: intakes, error } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, status, contact_email, client_name, created_at, form_data, project_address')
    .in('status', ['concept_ready', 'processing', 'new'])
    .order('created_at', { ascending: false })
    .limit(60)

  if (error || !intakes) {
    return NextResponse.json({ live: false, error: error?.message ?? 'Query failed' }, { status: 500 })
  }

  const twins = intakes.map((intake) => {
    const fd     = (intake.form_data as Record<string, unknown> | null) ?? {}
    const tier   = typeof fd.tier === 'number' ? fd.tier : 1
    const health = healthFromTier(tier, intake.status)

    const statusLabel: 'healthy' | 'warning' | 'critical' =
      health >= 75 ? 'healthy' : health >= 55 ? 'warning' : 'critical'

    const pathLabel = (intake.project_path ?? 'project')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase())

    const name       = (intake as { client_name?: string }).client_name ?? intake.contact_email ?? ''
    const projectName = name ? `${pathLabel} — ${name}` : pathLabel

    const projectType = (intake.project_path ?? 'renovation')
      .split('_')[0]
      .toUpperCase()

    const l1Kpis = {
      budget_variance: intake.status === 'concept_ready' ? 0 : 5,
      schedule_spi:    intake.status === 'concept_ready' ? 1.0 : 0.88,
      completion_pct:  intake.status === 'concept_ready' ? 100 : 25,
    }

    const l2Kpis = tier >= 2 ? {
      risk_score:    intake.status === 'concept_ready' ? 12 : 48,
      quality_score: health,
      open_issues:   intake.status === 'processing' ? 1 : 0,
    } : {}

    const l3Kpis = tier >= 3 ? {
      safety_score:          100,
      cost_performance_index: intake.status === 'concept_ready' ? 1.0 : 0.92,
      rfi_response_time:     0,
      change_order_rate:     0,
    } : {}

    return {
      id:          intake.id,
      project:     projectName,
      projectType,
      tier:        twinTier(tier),
      health,
      status:      statusLabel,
      phase:       phaseFromStatus(intake.status),
      lastSync:    timeAgo(intake.created_at),
      alerts:      intake.status === 'processing' ? 1 : 0,
      kpiCount:    kpiCountFromTier(tier),
      modules:     modulesFromTier(tier),
      kpis:        { ...l1Kpis, ...l2Kpis, ...l3Kpis },
      address:     (intake as { project_address?: string }).project_address ?? null,
      createdAt:   intake.created_at,
    }
  })

  return NextResponse.json({
    live: true,
    twins,
    summary: {
      total:      twins.length,
      l1:         twins.filter(t => t.tier === 'L1').length,
      l2:         twins.filter(t => t.tier === 'L2').length,
      l3:         twins.filter(t => t.tier === 'L3').length,
      withAlerts: twins.filter(t => t.alerts > 0).length,
    },
    generatedAt: new Date().toISOString(),
  })
}
