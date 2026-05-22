import { getSupabaseAdmin } from '@/lib/supabase-server'
import { queueV30DesignRenders } from '@/lib/v30-replicate-renders'

/**
 * Copy v30 DesignBot conceptOutput onto public_intake_leads for /concept/[id] portal.
 * Skips v20 /api/concept/generate (no duplicate DesignBot).
 */
export async function syncV30ConceptToIntakeLead(
  intakeId: string,
  conceptOutput: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('form_data, status')
    .eq('id', intakeId)
    .single()

  if (!row) return

  const formData = (row.form_data as Record<string, unknown>) ?? {}
  const imagePrompts = (conceptOutput.imagePrompts as string[] | undefined) ?? []
  const roomType = String(conceptOutput.projectPath ?? 'kitchen').replace(/_/g, ' ')

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        conceptOutput,
        v30ConceptOutput: conceptOutput,
        v30ConceptSyncedAt: new Date().toISOString(),
      },
      status: row.status === 'paid' ? 'concept_ready' : row.status,
    })
    .eq('id', intakeId)

  if (imagePrompts.length > 0) {
    void queueV30DesignRenders(intakeId, imagePrompts, roomType.split(' ')[0] ?? 'kitchen')
  }
}
