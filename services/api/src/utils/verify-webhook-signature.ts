/**
 * Webhook Signature Verification Utility
 * Provides functions for verifying Stripe webhook signatures
 */

import crypto from 'crypto'
import Stripe from 'stripe'
import { getStripe } from '../modules/billing/stripe.client'

/**
 * Verify webhook signature
 * @param payload - Raw webhook payload (string or Buffer)
 * @param signature - Stripe signature header
 * @param secret - Webhook signing secret
 * @returns Verification result with event if valid
 */
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Promise<{ valid: boolean; event?: Stripe.Event; error?: string }> {
  try {
    const stripe = getStripe()
    const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8')
    
    const event = stripe.webhooks.constructEvent(buf, signature, secret)
    
    // Additional security checks
    const tolerance = 300 // 5 minutes
    const timestamp = extractTimestamp(signature)
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (Math.abs(currentTime - timestamp) > tolerance) {
      return {
        valid: false,
        error: 'Webhook timestamp outside tolerance window (5 minutes)',
      }
    }
    
    return { valid: true, event }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Signature verification failed',
    }
  }
}

/**
 * Extract timestamp from Stripe signature
 * @param signature - Stripe signature header (format: t=timestamp,v1=signature)
 * @returns Unix timestamp
 */
export function extractTimestamp(signature: string): number {
  const parts = signature.split(',')
  for (const part of parts) {
    if (part.startsWith('t=')) {
      const timestamp = parseInt(part.substring(2), 10)
      if (isNaN(timestamp)) {
        throw new Error('Invalid timestamp in signature')
      }
      return timestamp
    }
  }
  throw new Error('No timestamp found in signature')
}

/**
 * Test webhook verification (for development/testing)
 */
export async function testWebhookVerification(): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
  }

  const testPayload = JSON.stringify({
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
      },
    },
  })

  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${testPayload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  const fullSignature = `t=${timestamp},v1=${signature}`

  const result = await verifyWebhookSignature(testPayload, fullSignature, secret)
  
  if (result.valid) {
    console.log('✅ Webhook verification test passed')
  } else {
    console.error('❌ Webhook verification test failed:', result.error)
  }
}

// Run test if executed directly
if (require.main === module) {
  testWebhookVerification().catch(console.error)
}
