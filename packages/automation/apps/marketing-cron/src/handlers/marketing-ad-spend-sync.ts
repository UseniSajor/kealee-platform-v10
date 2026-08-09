export async function marketingAdSpendSyncHandler() {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase-server')
    const { syncAdSpendToDatabase, toDateOnly } = await import('@/lib/marketing/ad-spend')

    const supabase = getSupabaseAdmin()
    const today = toDateOnly(new Date())

    const result = await syncAdSpendToDatabase(supabase, {
      from: new Date(today),
      to: new Date(today),
    })

    console.log(`  [marketing-ad-spend-sync] Synced spend data`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [marketing-ad-spend-sync] Error: ${msg}`)
  }
}
