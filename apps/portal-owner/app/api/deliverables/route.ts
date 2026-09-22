/**
 * GET /api/deliverables
 *
 * Returns the authenticated user's concept deliverables from
 * public_intake_leads (filtered by the signed-in Clerk email).
 * Uses service_role key to bypass RLS.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClerkUser } from '@kealee/auth'
import { priceRangeFor } from '@kealee/core-rules'

export const dynamic = 'force-dynamic'
import {
  isV30IntakeFormData,
  mapDeliverableUiStatus,
  v30TierLabel,
  v30WorkspaceUrl,
} from '@/lib/concept-output'
import { getBuildPathUpsells } from '@kealee/core-rules'
import { isConceptSourcePath, ownedProductsFromRows } from '@/lib/build-path-owned'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  const user = await getClerkUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Sign in to view your packages' }, { status: 401 })
  }

  const userEmail = user.email

  // ── Query public_intake_leads by contact_email ──────────────────────────────
  const { data, error } = await supabaseAdmin
    .from('public_intake_leads')
    .select('id, client_name, project_path, status, budget_range, project_address, created_at, updated_at, form_data')
    .eq('contact_email', userEmail)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ownedProducts = ownedProductsFromRows(data ?? [])

  // ── Batch-fetch service_chain_gates for lifecycle stage ─────────────────────
  const intakeIds = (data ?? []).map((r: any) => r.id as string)
  const { data: gates } = intakeIds.length > 0
    ? await supabaseAdmin
        .from('service_chain_gates')
        .select('conceptIntakeId, permitSubmitted, permitApproved, contractorMatchingUnlocked')
        .in('conceptIntakeId', intakeIds)
    : { data: [] }
  const gateMap = new Map<string, { permitSubmitted: boolean; contractorMatchingUnlocked: boolean }>()
  ;(gates ?? []).forEach((g: any) => {
    gateMap.set(g.conceptIntakeId as string, {
      permitSubmitted:            !!(g.permitSubmitted || g.permitApproved),
      contractorMatchingUnlocked: !!(g.contractorMatchingUnlocked || g.permitSubmitted || g.permitApproved),
    })
  })

    // ── Tier label map ─────────────────────────────────────────────────────────
  const TIER_LABELS: Record<number, string> = {
    1: 'Starter Concept',
    2: 'Visualization Package',
    3: 'Pre-Design Package',
  }

  // ── Package label overrides by project_path ─────────────────────────────────
  const PACKAGE_LABELS: Record<string, string> = {
    kitchen_remodel:    'Kitchen Design Package',
    bathroom_remodel:   'Bathroom Design Package',
    exterior_concept:   'Exterior Concept Package',
    interior_reno_concept: 'Interior Reno Concept',
    interior_renovation: 'Interior Renovation',
    whole_home_concept: 'Whole Home Concept',
    whole_home_remodel: 'Whole-Home Remodel',
    addition_expansion: 'Addition / Expansion',
    garden_concept:     'Garden Concept',
    design_build:       'Design + Build Package',
    developer_concept:  'Developer Concept',
    single_lot_development: 'Single-Lot Development',
    capture_site_concept: 'Site Capture Concept',
    cost_estimate:      'Cost Estimate',
    certified_estimate: 'Certified Estimate',
    permit_path_only:   'Permit Path Assessment',
  }

  // The amount the customer paid comes from the order (recorded by the Stripe
  // webhook). The hardcoded map that used to sit here disagreed with checkout
  // on every product — it even charged for contractor matching, which is free.
  const conceptServicePriceFor = (fd: Record<string, any>, path: string): number | null => {
    const paidCents = typeof fd.amountPaidCents === 'number' ? fd.amountPaidCents : 0
    if (paidCents > 0) return paidCents / 100
    // Orders placed before the amount was recorded fall back to the published
    // "from" price, which the list labels as a typical price rather than a bill.
    const range = priceRangeFor(path)
    return range ? range.lowCents / 100 : null
  }

  // ── Shape response — extract conceptOutput summary from form_data ───────────
  const deliverables = (data ?? []).map((row: any) => {
    const fd    = (row.form_data ?? {}) as Record<string, any>
    const co    = (fd.conceptOutput ?? fd.v30ConceptOutput ?? null) as Record<string, any> | null
    const tier  = typeof fd.tier === 'number' ? fd.tier : 1
    const path  = row.project_path as string
    const pkg   = (co?.packageJson as Record<string, any>) ?? {}
    const scope = (pkg.scope as Record<string, any>) ?? {}

    const estimatedCostMin = typeof scope.totalEstimatedMin === 'number' ? scope.totalEstimatedMin : null
    const estimatedCostMax = typeof scope.totalEstimatedMax === 'number' ? scope.totalEstimatedMax : null

    const isV30 = isV30IntakeFormData(fd)
    const uiStatus = mapDeliverableUiStatus(row.status as string, fd)

    // ── Lifecycle stage for Build Journey indicator ────────────────────────
    const gate = gateMap.get(row.id as string)
    const hasContractorMatch = typeof fd.contractorMatchResult === 'object' && fd.contractorMatchResult !== null
    const contractorMatchingUnlocked = !!(gate?.contractorMatchingUnlocked || hasContractorMatch)
    const permitSubmitted = gate?.permitSubmitted ?? false
    // -1 = not yet started, 0 = concept ready, 1 = permit/pricing done, 2 = contractor matched
    const lifecycleStage = uiStatus !== 'ready' ? -1
      : contractorMatchingUnlocked ? 2
      : permitSubmitted ? 1
      : 0

    const upsell =
      uiStatus === 'ready' && isConceptSourcePath(path)
        ? getBuildPathUpsells({
            sourceProjectPath: path,
            fromIntakeId: row.id as string,
            ownedProducts,
          })
        : null

    return {
      id:              row.id,
      clientName:      row.client_name,
      projectPath:     path,
      projectLabel:    PACKAGE_LABELS[path]
                         ?? path?.replace(/_/g, ' ')?.replace(/\b\w/g, (c: string) => c.toUpperCase())
                         ?? 'Project',
      tier,
      tierLabel:       isV30 ? v30TierLabel(tier) : (TIER_LABELS[tier] ?? 'Starter Concept'),
      address:         row.project_address ?? fd.projectAddress ?? null,
      budgetRange:     row.budget_range ?? fd.budgetRange ?? null,
      status:          row.status as string,
      uiStatus,
      isV30,
      v30WorkspaceUrl: isV30 ? v30WorkspaceUrl(row.id) : null,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
      // Concept package fields (populated after generation)
      conceptPackageId:    co?.conceptPackageId ?? null,
      pdfUrl:              co?.pdfUrl ?? null,
      generatedAt:         co?.generatedAt ?? null,
      // Pricing
      conceptServicePrice: conceptServicePriceFor(fd, path),
      estimatedCostMin,
      estimatedCostMax,
      lifecycleStage,
      upsellSummary: upsell?.bundle
        ? {
            label: upsell.bundle.label,
            priceLabel: upsell.bundle.priceLabel,
            savingsLabel: upsell.bundle.savingsLabel,
            href: upsell.bundle.href,
            includes: upsell.bundle.includes,
          }
        : upsell && upsell.offers.length > 0
          ? {
              label: upsell.offers[0]?.label ?? 'Next steps',
              priceLabel: upsell.offers[0]?.priceLabel ?? '',
              savingsLabel: null,
              href: upsell.offers[0]?.href ?? '',
              includes: upsell.nextSteps.slice(0, 3),
            }
          : null,
    }
  })

  return NextResponse.json({ deliverables, ownedProducts })
}
