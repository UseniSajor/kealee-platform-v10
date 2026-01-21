/**
 * Stripe Ops Services Products Setup
 * 
 * This script creates/updates Stripe products and prices for:
 * - Package-based subscriptions (A, B, C, D)
 * - A la carte products (8 service request categories)
 * 
 * Run: pnpm tsx scripts/stripe/setup-ops-products.ts
 */

import Stripe from 'stripe'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file if it exists
config({ path: resolve(process.cwd(), '.env.local') })

// Environment variable helper
function env(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var ${key}`)
  return v
}

// Package definitions (from OPS_SERVICES_PRODUCTS.md)
interface PackagePlan {
  slug: 'package-a' | 'package-b' | 'package-c' | 'package-d'
  display: string
  monthlyPrice: number // in dollars
  annualPrice?: number // in dollars (optional, calculated if not provided)
  description: string
  features: string[]
}

const packages: PackagePlan[] = [
  {
    slug: 'package-a',
    display: 'Package A - Starter',
    monthlyPrice: 1750,
    annualPrice: 1750 * 12 * 0.85, // 15% discount for annual
    description: 'Starter package for small projects',
    features: [
      '5-10 hours/week PM time',
      'Single project focus',
      'Email support (48hr response)',
      'Weekly progress reports',
      'Basic task tracking',
    ],
  },
  {
    slug: 'package-b',
    display: 'Package B - Professional',
    monthlyPrice: 3750,
    annualPrice: 3750 * 12 * 0.85,
    description: 'Professional package for growing projects',
    features: [
      '15-20 hours/week PM time',
      'Up to 3 concurrent projects',
      'Priority email & phone support',
      'Bi-weekly progress reports',
      'Advanced project tracking',
      'Contractor coordination',
    ],
  },
  {
    slug: 'package-c',
    display: 'Package C - Premium',
    monthlyPrice: 6500,
    annualPrice: 6500 * 12 * 0.85,
    description: 'Premium package for complex projects',
    features: [
      '30-40 hours/week PM time',
      'Unlimited projects',
      '24/7 priority support',
      'Daily progress reports',
      'Dedicated PM assigned',
      'Full contractor management',
      'Budget optimization',
      'Risk management',
    ],
  },
  {
    slug: 'package-d',
    display: 'Package D - Enterprise',
    monthlyPrice: 10500,
    annualPrice: 10500 * 12 * 0.85,
    description: 'Enterprise package for portfolio management',
    features: [
      '40+ hours/week PM time',
      'Portfolio management',
      'Dedicated account manager',
      'Custom reporting',
      'Strategic planning support',
      'Multi-project coordination',
      'Executive-level insights',
      'White-glove service',
    ],
  },
]

// A la carte product definitions
interface ALaCarteProduct {
  slug: string
  display: string
  description: string
  priceType: 'one-time' | 'recurring'
  price?: number // in dollars (if one-time or fixed recurring)
  priceRange?: { min: number; max: number } // if variable pricing
}

const aLaCarteProducts: ALaCarteProduct[] = [
  {
    slug: 'permit-application-help',
    display: 'Permit Application Help',
    description: 'Applications, resubmittals, follow-ups, jurisdiction communications',
    priceType: 'one-time',
    priceRange: { min: 150, max: 500 },
  },
  {
    slug: 'inspection-scheduling',
    display: 'Inspection Scheduling',
    description: 'Book inspections, coordinate trades, prep checklists',
    priceType: 'one-time',
    priceRange: { min: 100, max: 300 },
  },
  {
    slug: 'contractor-coordination',
    display: 'Contractor Coordination',
    description: 'Subs/vendors scheduling, updates, and accountability',
    priceType: 'recurring',
    price: 500, // per month
  },
  {
    slug: 'change-order-management',
    display: 'Change Order Management',
    description: 'CO drafting, approvals, documentation, client communications',
    priceType: 'one-time',
    priceRange: { min: 200, max: 750 },
  },
  {
    slug: 'billing-invoicing',
    display: 'Billing & Invoicing',
    description: 'Owner invoices, vendor bills, lien waivers, receipts',
    priceType: 'recurring',
    price: 300, // per month
  },
  {
    slug: 'schedule-optimization',
    display: 'Schedule Optimization',
    description: 'Tighten sequence, reduce downtime, protect milestones',
    priceType: 'one-time',
    priceRange: { min: 500, max: 2000 },
  },
  {
    slug: 'document-preparation',
    display: 'Document Preparation',
    description: 'Submittals, closeout docs, plan sets, compliance files',
    priceType: 'one-time',
    priceRange: { min: 150, max: 500 },
  },
  {
    slug: 'other-operations-help',
    display: 'Other Operations Help',
    description: 'Anything ops-related that\'s slowing your team down',
    priceType: 'one-time',
    priceRange: { min: 200, max: 1000 },
  },
]

/**
 * Upsert a Stripe product
 */
async function upsertProduct(
  stripe: Stripe,
  data: {
    name: string
    description: string
    metadata: Record<string, string>
  }
): Promise<Stripe.Product> {
  // Search for existing product by metadata
  let product: Stripe.Product | undefined

  try {
    const searchKey = Object.keys(data.metadata)[0]
    const searchValue = data.metadata[searchKey]
    const res = await stripe.products.search({
      query: `metadata['${searchKey}']:'${searchValue}' AND active:'true'`,
      limit: 10,
    })
    product = res.data[0]
  } catch {
    // Fallback to listing
    const res = await stripe.products.list({ limit: 100, active: true })
    const searchKey = Object.keys(data.metadata)[0]
    const searchValue = data.metadata[searchKey]
    product = res.data.find((p) => p.metadata?.[searchKey] === searchValue)
  }

  if (product) {
    // Update if exists
    return stripe.products.update(product.id, {
      name: data.name,
      description: data.description,
      metadata: data.metadata,
    })
  }

  // Create new product
  return stripe.products.create({
    name: data.name,
    description: data.description,
    metadata: data.metadata,
    active: true,
  })
}

/**
 * Upsert a Stripe price
 */
async function upsertPrice(
  stripe: Stripe,
  data: {
    productId: string
    lookupKey: string
    unitAmount: number // in cents
    interval?: 'month' | 'year'
    currency?: string
  }
): Promise<Stripe.Price> {
  // Search for existing price by lookup_key
  let price: Stripe.Price | undefined

  try {
    const res = await stripe.prices.search({
      query: `lookup_key:'${data.lookupKey}'`,
      limit: 10,
    })
    price = res.data[0]
  } catch {
    // Fallback to listing
    const res = await stripe.prices.list({ product: data.productId, limit: 100 })
    price = res.data.find((p) => p.lookup_key === data.lookupKey)
  }

  if (price) {
    // Prices are immutable, return existing
    return price
  }

  // Create new price
  const priceData: Stripe.PriceCreateParams = {
    product: data.productId,
    currency: data.currency || 'usd',
    unit_amount: data.unitAmount,
    lookup_key: data.lookupKey,
    nickname: data.lookupKey,
    metadata: {
      productType: 'ops-services',
    },
  }

  if (data.interval) {
    priceData.recurring = {
      interval: data.interval,
    }
  }

  return stripe.prices.create(priceData)
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Setting up Ops Services Stripe products...\n')

  const stripe = new Stripe(env('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16',
  })

  const output: Record<string, string> = {}

  // ============================================================================
  // PACKAGE-BASED SUBSCRIPTIONS
  // ============================================================================
  console.log('📦 Creating package-based subscriptions...\n')

  for (const pkg of packages) {
    console.log(`Processing ${pkg.display}...`)

    // Create/update product
    const product = await upsertProduct(stripe, {
      name: `Kealee Ops Services - ${pkg.display}`,
      description: `${pkg.description}\n\nFeatures:\n${pkg.features.map((f) => `• ${f}`).join('\n')}`,
      metadata: {
        planSlug: pkg.slug,
        productType: 'package',
        audience: 'gc',
      },
    })

    // Create monthly price
    const monthlyLookupKey = `ops-${pkg.slug}-month`
    const monthlyPrice = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: monthlyLookupKey,
      unitAmount: Math.round(pkg.monthlyPrice * 100), // Convert to cents
      interval: 'month',
    })

    // Create annual price (if provided)
    let annualPrice: Stripe.Price | undefined
    if (pkg.annualPrice) {
      const annualLookupKey = `ops-${pkg.slug}-year`
      annualPrice = await upsertPrice(stripe, {
        productId: product.id,
        lookupKey: annualLookupKey,
        unitAmount: Math.round(pkg.annualPrice * 100),
        interval: 'year',
      })

      output[`STRIPE_PRICE_${pkg.slug.toUpperCase().replace(/-/g, '_')}_ANNUAL`] = annualPrice.id
    }

    output[`STRIPE_PRICE_${pkg.slug.toUpperCase().replace(/-/g, '_')}_MONTHLY`] = monthlyPrice.id
    output[`STRIPE_PRICE_PACKAGE_${pkg.slug.split('-')[1].toUpperCase()}`] = monthlyPrice.id // Legacy format

    console.log(`  ✅ Product: ${product.id}`)
    console.log(`  ✅ Monthly Price: ${monthlyPrice.id} ($${pkg.monthlyPrice}/month)`)
    if (annualPrice) {
      console.log(`  ✅ Annual Price: ${annualPrice.id} ($${Math.round(pkg.annualPrice!)}/year)`)
    }
    console.log('')
  }

  // ============================================================================
  // A LA CARTE PRODUCTS
  // ============================================================================
  console.log('🛒 Creating a la carte products...\n')

  for (const aLaCarteProduct of aLaCarteProducts) {
    console.log(`Processing ${aLaCarteProduct.display}...`)

    // Create/update product
    const stripeProduct = await upsertProduct(stripe, {
      name: `Kealee Ops Services - ${aLaCarteProduct.display}`,
      description: aLaCarteProduct.description,
      metadata: {
        productSlug: aLaCarteProduct.slug,
        productType: 'a-la-carte',
        audience: 'gc',
      },
    })

    if (aLaCarteProduct.priceType === 'one-time') {
      // For variable pricing, create a price at the midpoint
      const priceAmount = aLaCarteProduct.price
        ? aLaCarteProduct.price
        : aLaCarteProduct.priceRange
        ? Math.round((aLaCarteProduct.priceRange.min + aLaCarteProduct.priceRange.max) / 2)
        : 300

      const price = await upsertPrice(stripe, {
        productId: stripeProduct.id,
        lookupKey: `ops-${aLaCarteProduct.slug}`,
        unitAmount: Math.round(priceAmount * 100),
        // No interval = one-time
      })

      output[`STRIPE_PRICE_${aLaCarteProduct.slug.toUpperCase().replace(/-/g, '_')}`] = price.id

      console.log(`  ✅ Product: ${stripeProduct.id}`)
      console.log(
        `  ✅ Price: ${price.id} ($${priceAmount}${aLaCarteProduct.priceRange ? ` - range: $${aLaCarteProduct.priceRange.min}-$${aLaCarteProduct.priceRange.max}` : ''})`
      )
    } else {
      // Recurring product
      const price = await upsertPrice(stripe, {
        productId: stripeProduct.id,
        lookupKey: `ops-${aLaCarteProduct.slug}-month`,
        unitAmount: Math.round((aLaCarteProduct.price || 300) * 100),
        interval: 'month',
      })

      output[`STRIPE_PRICE_${aLaCarteProduct.slug.toUpperCase().replace(/-/g, '_')}`] = price.id

      console.log(`  ✅ Product: ${stripeProduct.id}`)
      console.log(`  ✅ Price: ${price.id} ($${aLaCarteProduct.price}/month)`)
    }
    console.log('')
  }

  // ============================================================================
  // OUTPUT ENVIRONMENT VARIABLES
  // ============================================================================
  console.log('\n' + '='.repeat(80))
  console.log('📋 ENVIRONMENT VARIABLES')
  console.log('='.repeat(80))
  console.log('\nAdd these to your .env.local and production environment:\n')

  // Group by type
  console.log('// Package-based subscriptions (monthly)')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('PACKAGE_') && !key.includes('ANNUAL')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// Package-based subscriptions (annual)')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('ANNUAL')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// A la carte products')
  for (const [key, value] of Object.entries(output)) {
    if (!key.includes('PACKAGE_') && !key.includes('ANNUAL')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Setup complete!')
  console.log('='.repeat(80))
  console.log('\nNext steps:')
  console.log('1. Copy the environment variables above to your .env.local')
  console.log('2. Add them to Vercel (m-ops-services app)')
  console.log('3. Add them to Railway (API service)')
  console.log('4. Update database seed.ts with the new price IDs')
  console.log('')
}

// Run script
main().catch((e) => {
  console.error('❌ Error:', e)
  process.exit(1)
})

