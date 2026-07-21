/**
 * Stripe Setup Script
 * Creates subscription products and prices for Kealee GC Operations
 *
 * Usage:
 * STRIPE_SECRET_KEY=sk_... npx tsx scripts/setup-stripe-products.ts
 */

import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any })

interface Plan {
  slug: string
  name: string
  monthlyPrice: number
  annualPrice: number
  features: string[]
}

const PLANS: Plan[] = [
  {
    slug: 'package-a',
    name: 'Starter',
    monthlyPrice: 1750,
    annualPrice: Math.round(1750 * 12 * 0.85),
    features: ['Up to 5 projects', 'Basic project management', 'Email support', 'Core integrations'],
  },
  {
    slug: 'package-b',
    name: 'Growth',
    monthlyPrice: 3500,
    annualPrice: Math.round(3500 * 12 * 0.85),
    features: ['Up to 20 projects', 'Advanced project management', 'Priority support', 'Contractor marketplace'],
  },
  {
    slug: 'package-c',
    name: 'Professional',
    monthlyPrice: 7500,
    annualPrice: Math.round(7500 * 12 * 0.85),
    features: ['Unlimited projects', 'Full suite', 'Phone support', 'Custom workflows', 'Analytics'],
  },
  {
    slug: 'package-d',
    name: 'Enterprise',
    monthlyPrice: 16500,
    annualPrice: Math.round(16500 * 12 * 0.85),
    features: ['Unlimited everything', 'Dedicated manager', '24/7 support', 'Custom integrations'],
  },
]

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n')

  const results: Record<string, { productId: string; monthlyPriceId: string; annualPriceId: string }> = {}

  for (const plan of PLANS) {
    console.log(`📦 Creating ${plan.name} (${plan.slug})...`)

    // Create product
    const product = await stripe.products.create({
      name: `Kealee GC Operations - ${plan.name}`,
      description: `${plan.name} tier for Kealee GC Operations Platform`,
      metadata: {
        tier: plan.slug,
        moduleKey: 'm-ops-services',
      },
    })

    console.log(`   ✓ Product created: ${product.id}`)

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPrice * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 14,
      },
      metadata: {
        tier: plan.slug,
        interval: 'month',
      },
    })

    console.log(`   ✓ Monthly price: ${monthlyPrice.id} ($${plan.monthlyPrice}/mo)`)

    // Create annual price
    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.annualPrice * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'year',
        trial_period_days: 14,
      },
      metadata: {
        tier: plan.slug,
        interval: 'year',
      },
    })

    console.log(`   ✓ Annual price: ${annualPrice.id} ($${plan.annualPrice}/yr)\n`)

    results[plan.slug] = {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    }
  }

  // Generate environment variables
  console.log('📝 Add these environment variables to your .env.local or Railway:')
  console.log('=' .repeat(70))
  console.log('')

  for (const plan of PLANS) {
    const result = results[plan.slug]
    const packageName = plan.slug.toUpperCase().replace('-', '_')

    console.log(`# ${plan.name} Plan`)
    console.log(`STRIPE_PRICE_PACKAGE_${packageName}_MONTHLY=${result.monthlyPriceId}`)
    console.log(`STRIPE_PRICE_PACKAGE_${packageName}_ANNUAL=${result.annualPriceId}`)
    console.log(`STRIPE_PRODUCT_PACKAGE_${packageName}=${result.productId}`)
    console.log('')
  }

  console.log('=' .repeat(70))
  console.log('✅ Stripe setup complete!')
  console.log('')
  console.log('📌 Next steps:')
  console.log('1. Copy the environment variables above')
  console.log('2. Add them to Railway environment variables')
  console.log('3. Redeploy your application')
  console.log('4. Test checkout flow at /checkout')
}

// Run setup
setupStripeProducts().catch((err) => {
  console.error('❌ Setup failed:', err.message)
  process.exit(1)
})
