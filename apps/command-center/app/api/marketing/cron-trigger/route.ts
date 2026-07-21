import { NextRequest, NextResponse } from 'next/server'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'
const SECRET = process.env.CRON_SECRET ?? process.env.MARKETING_BOT_API_KEY

/** Proxy manual cron invocation to web-main (Vercel cron auth). */
export async function POST(req: NextRequest) {
  if (!SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured on Command Center' }, { status: 503 })
  }

  const body = (await req.json().catch(() => ({}))) as { path?: string }
  const path = body.path?.startsWith('/') ? body.path : null
  if (!path || !path.startsWith('/api/cron/')) {
    return NextResponse.json({ error: 'Invalid cron path' }, { status: 400 })
  }

  const url = `${SITE.replace(/\/$/, '')}${path}`
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SECRET}`,
        'x-cron-secret': SECRET,
      },
      cache: 'no-store',
    })
    const text = await res.text()
    let json: unknown = { raw: text.slice(0, 500) }
    try {
      json = JSON.parse(text)
    } catch {
      /* keep raw */
    }
    return NextResponse.json(
      { ok: res.ok, status: res.status, path, result: json },
      { status: res.ok ? 200 : res.status },
    )
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Cron trigger failed', path },
      { status: 502 },
    )
  }
}
