import { getSupabaseAdmin } from '@/lib/supabase-server'
import { queueV30DesignRenders } from '@/lib/v30-replicate-renders'
import { pollV30RendersUntilDone } from '@/lib/v30-replicate-poll'
import { resolveConceptTier } from '@kealee/core-rules'
import {
  generateAndAttachConceptFloorplan,
  generateAndAttachConceptPdf,
} from '@/lib/concept-output-enrichment'
import {
  conceptDeliverablesAreComplete,
  conceptHasRenders,
} from '@/lib/v30-deliverable-state'

/**
 * Copy the canonical v30 DesignBot result into the customer portal, render its
 * imagery once, then assemble the shared floor-plan/PDF deliverables.
 */
export async function syncV30ConceptToIntakeLead(
  intakeId: string,
  conceptOutput: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, client_name, contact_email, contact_phone, project_address, budget_range, form_data, status')
    .eq('id', intakeId)
    .single()

  if (!row) return

  const formData = (row.form_data as Record<string, unknown>) ?? {}
  const assemblyStartedAt = Date.parse(String(formData.v30DeliverableAssemblyStartedAt ?? ''))
  const assemblyIsActive = Number.isFinite(assemblyStartedAt) && Date.now() - assemblyStartedAt < 30 * 60 * 1000
  if (conceptDeliverablesAreComplete(formData) || assemblyIsActive) return

  const imagePrompts = (conceptOutput.imagePrompts as string[] | undefined) ?? []
  const roomType = String(conceptOutput.projectPath ?? 'kitchen').replace(/_/g, ' ')
  const mergedConcept = {
    ...((formData.conceptOutput as Record<string, unknown> | undefined) ?? {}),
    ...conceptOutput,
  }

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        conceptOutput: mergedConcept,
        v30ConceptOutput: mergedConcept,
        v30ConceptSyncedAt: new Date().toISOString(),
        v30DeliverableAssemblyStartedAt: new Date().toISOString(),
        // A prior run may have written this marker without producing its
        // required images/PDF. The assembly lock above prevents concurrency;
        // clear stale success before retrying the actual customer assets.
        v30ConceptDeliverablesFinalizedAt: null,
      },
      status: row.status === 'paid' ? 'concept_ready' : row.status,
    })
    .eq('id', intakeId)

  // This must stay attached to a durable caller. It used to be a detached
  // promise, so a server restart after writing the concept JSON could abandon
  // the paid order before images and PDF existed. The worker reconciliation
  // loop retries this awaited operation until finalization is recorded.
  try {
    const existingPredictionIds = Array.isArray(formData.v30RenderPredictionIds)
      ? formData.v30RenderPredictionIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : []
    if (imagePrompts.length > 0 && existingPredictionIds.length === 0 && !conceptHasRenders(formData)) {
      const queued = await queueV30DesignRenders(intakeId, imagePrompts, roomType.split(' ')[0] ?? 'kitchen')
      if (queued.length === 0) {
        throw new Error('No design render jobs were accepted by the image provider')
      }
    }
    if (!conceptHasRenders(formData)) {
      if (imagePrompts.length === 0 && existingPredictionIds.length === 0) {
        throw new Error('Design output did not include image prompts or completed renders')
      }
      await pollV30RendersUntilDone(intakeId, { maxAttempts: 40, intervalMs: 15_000 })
    }
    await finalizeConceptDeliverables(intakeId)
  } catch (error) {
    console.error('[v30-design-sync] deliverable assembly failed', error)
    const { data: failedRow } = await supabase
      .from('public_intake_leads')
      .select('form_data')
      .eq('id', intakeId)
      .single()
    const failedFormData = (failedRow?.form_data as Record<string, unknown>) ?? {}
    const predictionIds = Array.isArray(failedFormData.v30RenderPredictionIds)
      ? failedFormData.v30RenderPredictionIds
      : []
    const settledCount = Number(failedFormData.v30RenderSettledCount ?? 0)
    const exhaustedWithoutImages = predictionIds.length > 0
      && settledCount >= predictionIds.length
      && !conceptHasRenders(failedFormData)
    await supabase.from('public_intake_leads').update({
      form_data: {
        ...failedFormData,
        v30DeliverableAssemblyStartedAt: null,
        v30DeliverableAssemblyError: error instanceof Error ? error.message : String(error),
        // If every prediction definitively failed, release the batch so the
        // durable reconciler can submit a fresh one. Do not clear jobs that are
        // merely slow; the next pass must continue polling those same IDs.
        ...(exhaustedWithoutImages ? {
          v30RenderPredictionIds: null,
          v30RenderPairs: [],
          v30RendersCompletedAt: null,
          v30RenderRetryCount: Number(failedFormData.v30RenderRetryCount ?? 0) + 1,
        } : {}),
      },
    }).eq('id', intakeId)
    throw error
  }
}

async function finalizeConceptDeliverables(intakeId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: intake } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, client_name, contact_email, contact_phone, project_address, budget_range, form_data')
    .eq('id', intakeId)
    .single()

  if (!intake) return

  const formData = (intake.form_data as Record<string, unknown>) ?? {}
  const output = {
    ...((formData.v30ConceptOutput ?? formData.conceptOutput) as Record<string, unknown>),
  }
  const tier = resolveConceptTier(formData, { projectPath: intake.project_path })
  const enrichmentInput = {
    ...intake,
    form_data: formData,
  }

  if (!conceptHasRenders(formData)) {
    throw new Error('Concept deliverables cannot be finalized without a completed design rendering')
  }

  await generateAndAttachConceptFloorplan(enrichmentInput, output, tier)

  const enrichedFormData = {
    ...formData,
    conceptOutput: output,
    v30ConceptOutput: output,
  }
  await supabase
    .from('public_intake_leads')
    .update({ form_data: enrichedFormData })
    .eq('id', intakeId)

  const pdfUrl = await generateAndAttachConceptPdf({
    ...enrichmentInput,
    form_data: enrichedFormData,
  })
  if (!pdfUrl) {
    throw new Error('Concept deliverables cannot be finalized because PDF generation or storage failed')
  }
  const finalOutput = { ...output, pdfUrl }

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...enrichedFormData,
        conceptOutput: finalOutput,
        v30ConceptOutput: finalOutput,
        v30ConceptDeliverablesFinalizedAt: new Date().toISOString(),
        v30DeliverableAssemblyStartedAt: null,
        v30DeliverableAssemblyError: null,
      },
    })
    .eq('id', intakeId)
}
