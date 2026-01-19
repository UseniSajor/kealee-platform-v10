import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance
  
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.error('❌ STRIPE_SECRET_KEY is not set - Stripe functionality will not work')
    console.error('   Please add STRIPE_SECRET_KEY to your Railway environment variables')
    console.error('   The API will start but billing features will be disabled')
    
    // Return a mock Stripe instance that throws helpful errors when used
    return new Proxy({} as Stripe, {
      get: () => {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
      }
    })
  }

  stripeInstance = new Stripe(key)
  return stripeInstance
}

