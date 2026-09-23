import { NextResponse } from 'next/server'
import { buildIdentity, capabilityReport } from '@kealee/core-rules'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Liveness plus BUILD IDENTITY.
 *
 * This used to return `{"ok":true}` and nothing else, which made "is this
 * deployed?" unanswerable from outside the Railway dashboard. A feature in the
 * repo was indistinguishable from a feature that was live, and every claim
 * about production was an inference. Now the commit is on the wire.
 *
 * Still cheap and dependency-free: no database, no network. `/api/health/deep`
 * is where anything that can be slow belongs.
 */
export function GET() {
  const identity = buildIdentity('web-main')
  const { capabilities, missing } = capabilityReport({
    // Present in the bundle iff the module resolves at build time.
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    replicateConfigured: Boolean(process.env.REPLICATE_API_TOKEN),
    anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  })
  return NextResponse.json({ ok: true, ...identity, capabilities, missing }, { status: 200 })
}
