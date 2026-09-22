import type Stripe from 'stripe'

/**
 * Per-session branding keeps hosted and embedded Stripe Checkout consistent
 * with the public Kealee site. Stripe standard accounts cannot update their
 * own global branding through the Accounts API, so every Checkout Session
 * supplies the canonical public K asset directly.
 */
export const KEALEE_STRIPE_CHECKOUT_BRANDING: NonNullable<
  Stripe.Checkout.SessionCreateParams['branding_settings']
> = {
  background_color: '#FFFFFF',
  border_style: 'rounded',
  button_color: '#EE7326',
  font_family: 'nunito',
  icon: {
    type: 'url',
    url: 'https://www.kealee.com/kealee-icon-512x512-transparent.png',
  },
  logo: {
    type: 'url',
    url: 'https://www.kealee.com/kealee-icon-512x512-transparent.png',
  },
}
