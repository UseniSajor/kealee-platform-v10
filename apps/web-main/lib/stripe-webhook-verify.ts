import type Stripe from 'stripe'

/** Live Dashboard signing secret(s). Comma-separated for rotation. */
export function getStripeWebhookSecrets(): string[] {
  const raw = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_LIVE,
    process.env.STRIPE_WEBHOOK_SECRETS,
  ]
    .filter(Boolean)
    .join(',')

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('whsec_'))
}

export function verifyStripeWebhookEvent(
  stripe: Stripe,
  rawBody: string,
  signature: string,
): Stripe.Event {
  const secrets = getStripeWebhookSecrets()
  if (secrets.length === 0) {
    throw new Error('No STRIPE_WEBHOOK_SECRET configured')
  }

  let lastMessage = 'Invalid signature'
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret)
    } catch (err: unknown) {
      lastMessage = err instanceof Error ? err.message : String(err)
    }
  }
  throw new Error(lastMessage)
}
