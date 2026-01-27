/**
 * Stripe Product Setup - Engineering & Marketplace
 *
 * Run this script to create Engineering and Marketplace products in Stripe.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_xxx npx tsx scripts/stripe/setup-engineering-marketplace.ts
 *
 * Or with .env.local:
 *   npx tsx scripts/stripe/setup-engineering-marketplace.ts
 */

import Stripe from 'stripe';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment
config({ path: resolve(process.cwd(), '.env.local') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  console.log('\nSet it via:');
  console.log('  STRIPE_SECRET_KEY=sk_live_xxx npx tsx scripts/stripe/setup-engineering-marketplace.ts');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// ============================================================================
// ENGINEERING PRODUCTS
// ============================================================================

const ENGINEERING_PRODUCTS = [
  {
    name: 'Engineering - Basic Review',
    description: 'Basic structural review and assessment for simple projects.\n\nFeatures:\n• Structural review\n• Load calculations\n• Basic recommendations\n• PDF report\n• 7-10 day turnaround',
    price: 1500, // $1,500
    metadata: {
      category: 'engineering',
      package_tier: 'basic',
      turnaround: '7-10 days',
      service_type: 'review',
    },
    lookup_key: 'eng-basic-review',
  },
  {
    name: 'Engineering - Standard Design',
    description: 'Complete structural design package for residential projects.\n\nFeatures:\n• Full structural design\n• Stamped drawings\n• Foundation design\n• Beam/column sizing\n• Connection details\n• 5-7 day turnaround',
    price: 4500, // $4,500
    metadata: {
      category: 'engineering',
      package_tier: 'standard',
      turnaround: '5-7 days',
      service_type: 'design',
      popular: 'true',
    },
    lookup_key: 'eng-standard-design',
  },
  {
    name: 'Engineering - Premium Service',
    description: 'Premium engineering with expedited service and full coordination.\n\nFeatures:\n• Full structural design\n• MEP coordination\n• Civil coordination\n• Stamped drawings\n• Site visits included\n• Priority support\n• 3-5 day turnaround',
    price: 12000, // $12,000
    metadata: {
      category: 'engineering',
      package_tier: 'premium',
      turnaround: '3-5 days',
      service_type: 'full_service',
      includes_site_visits: 'true',
    },
    lookup_key: 'eng-premium-service',
  },
  {
    name: 'Engineering - Enterprise',
    description: 'Enterprise engineering for commercial and multi-family projects.\n\nFeatures:\n• Dedicated engineering team\n• All disciplines (Structural, MEP, Civil)\n• Custom turnaround\n• Unlimited revisions\n• On-site coordination\n• Project management\n• SLA guarantees',
    price: 25000, // $25,000 base
    metadata: {
      category: 'engineering',
      package_tier: 'enterprise',
      turnaround: 'custom',
      service_type: 'enterprise',
      dedicated_team: 'true',
    },
    lookup_key: 'eng-enterprise',
  },
  // Individual Services
  {
    name: 'Structural Engineering - Review Only',
    description: 'Structural review and load calculations only.',
    price: 1500,
    metadata: { category: 'engineering', discipline: 'structural', service_type: 'review' },
    lookup_key: 'eng-structural-review',
  },
  {
    name: 'Structural Engineering - Basic Design',
    description: 'Basic structural design with stamped drawings.',
    price: 3000,
    metadata: { category: 'engineering', discipline: 'structural', service_type: 'design' },
    lookup_key: 'eng-structural-basic',
  },
  {
    name: 'Structural Engineering - Full Service',
    description: 'Complete structural engineering with site supervision.',
    price: 6000,
    metadata: { category: 'engineering', discipline: 'structural', service_type: 'full_service' },
    lookup_key: 'eng-structural-full',
  },
  {
    name: 'MEP Engineering - Single System',
    description: 'Mechanical, Electrical, or Plumbing - single system design.',
    price: 2000,
    metadata: { category: 'engineering', discipline: 'mep', service_type: 'single' },
    lookup_key: 'eng-mep-single',
  },
  {
    name: 'MEP Engineering - Full Package',
    description: 'Complete MEP design for residential projects.',
    price: 5000,
    metadata: { category: 'engineering', discipline: 'mep', service_type: 'full' },
    lookup_key: 'eng-mep-full',
  },
  {
    name: 'MEP Engineering - Commercial',
    description: 'Commercial MEP design with Title 24 compliance.',
    price: 10000,
    metadata: { category: 'engineering', discipline: 'mep', service_type: 'commercial' },
    lookup_key: 'eng-mep-commercial',
  },
  {
    name: 'Civil Engineering - Site Plan',
    description: 'Site plan and grading for residential projects.',
    price: 2500,
    metadata: { category: 'engineering', discipline: 'civil', service_type: 'site_plan' },
    lookup_key: 'eng-civil-site',
  },
  {
    name: 'Civil Engineering - Full Package',
    description: 'Complete civil engineering including drainage and utilities.',
    price: 7500,
    metadata: { category: 'engineering', discipline: 'civil', service_type: 'full' },
    lookup_key: 'eng-civil-full',
  },
  {
    name: 'Geotechnical - Desktop Study',
    description: 'Desktop geotechnical assessment based on existing data.',
    price: 800,
    metadata: { category: 'engineering', discipline: 'geotech', service_type: 'desktop' },
    lookup_key: 'eng-geotech-desktop',
  },
  {
    name: 'Geotechnical - Standard Investigation',
    description: 'Standard geotechnical investigation with soil borings.',
    price: 3500,
    metadata: { category: 'engineering', discipline: 'geotech', service_type: 'standard' },
    lookup_key: 'eng-geotech-standard',
  },
  {
    name: 'Geotechnical - Comprehensive',
    description: 'Comprehensive geotechnical with multiple borings and lab testing.',
    price: 8000,
    metadata: { category: 'engineering', discipline: 'geotech', service_type: 'comprehensive' },
    lookup_key: 'eng-geotech-comprehensive',
  },
];

// ============================================================================
// MARKETPLACE PRODUCTS
// ============================================================================

const MARKETPLACE_PRODUCTS = {
  subscriptions: [
    {
      name: 'Marketplace - Basic',
      description: 'Basic contractor listing in the Kealee Marketplace.\n\nFeatures:\n• Business profile listing\n• 5 leads per month\n• Basic analytics\n• Email support',
      monthlyPrice: 299,
      yearlyPrice: 299 * 12 * 0.85, // 15% discount
      metadata: {
        category: 'marketplace',
        plan_tier: 'basic',
        leads_per_month: '5',
        support_level: 'email',
      },
      lookup_key: 'mkt-basic',
    },
    {
      name: 'Marketplace - Professional',
      description: 'Professional listing with priority placement.\n\nFeatures:\n• Featured business listing\n• 15 leads per month\n• Priority search placement\n• Portfolio showcase\n• Advanced analytics\n• Phone support',
      monthlyPrice: 699,
      yearlyPrice: 699 * 12 * 0.85,
      metadata: {
        category: 'marketplace',
        plan_tier: 'professional',
        leads_per_month: '15',
        support_level: 'priority',
        featured: 'true',
        popular: 'true',
      },
      lookup_key: 'mkt-professional',
    },
    {
      name: 'Marketplace - Enterprise',
      description: 'Enterprise marketplace presence with unlimited leads.\n\nFeatures:\n• Premium placement\n• Unlimited leads\n• Dedicated account manager\n• Custom branding\n• API access\n• Lead exclusivity options\n• Advanced reporting',
      monthlyPrice: 1499,
      yearlyPrice: 1499 * 12 * 0.85,
      metadata: {
        category: 'marketplace',
        plan_tier: 'enterprise',
        leads_per_month: 'unlimited',
        support_level: 'dedicated',
        api_access: 'true',
      },
      lookup_key: 'mkt-enterprise',
    },
  ],
  leads: [
    {
      name: 'Lead - Small Project',
      description: 'Lead for small projects under $10,000.',
      price: 50,
      metadata: { category: 'lead', project_size: 'small', max_value: '10000' },
      lookup_key: 'lead-small',
    },
    {
      name: 'Lead - Medium Project',
      description: 'Lead for medium projects $10,000 - $50,000.',
      price: 150,
      metadata: { category: 'lead', project_size: 'medium', min_value: '10000', max_value: '50000' },
      lookup_key: 'lead-medium',
    },
    {
      name: 'Lead - Large Project',
      description: 'Lead for large projects $50,000 - $150,000.',
      price: 300,
      metadata: { category: 'lead', project_size: 'large', min_value: '50000', max_value: '150000' },
      lookup_key: 'lead-large',
    },
    {
      name: 'Lead - Premium Project',
      description: 'Lead for premium projects over $150,000.',
      price: 500,
      metadata: { category: 'lead', project_size: 'premium', min_value: '150000' },
      lookup_key: 'lead-premium',
    },
    {
      name: 'Lead - Exclusive (Small)',
      description: 'Exclusive lead for small projects - only you receive it.',
      price: 150, // 3x regular
      metadata: { category: 'lead', project_size: 'small', exclusive: 'true' },
      lookup_key: 'lead-small-exclusive',
    },
    {
      name: 'Lead - Exclusive (Medium)',
      description: 'Exclusive lead for medium projects - only you receive it.',
      price: 450, // 3x regular
      metadata: { category: 'lead', project_size: 'medium', exclusive: 'true' },
      lookup_key: 'lead-medium-exclusive',
    },
    {
      name: 'Lead - Exclusive (Large)',
      description: 'Exclusive lead for large projects - only you receive it.',
      price: 900, // 3x regular
      metadata: { category: 'lead', project_size: 'large', exclusive: 'true' },
      lookup_key: 'lead-large-exclusive',
    },
    {
      name: 'Lead - Exclusive (Premium)',
      description: 'Exclusive lead for premium projects - only you receive it.',
      price: 1500, // 3x regular
      metadata: { category: 'lead', project_size: 'premium', exclusive: 'true' },
      lookup_key: 'lead-premium-exclusive',
    },
  ],
  credits: [
    {
      name: 'Lead Credits - 10 Pack',
      description: 'Purchase 10 lead credits at a discount.',
      price: 400, // ~$40/lead vs $50
      metadata: { category: 'credits', credit_count: '10', discount: '20%' },
      lookup_key: 'credits-10',
    },
    {
      name: 'Lead Credits - 25 Pack',
      description: 'Purchase 25 lead credits at a discount.',
      price: 875, // $35/lead
      metadata: { category: 'credits', credit_count: '25', discount: '30%' },
      lookup_key: 'credits-25',
    },
    {
      name: 'Lead Credits - 50 Pack',
      description: 'Purchase 50 lead credits at a discount.',
      price: 1500, // $30/lead
      metadata: { category: 'credits', credit_count: '50', discount: '40%' },
      lookup_key: 'credits-50',
    },
  ],
};

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function createProduct(
  name: string,
  description: string,
  priceInDollars: number,
  metadata: Record<string, string>,
  lookupKey: string,
  recurring?: { interval: 'month' | 'year' }
): Promise<{ product: Stripe.Product; price: Stripe.Price }> {
  // Create product
  const product = await stripe.products.create({
    name,
    description,
    metadata,
    statement_descriptor: name.substring(0, 22).toUpperCase().replace(/[^A-Z0-9 ]/g, ''),
  });

  // Create price
  const priceData: Stripe.PriceCreateParams = {
    product: product.id,
    unit_amount: Math.round(priceInDollars * 100), // Convert to cents
    currency: 'usd',
    lookup_key: lookupKey,
    metadata,
  };

  if (recurring) {
    priceData.recurring = { interval: recurring.interval };
  }

  const price = await stripe.prices.create(priceData);

  return { product, price };
}

async function main() {
  console.log('🚀 Creating Engineering & Marketplace Products in Stripe...\n');

  const results: { name: string; priceId: string; lookupKey: string }[] = [];
  const errors: { name: string; error: string }[] = [];

  // Create Engineering Products
  console.log('📐 Creating Engineering Products...\n');
  for (const eng of ENGINEERING_PRODUCTS) {
    try {
      const { price } = await createProduct(
        eng.name,
        eng.description,
        eng.price,
        eng.metadata,
        eng.lookup_key
      );
      results.push({ name: eng.name, priceId: price.id, lookupKey: eng.lookup_key });
      console.log(`  ✅ ${eng.name}: ${price.id}`);
    } catch (error: any) {
      errors.push({ name: eng.name, error: error.message });
      console.log(`  ❌ ${eng.name}: ${error.message}`);
    }
  }

  // Create Marketplace Subscriptions
  console.log('\n🏪 Creating Marketplace Subscriptions...\n');
  for (const sub of MARKETPLACE_PRODUCTS.subscriptions) {
    try {
      // Monthly
      const { price: monthlyPrice } = await createProduct(
        sub.name,
        sub.description,
        sub.monthlyPrice,
        { ...sub.metadata, billing: 'monthly' },
        `${sub.lookup_key}-month`,
        { interval: 'month' }
      );
      results.push({ name: `${sub.name} (Monthly)`, priceId: monthlyPrice.id, lookupKey: `${sub.lookup_key}-month` });
      console.log(`  ✅ ${sub.name} (Monthly): ${monthlyPrice.id}`);

      // Yearly
      const { price: yearlyPrice } = await createProduct(
        sub.name + ' (Annual)',
        sub.description + '\n\n💰 15% discount with annual billing!',
        sub.yearlyPrice,
        { ...sub.metadata, billing: 'yearly', discount: '15%' },
        `${sub.lookup_key}-year`,
        { interval: 'year' }
      );
      results.push({ name: `${sub.name} (Yearly)`, priceId: yearlyPrice.id, lookupKey: `${sub.lookup_key}-year` });
      console.log(`  ✅ ${sub.name} (Yearly): ${yearlyPrice.id}`);
    } catch (error: any) {
      errors.push({ name: sub.name, error: error.message });
      console.log(`  ❌ ${sub.name}: ${error.message}`);
    }
  }

  // Create Lead Products
  console.log('\n📨 Creating Lead Products...\n');
  for (const lead of MARKETPLACE_PRODUCTS.leads) {
    try {
      const { price } = await createProduct(
        lead.name,
        lead.description,
        lead.price,
        lead.metadata,
        lead.lookup_key
      );
      results.push({ name: lead.name, priceId: price.id, lookupKey: lead.lookup_key });
      console.log(`  ✅ ${lead.name}: ${price.id}`);
    } catch (error: any) {
      errors.push({ name: lead.name, error: error.message });
      console.log(`  ❌ ${lead.name}: ${error.message}`);
    }
  }

  // Create Credit Packs
  console.log('\n💳 Creating Lead Credit Packs...\n');
  for (const credit of MARKETPLACE_PRODUCTS.credits) {
    try {
      const { price } = await createProduct(
        credit.name,
        credit.description,
        credit.price,
        credit.metadata,
        credit.lookup_key
      );
      results.push({ name: credit.name, priceId: price.id, lookupKey: credit.lookup_key });
      console.log(`  ✅ ${credit.name}: ${price.id}`);
    } catch (error: any) {
      errors.push({ name: credit.name, error: error.message });
      console.log(`  ❌ ${credit.name}: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Created: ${results.length} products`);
  console.log(`❌ Errors: ${errors.length}`);

  // Output environment variables
  console.log('\n' + '='.repeat(60));
  console.log('📋 ADD THESE TO YOUR .env FILE:');
  console.log('='.repeat(60) + '\n');

  console.log('# Engineering Products');
  results
    .filter(r => r.lookupKey.startsWith('eng-'))
    .forEach(r => {
      const envKey = `STRIPE_PRICE_${r.lookupKey.toUpperCase().replace(/-/g, '_')}`;
      console.log(`${envKey}=${r.priceId}`);
    });

  console.log('\n# Marketplace Subscriptions');
  results
    .filter(r => r.lookupKey.startsWith('mkt-'))
    .forEach(r => {
      const envKey = `STRIPE_PRICE_${r.lookupKey.toUpperCase().replace(/-/g, '_')}`;
      console.log(`${envKey}=${r.priceId}`);
    });

  console.log('\n# Lead Products');
  results
    .filter(r => r.lookupKey.startsWith('lead-'))
    .forEach(r => {
      const envKey = `STRIPE_PRICE_${r.lookupKey.toUpperCase().replace(/-/g, '_')}`;
      console.log(`${envKey}=${r.priceId}`);
    });

  console.log('\n# Credit Packs');
  results
    .filter(r => r.lookupKey.startsWith('credits-'))
    .forEach(r => {
      const envKey = `STRIPE_PRICE_${r.lookupKey.toUpperCase().replace(/-/g, '_')}`;
      console.log(`${envKey}=${r.priceId}`);
    });

  console.log('\n✅ Done!');
}

main().catch(console.error);
