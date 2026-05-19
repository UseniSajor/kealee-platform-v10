/**
 * GET /api/concepts/[id]
 *
 * Reads a concept from the intake record and maps it to the Concept shape
 * consumed by the concept portal page.
 *
 * The [id] is the intake UUID (same as intakeId elsewhere in the system).
 * No auth required — customers reach this via a direct link in their email.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import type { Concept, BOMItem, PermitItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Intake statuses that the portal maps to 'completed' — concept is ready.
const COMPLETED_STATUSES = new Set(['concept_ready'])

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // ── Auth gate ────────────────────────────────────────────────────────────
    // Concept packages are paid deliverables. The requesting user must be
    // authenticated and their email must match the intake contact_email.
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    const { data: intake, error } = await supabase
      .from('public_intake_leads')
      .select('id, project_path, client_name, contact_email, contact_phone, project_address, budget_range, status, form_data, created_at, updated_at')
      .eq('id', params.id)
      .single()

    if (error || !intake) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Ownership check: authenticated user must match the intake contact email.
    const conceptEmail = intake.contact_email as string | null
    if (conceptEmail && user.email?.toLowerCase() !== conceptEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const formData      = (intake.form_data ?? {}) as Record<string, unknown>
    const conceptOutput = formData.conceptOutput as Record<string, unknown> | undefined
    const tier          = typeof formData.tier === 'number' ? formData.tier as 1 | 2 | 3 : 1
    const deliverable   = SERVICE_DELIVERABLES[intake.project_path as string]

    // Map intake status → portal status
    const intakeStatus = intake.status as string | null
    let status: Concept['status'] = 'processing'
    if (intakeStatus && COMPLETED_STATUSES.has(intakeStatus)) status = 'completed'
    else if (intakeStatus === 'error') status = 'error'

    // Map bill of materials: ConceptOutput uses { item, quantity, unit, estimatedCost, description }
    // Concept type uses { category, item, quantity, unit, unitCost, total }
    const rawBom = conceptOutput?.billOfMaterials as Array<Record<string, unknown>> | undefined
    const billOfMaterials: BOMItem[] | undefined = rawBom?.map((row) => ({
      category:  'Materials',
      item:      String(row.item ?? ''),
      quantity:  Number(row.quantity ?? 0),
      unit:      String(row.unit ?? ''),
      unitCost:  Number(row.estimatedCost ?? 0) / Math.max(Number(row.quantity ?? 1), 1),
      total:     Number(row.estimatedCost ?? 0),
    }))

    // Map permit scope → PermitItem array
    const permitScope = conceptOutput?.permitScope as Record<string, unknown> | undefined
    const permits: PermitItem[] | undefined = permitScope?.requiresPermit
      ? (permitScope.permitTypes as string[] | undefined)?.map((name) => ({
          name,
          jurisdiction: String(intake.project_address ?? formData.zip ?? 'DMV region'),
          estimatedFee:  typeof permitScope.estimatedPermitFee === 'number' ? permitScope.estimatedPermitFee : 0,
          leadTime:      `${permitScope.estimatedProcessingDays ?? '30'} days`,
          required:      true,
        })) ?? []
      : []

    const concept: Concept = {
      id:       intake.id,
      service:  deliverable?.label ?? (intake.project_path as string),
      serviceSlug: intake.project_path as string,
      scope:    String(formData.description ?? ''),
      budget:   Number(formData.budget ?? 0),
      location: String(intake.project_address ?? `ZIP ${formData.zip ?? ''}`),
      name:     String(intake.client_name ?? ''),
      email:    String(intake.contact_email ?? ''),
      phone:    intake.contact_phone ? String(intake.contact_phone) : undefined,
      tier,
      status,

      // Design concept (style, palette, features)
      designConcept: conceptOutput?.designConcept as Concept['designConcept'],

      // MEP specification strings from Claude
      mepSystem: conceptOutput?.mepSystem as Concept['mepSystem'],

      // AI-written client summary
      description: conceptOutput?.description as string | undefined,

      // Buildability / permit readiness
      buildabilityFlag: conceptOutput?.buildabilityFlag as Concept['buildabilityFlag'],
      readinessScore:   typeof conceptOutput?.readinessScore === 'number'
        ? (conceptOutput.readinessScore as number)
        : undefined,

      // Renders — empty array when AI jobs are in flight; portal polls renderJobs
      renderings: (conceptOutput?.renderUrls as string[] | undefined) ?? [],
      renderJobs: (formData.renderJobs as string[] | undefined) ?? [],
      // Before-photos uploaded by the client; used alongside "after" renders for comparison
      beforeUrls: (conceptOutput?.beforeUrls as string[] | undefined) ?? undefined,

      // Video (tier 2+)
      videoUrl:        conceptOutput?.videoUrl   as string | undefined,
      videoDuration:   conceptOutput?.videoDuration as number | undefined,
      videoFormatUrls: conceptOutput?.videoFormatUrls as Record<string, string> | undefined,

      // Financials
      estimatedCost: conceptOutput?.estimatedCost as number | undefined,
      timeline:      conceptOutput?.projectTimeline as string | undefined,

      // Zoning
      zoningAnalysis: {
        notes:          conceptOutput?.zoningNotes,
        buildability:   conceptOutput?.buildabilityFlag,
        readinessScore: conceptOutput?.readinessScore,
      },

      permits,
      billOfMaterials,

      createdAt:  intake.created_at as string,
      updatedAt:  intake.updated_at as string,
    }

    return NextResponse.json(concept)
  } catch (err: any) {
    console.error('[concepts/[id] GET]', err?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
