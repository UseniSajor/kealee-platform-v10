import Stripe from 'stripe'

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.warn('⚠️  STRIPE_SECRET_KEY is not set - Stripe functionality will not work')
    throw new Error('STRIPE_SECRET_KEY is not set. Please add it to your Railway environment variables.')
  }

  // Note: keep apiVersion default unless you pin one org-wide.
  return new Stripe(key)
}

