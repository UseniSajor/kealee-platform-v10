/**
 * Stripe Software-Only Packages Setup
 *
 * Creates/updates 4 software-only subscription products (S1-S4) in Stripe,
 * each with 3 pricing tiers + annual variants (20% discount).
 *
 * Run: pnpm tsx scripts/stripe/setup-software-packages.ts
 *
 * See: _docs/Kealee-Software-Only-Packages.md
 */

import Stripe from 'stripe';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var ${key}`);
  return v;
}

// ── Software-Only Package Definitions ───────────────────────────

interface SoftwarePricingTier {
  label: string;
  monthlyPrice: number; // dollars
  maxProjects: number;
  maxUsers: number;
}

interface SoftwarePackage {
  slug: string;
  tier: 's1' | 's2' | 's3' | 's4';
  display: string;
  description: string;
  features: string[];
  pricingTiers: SoftwarePricingTier[];
}

const ANNUAL_DISCOUNT = 0.20; // 20% off for annual

const softwarePackages: SoftwarePackage[] = [
  {
    slug: 'software-s1-starter',
    tier: 's1',
    display: 'S1 Starter',
    description: 'Essential tools for solo GCs, handymen, and small subs getting organized.',
    features: [
      'Bid Tracker', 'Daily Reports', 'Punch List', 'Progress Reports',
      'Mobile Field Access', 'Change Order Tracking', 'Contract Manager', 'Safety Manager',
    ],
    pricingTiers: [
      { label: 'S1 Basic', monthlyPrice: 29, maxProjects: 1, maxUsers: 1 },
      { label: 'S1 Standard', monthlyPrice: 49, maxProjects: 2, maxUsers: 1 },
      { label: 'S1 Plus', monthlyPrice: 79, maxProjects: 3, maxUsers: 1 },
    ],
  },
  {
    slug: 'software-s2-builder',
    tier: 's2',
    display: 'S2 Builder',
    description: 'Complete project management for growing GCs and established subs.',
    features: [
      // S1 features +
      'Owner Dashboard', 'Schedule Manager', 'Lien Waiver Workflow', 'Budget Reports',
      'Scope Matrix', 'Permit Wizard', 'Inspection Scheduler', 'RFI Portal',
      'Submittal Manager', 'COI Tracker', 'QC Inspections', 'Document Control',
    ],
    pricingTiers: [
      { label: 'S2 Basic', monthlyPrice: 149, maxProjects: 5, maxUsers: 3 },
      { label: 'S2 Standard', monthlyPrice: 249, maxProjects: 7, maxUsers: 4 },
      { label: 'S2 Plus', monthlyPrice: 349, maxProjects: 10, maxUsers: 5 },
    ],
  },
  {
    slug: 'software-s3-pro',
    tier: 's3',
    display: 'S3 Pro',
    description: 'Advanced tools for mid-size GCs and multi-crew firms with AI-powered features.',
    features: [
      // S1+S2 features +
      'AIA Pay Applications', 'Retention Manager', 'Sub Prequalification',
      'Look-Ahead Scheduler', 'Bid Broadcast', 'Cash Flow Dashboard',
      'Job Cost Reports', 'Back-Charge Manager', 'Sub Ratings',
      'Sub Pay App Review', 'AI Takeoff Analysis', 'Labor Analytics',
      'As-Built Manager', 'Selection Manager', 'Warranty Portal',
    ],
    pricingTiers: [
      { label: 'S3 Basic', monthlyPrice: 599, maxProjects: 15, maxUsers: 8 },
      { label: 'S3 Standard', monthlyPrice: 899, maxProjects: 20, maxUsers: 10 },
      { label: 'S3 Plus', monthlyPrice: 1299, maxProjects: 30, maxUsers: 15 },
    ],
  },
  {
    slug: 'software-s4-enterprise',
    tier: 's4',
    display: 'S4 Enterprise',
    description: 'Full platform access for large GCs and multi-project operations with dedicated support.',
    features: [
      // S1+S2+S3 features +
      'Supplier Connect', 'Meeting Minutes', 'Weather Tracking', 'AP Manager',
      'Code Monitor', 'Cost Intelligence', 'License Manager', 'AI Scope Analyzer',
      'Bid Analytics', 'Bonding Dashboard', 'Tax Manager', 'Capacity Tracker',
      'Environmental Tracker', 'Issue Tracker', 'Integration Hub / API',
    ],
    pricingTiers: [
      { label: 'S4 Basic', monthlyPrice: 1999, maxProjects: 50, maxUsers: 25 },
      { label: 'S4 Standard', monthlyPrice: 3499, maxProjects: 75, maxUsers: 35 },
      { label: 'S4 Plus', monthlyPrice: 4999, maxProjects: 100, maxUsers: 50 },
    ],
  },
];

// ── PM Service Package Definitions (updated from restructured doc) ──────────

const pmServicePackages = [
  {
    slug: 'pm-package-a',
    display: 'PM Package A - Essentials',
    tier: 'PACKAGE_A',
    monthlyPrice: 1750,
    description: 'Essential PM services for single-project oversight.',
    maxProjects: 1,
    hoursPerWeek: '5-10',
    features: [
      '5-10 hours/week PM time',
      'Single project focus',
      'Email support (48hr response)',
      'Weekly progress reports',
      'Basic task tracking',
    ],
  },
  {
    slug: 'pm-package-b',
    display: 'PM Package B - Professional',
    tier: 'PACKAGE_B',
    monthlyPrice: 3750,
    description: 'Professional PM services for multi-project management.',
    maxProjects: 5,
    hoursPerWeek: '15-20',
    features: [
      '15-20 hours/week PM time',
      'Up to 5 concurrent projects',
      'Priority email & phone support',
      'Bi-weekly progress reports',
      'Contractor coordination',
      'Permit management',
    ],
  },
  {
    slug: 'pm-package-c',
    display: 'PM Package C - Premium',
    tier: 'PACKAGE_C',
    monthlyPrice: 9500,
    description: 'Premium PM services with dedicated project manager.',
    maxProjects: 20,
    hoursPerWeek: '30-40',
    features: [
      '30-40 hours/week PM time',
      'Up to 20 concurrent projects',
      '24/7 priority support',
      'Daily progress reports',
      'Dedicated PM assigned',
      'Full contractor management',
      'Budget optimization',
      'Risk management',
      'Site visit coordination',
    ],
  },
  {
    slug: 'pm-package-d',
    display: 'PM Package D - Enterprise',
    tier: 'PACKAGE_D',
    monthlyPrice: 16500,
    description: 'Enterprise PM services for portfolio management.',
    maxProjects: -1, // unlimited
    hoursPerWeek: '40+',
    features: [
      '40+ hours/week PM time',
      'Unlimited projects',
      'Dedicated account manager',
      'Custom reporting',
      'Strategic planning support',
      'Multi-project coordination',
      'Executive-level insights',
      'White-glove service',
      'Custom integrations',
    ],
  },
];

// ── Stripe Helpers ─────────────────────────────────────────────

async function upsertProduct(
  stripe: Stripe,
  data: { name: string; description: string; metadata: Record<string, string> }
): Promise<Stripe.Product> {
  const metaKey = data.metadata.kealee_slug;

  try {
    const res = await stripe.products.search({
      query: `metadata['kealee_slug']:'${metaKey}' AND active:'true'`,
      limit: 5,
    });
    if (res.data[0]) {
      return stripe.products.update(res.data[0].id, {
        name: data.name,
        description: data.description,
        metadata: data.metadata,
      });
    }
  } catch {
    // Fallback
  }

  return stripe.products.create({
    name: data.name,
    description: data.description,
    metadata: data.metadata,
    active: true,
  });
}

async function upsertPrice(
  stripe: Stripe,
  data: {
    productId: string;
    lookupKey: string;
    unitAmount: number; // cents
    interval: 'month' | 'year';
    currency?: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Price> {
  try {
    const res = await stripe.prices.search({
      query: `lookup_key:'${data.lookupKey}'`,
      limit: 5,
    });
    if (res.data[0]) return res.data[0];
  } catch {
    // Fallback to listing
  }

  return stripe.prices.create({
    product: data.productId,
    lookup_key: data.lookupKey,
    unit_amount: data.unitAmount,
    currency: data.currency ?? 'usd',
    recurring: { interval: data.interval },
    metadata: data.metadata,
    transfer_lookup_key: true,
  });
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const stripe = new Stripe(env('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' as any });

  console.log('\n=== KEALEE SOFTWARE-ONLY PACKAGES — Stripe Setup ===\n');

  const envVars: string[] = [];

  // ── Software-Only Packages (S1-S4) ──

  for (const pkg of softwarePackages) {
    console.log(`\n── ${pkg.display} ──`);

    const product = await upsertProduct(stripe, {
      name: `Kealee ${pkg.display}`,
      description: pkg.description,
      metadata: {
        kealee_slug: pkg.slug,
        package_type: 'software_only',
        feature_tier: pkg.tier,
        audience: 'gc_builder_contractor',
      },
    });
    console.log(`  Product: ${product.id} (${product.name})`);

    const envPrefix = `STRIPE_${pkg.tier.toUpperCase()}`;
    envVars.push(`${envPrefix}_PRODUCT_ID=${product.id}`);

    for (let i = 0; i < pkg.pricingTiers.length; i++) {
      const tier = pkg.pricingTiers[i];
      const tierSuffix = ['basic', 'standard', 'plus'][i];

      // Monthly price
      const monthlyPrice = await upsertPrice(stripe, {
        productId: product.id,
        lookupKey: `${pkg.slug}-${tierSuffix}-monthly`,
        unitAmount: tier.monthlyPrice * 100,
        interval: 'month',
        metadata: {
          max_projects: String(tier.maxProjects),
          max_users: String(tier.maxUsers),
          feature_tier: pkg.tier,
          package_type: 'software_only',
          tier_label: tier.label,
        },
      });
      console.log(`  Monthly ${tier.label}: ${monthlyPrice.id} ($${tier.monthlyPrice}/mo)`);
      envVars.push(`${envPrefix}_${tierSuffix.toUpperCase()}_MONTHLY_PRICE_ID=${monthlyPrice.id}`);

      // Annual price (20% discount)
      const annualMonthly = Math.round(tier.monthlyPrice * (1 - ANNUAL_DISCOUNT));
      const annualTotal = annualMonthly * 12;
      const annualPrice = await upsertPrice(stripe, {
        productId: product.id,
        lookupKey: `${pkg.slug}-${tierSuffix}-annual`,
        unitAmount: annualTotal * 100,
        interval: 'year',
        metadata: {
          max_projects: String(tier.maxProjects),
          max_users: String(tier.maxUsers),
          feature_tier: pkg.tier,
          package_type: 'software_only',
          tier_label: `${tier.label} (Annual)`,
          monthly_equivalent: String(annualMonthly),
        },
      });
      console.log(`  Annual  ${tier.label}: ${annualPrice.id} ($${annualMonthly}/mo billed annually)`);
      envVars.push(`${envPrefix}_${tierSuffix.toUpperCase()}_ANNUAL_PRICE_ID=${annualPrice.id}`);
    }
  }

  // ── PM Service Packages (A-D) ──

  console.log('\n\n=== PM SERVICE PACKAGES — Stripe Setup ===\n');

  for (const pkg of pmServicePackages) {
    console.log(`\n── ${pkg.display} ──`);

    const product = await upsertProduct(stripe, {
      name: `Kealee ${pkg.display}`,
      description: pkg.description,
      metadata: {
        kealee_slug: pkg.slug,
        package_type: 'pm_service',
        pm_tier: pkg.tier,
        max_projects: String(pkg.maxProjects),
        hours_per_week: pkg.hoursPerWeek,
        audience: 'homeowner_developer_gc',
      },
    });
    console.log(`  Product: ${product.id} (${product.name})`);

    const envPrefix = `STRIPE_PM_${pkg.tier.replace('PACKAGE_', '')}`;
    envVars.push(`${envPrefix}_PRODUCT_ID=${product.id}`);

    // Monthly price
    const monthlyPrice = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: `${pkg.slug}-monthly`,
      unitAmount: pkg.monthlyPrice * 100,
      interval: 'month',
      metadata: {
        package_type: 'pm_service',
        pm_tier: pkg.tier,
        max_projects: String(pkg.maxProjects),
      },
    });
    console.log(`  Monthly: ${monthlyPrice.id} ($${pkg.monthlyPrice}/mo)`);
    envVars.push(`${envPrefix}_MONTHLY_PRICE_ID=${monthlyPrice.id}`);

    // Annual price (15% discount for PM services)
    const annualMonthly = Math.round(pkg.monthlyPrice * 0.85);
    const annualTotal = annualMonthly * 12;
    const annualPrice = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: `${pkg.slug}-annual`,
      unitAmount: annualTotal * 100,
      interval: 'year',
      metadata: {
        package_type: 'pm_service',
        pm_tier: pkg.tier,
        max_projects: String(pkg.maxProjects),
        monthly_equivalent: String(annualMonthly),
      },
    });
    console.log(`  Annual: ${annualPrice.id} ($${annualMonthly}/mo billed annually)`);
    envVars.push(`${envPrefix}_ANNUAL_PRICE_ID=${annualPrice.id}`);
  }

  // ── Output env vars ──

  console.log('\n\n=== Environment Variables ===\n');
  console.log('# Add these to .env.local:\n');
  envVars.forEach((v) => console.log(v));

  console.log('\n\nDone! All products and prices created/updated.');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
