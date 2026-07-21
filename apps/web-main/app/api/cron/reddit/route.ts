import { NextRequest, NextResponse } from 'next/server'
import { REDDIT_POSTS, type RedditPost } from '@/lib/marketing/reddit-organic'
import { verifyCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
const REDDIT_SUBMIT_URL = 'https://oauth.reddit.com/api/submit'

async function getRedditAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID ?? ''
  const clientSecret = process.env.REDDIT_CLIENT_SECRET ?? ''
  const refreshToken = process.env.REDDIT_REFRESH_TOKEN ?? ''

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Reddit OAuth credentials must be set: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_REFRESH_TOKEN')
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
  const response = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': process.env.REDDIT_USER_AGENT ?? 'web:kealee-marketing:v1.0 (by /u/KealeeDMV)',
    },
    body: body.toString(),
  })

  const result = await response.json() as { access_token?: string; error?: string }
  if (!response.ok || !result.access_token) {
    throw new Error(`Reddit token error: ${response.status} — ${result.error ?? 'access token missing'}`)
  }
  return result.access_token
}

async function publishRedditPost(post: RedditPost): Promise<string> {
  const accessToken = await getRedditAccessToken()
  const subreddit = post.subreddit.replace(/^r\//, '')
  const text = post.cta ? `${post.body}\n\n${post.cta}` : post.body
  const body = new URLSearchParams({
    api_type: 'json',
    kind: 'self',
    sr: subreddit,
    title: post.title,
    text,
    resubmit: 'false',
    sendreplies: 'true',
  })
  if (post.flairSuggestion) body.set('flair_text', post.flairSuggestion)

  const response = await fetch(REDDIT_SUBMIT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': process.env.REDDIT_USER_AGENT ?? 'web:kealee-marketing:v1.0 (by /u/KealeeDMV)',
    },
    body: body.toString(),
  })
  const result = await response.json() as {
    json?: { errors?: unknown[]; data?: { url?: string; name?: string } }
  }
  const errors = result.json?.errors ?? []
  if (!response.ok || errors.length > 0) {
    throw new Error(`Reddit submit error: ${response.status} — ${JSON.stringify(errors)}`)
  }
  return result.json?.data?.url ?? result.json?.data?.name ?? 'submitted'
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = verifyCronRequest(req)
  if (denied) return denied

  const today = new Date().toISOString().slice(0, 10)
  const post = REDDIT_POSTS.find(candidate => candidate.scheduledDate === today)
  if (!post) {
    return NextResponse.json({ skipped: true, reason: `No Reddit post scheduled for ${today}` })
  }

  try {
    const url = await publishRedditPost(post)
    console.log(`[cron/reddit] Published week ${post.week} to ${post.subreddit}: ${url}`)
    return NextResponse.json({ success: true, subreddit: post.subreddit, week: post.week, url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[cron/reddit] Publish error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
