export async function sendDailyCampaignsHandler() {
  try {
    const { sendTodaysCampaigns } = await import('@/lib/marketing/campaign-runner')
    const { createClient } = await import('@supabase/supabase-js')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const result = await sendTodaysCampaigns(supabase)
    console.log(`  [send-daily-campaigns] Campaigns processed`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [send-daily-campaigns] Error: ${msg}`)
  }
}
