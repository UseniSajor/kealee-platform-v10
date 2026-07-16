import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { hasOsAdminRole, verifyOpsBearer } from '@kealee/auth/ops-api-auth'

export const runtime = 'nodejs'

async function authorizeRedeliver(req: NextRequest): Promise<NextResponse | null> {
  if (verifyOpsBearer(req)) return null

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (user.app_metadata?.role as string | undefined)?.toLowerCase()
  if (!hasOsAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

/**
 * POST /api/purchases/:id/redeliver
 *
 * Manual staff lever for a paid order whose deliverables (e.g. Premium+ CAD
 * export) didn't finish generating automatically. Re-invokes web-main's
 * concept/generate route, which is idempotent for already-generated concepts —
 * it backfills any missing deliverable (floor plan, CAD/DXF, PDF) onto the
 * existing package rather than regenerating the whole concept from scratch.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await authorizeRedeliver(req)
  if (denied) return denied

  const { id: intakeId } = await params
  const webMainUrl = (process.env.NEXT_PUBLIC_WEB_MAIN_URL ?? 'https://kealee.com').replace(/\/$/, '')

  try {
    const res = await fetch(`${webMainUrl}/api/concept/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ error: body?.error ?? 'Redelivery failed', detail: body }, { status: res.status })
    }
    return NextResponse.json({ ok: true, result: body })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
