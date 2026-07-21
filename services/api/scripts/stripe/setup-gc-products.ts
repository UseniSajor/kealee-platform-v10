import Stripe from 'stripe'

type Plan = {
  slug: 'package-a' | 'package-b' | 'package-c' | 'package-d'
  display: 'Package A' | 'Package B' | 'Package C' | 'Package D'
  monthlyCents: number
  annualCents: number
}

const plans: Plan[] = [
  { slug: 'package-a', display: 'Package A', monthlyCents: 175_000, annualCents: 1_785_000 },
  { slug: 'package-b', display: 'Package B', monthlyCents: 375_000, annualCents: 3_825_000 },
  { slug: 'package-c', display: 'Package C', monthlyCents: 950_000, annualCents: 9_690_000 },
  { slug: 'package-d', display: 'Package D', monthlyCents: 1_650_000, annualCents: 16_830_000 },
]

function env(key: string) {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var ${key}`)
  return v
}

async function upsertProduct(stripe: Stripe, plan: Plan) {
  // Idempotency strategy: search by metadata.planSlug (fallback to list+filter if search unavailable)
  // Stripe Search API is available on most accounts; if not, listing still works for small catalogs.
  let product: Stripe.Product | undefined

  try {
    const res = await stripe.products.search({
      query: `metadata['planSlug']:'${plan.slug}' AND active:'true'`,
      limit: 10,
    })
    product = res.data[0]
  } catch {
    const res = await stripe.products.list({ limit: 100 })
    product = res.data.find((p) => p.metadata?.planSlug === plan.slug)
  }

  if (product) return product

  return stripe.products.create({
    name: `Kealee Ops Services - ${plan.display} (GC)`,
    metadata: {
      planSlug: plan.slug,
      audience: 'gc',
    },
  })
}

async function upsertPrice(
  stripe: Stripe,
  input: {
    productId: string
    lookupKey: string
    unitAmount: number
    interval: 'month' | 'year'
  }
) {
  // Price objects are immutable; "upsert" means "find by lookup_key, else create".
  let existing: Stripe.Price | undefined
  try {
    const res = await stripe.prices.search({
      query: `lookup_key:'${input.lookupKey}'`,
      limit: 10,
    })
    existing = res.data[0]
  } catch {
    const res = await stripe.prices.list({ product: input.productId, limit: 100 })
    existing = res.data.find((p) => p.lookup_key === input.lookupKey)
  }

  if (existing) return existing

  return stripe.prices.create({
    product: input.productId,
    currency: 'usd',
    unit_amount: input.unitAmount,
    recurring: { interval: input.interval },
    lookup_key: input.lookupKey,
    nickname: input.lookupKey,
    metadata: {
      audience: 'gc',
    },
  })
}

async function main() {
  const stripe = new Stripe(env('STRIPE_SECRET_KEY'))

  const output: Record<string, string> = {}

  for (const p of plans) {
    const product = await upsertProduct(stripe, p)
    const monthlyLookup = `gc-${p.slug}-month`
    const annualLookup = `gc-${p.slug}-year`

    const monthly = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: monthlyLookup,
      unitAmount: p.monthlyCents,
      interval: 'month',
    })

    const yearly = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: annualLookup,
      unitAmount: p.annualCents,
      interval: 'year',
    })

    output[`STRIPE_GC_${p.slug.toUpperCase().replace('-', '_')}_MONTH_PRICE_ID`] = monthly.id
    output[`STRIPE_GC_${p.slug.toUpperCase().replace('-', '_')}_YEAR_PRICE_ID`] = yearly.id
  }

  // Print env snippet
  // eslint-disable-next-line no-console
  console.log('\nAdd these to your services/api .env.local (and production secrets):\n')
  for (const [k, v] of Object.entries(output)) {
    // eslint-disable-next-line no-console
    console.log(`${k}=${v}`)
  }
  // eslint-disable-next-line no-console
  console.log('\nAlso set STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY.\n')
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

