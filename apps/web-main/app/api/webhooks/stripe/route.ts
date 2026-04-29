/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe checkout.session.completed for source='public_intake'.
 * 1. Verifies Stripe webhook signature
 * 2. Updates public_intake_leads status to 'paid'
 * 3. Triggers concept generation for design/development services
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET  (from Stripe Dashboard → Webhooks)
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'

export const runtime = 'nodejs' // Required: raw body access for signature verification

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    console.error('[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })

  // Read raw body for signature verification
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── payment_intent.payment_failed ─────────────────────────────────────────
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const meta = pi.metadata ?? {}
    const intakeId = meta.intakeId
    const projectPath = meta.projectPath
    const source = meta.source

    const failureMessage =
      pi.last_payment_error?.message ?? 'Unknown error'

    console.log(`[stripe-webhook] payment_intent.payment_failed intakeId=${intakeId} reason="${failureMessage}"`)

    // Fire-and-forget email notification
    if (intakeId && source) {
      const baseUrl = req.nextUrl.origin
      fetch(`${baseUrl}/api/emails/payment-failed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: pi.receipt_email ?? '',
          firstName: '',
          service: projectPath ?? source,
          amount: pi.amount,
          intakeId,
          failureMessage,
          source,
        }),
      }).catch((err: Error) => {
        console.error('[stripe-webhook] payment-failed email trigger failed:', err.message)
      })
    }

    return NextResponse.json({ received: true })
  }

  // ── checkout.session.expired ───────────────────────────────────────────────
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata ?? {}
    const intakeId = meta.intakeId

    console.log(`[stripe-webhook] checkout.session.expired intakeId=${intakeId}`)

    return NextResponse.json({ received: true })
  }

  // ── checkout.session.completed ─────────────────────────────────────────────
  if (event.type !== 'checkout.session.completed') {
    // Acknowledge other events without processing
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta = session.metadata ?? {}

  // Only handle public_intake source
  if (meta.source !== 'public_intake') {
    return NextResponse.json({ received: true })
  }

  const intakeId = meta.intakeId
  const projectPath = meta.projectPath

  if (!intakeId || !projectPath) {
    console.error('[stripe-webhook] Missing intakeId or projectPath in metadata', meta)
    return NextResponse.json({ received: true })
  }

  const supabase = getSupabaseAdmin()

  // 1. Mark intake as paid
  const { error: updateErr } = await supabase
    .from('public_intake_leads')
    .update({ status: 'paid' })
    .eq('id', intakeId)
    .eq('status', 'new') // Only update if still new (idempotency)

  if (updateErr) {
    console.error('[stripe-webhook] Failed to update intake status:', updateErr.message)
    // Don't return error — Stripe would retry. Log and continue.
  }

  // 2. Trigger concept generation for design/development services (fire-and-forget)
  const deliverable = SERVICE_DELIVERABLES[projectPath]
  if (deliverable?.generatesConcept) {
    const baseUrl = req.nextUrl.origin
    // Non-blocking — Stripe gets 200 immediately
    fetch(`${baseUrl}/api/concept/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId }),
    }).catch((err: Error) => {
      console.error('[stripe-webhook] Concept generation trigger failed:', err.message)
    })
  }

  return NextResponse.json({ received: true })
}
