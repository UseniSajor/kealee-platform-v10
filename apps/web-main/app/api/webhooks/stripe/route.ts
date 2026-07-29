/**
 * POST /api/webhooks/stripe
 *
 * Stripe live endpoint: https://kealee.com/api/webhooks/stripe
 *
 * Required on Vercel (kealee-web-main Production):
 *   STRIPE_SECRET_KEY=sk_live_…
 *   STRIPE_WEBHOOK_SECRET=whsec_…  (Signing secret from this exact Dashboard endpoint)
 *   SUPABASE_SERVICE_ROLE_KEY=…
 */

import { NextRequest, NextResponse } from 'next/server'
import { createStripe } from '@/lib/stripe-client'
import { isStripeWebhookSideEffectsDisabledOnThisDeployment } from '@/lib/stripe-vercel-guard'
import { getStripeWebhookSecrets, verifyStripeWebhookEvent } from '@/lib/stripe-webhook-verify'
import { processStripeWebhookEvent } from '@/lib/stripe-webhook-handler'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
export const runtime = 'nodejs'

export async function GET() {
  const secrets = getStripeWebhookSecrets()
  const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_'))
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
  return NextResponse.json({
    ok: secrets.length > 0 && hasStripeKey && hasSupabase,
    endpoint: '/api/webhooks/stripe',
    webhookSecretsConfigured: secrets.length,
    supabaseConfigured: hasSupabase,
    environment: process.env.RAILWAY_ENVIRONMENT_NAME ?? process.env.VERCEL_ENV ?? 'local',
  })
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecrets = getStripeWebhookSecrets()

  if (!stripeKey) {
    console.error('[stripe-webhook] Missing STRIPE_SECRET_KEY')
    Sentry.captureMessage('Stripe webhook missing secret key', {
      level: 'fatal',
      tags: { area: 'payment-fulfillment', stage: 'webhook-configuration' },
    })
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 503 })
  }

  if (webhookSecrets.length === 0) {
    console.error('[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET (whsec_…) on this deployment')
    Sentry.captureMessage('Stripe webhook signing secret missing', {
      level: 'fatal',
      tags: { area: 'payment-fulfillment', stage: 'webhook-configuration' },
    })
    return NextResponse.json(
      {
        error: 'STRIPE_WEBHOOK_SECRET not configured',
        hint: 'Stripe Dashboard → Webhooks → kealee.com endpoint → Signing secret → Vercel env',
      },
      { status: 503 },
    )
  }

  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const stripe = createStripe(stripeKey)

  let event
  try {
    event = verifyStripeWebhookEvent(stripe, rawBody, sig)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[stripe-webhook] Signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (isStripeWebhookSideEffectsDisabledOnThisDeployment()) {
    console.warn('[stripe-webhook] Non-production Vercel — ack only', event.type, event.id)
    return NextResponse.json({ received: true, ignoredNonProduction: true })
  }

  try {
    await processStripeWebhookEvent(event, req)
    return NextResponse.json({ received: true, id: event.id, type: event.type })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[stripe-webhook] processing failed:', event.type, event.id, message)
    Sentry.captureException(err, {
      tags: {
        area: 'payment-fulfillment',
        stage: 'webhook-processing',
        stripeEventType: event.type,
      },
      extra: { stripeEventId: event.id },
    })
    return NextResponse.json(
      { error: 'Webhook processing failed', eventId: event.id, message },
      { status: 500 },
    )
  }
}
