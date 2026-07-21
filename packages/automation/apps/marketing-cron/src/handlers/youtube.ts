export async function youtubeHandler() {
  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      console.log(`  [youtube] Credentials not configured`)
      return
    }

    const { YOUTUBE_VIDEOS } = await import('@/lib/marketing/youtube-content')

    const today = new Date().toISOString().slice(0, 10)
    const videos = YOUTUBE_VIDEOS.filter((v: any) => v.scheduledDate === today && v.youtubeId)

    if (!videos.length) {
      console.log(`  [youtube] No videos for ${today}`)
      return
    }

    console.log(`  [youtube] Ready to publish: ${videos.length} video(s)`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [youtube] Error: ${msg}`)
  }
}
