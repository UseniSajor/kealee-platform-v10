import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

/** Proxy card media manifest from web-main. */
export async function GET() {
  try {
    const res = await fetch(`${SITE.replace(/\/$/, '')}/api/marketing/card-media`, {
      next: { revalidate: 60 },
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: json.error ?? `Upstream ${res.status}`, site: SITE },
        { status: res.status },
      )
    }
    return NextResponse.json(json)
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load manifest' },
      { status: 502 },
    )
  }
}
