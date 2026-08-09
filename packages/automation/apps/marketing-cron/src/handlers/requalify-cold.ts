export async function requalifyColdHandler() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const { scoreLeadWithIntelligence } = await import('@/lib/marketing/intelligence-scorer')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: coldLeads, error } = await supabase
      .from('public_intake_leads')
      .select('*')
      .eq('status', 'new')
      .eq('routing_tag', 'cold')
      .gt('created_at', sevenDaysAgo.toISOString())
      .limit(50)

    if (error) {
      console.error(`  [requalify-cold] Error: ${error.message}`)
      return
    }

    console.log(`  [requalify-cold] Requalifying ${coldLeads?.length ?? 0} cold leads`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [requalify-cold] Error: ${msg}`)
  }
}
