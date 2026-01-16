import Stripe from 'stripe'

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }

  // Note: keep apiVersion default unless you pin one org-wide.
  return new Stripe(key)
}

