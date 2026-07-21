import Stripe from 'stripe'
import { afterEach, describe, expect, it } from 'vitest'
import { getStripeWebhookSecrets, verifyStripeWebhookEvent } from '../stripe-webhook-verify'

const stripe = new Stripe('sk_test_fixture', { apiVersion: '2023-10-16' })
const payload = JSON.stringify({
  id: 'evt_test_signed', object: 'event', type: 'checkout.session.completed',
  data: { object: { id: 'cs_test_signed', object: 'checkout.session' } },
})

describe('Stripe webhook signature verification', () => {
  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_WEBHOOK_SECRET_LIVE
    delete process.env.STRIPE_WEBHOOK_SECRETS
  })

  it('accepts a fixture signed with the configured test secret', () => {
    const secret = 'whsec_fixture_primary'
    process.env.STRIPE_WEBHOOK_SECRET = secret
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret })
    expect(verifyStripeWebhookEvent(stripe, payload, signature)).toEqual(expect.objectContaining({
      id: 'evt_test_signed', type: 'checkout.session.completed',
    }))
  })

  it('supports secret rotation without weakening verification', () => {
    const rotated = 'whsec_fixture_rotated'
    process.env.STRIPE_WEBHOOK_SECRETS = `whsec_fixture_old,${rotated}`
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: rotated })
    expect(getStripeWebhookSecrets()).toHaveLength(2)
    expect(verifyStripeWebhookEvent(stripe, payload, signature).id).toBe('evt_test_signed')
  })

  it('rejects a modified raw body', () => {
    const secret = 'whsec_fixture_primary'
    process.env.STRIPE_WEBHOOK_SECRET = secret
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret })
    expect(() => verifyStripeWebhookEvent(stripe, `${payload} `, signature)).toThrow()
  })
})
