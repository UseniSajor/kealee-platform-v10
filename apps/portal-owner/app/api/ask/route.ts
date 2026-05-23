/**
 * Proxies to web-main /api/ask so the owner portal ask rail works without CORS.
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function webMainBase(): string {
  return (process.env.NEXT_PUBLIC_WEB_MAIN_URL ?? 'https://kealee.com').replace(/\/$/, '')
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const upstream = `${webMainBase()}/api/ask`

  try {
    const res = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    const contentType = res.headers.get('content-type') ?? 'text/plain; charset=utf-8'
    return new Response(res.body, { status: res.status, headers: { 'Content-Type': contentType } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ask proxy failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
