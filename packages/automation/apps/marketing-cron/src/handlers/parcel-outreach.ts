export async function parcelOutreachHandler() {
  try {
    const { processOutreachQueue } = await import('@/lib/marketing/parcel-outreach/queue')

    const result = await processOutreachQueue()
    console.log(`  [parcel-outreach] Processed ${result?.processed ?? 0} targets`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [parcel-outreach] Error: ${msg}`)
  }
}
