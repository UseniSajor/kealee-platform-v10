#!/usr/bin/env node
/**
 * Stripe Product Import Script
 *
 * Creates Stripe products and prices for the 4-tier Kealee package structure.
 * Run with: node scripts/stripe-import-products.js
 *
 * Required environment variables:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (test or live)
 */

const Stripe = require('stripe');

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Package definitions based on the 4-tier structure
const packages = [
  // ============================================
  // Package A: Starter ($49-199/month)
  // 1-5 active projects, 6 core features
  // ============================================
  {
    name: 'Starter - Solo',
    id: 'starter_solo',
    price: 4900, // $49 in cents
    interval: 'month',
    tier: 'STARTER',
    features: ['1-2 jobs', '6 core features', '1 user'],
    metadata: {
      tier: 'A',
      minJobs: 1,
      maxJobs: 2,
      featureCount: 6,
      maxUsers: 1,
    },
  },
  {
    name: 'Starter - Team',
    id: 'starter_team',
    price: 9900, // $99 in cents
    interval: 'month',
    tier: 'STARTER',
    features: ['3-5 jobs', '6 core features', '3 users'],
    metadata: {
      tier: 'A',
      minJobs: 3,
      maxJobs: 5,
      featureCount: 6,
      maxUsers: 3,
    },
  },
  {
    name: 'Starter - Pro',
    id: 'starter_pro',
    price: 19900, // $199 in cents
    interval: 'month',
    tier: 'STARTER',
    features: ['5 jobs', '6 core features', '5 users', 'Priority support'],
    metadata: {
      tier: 'A',
      minJobs: 5,
      maxJobs: 5,
      featureCount: 6,
      maxUsers: 5,
      prioritySupport: true,
    },
  },

  // ============================================
  // Package B: Professional ($1,750-4,500/month)
  // 5-25 active projects, 20 features
  // ============================================
  {
    name: 'Professional - Growth',
    id: 'professional_growth',
    price: 175000, // $1,750 in cents
    interval: 'month',
    tier: 'PROFESSIONAL',
    features: ['5-10 jobs', '20 features', '10 users'],
    metadata: {
      tier: 'B',
      minJobs: 5,
      maxJobs: 10,
      featureCount: 20,
      maxUsers: 10,
    },
  },
  {
    name: 'Professional - Scale',
    id: 'professional_scale',
    price: 295000, // $2,950 in cents
    interval: 'month',
    tier: 'PROFESSIONAL',
    features: ['10-20 jobs', '20 features', '20 users'],
    metadata: {
      tier: 'B',
      minJobs: 10,
      maxJobs: 20,
      featureCount: 20,
      maxUsers: 20,
    },
  },
  {
    name: 'Professional - Max',
    id: 'professional_max',
    price: 450000, // $4,500 in cents
    interval: 'month',
    tier: 'PROFESSIONAL',
    features: ['20-25 jobs', '20 features', '30 users'],
    metadata: {
      tier: 'B',
      minJobs: 20,
      maxJobs: 25,
      featureCount: 20,
      maxUsers: 30,
    },
  },

  // ============================================
  // Package C: Enterprise ($8,500-16,500/month)
  // 25-100 active projects, 40 features
  // ============================================
  {
    name: 'Enterprise - Core',
    id: 'enterprise_core',
    price: 850000, // $8,500 in cents
    interval: 'month',
    tier: 'ENTERPRISE',
    features: ['25-50 jobs', '40 features', '50 users'],
    metadata: {
      tier: 'C',
      minJobs: 25,
      maxJobs: 50,
      featureCount: 40,
      maxUsers: 50,
    },
  },
  {
    name: 'Enterprise - Plus',
    id: 'enterprise_plus',
    price: 1250000, // $12,500 in cents
    interval: 'month',
    tier: 'ENTERPRISE',
    features: ['50-75 jobs', '40 features', '75 users'],
    metadata: {
      tier: 'C',
      minJobs: 50,
      maxJobs: 75,
      featureCount: 40,
      maxUsers: 75,
    },
  },
  {
    name: 'Enterprise - Max',
    id: 'enterprise_max',
    price: 1650000, // $16,500 in cents
    interval: 'month',
    tier: 'ENTERPRISE',
    features: ['75-100 jobs', '40 features', '100 users'],
    metadata: {
      tier: 'C',
      minJobs: 75,
      maxJobs: 100,
      featureCount: 40,
      maxUsers: 100,
    },
  },

  // ============================================
  // Package D: Platform ($25,000-50,000/month)
  // 100+ active projects, 50 features (all)
  // ============================================
  {
    name: 'Platform - Standard',
    id: 'platform_standard',
    price: 2500000, // $25,000 in cents
    interval: 'month',
    tier: 'PLATFORM',
    features: ['100-200 jobs', '50 features', 'Unlimited users'],
    metadata: {
      tier: 'D',
      minJobs: 100,
      maxJobs: 200,
      featureCount: 50,
      maxUsers: -1, // Unlimited
    },
  },
  {
    name: 'Platform - Premium',
    id: 'platform_premium',
    price: 3750000, // $37,500 in cents
    interval: 'month',
    tier: 'PLATFORM',
    features: ['200-500 jobs', '50 features', 'Dedicated support'],
    metadata: {
      tier: 'D',
      minJobs: 200,
      maxJobs: 500,
      featureCount: 50,
      maxUsers: -1,
      dedicatedSupport: true,
    },
  },
  {
    name: 'Platform - Enterprise',
    id: 'platform_enterprise',
    price: 5000000, // $50,000 in cents
    interval: 'month',
    tier: 'PLATFORM',
    features: ['500+ jobs', '50 features', 'Custom SLA'],
    metadata: {
      tier: 'D',
      minJobs: 500,
      maxJobs: -1, // Unlimited
      featureCount: 50,
      maxUsers: -1,
      customSLA: true,
    },
  },
];

// Annual discount packages (20% off)
const annualPackages = packages.map(pkg => ({
  ...pkg,
  id: `${pkg.id}_annual`,
  name: `${pkg.name} (Annual)`,
  price: Math.round(pkg.price * 12 * 0.8), // 20% discount
  interval: 'year',
  metadata: {
    ...pkg.metadata,
    billingCycle: 'annual',
    discount: 0.2,
  },
}));

async function createProducts() {
  console.log('Starting Stripe product import...\n');

  const allPackages = [...packages, ...annualPackages];
  const results = {
    created: [],
    updated: [],
    errors: [],
  };

  for (const pkg of allPackages) {
    try {
      console.log(`Processing: ${pkg.name}...`);

      // Check if product already exists
      let product;
      try {
        const existingProducts = await stripe.products.list({
          limit: 100,
        });
        product = existingProducts.data.find(p =>
          p.metadata.kealee_id === pkg.id
        );
      } catch (e) {
        // Product doesn't exist
      }

      if (product) {
        // Update existing product
        product = await stripe.products.update(product.id, {
          name: pkg.name,
          description: pkg.features.join(', '),
          metadata: {
            kealee_id: pkg.id,
            tier: pkg.tier,
            ...pkg.metadata,
          },
        });
        results.updated.push(pkg.name);
        console.log(`  Updated product: ${product.id}`);
      } else {
        // Create new product
        product = await stripe.products.create({
          name: pkg.name,
          description: pkg.features.join(', '),
          metadata: {
            kealee_id: pkg.id,
            tier: pkg.tier,
            ...pkg.metadata,
          },
        });
        results.created.push(pkg.name);
        console.log(`  Created product: ${product.id}`);
      }

      // Create or update price
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      const matchingPrice = existingPrices.data.find(
        p => p.unit_amount === pkg.price &&
             p.recurring?.interval === pkg.interval
      );

      if (!matchingPrice) {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: pkg.price,
          currency: 'usd',
          recurring: {
            interval: pkg.interval,
          },
          metadata: {
            kealee_id: pkg.id,
          },
        });
        console.log(`  Created price: ${price.id} ($${pkg.price / 100}/${pkg.interval})`);
      } else {
        console.log(`  Price already exists: ${matchingPrice.id}`);
      }

    } catch (error) {
      console.error(`  Error processing ${pkg.name}:`, error.message);
      results.errors.push({ name: pkg.name, error: error.message });
    }
  }

  // Print summary
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');
  console.log(`Created: ${results.created.length} products`);
  console.log(`Updated: ${results.updated.length} products`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`));
  }

  console.log('\nDone!');
}

// Export for programmatic use
module.exports = { packages, annualPackages, createProducts };

// Run if executed directly
if (require.main === module) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Error: STRIPE_SECRET_KEY environment variable is required');
    process.exit(1);
  }

  createProducts().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
