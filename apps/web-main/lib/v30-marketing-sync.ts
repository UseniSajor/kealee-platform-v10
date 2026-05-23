import { getSupabaseAdmin } from '@/lib/supabase-server'

/** Persist MarketingBot JSON on public_intake_leads for portal + GHL handoff. */
export async function syncV30MarketingKit(
  intakeId: string,
  marketingOutput: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('form_data')
    .eq('id', intakeId)
    .single()

  if (!row) return

  const formData = (row.form_data as Record<string, unknown>) ?? {}
  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        v30MarketingKit: marketingOutput,
        v30MarketingSyncedAt: new Date().toISOString(),
      },
    })
    .eq('id', intakeId)
}
