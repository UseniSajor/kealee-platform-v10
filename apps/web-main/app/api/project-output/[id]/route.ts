/**
 * GET /api/project-output/[id]
 *
 * Returns a ProjectOutput-shaped response for the pre-design results page
 * (`/pre-design/results/[id]`). The [id] is the intake UUID.
 *
 * Bridges the gap between:
 *   - What the generate route writes: `form_data.conceptOutput.renderUrls`
 *   - What the pre-design results page reads: `resultJson.conceptImageUrls`
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabaseAdmin()

    const { data: intake, error } = await supabase
      .from('public_intake_leads')
      .select('id, status, form_data, updated_at')
      .eq('id', params.id)
      .single()

    if (error || !intake) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const formData      = (intake.form_data as Record<string, unknown>) ?? {}
    const conceptOutput = (formData.conceptOutput as Record<string, unknown>) ?? {}

    // Collect render URLs — prefer resolved permanent URLs over the split sets
    const renderUrls         = (conceptOutput.renderUrls         as string[] | undefined) ?? []
    const interiorRenderUrls = (conceptOutput.interiorRenderUrls as string[] | undefined) ?? []
    const exteriorRenderUrls = (conceptOutput.exteriorRenderUrls as string[] | undefined) ?? []
    const allRenderUrls = renderUrls.length > 0
      ? renderUrls
      : [...interiorRenderUrls, ...exteriorRenderUrls]

    // Detect pending renders: jobs submitted but URLs not yet resolved
    const renderJobsPending =
      Array.isArray(formData.renderJobs) && (formData.renderJobs as string[]).length > 0
    const hasRealRenders = allRenderUrls.length > 0

    // Map intake status → ProjectOutput status
    const intakeStatus = intake.status as string | null
    const isConceptReady  = intakeStatus === 'concept_ready'
    const isRendering     = intakeStatus === 'paid' && renderJobsPending && !hasRealRenders

    const status: 'pending' | 'generating' | 'completed' | 'failed' =
      isConceptReady ? 'completed'
      : isRendering   ? 'generating'
      : intakeStatus === 'paid' ? 'generating'
      : intakeStatus === 'failed' ? 'failed'
      : 'pending'

    const requiresPermit =
      (conceptOutput.permitScope as Record<string, unknown> | undefined)?.requiresPermit

    return NextResponse.json({
      id:          intake.id,
      status,
      type:        'concept',
      serviceType: 'concept',
      isProcessing: status === 'generating' || status === 'pending',
      isCompleted:  status === 'completed',
      resultJson: {
        // Pre-design results page reads resultJson.conceptImageUrls (primary)
        // and resultJson.images (legacy fallback) — both wired here.
        conceptImageUrls: allRenderUrls,
        images:           allRenderUrls,
        requiresPermit,
      },
      pdfUrl:      typeof conceptOutput.pdfUrl === 'string' ? conceptOutput.pdfUrl : undefined,
      downloadUrl: typeof conceptOutput.pdfUrl === 'string' ? conceptOutput.pdfUrl : undefined,
      updatedAt:   intake.updated_at as string | undefined,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[project-output/[id] GET]', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
