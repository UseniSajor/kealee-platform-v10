import { NextRequest, NextResponse } from 'next/server'
import { runCardMediaBatch, type GenerateCardMediaOptions } from '@/lib/marketing/card-media-generator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function assertAuthorized(req: NextRequest): boolean {
  const secret =
    req.headers.get('x-cron-secret') ??
    req.headers.get('x-marketing-bot-key') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const expected =
    process.env.CRON_SECRET ??
    process.env.MARKETING_BOT_API_KEY ??
    process.env.ADMIN_API_KEY
  return Boolean(expected && secret === expected)
}

/**
 * POST /api/marketing/card-media/generate
 * MarketingBot (prompts) + DesignBot (DALL-E/Replicate) + concept video engine.
 *
 * Body: { scope?: 'home'|'product'|'all', keys?: string[], skipVideo?: boolean, dryRun?: boolean }
 */
export async function POST(req: NextRequest) {
  if (!assertAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as GenerateCardMediaOptions & {
    keys?: string[]
  }

  if (!process.env.OPENAI_API_KEY && !process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      {
        error: 'No image provider configured',
        hint: 'Set OPENAI_API_KEY (DALL-E) and/or REPLICATE_API_TOKEN (design-engine fallback)',
      },
      { status: 503 },
    )
  }

  try {
    const { manifest, results } = await runCardMediaBatch({
      scope: body.scope ?? 'all',
      keys: body.keys,
      skipVideo: body.skipVideo,
      dryRun: body.dryRun,
      useMarketingBot: body.useMarketingBot !== false,
    })

    const ok = results.filter((r) => r.ok).length
    return NextResponse.json({
      success: true,
      generated: ok,
      failed: results.length - ok,
      updatedAt: manifest.updatedAt,
      results,
    })
  } catch (err) {
    console.error('[card-media/generate]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    )
  }
}
