/**
 * GET /api/cron/linkedin
 *
 * Vercel Cron job — runs daily at 9am ET.
 * Finds the LinkedIn post scheduled for today and publishes it via LinkedIn API v2.
 *
 * Required env vars:
 *   LINKEDIN_ACCESS_TOKEN      — OAuth 2.0 access token
 *   LINKEDIN_ORGANIZATION_ID   — LinkedIn organization ID (urn:li:organization:...)
 *   CRON_SECRET                — Bearer token for cron auth
 *
 * Vercel cron config (vercel.json):
 * { "crons": [{ "path": "/api/cron/linkedin", "schedule": "0 14 * * *" }] }
 * (14:00 UTC = 10:00 ET)
 */

import { NextRequest, NextResponse }   from 'next/server'
import { LINKEDIN_POSTS, LinkedInPost } from '@/lib/marketing/linkedin-posts'

const CRON_SECRET              = process.env.CRON_SECRET              ?? ''
const LINKEDIN_ACCESS_TOKEN    = process.env.LINKEDIN_ACCESS_TOKEN    ?? ''
const LINKEDIN_ORGANIZATION_ID = process.env.LINKEDIN_ORGANIZATION_ID ?? ''

// ── Find today's post ─────────────────────────────────────────────────────────

function getTodaysPost(): LinkedInPost | null {
  const today = new Date().toISOString().slice(0, 10)   // YYYY-MM-DD
  return LINKEDIN_POSTS.find(p => p.scheduledDate === today) ?? null
}

// ── LinkedIn API v2 post ──────────────────────────────────────────────────────

async function publishLinkedInPost(post: LinkedInPost): Promise<{ id: string }> {
  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_ORGANIZATION_ID) {
    throw new Error('LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORGANIZATION_ID must be set')
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
      Authorization:               `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
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
  // Auth
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const post = getTodaysPost()

  if (!post) {
    const today = new Date().toISOString().slice(0, 10)
    console.log(`[cron/linkedin] No post scheduled for ${today}`)
    return NextResponse.json({ skipped: true, reason: `No post scheduled for ${today}` })
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
