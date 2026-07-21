#!/usr/bin/env node
/**
 * scripts/stripe-import-products.js
 *
 * Creates or updates all Stripe products and prices for the Kealee platform.
 * Run with: STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-import-products.js
 *
 * Output: stripe-products-complete.json with all created price IDs.
 * Copy the price IDs to Railway environment variables.
 */

const Stripe = require('stripe');
const fs = require('fs');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// ─── Product catalog ──────────────────────────────────────────────────────────

const PRODUCTS = [
  // ── PLAN YOUR PROJECT (Design) ─────────────────────────────────────────────
  {
    key:      'STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION',
    name:     'Project Concept + Validation',
    desc:     'AI concept + zoning + structural + cost band + permit risk — all in one report, delivered in 24 hours',
    amount:   39500,
    currency: 'usd',
    mode:     'payment',
    category: 'design',
  },
  {
    key:      'STRIPE_PRICE_DESIGN_ADVANCED',
    name:     'Advanced AI Concept',
    desc:     '3 floor plan options, 3D views, material suggestions',
    amount:   89900,
    currency: 'usd',
    mode:     'payment',
    category: 'design',
  },
  {
    key:      'STRIPE_PRICE_DESIGN_FULL',
    name:     'Full Design Package',
    desc:     'Permit-ready drawing set, schematic through construction documents',
    amount:   449900,
    currency: 'usd',
    mode:     'payment',
    category: 'design',
  },

  // ── PRICE YOUR PROJECT (Estimate) ──────────────────────────────────────────
  {
    key:      'STRIPE_PRICE_ESTIMATE_DETAILED',
    name:     'Detailed Estimate',
    desc:     'Professional cost analyst reviews and validates your estimate with trade-by-trade breakdown',
    amount:   59500,
    currency: 'usd',
    mode:     'payment',
    category: 'estimate',
  },
  {
    key:      'STRIPE_PRICE_ESTIMATE_CERTIFIED',
    name:     'Certified Estimate',
    desc:     'Certified cost report for lender submission, insurance, or investor decks',
    amount:   185000,
    currency: 'usd',
    mode:     'payment',
    category: 'estimate',
  },

  // ── PERMIT YOUR PROJECT ────────────────────────────────────────────────────
  {
    key:      'STRIPE_PRICE_PERMIT_SIMPLE',
    name:     'Simple Permit Filing',
    desc:     'Filing service for straightforward single-trade permits',
    amount:   14900,
    currency: 'usd',
    mode:     'payment',
    category: 'permit',
  },
  {
    key:      'STRIPE_PRICE_PERMIT_PACKAGE',
    name:     'Permit Package',
    desc:     'Full application prep, submission, and tracking for standard residential permits',
    amount:   95000,
    currency: 'usd',
    mode:     'payment',
    category: 'permit',
  },
  {
    key:      'STRIPE_PRICE_PERMIT_COORDINATION',
    name:     'Permit Coordination',
    desc:     'Submit and track your permit through the jurisdiction — includes response to comments',
    amount:   275000,
    currency: 'usd',
    mode:     'payment',
    category: 'permit',
  },
  {
    key:      'STRIPE_PRICE_PERMIT_EXPEDITING',
    name:     'Permit Expediting',
    desc:     'Priority expediting service — fastest possible approval with expeditor liaison',
    amount:   550000,
    currency: 'usd',
    mode:     'payment',
    category: 'permit',
  },

  // ── CONTROL YOUR PROJECT (PM — one-time per project) ───────────────────────
  {
    key:      'STRIPE_PRICE_PM_ADVISORY',
    name:     'PM Advisory',
    desc:     'Project management advisory — milestone reviews, budget oversight, owner guidance',
    amount:   95000,
    currency: 'usd',
    mode:     'payment',  // NOT subscription
    category: 'pm',
  },
  {
    key:      'STRIPE_PRICE_PM_OVERSIGHT',
    name:     'PM Oversight',
    desc:     'Full project management oversight from groundbreaking to closeout',
    amount:   295000,
    currency: 'usd',
    mode:     'payment',  // NOT subscription
    category: 'pm',
  },

  // ── MARKETPLACE LISTINGS (contractor, recurring) ───────────────────────────
  {
    key:      'STRIPE_PRICE_LISTING_BASIC',
    name:     'Marketplace Listing — Basic',
    desc:     'Basic contractor marketplace listing with profile and lead access',
    amount:   4900,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'listing',
  },
  {
    key:      'STRIPE_PRICE_LISTING_PRO',
    name:     'Marketplace Listing — Pro',
    desc:     'Pro contractor listing with priority placement and enhanced profile',
    amount:   14900,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'listing',
  },
  {
    key:      'STRIPE_PRICE_LISTING_PREMIUM',
    name:     'Marketplace Listing — Premium',
    desc:     'Premium contractor listing with featured placement and full analytics',
    amount:   29900,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'listing',
  },

  // ── CONTRACTOR GROWTH (contractor, recurring) ──────────────────────────────
  {
    key:      'STRIPE_PRICE_GROWTH_STARTER',
    name:     'Contractor Growth — Starter',
    desc:     'Profile optimization and marketplace listing priority boost',
    amount:   9900,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'growth',
  },
  {
    key:      'STRIPE_PRICE_GROWTH_PRO',
    name:     'Contractor Growth — Growth',
    desc:     'Dedicated landing page, SEO, and lead capture funnel',
    amount:   29900,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'growth',
  },
  {
    key:      'STRIPE_PRICE_GROWTH_ENTERPRISE',
    name:     'Contractor Growth — Pro',
    desc:     'Full marketing automation: Google Ads, SEO, email/SMS funnels, CRM',
    amount:   79900,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'growth',
  },

  // ── OPS OS (contractor B2B, recurring) ────────────────────────────────────
  {
    key:      'STRIPE_PRICE_OPS_A',
    name:     'Ops OS — Package A (Essential)',
    desc:     'Essential operations support for small contractors',
    amount:   175000,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'ops',
  },
  {
    key:      'STRIPE_PRICE_OPS_B',
    name:     'Ops OS — Package B (Professional)',
    desc:     'Professional operations support with dedicated PM',
    amount:   375000,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'ops',
  },
  {
    key:      'STRIPE_PRICE_OPS_C',
    name:     'Ops OS — Package C (Premium)',
    desc:     'Premium operations with daily reports and phone support',
    amount:   950000,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'ops',
  },
  {
    key:      'STRIPE_PRICE_OPS_D',
    name:     'Ops OS — Package D (White Glove)',
    desc:     'White glove dedicated PM team with 24/7 support',
    amount:   1650000,
    currency: 'usd',
    mode:     'subscription',
    interval: 'month',
    category: 'ops',
  },

  // ── DEVELOPER SERVICES (one-time) ─────────────────────────────────────────
  {
    key:      'STRIPE_PRICE_DEV_FEASIBILITY',
    name:     'Developer Feasibility Study',
    desc:     'Market analysis, site constraints, development potential, go/no-go recommendation',
    amount:   450000,
    currency: 'usd',
    mode:     'payment',
    category: 'developer',
  },
  {
    key:      'STRIPE_PRICE_DEV_PROFORMA',
    name:     'Developer Pro Forma Analysis',
    desc:     'Revenue projections, cost modeling, return on investment analysis',
    amount:   250000,
    currency: 'usd',
    mode:     'payment',
    category: 'developer',
  },
  {
    key:      'STRIPE_PRICE_DEV_CAPITAL',
    name:     'Developer Capital Stack Modeling',
    desc:     'Debt/equity structure, lender packaging, investor return modeling',
    amount:   350000,
    currency: 'usd',
    mode:     'payment',
    category: 'developer',
  },
  {
    key:      'STRIPE_PRICE_DEV_ENTITLEMENTS',
    name:     'Developer Entitlement Support',
    desc:     'Zoning analysis, variance support, hearing prep, entitlement strategy',
    amount:   750000,
    currency: 'usd',
    mode:     'payment',
    category: 'developer',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findOrCreateProduct(name, desc) {
  const list = await stripe.products.list({ limit: 100 });
  const existing = list.data.find(p => p.name === name && p.active);
  if (existing) {
    console.log(`  ✓ Product exists: ${name}`);
    return existing;
  }
  const product = await stripe.products.create({ name, description: desc });
  console.log(`  + Created product: ${name}`);
  return product;
}

async function findOrCreatePrice(product, amount, currency, mode, interval) {
  const prices = await stripe.prices.list({ product: product.id, limit: 20 });
  const existing = prices.data.find(p =>
    p.active &&
    p.unit_amount === amount &&
    p.currency === currency &&
    (mode === 'subscription'
      ? p.type === 'recurring' && p.recurring?.interval === interval
      : p.type === 'one_time')
  );
  if (existing) {
    console.log(`  ✓ Price exists: ${currency.toUpperCase()} ${(amount/100).toFixed(2)}`);
    return existing;
  }
  const priceData = {
    product:    product.id,
    unit_amount: amount,
    currency,
  };
  if (mode === 'subscription') {
    priceData.recurring = { interval };
  }
  const price = await stripe.prices.create(priceData);
  console.log(`  + Created price: ${currency.toUpperCase()} ${(amount/100).toFixed(2)}`);
  return price;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Kealee Stripe Product Import');
  console.log('============================\n');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY environment variable is required');
    process.exit(1);
  }

  const results = {};
  const envLines = [];

  for (const product of PRODUCTS) {
    console.log(`\n[${product.category.toUpperCase()}] ${product.name}`);
    try {
      const stripeProduct = await findOrCreateProduct(product.name, product.desc);
      const stripePrice   = await findOrCreatePrice(
        stripeProduct,
        product.amount,
        product.currency,
        product.mode,
        product.interval
      );

      results[product.key] = stripePrice.id;
      envLines.push(`${product.key}=${stripePrice.id}`);
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      results[product.key] = 'ERROR';
    }
  }

  // Write output files
  fs.writeFileSync('stripe-products-complete.json', JSON.stringify(results, null, 2));
  fs.writeFileSync('stripe-products-env.txt', envLines.join('\n'));

  console.log('\n============================');
  console.log(`✓ Done. ${Object.keys(results).length} products processed.`);
  console.log('✓ Price IDs written to: stripe-products-complete.json');
  console.log('✓ Env vars written to:  stripe-products-env.txt');
  console.log('\nCopy the contents of stripe-products-env.txt to Railway environment variables.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
