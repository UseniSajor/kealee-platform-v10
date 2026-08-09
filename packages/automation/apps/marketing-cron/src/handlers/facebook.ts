export async function facebookHandler() {
  try {
    const pageId = process.env.FACEBOOK_PAGE_ID
    const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

    if (!pageId || !pageToken) {
      console.log(`  [facebook] Credentials not configured`)
      return
    }

    const { FACEBOOK_POSTS } = await import('@/lib/marketing/facebook-posts')

    const today = new Date().toISOString().slice(0, 10)
    const post = FACEBOOK_POSTS.find((p: any) => p.scheduledDate === today)

    if (!post) {
      console.log(`  [facebook] No post for ${today}`)
      return
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      body: JSON.stringify({ message: post.message, access_token: pageToken }),
    })

    const data = (await res.json()) as { id: string }
    console.log(`  [facebook] Published: ${data.id}`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [facebook] Error: ${msg}`)
  }
}
