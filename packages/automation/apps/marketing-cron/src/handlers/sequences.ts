export async function sequencesHandler() {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase-server')
    const { isGhlEnabled } = await import('@/lib/marketing/ghl-enabled')

    if (!isGhlEnabled()) {
      console.log(`  [sequences] GHL not enabled, using native drip`)
      return
    }

    const supabase = getSupabaseAdmin()
    const { data: rows, error } = await supabase
      .from('ghl_sequence_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50)

    if (error) {
      console.error(`  [sequences] Error: ${error.message}`)
      return
    }

    console.log(`  [sequences] Processing ${rows?.length ?? 0} pending steps`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [sequences] Error: ${msg}`)
  }
}
