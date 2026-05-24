/**
 * POST /api/marketing/campaign/start — proxies to web-main campaign runner.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function webMainBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com').replace(/\/$/, '')
}

function opsSecret(): string | undefined {
  return (
    process.env.CRON_SECRET ??
    process.env.KEALEE_OPS_SECRET ??
    process.env.MARKETING_BOT_API_KEY
  )
}

export async function POST(req: NextRequest) {
  const secret = opsSecret()
  if (!secret) {
    return NextResponse.json(
      { error: 'Set CRON_SECRET or KEALEE_OPS_SECRET on Command Center' },
      { status: 503 },
    )
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  try {
    const res = await fetch(`${webMainBase()}/api/marketing/campaign/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const json = await res.json()
    return NextResponse.json(json, { status: res.status })
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}

export async function GET() {
  const secret = opsSecret()
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(`${webMainBase()}/api/marketing/campaign/start`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    const json = await res.json()
    return NextResponse.json(json, { status: res.status })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
