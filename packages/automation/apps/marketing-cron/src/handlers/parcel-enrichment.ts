export async function parcelEnrichmentHandler() {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase-server')
    const { enrichParcelTarget, applyEnrichment } = await import('@/lib/marketing/parcel-outreach/enrichment')
    const { queueOutreachForTarget } = await import('@/lib/marketing/parcel-outreach/queue')

    const supabase = getSupabaseAdmin()
    const { data: targets } = await supabase
      .from('parcel_outreach_targets')
      .select('*')
      .eq('enrichment_status', 'pending')
      .lt('enrichment_attempts', 3)
      .eq('opted_out', false)
      .limit(40)

    let enriched = 0
    for (const target of targets ?? []) {
      const result = await enrichParcelTarget(target)
      await applyEnrichment(target.id, result)
      enriched++
    }

    console.log(`  [parcel-enrichment] Enriched ${enriched} targets`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [parcel-enrichment] Error: ${msg}`)
  }
}
