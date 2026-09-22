import { getSupabaseAdmin } from '@/lib/supabase-server'
import { queueV30DesignRenders } from '@/lib/v30-replicate-renders'
import { pollV30RendersUntilDone } from '@/lib/v30-replicate-poll'
import { resolveConceptTier } from '@kealee/core-rules'
import {
  generateAndAttachConceptFloorplan,
  generateAndAttachConceptPdf,
} from '@/lib/concept-output-enrichment'

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
  if (formData.v30ConceptDeliverablesFinalizedAt || assemblyIsActive) return

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
      },
      status: row.status === 'paid' ? 'concept_ready' : row.status,
    })
    .eq('id', intakeId)

  void (async () => {
    try {
      if (imagePrompts.length > 0 && !formData.v30RenderPredictionIds) {
        await queueV30DesignRenders(intakeId, imagePrompts, roomType.split(' ')[0] ?? 'kitchen')
      }
      if (imagePrompts.length > 0 && !formData.v30RendersCompletedAt) {
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
      await supabase.from('public_intake_leads').update({
        form_data: {
          ...failedFormData,
          v30DeliverableAssemblyStartedAt: null,
          v30DeliverableAssemblyError: error instanceof Error ? error.message : String(error),
        },
      }).eq('id', intakeId)
    }
  })()
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
  const finalOutput = pdfUrl ? { ...output, pdfUrl } : output

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
