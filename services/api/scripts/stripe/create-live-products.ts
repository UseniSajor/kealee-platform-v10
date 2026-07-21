/**
 * Stripe Live Mode Product Creation
 * Run this AFTER switching Stripe to live mode
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

async function createLiveProducts() {
  console.log('═'.repeat(70));
  console.log('💳 STRIPE LIVE MODE - PRODUCT CREATION');
  console.log('═'.repeat(70));
  console.log();

  // Verify we're in live mode
  if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    console.error('❌ ERROR: Still using TEST mode key!');
    console.error('   Switch to LIVE mode in Stripe dashboard first.');
    process.exit(1);
  }

  console.log('✅ Live mode key detected');
  console.log();

  // Create Package A
  console.log('Creating Package A...');
  const packageA = await stripe.products.create({
    name: 'Package A - Solo GC',
    description: 'PM services for solo general contractors',
    metadata: { tier: 'A', code: 'PKG_A' },
  });

  const priceA = await stripe.prices.create({
    product: packageA.id,
    currency: 'usd',
    unit_amount: 175000, // $1,750.00
    recurring: { interval: 'month' },
  });

  console.log(`✅ Package A: ${priceA.id}`);

  // Create Package B
  console.log('Creating Package B...');
  const packageB = await stripe.products.create({
    name: 'Package B - Growing Team',
    description: 'PM services for growing contractors',
    metadata: { tier: 'B', code: 'PKG_B', mostPopular: 'true' },
  });

  const priceB = await stripe.prices.create({
    product: packageB.id,
    currency: 'usd',
    unit_amount: 375000, // $3,750.00
    recurring: { interval: 'month' },
  });

  console.log(`✅ Package B: ${priceB.id}`);

  // Create Package C
  console.log('Creating Package C...');
  const packageC = await stripe.products.create({
    name: 'Package C - Multiple Projects',
    description: 'PM services for multiple projects',
    metadata: { tier: 'C', code: 'PKG_C' },
  });

  const priceC = await stripe.prices.create({
    product: packageC.id,
    currency: 'usd',
    unit_amount: 950000, // $9,500.00
    recurring: { interval: 'month' },
  });

  console.log(`✅ Package C: ${priceC.id}`);

  // Create Package D
  console.log('Creating Package D...');
  const packageD = await stripe.products.create({
    name: 'Package D - Enterprise GC',
    description: 'Enterprise PM services',
    metadata: { tier: 'D', code: 'PKG_D' },
  });

  const priceD = await stripe.prices.create({
    product: packageD.id,
    currency: 'usd',
    unit_amount: 1650000, // $16,500.00
    recurring: { interval: 'month' },
  });

  console.log(`✅ Package D: ${priceD.id}`);

  // Print environment variables
  console.log();
  console.log('═'.repeat(70));
  console.log('📋 ADD THESE TO YOUR ENVIRONMENT VARIABLES');
  console.log('═'.repeat(70));
  console.log();
  console.log(`STRIPE_PRICE_PACKAGE_A=${priceA.id}`);
  console.log(`STRIPE_PRICE_PACKAGE_B=${priceB.id}`);
  console.log(`STRIPE_PRICE_PACKAGE_C=${priceC.id}`);
  console.log(`STRIPE_PRICE_PACKAGE_D=${priceD.id}`);
  console.log();
  console.log('Add these to:');
  console.log('  - Railway: API service → Variables');
  console.log('  - Vercel: m-ops-services → Environment Variables');
  console.log();
  console.log('✅ Stripe products created successfully!');
  console.log();
}

createLiveProducts().catch((error) => {
  console.error('❌ Failed to create products:', error);
  process.exit(1);
});
