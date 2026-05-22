import { getSupabaseAdmin } from '@/lib/supabase-server'

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
}
