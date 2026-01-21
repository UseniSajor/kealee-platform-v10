/**
 * Webhook Testing Utilities
 * Helper functions for testing Stripe webhooks locally
 * 
 * Provides both:
 * - Mock event payload generation (for fast, offline testing)
 * - Real Stripe API calls (for integration testing)
 */

import Stripe from 'stripe'
import { getStripe } from '../billing/stripe.client'
import crypto from 'crypto'

/**
 * Generate a test Stripe webhook signature
 * Note: This is for testing only. In production, use real Stripe webhooks.
 */
export function generateTestWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  const stripe = getStripe()
  
  // Use Stripe's signature generation (if available)
  // Otherwise, manually construct signature
  const signedPayload = `${timestamp}.${payload}`
  const crypto = require('crypto')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex')
  
  return `t=${timestamp},v1=${signature}`
}

/**
 * Create a test checkout.session.completed event payload
 */
export function createTestCheckoutSessionCompletedEvent(sessionData?: Partial<Stripe.Checkout.Session>): Stripe.Event {
  const defaultSession: Partial<Stripe.Checkout.Session> = {
    id: `cs_test_${Date.now()}`,
    object: 'checkout.session',
    mode: 'subscription',
    status: 'complete',
    subscription: `sub_test_${Date.now()}`,
    client_reference_id: null,
    customer: `cus_test_${Date.now()}`,
    customer_email: 'test@example.com',
    amount_total: 175000, // $1,750.00
    currency: 'usd',
    metadata: {
      orgId: 'test-org-id',
      planSlug: 'package-a',
      interval: 'month',
    },
    ...sessionData,
  }

  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2025-01-27.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: defaultSession as any,
      previous_attributes: {},
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
  }
}

/**
 * Create a test customer.subscription.updated event payload
 */
export function createTestSubscriptionUpdatedEvent(subscriptionData?: Partial<Stripe.Subscription>): Stripe.Event {
  const defaultSubscription: Partial<Stripe.Subscription> = {
    id: `sub_test_${Date.now()}`,
    object: 'subscription',
    status: 'active',
    customer: `cus_test_${Date.now()}`,
    current_period_start: Math.floor(Date.now() / 1000) as any,
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 as any, // 30 days
    cancel_at_period_end: false,
    canceled_at: null,
    metadata: {
      orgId: 'test-org-id',
      planSlug: 'package-b',
      interval: 'month',
    },
    items: {
      object: 'list',
      data: [{
        id: `si_test_${Date.now()}`,
        object: 'subscription_item',
        price: {
          id: 'price_test',
          object: 'price',
          active: true,
          currency: 'usd',
          unit_amount: 350000, // $3,500.00
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
        } as any,
        quantity: 1,
      } as any],
      has_more: false,
      url: '',
    },
    ...subscriptionData,
  }

  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2025-01-27.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'customer.subscription.updated',
    data: {
      object: defaultSubscription as any,
      previous_attributes: {},
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
  }
}

/**
 * Create a test invoice.payment_failed event payload
 */
export function createTestInvoicePaymentFailedEvent(invoiceData?: Partial<Stripe.Invoice>): Stripe.Event {
  const defaultInvoice: Partial<Stripe.Invoice> = {
    id: `in_test_${Date.now()}`,
    object: 'invoice',
    status: 'open',
    customer: `cus_test_${Date.now()}`,
    customer_email: 'test@example.com',
    subscription: `sub_test_${Date.now()}`,
    amount_due: 175000, // $1,750.00
    currency: 'usd',
    hosted_invoice_url: 'https://invoice.stripe.com/test',
    last_payment_error: {
      type: 'card_error',
      message: 'Your card was declined.',
      code: 'card_declined',
    } as any,
    ...invoiceData,
  }

  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2025-01-27.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'invoice.payment_failed',
    data: {
      object: defaultInvoice as any,
      previous_attributes: {},
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
  }
}

/**
 * Send a test webhook to the webhook handler
 * Useful for local testing
 */
export async function sendTestWebhook(
  event: Stripe.Event,
  webhookSecret: string
): Promise<{ signature: string; payload: string }> {
  const payload = JSON.stringify(event)
  const timestamp = event.created
  const signature = generateTestWebhookSignature(payload, webhookSecret, timestamp)

  return {
    signature,
    payload,
  }
}

/**
 * Webhook Testing Class
 * Provides methods for creating real Stripe objects and testing webhooks
 */
export class WebhookTesting {
  private static stripe = getStripe()

  /**
   * Create a real test checkout session via Stripe API
   * Note: This creates actual Stripe objects and requires valid API keys
   */
  static async createTestCheckoutSession(customerId?: string) {
    const testPriceId = process.env.STRIPE_TEST_PRICE_ID
    if (!testPriceId) {
      throw new Error('STRIPE_TEST_PRICE_ID environment variable is required')
    }

    return await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: testPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/cancel`,
      client_reference_id: 'test-user-123',
    })
  }

  /**
   * Create a real test subscription via Stripe API
   * Note: This creates actual Stripe objects and requires valid API keys
   */
  static async createTestSubscription(customerId: string) {
    const testPriceId = process.env.STRIPE_TEST_PRICE_ID
    if (!testPriceId) {
      throw new Error('STRIPE_TEST_PRICE_ID environment variable is required')
    }

    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: testPriceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })
  }

  /**
   * Generate a generic test webhook payload for any event type
   */
  static async generateTestWebhookPayload(eventType: string): Promise<Stripe.Event> {
    const timestamp = Math.floor(Date.now() / 1000)
    
    const baseEvent = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2025-01-27.acacia',
      created: timestamp,
      data: {
        object: {} as any,
        previous_attributes: {},
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_${Date.now()}`,
        idempotency_key: `idemp_${Date.now()}`,
      },
      type: eventType as Stripe.Event.Type,
    }

    switch (eventType) {
      case 'checkout.session.completed':
        baseEvent.data.object = {
          id: `cs_test_${Date.now()}`,
          object: 'checkout.session',
          subscription: `sub_test_${Date.now()}`,
          customer: `cus_test_${Date.now()}`,
          client_reference_id: 'test-user-123',
          mode: 'subscription',
          payment_status: 'paid',
          status: 'complete',
        } as any
        break

      case 'customer.subscription.updated':
        baseEvent.data.object = {
          id: `sub_test_${Date.now()}`,
          object: 'subscription',
          status: 'active',
          current_period_start: timestamp,
          current_period_end: timestamp + 2592000, // 30 days
          cancel_at_period_end: false,
          customer: `cus_test_${Date.now()}`,
        } as any
        break

      case 'invoice.payment_failed':
        baseEvent.data.object = {
          id: `in_test_${Date.now()}`,
          object: 'invoice',
          subscription: `sub_test_${Date.now()}`,
          customer: `cus_test_${Date.now()}`,
          attempt_count: 1,
          next_payment_attempt: timestamp + 86400, // 24 hours
          status: 'open',
          paid: false,
        } as any
        break

      default:
        // Generic object for unknown event types
        baseEvent.data.object = {
          id: `obj_test_${Date.now()}`,
          object: 'unknown',
        } as any
    }

    return baseEvent
  }

  /**
   * Verify webhook signature
   * Useful for testing signature verification logic
   */
  static async verifyWebhookSignature(
    payload: string,
    secret: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Parse Stripe signature format: t=timestamp,v1=signature
      const parts = signature.split(',')
      const timestampPart = parts.find(p => p.startsWith('t='))
      const signaturePart = parts.find(p => p.startsWith('v1='))

      if (!timestampPart || !signaturePart) {
        return false
      }

      const timestamp = timestampPart.split('=')[1]
      const expectedSignature = signaturePart.split('=')[1]

      // Construct signed payload
      const signedPayload = `${timestamp}.${payload}`
      
      // Generate expected signature
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex')

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(computedSignature)
      )
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }
}
