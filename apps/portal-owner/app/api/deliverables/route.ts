/**
 * GET /api/deliverables
 *
 * Returns the authenticated user's concept deliverables from
 * public_intake_leads (filtered by contact_email from the Supabase session).
 * Uses service_role key to bypass RLS.
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET() {
  // ── Get authenticated user from session ─────────────────────────────────────
  const cookieStore = cookies()
  const supabaseSession = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { session } } = await supabaseSession.auth.getSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userEmail = session.user.email

  // ── Query public_intake_leads by contact_email ──────────────────────────────
  const { data, error } = await supabaseAdmin
    .from('public_intake_leads')
    .select('id, client_name, project_path, status, budget_range, project_address, created_at, updated_at, form_data')
    .eq('contact_email', userEmail)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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

  // ── Concept service price map (mirrors INTAKE_PRICE_CENTS in core-rules) ────
  const CONCEPT_PRICE_DOLLARS: Record<string, number> = {
    exterior_concept:       395,
    garden_concept:         295,
    whole_home_concept:     595,
    interior_reno_concept:  345,
    developer_concept:      795,
    kitchen_remodel:        395,
    bathroom_remodel:       295,
    interior_renovation:    345,
    whole_home_remodel:     695,
    addition_expansion:     495,
    permit_path_only:       499,
    cost_estimate:          595,
    certified_estimate:    1850,
    contractor_match:       199,
    design_build:           795,
    capture_site_concept:   125,
    single_lot_development: 899,
  }

  // ── Shape response — extract conceptOutput summary from form_data ───────────
  const deliverables = (data ?? []).map((row: any) => {
    const fd    = (row.form_data ?? {}) as Record<string, any>
    const co    = (fd.conceptOutput ?? null) as Record<string, any> | null
    const tier  = typeof fd.tier === 'number' ? fd.tier : 1
    const path  = row.project_path as string
    const pkg   = (co?.packageJson as Record<string, any>) ?? {}
    const scope = (pkg.scope as Record<string, any>) ?? {}

    const estimatedCostMin = typeof scope.totalEstimatedMin === 'number' ? scope.totalEstimatedMin : null
    const estimatedCostMax = typeof scope.totalEstimatedMax === 'number' ? scope.totalEstimatedMax : null

    return {
      id:              row.id,
      clientName:      row.client_name,
      projectPath:     path,
      projectLabel:    PACKAGE_LABELS[path]
                         ?? path?.replace(/_/g, ' ')?.replace(/\b\w/g, (c: string) => c.toUpperCase())
                         ?? 'Project',
      tier,
      tierLabel:       TIER_LABELS[tier] ?? 'Starter Concept',
      address:         row.project_address ?? fd.projectAddress ?? null,
      budgetRange:     row.budget_range ?? fd.budgetRange ?? null,
      status:          row.status as string,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
      // Concept package fields (populated after generation)
      conceptPackageId:    co?.conceptPackageId ?? null,
      pdfUrl:              co?.pdfUrl ?? null,
      generatedAt:         co?.generatedAt ?? null,
      // Pricing
      conceptServicePrice: CONCEPT_PRICE_DOLLARS[path] ?? null,
      estimatedCostMin,
      estimatedCostMax,
    }
  })

  return NextResponse.json({ deliverables })
}
