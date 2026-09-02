import { NextResponse } from 'next/server'

/**
 * Liveness probe.
 *
 * Railway marks a deployment FAILED when its healthcheck never answers, which
 * is what happened here: the app started fine ("Ready in 53ms") and the probe
 * had nothing to hit. The root `railway.toml` checks `/health`; the per-app
 * `railway.json` files check `/api/health`. Serving both means the answer does
 * not depend on which config wins.
 *
 * Deliberately checks nothing downstream. A liveness probe that fails when the
 * database is slow takes a healthy container out of rotation for a fault it
 * cannot fix.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json({ ok: true }, { status: 200 })
}
