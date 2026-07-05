/**
 * GET /api/cron/youtube
 *
 * Vercel Cron — runs Wed + Fri at 10am ET (15:00 UTC).
 * Finds videos scheduled for today and sets their privacy from PRIVATE → PUBLIC
 * via the YouTube Data API v3.
 *
 * Workflow:
 * 1. Record and edit the video
 * 2. Upload to YouTube Studio as PRIVATE
 * 3. Copy the video ID from the URL and add it to youtube-content.ts (youtubeId field)
 * 4. Set scheduledDate in youtube-content.ts
 * 5. This cron publishes it on that date automatically
 *
 * Required env vars:
 *   YOUTUBE_OAUTH_TOKEN   — OAuth 2.0 access token with youtube.force-ssl scope
 *   CRON_SECRET           — shared cron Bearer auth
 *
 * Getting the OAuth token:
 * 1. Create a project at console.cloud.google.com
 * 2. Enable YouTube Data API v3
 * 3. Create OAuth 2.0 credentials (Desktop app type)
 * 4. Use Google OAuth Playground (developers.google.com/oauthplayground)
 *    to authorize scope: https://www.googleapis.com/auth/youtube.force-ssl
 * 5. Exchange for refresh token — store as YOUTUBE_REFRESH_TOKEN
 * 6. This route refreshes the access token automatically
 *
 * Note: YouTube Data API v3 has a daily quota of 10,000 units.
 * videos.update costs 50 units. This cron uses ~50–100 units/day.
 */

import { NextRequest, NextResponse }              from 'next/server'
import { YOUTUBE_VIDEOS, YouTubeVideo, buildDescription } from '@/lib/marketing/youtube-content'
import { verifyCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

const CRON_SECRET     = process.env.CRON_SECRET              ?? ''
const CLIENT_ID       = process.env.YOUTUBE_CLIENT_ID        ?? ''
const CLIENT_SECRET   = process.env.YOUTUBE_CLIENT_SECRET    ?? ''
const REFRESH_TOKEN   = process.env.YOUTUBE_REFRESH_TOKEN    ?? ''
const YT_API_BASE     = 'https://www.googleapis.com/youtube/v3'
const GOOGLE_TOKEN    = 'https://oauth2.googleapis.com/token'

// ── Refresh OAuth access token ────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error('YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN must be set')
  }

  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Token refresh failed: ${res.status} — ${text}`)
  }

  const json = await res.json() as { access_token: string }
  return json.access_token
}

// ── Set video to public ───────────────────────────────────────────────────────

async function publishVideo(video: YouTubeVideo, accessToken: string): Promise<void> {
  if (!video.youtubeId) {
    throw new Error(`Video "${video.id}" has no youtubeId set — upload to YouTube Studio first`)
  }

  // Update video status to public + refresh title, description, tags
  const res = await fetch(
    `${YT_API_BASE}/videos?part=status,snippet`,
    {
      method: 'PUT',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: video.youtubeId,
        status: {
          privacyStatus:           'public',
          selfDeclaredMadeForKids: false,
        },
        snippet: {
          title:       video.title,
          description: buildDescription(video),
          tags:        video.tags,
          categoryId:  '26',  // Howto & Style (best fit for home improvement)
        },
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`YouTube videos.update error: ${res.status} — ${text}`)
  }

  console.log(`[cron/youtube] Published: "${video.title}" (${video.youtubeId})`)
}

// ── Find today's videos ───────────────────────────────────────────────────────

function getTodaysVideos(): YouTubeVideo[] {
  const today = new Date().toISOString().slice(0, 10)
  return YOUTUBE_VIDEOS.filter(v => v.scheduledDate === today && v.youtubeId)
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronDenied = verifyCronRequest(req)
  if (cronDenied) return cronDenied

  const videos = getTodaysVideos()

  if (!videos.length) {
    const today = new Date().toISOString().slice(0, 10)
    // Also check for videos scheduled today but missing youtubeId (warn)
    const unready = YOUTUBE_VIDEOS.filter(v => v.scheduledDate === today && !v.youtubeId)
    if (unready.length) {
      console.warn(`[cron/youtube] ${unready.length} video(s) scheduled today but missing youtubeId:`, unready.map(v => v.id))
      return NextResponse.json({
        skipped: true,
        reason: `${unready.length} video(s) scheduled today but not yet uploaded to YouTube Studio`,
        pending: unready.map(v => ({ id: v.id, title: v.title })),
      })
    }
    return NextResponse.json({ skipped: true, reason: `No videos scheduled for ${today}` })
  }

  const accessToken = await getAccessToken().catch(e => {
    throw new Error(`OAuth token error: ${e instanceof Error ? e.message : String(e)}`)
  })

  const results: Array<{ id: string; title: string; success: boolean; error?: string }> = []

  for (const video of videos) {
    try {
      await publishVideo(video, accessToken)
      results.push({ id: video.id, title: video.title, success: true })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[cron/youtube] Failed to publish "${video.id}":`, msg)
      results.push({ id: video.id, title: video.title, success: false, error: msg })
    }
  }

  const allOk = results.every(r => r.success)
  return NextResponse.json({ success: allOk, published: results }, { status: allOk ? 200 : 207 })
}
