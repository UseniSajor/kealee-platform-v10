/**
 * POST /api/consultation/gate
 *
 * Consultation gating logic.
 *
 * Business rule:
 * Consultations are ONLY available to:
 * 1. Users who already uploaded approved plans (professional_drawings uploaded)
 * 2. Users who purchased: design_package | permit_package | design_build_package
 *
 * All other users are pushed into:
 * - self-service AI planning (Pascal Editor)
 * - automated preconstruction
 * - paid product upgrades
 *
 * Body:
 *   userId      — current user (optional for anonymous check)
 *   email       — user email (for order lookup)
 *   intakeId    — intake lead ID (if present)
 *   hasPlans    — user self-reports having approved plans
 *
 * Returns:
 *   { allowed: boolean, reason: string, upgradeProduct?: string, upgradeUrl?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const QUALIFYING_PRODUCTS = [
  'design_package',
  'permit_package',
  'design_build_package',
  'professional_drawings',
  'concept',                // paid concept unlocks consultation
]

const QUALIFYING_INTAKE_PATHS = [
  'professional_drawings',
  'permit_only',
  'design_build',
]

type GateResult =
  | { allowed: true; reason: string }
  | { allowed: false; reason: string; upgradeProduct: string; upgradeUrl: string; upgradePrice: string }

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}))
    const { userId, email, intakeId, hasPlans } = body

    const supabase = getSupabaseAdmin()

    // 1. User self-reports having approved plans → allowed with disclaimer
    if (hasPlans === true) {
      return NextResponse.json({
        allowed: true,
        reason: 'User has approved plans — consultation unlocked',
      } satisfies GateResult)
    }

    // 2. Check for qualifying paid product in intake leads
    if (email || userId) {
      let query = supabase
        .from('public_intake_leads')
        .select('id, project_path, payment_status, created_at')
        .in('project_path', QUALIFYING_INTAKE_PATHS)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)

      if (email)  query = query.eq('email', email)

      const { data: leads } = await query

      if (leads && leads.length > 0) {
        return NextResponse.json({
          allowed: true,
          reason: `Consultation unlocked — paid ${leads[0].project_path} order found`,
        } satisfies GateResult)
      }
    }

    // 3. Check concept package orders (ConceptPackageOrder)
    if (email) {
      const { data: orders } = await supabase
        .from('concept_package_orders')
        .select('id, status')
        .eq('email', email)
        .eq('status', 'paid')
        .limit(1)

      if (orders && orders.length > 0) {
        return NextResponse.json({
          allowed: true,
          reason: 'Consultation unlocked — AI Concept package purchased',
        } satisfies GateResult)
      }
    }

    // 4. Specific intake id with qualifying path
    if (intakeId) {
      const { data: lead } = await supabase
        .from('public_intake_leads')
        .select('project_path, payment_status')
        .eq('id', intakeId)
        .single()

      if (lead && lead.payment_status === 'paid' && QUALIFYING_INTAKE_PATHS.includes(lead.project_path)) {
        return NextResponse.json({
          allowed: true,
          reason: 'Consultation unlocked via intake purchase',
        } satisfies GateResult)
      }
    }

    // 5. Not allowed — push to AI Concept (cheapest entry point)
    return NextResponse.json({
      allowed: false,
      reason: 'Consultation requires an AI Concept package or approved plans',
      upgradeProduct: 'concept',
      upgradeUrl:     '/intake/concept',
      upgradePrice:   '$149',
    } satisfies GateResult)

  } catch (err) {
    console.error('[consultation/gate POST]', err)
    return NextResponse.json({ error: 'Gate check failed' }, { status: 500 })
  }
}
