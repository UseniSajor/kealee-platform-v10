/**
 * GET /api/cron/instagram
 *
 * Vercel Cron — runs Tue/Thu/Sat at 11am ET (16:00 UTC).
 * Finds the Instagram post scheduled for today and publishes it
 * via the Instagram Graph API.
 *
 * Required env vars:
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID  — numeric IG Business Account ID
 *   INSTAGRAM_ACCESS_TOKEN         — long-lived Page access token
 *   CRON_SECRET                    — Bearer auth for cron requests
 *
 * Instagram Graph API flow (2-step):
 *   1. POST /v19.0/{ig-user-id}/media        → creates media container
 *   2. POST /v19.0/{ig-user-id}/media_publish → publishes container
 *
 * Image requirement: image_url must be a publicly accessible HTTPS URL.
 * For posts with imageFallback, the image must be hosted (not local).
 * Set NEXT_PUBLIC_SITE_URL so fallback images resolve to full URLs.
 */

import { NextRequest, NextResponse }     from 'next/server'
import { INSTAGRAM_POSTS, InstagramPost } from '@/lib/marketing/instagram-posts'

export const dynamic = 'force-dynamic'

const CRON_SECRET     = process.env.CRON_SECRET                    ?? ''
const IG_ACCOUNT_ID   = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID  ?? ''
const IG_TOKEN        = process.env.INSTAGRAM_ACCESS_TOKEN          ?? ''
const SITE_URL        = process.env.NEXT_PUBLIC_SITE_URL            ?? 'https://kealee.com'
const IG_API_BASE     = 'https://graph.facebook.com/v19.0'

// ── Find today's post ─────────────────────────────────────────────────────────

function getTodaysPost(): InstagramPost | null {
  const today = new Date().toISOString().slice(0, 10)
  return INSTAGRAM_POSTS.find(p => p.scheduledDate === today) ?? null
}

// ── Build full caption with hashtags in first comment ─────────────────────────

function buildCaption(post: InstagramPost): string {
  // Put top 5 hashtags inline with caption
  const inlineHashtags = post.hashtags.slice(0, 5).map(h => `#${h}`).join(' ')
  return `${post.caption}\n\n${inlineHashtags}`
}

// ── Resolve image URL ─────────────────────────────────────────────────────────

function resolveImageUrl(post: InstagramPost): string | null {
  // imagePrompt-based posts need a real hosted image URL
  // For now fall back to the service photo if available
  if (post.imageFallback) {
    return `${SITE_URL}${post.imageFallback}`
  }
  return null
}

// ── Publish to Instagram Graph API ───────────────────────────────────────────

async function publishInstagramPost(post: InstagramPost): Promise<{ id: string }> {
  if (!IG_ACCOUNT_ID || !IG_TOKEN) {
    throw new Error('INSTAGRAM_BUSINESS_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN must be set')
  }

  const imageUrl = resolveImageUrl(post)
  if (!imageUrl) {
    throw new Error(`No image URL for post (week ${post.week}, ${post.scheduledDate}). Add imageFallback or a hosted image URL.`)
  }

  const caption = buildCaption(post)

  // Step 1: Create media container
  const containerRes = await fetch(
    `${IG_API_BASE}/${IG_ACCOUNT_ID}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url:    imageUrl,
        caption:      caption,
        access_token: IG_TOKEN,
      }),
    }
  )

  if (!containerRes.ok) {
    const text = await containerRes.text().catch(() => containerRes.statusText)
    throw new Error(`IG media container error: ${containerRes.status} — ${text}`)
  }

  const { id: containerId } = await containerRes.json() as { id: string }

  // Small delay — Instagram recommends waiting before publishing
  await new Promise(r => setTimeout(r, 3000))

  // Step 2: Publish container
  const publishRes = await fetch(
    `${IG_API_BASE}/${IG_ACCOUNT_ID}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id:  containerId,
        access_token: IG_TOKEN,
      }),
    }
  )

  if (!publishRes.ok) {
    const text = await publishRes.text().catch(() => publishRes.statusText)
    throw new Error(`IG publish error: ${publishRes.status} — ${text}`)
  }

  const { id: postId } = await publishRes.json() as { id: string }

  // Step 3: Add remaining hashtags as first comment
  const remainingTags = post.hashtags.slice(5).map(h => `#${h}`).join(' ')
  if (remainingTags) {
    await fetch(
      `${IG_API_BASE}/${postId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:      remainingTags,
          access_token: IG_TOKEN,
        }),
      }
    ).catch(e => console.warn('[cron/instagram] Hashtag comment failed:', e?.message))
  }

  return { id: postId }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const post = getTodaysPost()

  if (!post) {
    const today = new Date().toISOString().slice(0, 10)
    console.log(`[cron/instagram] No post scheduled for ${today}`)
    return NextResponse.json({ skipped: true, reason: `No post scheduled for ${today}` })
  }

  try {
    const result = await publishInstagramPost(post)
    console.log(`[cron/instagram] Published week ${post.week} (${post.day}) post: ${result.id}`)
    return NextResponse.json({
      success: true,
      postId:  result.id,
      week:    post.week,
      day:     post.day,
      format:  post.format,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[cron/instagram] Publish error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
