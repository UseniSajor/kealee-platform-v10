/**
 * GET /api/command-center/analytics
 *
 * Returns real analytics derived from public_intake_leads:
 * - KPIs: estimated revenue (paid intakes × tier price), intake counts, unique users
 * - Revenue by service type
 * - Conversion funnel from status distribution
 * - Top markets from project_address
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 0

// Tier prices: [tier1, tier2, tier3]
const PRICE_MAP: Record<string, [number, number, number]> = {
  kitchen_remodel:               [149, 699, 1299],
  bathroom_remodel:              [129, 549,  999],
  exterior_concept:              [139, 599, 1099],
  interior_reno_concept:         [149, 649, 1199],
  interior_renovation:           [149, 649, 1199],
  whole_home_concept:            [249, 899, 1699],
  whole_home_remodel:            [249, 899, 1699],
  addition_expansion:            [199, 799, 1499],
  garden_concept:                [ 99, 399,  799],
  capture_site_concept:          [149, 599, 1099],
  design_build:                  [249, 899, 1699],
  design_estimate_permit_bundle: [299, 999, 1999],
  developer_concept:             [299, 999, 1999],
  single_lot_development:        [299, 999, 1999],
  single_family_subdivision:     [399,1299, 2499],
  townhome_subdivision:          [399,1299, 2499],
  development_feasibility:       [299, 999, 1999],
  mixed_use:                     [299, 999, 1999],
  commercial_office:             [299, 999, 1999],
  multi_unit_residential:        [299, 999, 1999],
  permit_path_only:              [199, 699, 1299],
  cost_estimate:                 [149, 499,  999],
  contractor_match:              [ 99, 299,  599],
}

function getPrice(projectPath: string, tier: number): number {
  const prices = PRICE_MAP[projectPath] ?? [149, 599, 1199]
  return prices[Math.min(Math.max(tier - 1, 0), 2)]
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
    .select('id, project_path, status, contact_email, created_at, form_data, project_address')
    .order('created_at', { ascending: false })

  if (error || !intakes) {
    return NextResponse.json({ live: false, error: error?.message ?? 'Query failed' }, { status: 500 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo  = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const paidIntakes   = intakes.filter(i => i.status === 'paid' || i.status === 'concept_ready')
  const recentIntakes = intakes.filter(i => i.created_at >= thirtyDaysAgo)
  const prevIntakes   = intakes.filter(i => i.created_at >= sixtyDaysAgo && i.created_at < thirtyDaysAgo)

  // ── Revenue estimation ────────────────────────────────────────────────────

  let totalRevenue = 0
  let recentRevenue = 0
  let prevRevenue = 0
  const revenueByPath: Record<string, { revenue: number; count: number }> = {}

  for (const intake of paidIntakes) {
    const fd   = (intake.form_data as Record<string, unknown> | null) ?? {}
    const tier = typeof fd.tier === 'number' ? fd.tier : 1
    const price = getPrice(intake.project_path ?? '', tier)
    totalRevenue += price
    const path = intake.project_path ?? 'unknown'
    if (!revenueByPath[path]) revenueByPath[path] = { revenue: 0, count: 0 }
    revenueByPath[path].revenue += price
    revenueByPath[path].count  += 1
  }

  for (const intake of recentIntakes) {
    if (intake.status !== 'paid' && intake.status !== 'concept_ready') continue
    const fd   = (intake.form_data as Record<string, unknown> | null) ?? {}
    const tier = typeof fd.tier === 'number' ? fd.tier : 1
    recentRevenue += getPrice(intake.project_path ?? '', tier)
  }

  for (const intake of prevIntakes) {
    if (intake.status !== 'paid' && intake.status !== 'concept_ready') continue
    const fd   = (intake.form_data as Record<string, unknown> | null) ?? {}
    const tier = typeof fd.tier === 'number' ? fd.tier : 1
    prevRevenue += getPrice(intake.project_path ?? '', tier)
  }

  // Revenue by package (top 8)
  const revenueByPackage = Object.entries(revenueByPath)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8)
    .map(([path, data]) => ({
      name:    path.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      revenue: data.revenue,
      count:   data.count,
    }))

  // ── Conversion funnel ─────────────────────────────────────────────────────

  const totalIntakes    = intakes.length
  const processingCount = intakes.filter(i => i.status === 'processing').length
  const paidCount       = paidIntakes.length

  const funnel = [
    { stage: 'Intake Submitted',      count: totalIntakes, pct: 100 },
    { stage: 'In Review / Processing', count: processingCount + paidCount,
      pct: totalIntakes > 0 ? Math.round(((processingCount + paidCount) / totalIntakes) * 100) : 0 },
    { stage: 'Concept Ready / Paid',  count: paidCount,
      pct: totalIntakes > 0 ? Math.round((paidCount / totalIntakes) * 100) : 0 },
  ]

  // ── Top markets ───────────────────────────────────────────────────────────

  const cityCount: Record<string, { projects: number; revenue: number }> = {}

  for (const intake of paidIntakes) {
    const addr  = (intake as { project_address?: string }).project_address ?? ''
    const parts = addr.split(',').map((p: string) => p.trim())

    let city = 'Unknown'
    if (parts.length >= 3) {
      // "123 Main St, Austin, TX 78701" → "Austin, TX"
      const statePart = parts[parts.length - 1].split(' ')[0]
      city = `${parts[parts.length - 2]}, ${statePart}`
    } else if (parts.length === 2) {
      city = parts[0]
    } else if (addr) {
      city = 'Other'
    }

    if (!cityCount[city]) cityCount[city] = { projects: 0, revenue: 0 }
    cityCount[city].projects += 1
    const fd   = (intake.form_data as Record<string, unknown> | null) ?? {}
    const tier = typeof fd.tier === 'number' ? fd.tier : 1
    cityCount[city].revenue += getPrice(intake.project_path ?? '', tier)
  }

  const topMarkets = Object.entries(cityCount)
    .sort((a, b) => b[1].projects - a[1].projects)
    .slice(0, 6)
    .map(([city, data]) => ({ city, projects: data.projects, revenue: data.revenue }))

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const revenueChangePct = prevRevenue > 0
    ? Math.round(((recentRevenue - prevRevenue) / prevRevenue) * 100)
    : recentRevenue > 0 ? 100 : 0

  const recentPaidCount = recentIntakes.filter(i => i.status === 'paid' || i.status === 'concept_ready').length
  const prevPaidCount   = prevIntakes.filter(i => i.status === 'paid' || i.status === 'concept_ready').length
  const paidChangePct   = prevPaidCount > 0
    ? Math.round(((recentPaidCount - prevPaidCount) / prevPaidCount) * 100)
    : recentPaidCount > 0 ? 100 : 0

  const recentIntakeCount = recentIntakes.length
  const prevIntakeCount   = prevIntakes.length
  const intakeChangePct   = prevIntakeCount > 0
    ? Math.round(((recentIntakeCount - prevIntakeCount) / prevIntakeCount) * 100)
    : recentIntakeCount > 0 ? 100 : 0

  return NextResponse.json({
    live: true,
    kpis: {
      totalRevenue,
      recentRevenue30d:      recentRevenue,
      revenueChangePct,
      totalIntakes,
      recentIntakes30d:      recentIntakeCount,
      intakeChangePct,
      paidCount,
      recentPaidCount30d:    recentPaidCount,
      paidChangePct,
      uniqueUsers:           new Set(intakes.map(i => i.contact_email)).size,
    },
    revenueByPackage,
    funnel,
    topMarkets,
    generatedAt: new Date().toISOString(),
  })
}
