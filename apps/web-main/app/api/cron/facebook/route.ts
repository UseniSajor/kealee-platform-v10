/**
 * GET /api/cron/facebook
 *
 * Vercel Cron — runs Mon/Wed/Fri at 10am ET (15:00 UTC).
 * Finds the Facebook post scheduled for today and publishes it
 * via the Facebook Graph API.
 *
 * Required env vars:
 *   FACEBOOK_PAGE_ID            — numeric Facebook Page ID
 *   FACEBOOK_PAGE_ACCESS_TOKEN  — long-lived Page access token
 *   CRON_SECRET                 — Bearer auth for cron requests
 *
 * Note: FACEBOOK_PAGE_ACCESS_TOKEN is a Page token (not a user token).
 * Required scopes: pages_manage_posts, pages_read_engagement
 *
 * Getting a long-lived Page token:
 * 1. Generate a short-lived user token at developers.facebook.com/tools/explorer
 * 2. Exchange for long-lived user token (60 days)
 * 3. Call GET /me/accounts to get Page tokens — Page tokens do NOT expire
 *    as long as the user token that generated them is refreshed annually.
 */

import { NextRequest, NextResponse }   from 'next/server'
import { FACEBOOK_POSTS, FacebookPost } from '@/lib/marketing/facebook-posts'
import { verifyCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

const CRON_SECRET  = process.env.CRON_SECRET                   ?? ''
const PAGE_ID      = process.env.FACEBOOK_PAGE_ID              ?? ''
const PAGE_TOKEN   = process.env.FACEBOOK_PAGE_ACCESS_TOKEN    ?? ''
const GRAPH_BASE   = 'https://graph.facebook.com/v19.0'

// ── Find today's post ─────────────────────────────────────────────────────────

function getTodaysPost(): FacebookPost | null {
  const today = new Date().toISOString().slice(0, 10)
  return FACEBOOK_POSTS.find(p => p.scheduledDate === today) ?? null
}

// ── Publish to Facebook Page ──────────────────────────────────────────────────

async function publishFacebookPost(post: FacebookPost): Promise<{ id: string }> {
  if (!PAGE_ID || !PAGE_TOKEN) {
    throw new Error('FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN must be set')
  }

  const body: Record<string, string> = {
    message:      post.message,
    access_token: PAGE_TOKEN,
  }

  // Include link for link-preview card if provided
  if (post.link) {
    body.link = post.link
  }

  const res = await fetch(
    `${GRAPH_BASE}/${PAGE_ID}/feed`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Facebook Graph API error: ${res.status} — ${text}`)
  }

  const json = await res.json() as { id: string }
  return { id: json.id }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronDenied = verifyCronRequest(req)
  if (cronDenied) return cronDenied

  const post = getTodaysPost()

  if (!post) {
    const today = new Date().toISOString().slice(0, 10)
    console.log(`[cron/facebook] No post scheduled for ${today}`)
    return NextResponse.json({ skipped: true, reason: `No post scheduled for ${today}` })
  }

  try {
    const result = await publishFacebookPost(post)
    console.log(`[cron/facebook] Published week ${post.week} (${post.day}) post: ${result.id}`)
    return NextResponse.json({
      success: true,
      postId:  result.id,
      week:    post.week,
      day:     post.day,
      format:  post.format,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[cron/facebook] Publish error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
