/**
 * GET /api/cron/twitter
 *
 * Vercel Cron — runs daily at 9am ET (14:00 UTC).
 * Finds the Twitter post scheduled for today and publishes it.
 * Threads are posted as reply chains (each tweet replies to the previous).
 *
 * Twitter API v2 — requires Basic tier ($100/mo) for write access.
 * Uses OAuth 1.0a for user-context posting (required for tweets).
 *
 * Required env vars:
 *   TWITTER_API_KEY             — Consumer Key from developer.twitter.com
 *   TWITTER_API_SECRET          — Consumer Secret
 *   TWITTER_ACCESS_TOKEN        — OAuth 1.0a Access Token (your account)
 *   TWITTER_ACCESS_TOKEN_SECRET — OAuth 1.0a Access Token Secret
 *   CRON_SECRET                 — Bearer auth for cron requests
 *
 * Setup at: developer.twitter.com/en/portal/dashboard
 * App permissions must be set to "Read and Write"
 */

import { NextRequest, NextResponse }   from 'next/server'
import { createHmac }                   from 'crypto'
import { TWITTER_POSTS, TwitterPost }   from '@/lib/marketing/twitter-posts'
import { verifyCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

const CRON_SECRET    = process.env.CRON_SECRET                   ?? ''
const API_KEY        = process.env.TWITTER_API_KEY               ?? ''
const API_SECRET     = process.env.TWITTER_API_SECRET            ?? ''
const ACCESS_TOKEN   = process.env.TWITTER_ACCESS_TOKEN          ?? ''
const ACCESS_SECRET  = process.env.TWITTER_ACCESS_TOKEN_SECRET   ?? ''

const TWITTER_API    = 'https://api.twitter.com/2/tweets'

// ── OAuth 1.0a signing ────────────────────────────────────────────────────────

function oauthSign(method: string, url: string, params: Record<string, string>): string {
  const nonce     = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key:     API_KEY,
    oauth_nonce:            nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        timestamp,
    oauth_token:            ACCESS_TOKEN,
    oauth_version:          '1.0',
  }

  // Collect all params for signature base
  const allParams = { ...params, ...oauthParams }
  const sortedParams = Object.keys(allParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&')

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&')

  const signingKey = `${encodeURIComponent(API_SECRET)}&${encodeURIComponent(ACCESS_SECRET)}`
  const signature  = createHmac('sha1', signingKey).update(baseString).digest('base64')

  oauthParams.oauth_signature = signature

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ')

  return authHeader
}

// ── Post a single tweet ───────────────────────────────────────────────────────

async function postTweet(text: string, replyToId?: string): Promise<string> {
  if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_SECRET) {
    throw new Error('Twitter OAuth credentials must be set')
  }

  const body: Record<string, unknown> = { text }
  if (replyToId) {
    body.reply = { in_reply_to_tweet_id: replyToId }
  }

  const authHeader = oauthSign('POST', TWITTER_API, {})

  const res = await fetch(TWITTER_API, {
    method:  'POST',
    headers: {
      Authorization:  authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Twitter API error: ${res.status} — ${text}`)
  }

  const json = await res.json() as { data: { id: string } }
  return json.data.id
}

// ── Post thread ───────────────────────────────────────────────────────────────

async function postThread(post: TwitterPost): Promise<string[]> {
  const ids: string[] = []
  let previousId: string | undefined

  for (let i = 0; i < post.tweets.length; i++) {
    let tweetText = post.tweets[i]

    // Append hashtags to the last tweet only
    if (i === post.tweets.length - 1 && post.tags?.length) {
      const tags = post.tags.map(t => `#${t}`).join(' ')
      tweetText = `${tweetText}\n\n${tags}`
    }

    // Small delay between tweets to avoid rate limits
    if (i > 0) {
      await new Promise(r => setTimeout(r, 1500))
    }

    const id = await postTweet(tweetText, previousId)
    ids.push(id)
    previousId = id
  }

  return ids
}

// ── Find today's post ─────────────────────────────────────────────────────────

function getTodaysPost(): TwitterPost | null {
  const today = new Date().toISOString().slice(0, 10)
  return TWITTER_POSTS.find(p => p.scheduledDate === today) ?? null
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronDenied = verifyCronRequest(req)
  if (cronDenied) return cronDenied

  const post = getTodaysPost()

  if (!post) {
    const today = new Date().toISOString().slice(0, 10)
    console.log(`[cron/twitter] No post scheduled for ${today}`)
    return NextResponse.json({ skipped: true, reason: `No post scheduled for ${today}` })
  }

  try {
    const ids = await postThread(post)
    const firstId = ids[0]
    console.log(`[cron/twitter] Posted week ${post.week} (${post.day}) — ${ids.length} tweet(s), first ID: ${firstId}`)
    return NextResponse.json({
      success:    true,
      tweetIds:   ids,
      tweetCount: ids.length,
      week:       post.week,
      day:        post.day,
      type:       post.type,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[cron/twitter] Post error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
