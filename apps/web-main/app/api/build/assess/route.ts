/**
 * POST /api/build/assess
 *
 * Called when a user on the /build page clicks a product CTA.
 * Saves their journey state (what they have vs. need) and returns
 * the recommended next step. Fire-and-forget safe — errors are
 * logged but never returned to the user.
 *
 * Body:
 *   projectType       string   required  — 'kitchen' | 'addition' | etc.
 *   hasConcept        boolean  optional  default false
 *   hasDrawings       boolean  optional  default false
 *   hasPermit         boolean  optional  default false
 *   hasContractor     boolean  optional  default false
 *   email             string   optional
 *   name              string   optional
 *   phone             string   optional
 *   projectAddress    string   optional
 *   budgetRange       string   optional
 *   conceptIntakeId   string   optional  — UUID of existing concept intake
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin }          from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

type RecommendedStep =
  | 'design_concept'
  | 'professional_drawings'
  | 'permit_filing'
  | 'contractor_match'
  | 'build_management'

function resolveRecommendedStep(state: {
  hasConcept:    boolean
  hasDrawings:   boolean
  hasPermit:     boolean
  hasContractor: boolean
}): RecommendedStep {
  if (!state.hasConcept)    return 'design_concept'
  if (!state.hasDrawings)   return 'professional_drawings'
  if (!state.hasPermit)     return 'permit_filing'
  if (!state.hasContractor) return 'contractor_match'
  return 'build_management'
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    projectType,
    hasConcept    = false,
    hasDrawings   = false,
    hasPermit     = false,
    hasContractor = false,
    email,
    name,
    phone,
    projectAddress,
    budgetRange,
    conceptIntakeId,
  } = body as {
    projectType:      string
    hasConcept?:      boolean
    hasDrawings?:     boolean
    hasPermit?:       boolean
    hasContractor?:   boolean
    email?:           string
    name?:            string
    phone?:           string
    projectAddress?:  string
    budgetRange?:     string
    conceptIntakeId?: string
  }

  if (!projectType) {
    return NextResponse.json({ error: 'projectType is required' }, { status: 400 })
  }

  const recommendedStep = resolveRecommendedStep({
    hasConcept:    Boolean(hasConcept),
    hasDrawings:   Boolean(hasDrawings),
    hasPermit:     Boolean(hasPermit),
    hasContractor: Boolean(hasContractor),
  })

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('build_journey_assessments')
    .insert({
      project_type:      projectType,
      has_concept:       Boolean(hasConcept),
      has_drawings:      Boolean(hasDrawings),
      has_permit:        Boolean(hasPermit),
      has_contractor:    Boolean(hasContractor),
      recommended_step:  recommendedStep,
      email:             email             ?? null,
      name:              name              ?? null,
      phone:             phone             ?? null,
      project_address:   projectAddress    ?? null,
      budget_range:      budgetRange       ?? null,
      concept_intake_id: conceptIntakeId   ?? null,
      source:            'build-page',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[build/assess] DB insert error:', error.message)
    // Return recommendation anyway — never block the user
  }

  return NextResponse.json({
    assessmentId:    data?.id ?? null,
    recommendedStep,
  })
}
