export async function linkedinHandler() {
  try {
    const orgId = process.env.LINKEDIN_ORGANIZATION_ID
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN

    if (!orgId || !accessToken) {
      console.log(`  [linkedin] Credentials not configured`)
      return
    }

    const { LINKEDIN_POSTS } = await import('@/lib/marketing/linkedin-posts')

    const today = new Date().toISOString().slice(0, 10)
    const post = LINKEDIN_POSTS.find((p: any) => p.scheduledDate === today)

    if (!post) {
      console.log(`  [linkedin] No post for ${today}`)
      return
    }

    console.log(`  [linkedin] Post ready: ${post.theme}`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [linkedin] Error: ${msg}`)
  }
}
