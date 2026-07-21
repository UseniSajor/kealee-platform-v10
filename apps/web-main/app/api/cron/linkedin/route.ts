/**
 * GET /api/cron/linkedin
 *
 * Vercel Cron job — runs every Monday at 10am ET.
 * Finds the LinkedIn post scheduled for today and publishes it via LinkedIn API v2.
 *
 * Required env vars (Option A — 60-day static token):
 *   LINKEDIN_ACCESS_TOKEN      — OAuth 2.0 access token (expires every 60 days)
 *   LINKEDIN_ORGANIZATION_ID   — LinkedIn organization ID (urn:li:organization:...)
 *   CRON_SECRET                — Bearer token for cron auth
 *
 * Option B — refresh token (recommended for production, token lasts 365 days):
 *   LINKEDIN_CLIENT_ID         — LinkedIn app client ID
 *   LINKEDIN_CLIENT_SECRET     — LinkedIn app client secret
 *   LINKEDIN_REFRESH_TOKEN     — OAuth 2.0 refresh token (365-day lifetime)
 *   LINKEDIN_ORGANIZATION_ID   — same as above
 *   CRON_SECRET                — same as above
 *
 * When all three LINKEDIN_CLIENT_* vars are present, the cron auto-refreshes
 * the access token before every post. LINKEDIN_ACCESS_TOKEN becomes a fallback.
 *
 * Vercel cron config (vercel.json):
 * { "crons": [{ "path": "/api/cron/linkedin", "schedule": "0 14 * * 1" }] }
 * (14:00 UTC Monday = 10:00 ET)
 */

import { NextRequest, NextResponse }   from 'next/server'
import { LINKEDIN_POSTS, LinkedInPost } from '@/lib/marketing/linkedin-posts'
import { verifyCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'


const CRON_SECRET              = process.env.CRON_SECRET              ?? ''
const LINKEDIN_ORGANIZATION_ID = process.env.LINKEDIN_ORGANIZATION_ID ?? ''

function hasLinkedInCredentials(): boolean {
  const hasStaticToken = Boolean(process.env.LINKEDIN_ACCESS_TOKEN)
  const hasRefreshCredentials = Boolean(
    process.env.LINKEDIN_CLIENT_ID &&
    process.env.LINKEDIN_CLIENT_SECRET &&
    process.env.LINKEDIN_REFRESH_TOKEN,
  )
  return Boolean(LINKEDIN_ORGANIZATION_ID && (hasStaticToken || hasRefreshCredentials))
}

// ── Token resolution (Option B: refresh token; Option A: static token) ────────

/**
 * Resolves a valid LinkedIn access token.
 * If LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET + LINKEDIN_REFRESH_TOKEN are
 * all set, exchanges the refresh token for a fresh access token on every run
 * (safe to call on every cron invocation — token exchange is idempotent).
 * Falls back to LINKEDIN_ACCESS_TOKEN when refresh creds are not configured.
 */
async function getLinkedInAccessToken(): Promise<string> {
  const clientId      = process.env.LINKEDIN_CLIENT_ID      ?? ''
  const clientSecret  = process.env.LINKEDIN_CLIENT_SECRET  ?? ''
  const refreshToken  = process.env.LINKEDIN_REFRESH_TOKEN  ?? ''
  const staticToken   = process.env.LINKEDIN_ACCESS_TOKEN   ?? ''

  if (clientId && clientSecret && refreshToken) {
    try {
      const params = new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     clientId,
        client_secret: clientSecret,
      })
      const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    params.toString(),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        console.warn(`[cron/linkedin] Refresh token exchange failed (${res.status}): ${text}. Falling back to LINKEDIN_ACCESS_TOKEN.`)
        return staticToken
      }
      const data = await res.json() as { access_token?: string }
      if (data.access_token) {
        console.log('[cron/linkedin] Access token refreshed successfully via refresh token.')
        return data.access_token
      }
    } catch (err: any) {
      console.warn(`[cron/linkedin] Refresh token fetch threw: ${err?.message}. Falling back to LINKEDIN_ACCESS_TOKEN.`)
    }
  }

  return staticToken
}

// ── Find today's post ─────────────────────────────────────────────────────────

function getTodaysPost(): LinkedInPost | null {
  const today = new Date().toISOString().slice(0, 10)   // YYYY-MM-DD
  return LINKEDIN_POSTS.find(p => p.scheduledDate === today) ?? null
}

// ── LinkedIn API v2 post ──────────────────────────────────────────────────────

async function publishLinkedInPost(post: LinkedInPost): Promise<{ id: string }> {
  const accessToken = await getLinkedInAccessToken()

  if (!accessToken || !LINKEDIN_ORGANIZATION_ID) {
    throw new Error('LinkedIn credentials not configured — set LINKEDIN_ACCESS_TOKEN (or LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET + LINKEDIN_REFRESH_TOKEN) and LINKEDIN_ORGANIZATION_ID')
  }

  const orgUrn      = LINKEDIN_ORGANIZATION_ID.startsWith('urn:')
    ? LINKEDIN_ORGANIZATION_ID
    : `urn:li:organization:${LINKEDIN_ORGANIZATION_ID}`

  const commentText = `${post.body}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`

  const payload = {
    author:          orgUrn,
    lifecycleState:  'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: commentText,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method:  'POST',
    headers: {
      Authorization:               `Bearer ${accessToken}`,
      'Content-Type':              'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`LinkedIn API error: ${res.status} — ${text}`)
  }

  const json = await res.json()
  return { id: json.id ?? 'unknown' }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronDenied = verifyCronRequest(req)
  if (cronDenied) return cronDenied

  const post = getTodaysPost()

  if (!post) {
    const today = new Date().toISOString().slice(0, 10)
    console.log(`[cron/linkedin] No post scheduled for ${today}`)
    return NextResponse.json({ skipped: true, reason: `No post scheduled for ${today}` })
  }

  if (!hasLinkedInCredentials()) {
    console.warn(`[cron/linkedin] Post scheduled for ${new Date().toISOString().slice(0, 10)}, but LinkedIn credentials are not configured; skipping`)
    return NextResponse.json({
      skipped: true,
      reason: 'LinkedIn credentials not configured',
      week: post.week,
      theme: post.theme,
    })
  }

  try {
    const result = await publishLinkedInPost(post)
    console.log(`[cron/linkedin] Published week ${post.week} post: ${result.id}`)
    return NextResponse.json({ success: true, postId: result.id, week: post.week, theme: post.theme })
  } catch (e: any) {
    console.error('[cron/linkedin] Publish error:', e?.message)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
