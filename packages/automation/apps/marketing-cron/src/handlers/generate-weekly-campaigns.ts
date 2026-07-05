export async function generateWeeklyCampaignsHandler() {
  try {
    const { generateWeeklyCampaigns } = await import('@/lib/marketing/campaign-runner')
    const { createClient } = await import('@supabase/supabase-js')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const result = await generateWeeklyCampaigns(supabase)
    console.log(`  [generate-weekly-campaigns] Generated campaigns`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [generate-weekly-campaigns] Error: ${msg}`)
  }
}
