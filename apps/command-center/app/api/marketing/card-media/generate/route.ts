import { NextRequest, NextResponse } from 'next/server'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'
const SECRET = process.env.CRON_SECRET ?? process.env.MARKETING_BOT_API_KEY

/** Proxy to web-main card media generator (MarketingBot + concept video). */
export async function POST(req: NextRequest) {
  if (!SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured on Command Center' }, { status: 503 })
  }
  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${SITE}/api/marketing/card-media/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': SECRET,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return NextResponse.json(json, { status: res.status })
}
