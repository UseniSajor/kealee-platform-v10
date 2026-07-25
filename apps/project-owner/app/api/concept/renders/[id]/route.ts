/**
 * GET /api/concept/renders/[id]
 *
 * Proxy to web-main's Replicate polling route. Keeps the deliverable page's
 * fetch calls relative (same origin) without adding `replicate` as a
 * dependency of portal-owner.
 *
 * Override the upstream URL via KEALEE_WEB_MAIN_URL for local dev.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const UPSTREAM = (process.env.KEALEE_WEB_MAIN_URL ?? 'https://kealee.com').replace(/\/$/, '')

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const res = await fetch(`${UPSTREAM}/api/concept/renders/${params.id}`, {
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('[portal-owner/concept/renders]', err?.message)
    return NextResponse.json({ error: 'Failed to fetch render status' }, { status: 500 })
  }
}
