export async function leadScoringHandler() {
  try {
    const { createClient } = await import('@supabase/supabase-js')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: unscored, error } = await supabase
      .from('public_intake_leads')
      .select('*')
      .eq('status', 'new')
      .is('lead_score', null)
      .limit(50)

    if (error) {
      console.error(`  [lead-scoring] Error: ${error.message}`)
      return
    }

    console.log(`  [lead-scoring] Scoring ${unscored?.length ?? 0} new leads`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [lead-scoring] Error: ${msg}`)
  }
}
