import type { NextRequest } from 'next/server'
import { POST as processSharedStripeWebhook } from '../stripe/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Backward-compatible endpoint alias. All signature verification, idempotency,
 * routing, and side effects live in the canonical `/api/webhooks/stripe` route.
 */
export async function POST(req: NextRequest) {
  return processSharedStripeWebhook(req)
}
