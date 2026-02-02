/**
 * Complete Stripe Product Catalog Creator
 * Creates all products for the Kealee Platform
 * Run with: STRIPE_SECRET_KEY=sk_live_xxx pnpm tsx scripts/stripe/create-complete-catalog.ts
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.error('   Run: STRIPE_SECRET_KEY=sk_live_xxx pnpm tsx scripts/stripe/create-complete-catalog.ts');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia',
});

interface ProductConfig {
  name: string;
  description: string;
  price: number;
  type: 'recurring' | 'one_time';
  interval?: 'month' | 'year';
  category: string;
  metadata: Record<string, string>;
}

// ============================================================================
// PRODUCT CATALOG
// ============================================================================

const products: ProductConfig[] = [
  // -------------------------
  // PM MANAGED SERVICE PACKAGES
  // -------------------------
  {
    name: 'Package A - Solo GC',
    description: 'PM services for solo general contractors: 5-10 hours/week, 1 project, weekly reports, basic coordination',
    price: 175000, // $1,750/month
    type: 'recurring',
    interval: 'month',
    category: 'pm-packages',
    metadata: {
      tier: 'A',
      code: 'PKG_A',
      hoursPerWeek: '5-10',
      projects: '1',
      visits: '0-1/month',
    },
  },
  {
    name: 'Package B - Growing Team',
    description: 'PM services for growing teams: 15-20 hours/week, 3 projects, priority support, advanced tracking',
    price: 375000, // $3,750/month
    type: 'recurring',
    interval: 'month',
    category: 'pm-packages',
    metadata: {
      tier: 'B',
      code: 'PKG_B',
      hoursPerWeek: '15-20',
      projects: '3',
      visits: '2-4/month',
      mostPopular: 'true',
    },
  },
  {
    name: 'Package C - Multiple Projects',
    description: 'Premium PM services: 30-40 hours/week, unlimited projects, dedicated PM, permit management, 0% marketplace fees',
    price: 950000, // $9,500/month
    type: 'recurring',
    interval: 'month',
    category: 'pm-packages',
    metadata: {
      tier: 'C',
      code: 'PKG_C',
      hoursPerWeek: '30-40',
      projects: 'unlimited',
      visits: '4-8/month',
      featuredFeature: 'permit-management',
    },
  },
  {
    name: 'Package D - Enterprise GC',
    description: 'Enterprise PM services: 40+ hours/week, unlimited projects, multi-PM team, real-time dashboard, executive reporting',
    price: 1650000, // $16,500/month
    type: 'recurring',
    interval: 'month',
    category: 'pm-packages',
    metadata: {
      tier: 'D',
      code: 'PKG_D',
      hoursPerWeek: '40+',
      projects: 'unlimited',
      visits: '8-16/month',
      enterprise: 'true',
    },
  },

  // -------------------------
  // ANNUAL PACKAGES (10% discount)
  // -------------------------
  {
    name: 'Package A - Annual',
    description: 'Package A billed annually (save 10%)',
    price: 1890000, // $18,900/year ($1,575/month effective)
    type: 'recurring',
    interval: 'year',
    category: 'pm-packages-annual',
    metadata: {
      tier: 'A',
      code: 'PKG_A_ANNUAL',
      discount: '10%',
    },
  },
  {
    name: 'Package B - Annual',
    description: 'Package B billed annually (save 10%)',
    price: 4050000, // $40,500/year ($3,375/month effective)
    type: 'recurring',
    interval: 'year',
    category: 'pm-packages-annual',
    metadata: {
      tier: 'B',
      code: 'PKG_B_ANNUAL',
      discount: '10%',
      mostPopular: 'true',
    },
  },
  {
    name: 'Package C - Annual',
    description: 'Package C billed annually (save 10%)',
    price: 10260000, // $102,600/year ($8,550/month effective)
    type: 'recurring',
    interval: 'year',
    category: 'pm-packages-annual',
    metadata: {
      tier: 'C',
      code: 'PKG_C_ANNUAL',
      discount: '10%',
    },
  },
  {
    name: 'Package D - Annual',
    description: 'Package D billed annually (save 10%)',
    price: 17820000, // $178,200/year ($14,850/month effective)
    type: 'recurring',
    interval: 'year',
    category: 'pm-packages-annual',
    metadata: {
      tier: 'D',
      code: 'PKG_D_ANNUAL',
      discount: '10%',
    },
  },

  // -------------------------
  // ON-DEMAND OPS (À LA CARTE)
  // -------------------------
  
  // Permits & Field Ops
  {
    name: 'Permit Application Assistance',
    description: 'Complete permit application preparation and submission through approval',
    price: 32500, // $325
    type: 'one_time',
    category: 'on-demand-permits',
    metadata: {
      category: 'permits-field',
      code: 'OD_PERMIT_APP',
    },
  },
  {
    name: 'Inspection Scheduling',
    description: 'Coordinate inspections with AHJ and handle re-inspection follow-ups',
    price: 20000, // $200
    type: 'one_time',
    category: 'on-demand-permits',
    metadata: {
      category: 'permits-field',
      code: 'OD_INSPECTION',
    },
  },
  {
    name: 'Site Visit & Reporting',
    description: 'Scheduled site visit with photo documentation and progress report',
    price: 35000, // $350
    type: 'one_time',
    category: 'on-demand-permits',
    metadata: {
      category: 'permits-field',
      code: 'OD_SITE_VISIT',
    },
  },
  {
    name: 'Quality Control Review',
    description: 'Independent quality inspection against plans and specifications',
    price: 40000, // $400
    type: 'one_time',
    category: 'on-demand-permits',
    metadata: {
      category: 'permits-field',
      code: 'OD_QC_REVIEW',
    },
  },

  // Coordination & Admin
  {
    name: 'Contractor Coordination',
    description: 'Manage subcontractor schedules, deliveries, and change order tracking',
    price: 50000, // $500
    type: 'one_time',
    category: 'on-demand-coordination',
    metadata: {
      category: 'coordination-admin',
      code: 'OD_CONTRACTOR_COORD',
    },
  },
  {
    name: 'Change Order Management',
    description: 'Document, price, and track change orders from request to approval',
    price: 47500, // $475
    type: 'one_time',
    category: 'on-demand-coordination',
    metadata: {
      category: 'coordination-admin',
      code: 'OD_CHANGE_ORDER',
    },
  },
  {
    name: 'Document Organization',
    description: 'Centralize and organize contracts, invoices, and project documents',
    price: 40000, // $400
    type: 'one_time',
    category: 'on-demand-coordination',
    metadata: {
      category: 'coordination-admin',
      code: 'OD_DOCUMENT_ORG',
    },
  },
  {
    name: 'Progress Reporting',
    description: 'Weekly or bi-weekly client update with photos and milestone status',
    price: 25000, // $250
    type: 'one_time',
    category: 'on-demand-coordination',
    metadata: {
      category: 'coordination-admin',
      code: 'OD_PROGRESS_REPORT',
    },
  },

  // Estimating & Pre-Construction
  {
    name: 'Budget Analysis',
    description: 'Review estimates and provide cost-saving recommendations',
    price: 45000, // $450
    type: 'one_time',
    category: 'on-demand-estimating',
    metadata: {
      category: 'estimating-precon',
      code: 'OD_BUDGET_ANALYSIS',
    },
  },
  {
    name: 'Schedule Optimization',
    description: 'Build or refine project schedule to minimize delays and conflicts',
    price: 125000, // $1,250
    type: 'one_time',
    category: 'on-demand-estimating',
    metadata: {
      category: 'estimating-precon',
      code: 'OD_SCHEDULE_OPT',
    },
  },
  {
    name: 'Scope Review - Hourly',
    description: 'Identify gaps and clarify specifications before construction starts',
    price: 30000, // $300/hour
    type: 'one_time',
    category: 'on-demand-estimating',
    metadata: {
      category: 'estimating-precon',
      code: 'OD_SCOPE_REVIEW',
      billing: 'hourly',
    },
  },
  {
    name: 'Value Engineering - Hourly',
    description: 'Cost-reduction analysis without sacrificing quality or performance',
    price: 40000, // $400/hour
    type: 'one_time',
    category: 'on-demand-estimating',
    metadata: {
      category: 'estimating-precon',
      code: 'OD_VALUE_ENG',
      billing: 'hourly',
    },
  },

  // -------------------------
  // ESTIMATION SERVICES
  // -------------------------
  {
    name: 'Basic Estimate',
    description: 'Line-item cost estimate for projects up to $100K',
    price: 50000, // $500
    type: 'one_time',
    category: 'estimation',
    metadata: {
      code: 'EST_BASIC',
      projectSize: 'up-to-100k',
    },
  },
  {
    name: 'Standard Estimate',
    description: 'Detailed estimate with assemblies for projects $100K-$500K',
    price: 100000, // $1,000
    type: 'one_time',
    category: 'estimation',
    metadata: {
      code: 'EST_STANDARD',
      projectSize: '100k-500k',
    },
  },
  {
    name: 'Premium Estimate',
    description: 'Comprehensive estimate with takeoff and value engineering for projects $500K+',
    price: 200000, // $2,000
    type: 'one_time',
    category: 'estimation',
    metadata: {
      code: 'EST_PREMIUM',
      projectSize: '500k-plus',
      includes: 'takeoff,value-engineering',
    },
  },

  // -------------------------
  // ARCHITECTURE SERVICES
  // -------------------------
  {
    name: 'Schematic Design',
    description: 'Initial design concepts and space planning',
    price: 250000, // $2,500
    type: 'one_time',
    category: 'architecture',
    metadata: {
      code: 'ARCH_SCHEMATIC',
      phase: 'schematic-design',
    },
  },
  {
    name: 'Design Development',
    description: 'Detailed design drawings and specifications',
    price: 400000, // $4,000
    type: 'one_time',
    category: 'architecture',
    metadata: {
      code: 'ARCH_DD',
      phase: 'design-development',
    },
  },
  {
    name: 'Construction Documents',
    description: 'Complete construction drawing set for permitting',
    price: 600000, // $6,000
    type: 'one_time',
    category: 'architecture',
    metadata: {
      code: 'ARCH_CD',
      phase: 'construction-documents',
    },
  },

  // -------------------------
  // ENGINEERING SERVICES
  // -------------------------
  {
    name: 'Structural Engineering - Residential',
    description: 'Structural calculations and stamped drawings for residential projects',
    price: 150000, // $1,500
    type: 'one_time',
    category: 'engineering',
    metadata: {
      code: 'ENG_STRUCT_RES',
      discipline: 'structural',
      projectType: 'residential',
    },
  },
  {
    name: 'MEP Engineering',
    description: 'Mechanical, Electrical, and Plumbing design and calculations',
    price: 350000, // $3,500
    type: 'one_time',
    category: 'engineering',
    metadata: {
      code: 'ENG_MEP',
      discipline: 'mep',
    },
  },

  // -------------------------
  // PERMIT SERVICES
  // -------------------------
  {
    name: 'Standard Permit Package',
    description: 'Complete permit submittal package preparation',
    price: 50000, // $500
    type: 'one_time',
    category: 'permits',
    metadata: {
      code: 'PERMIT_STANDARD',
    },
  },
  {
    name: 'Expedited Permit Service',
    description: 'Fast-track permit processing with follow-up',
    price: 100000, // $1,000
    type: 'one_time',
    category: 'permits',
    metadata: {
      code: 'PERMIT_EXPEDITED',
      expedited: 'true',
    },
  },

  // -------------------------
  // FINANCE & ESCROW
  // -------------------------
  {
    name: 'Escrow Service - Standard',
    description: 'Milestone-based escrow management (1% fee, max $500)',
    price: 0, // Fee calculated as % of transaction
    type: 'one_time',
    category: 'finance',
    metadata: {
      code: 'ESCROW_STANDARD',
      feeType: 'percentage',
      feePercent: '1',
      feeMax: '500',
    },
  },
  {
    name: 'Payment Processing',
    description: 'Secure payment processing (2.9% + $0.30 per transaction)',
    price: 0, // Fee calculated per transaction
    type: 'one_time',
    category: 'finance',
    metadata: {
      code: 'PAYMENT_PROCESSING',
      feeType: 'percentage',
      feePercent: '2.9',
      feeFixed: '30',
    },
  },

  // -------------------------
  // MARKETPLACE SERVICES
  // -------------------------
  {
    name: 'Contractor Lead',
    description: 'Qualified contractor lead from Fair Bid Rotation',
    price: 5000, // $50 per lead
    type: 'one_time',
    category: 'marketplace',
    metadata: {
      code: 'MKT_LEAD',
    },
  },
  {
    name: 'Premium Contractor Listing',
    description: 'Featured placement in contractor marketplace (monthly)',
    price: 29900, // $299/month
    type: 'recurring',
    interval: 'month',
    category: 'marketplace',
    metadata: {
      code: 'MKT_PREMIUM_LISTING',
    },
  },

  // -------------------------
  // CONSULTATION SERVICES
  // -------------------------
  {
    name: 'Initial Consultation',
    description: '1-hour consultation to discuss project and services',
    price: 0, // Free
    type: 'one_time',
    category: 'consultation',
    metadata: {
      code: 'CONSULT_INITIAL',
      duration: '60',
      free: 'true',
    },
  },
  {
    name: 'Expert Consultation - Hourly',
    description: 'Ongoing consultation with construction PM expert',
    price: 15000, // $150/hour
    type: 'one_time',
    category: 'consultation',
    metadata: {
      code: 'CONSULT_HOURLY',
      billing: 'hourly',
    },
  },
];

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function createProducts() {
  console.log('═'.repeat(70));
  console.log('💳 KEALEE PLATFORM - COMPLETE STRIPE CATALOG CREATION');
  console.log('═'.repeat(70));
  console.log();

  // Verify mode
  const isLiveMode = stripeKey!.startsWith('sk_live_');
  console.log(`Mode: ${isLiveMode ? '🔴 LIVE' : '🟡 TEST'}`);
  console.log();

  if (isLiveMode) {
    console.log('⚠️  WARNING: Creating products in LIVE mode!');
    console.log('   These will be real products that can be purchased.');
    console.log();
    
    // Simple confirmation for automation
    if (process.argv.includes('--confirm-live')) {
      console.log('✅ Live mode confirmed via --confirm-live flag');
    } else {
      console.error('❌ Live mode requires --confirm-live flag');
      console.error('   Run: pnpm tsx scripts/stripe/create-complete-catalog.ts --confirm-live');
      process.exit(1);
    }
  }

  const createdProducts: Array<{
    product: Stripe.Product;
    price: Stripe.Price;
    config: ProductConfig;
  }> = [];

  console.log(`Creating ${products.length} products...\n`);

  for (const productConfig of products) {
    try {
      console.log(`Creating: ${productConfig.name}`);

      // Create product
      const product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: productConfig.metadata,
      });

      // Create price (only if price > 0)
      let price: Stripe.Price | null = null;
      
      if (productConfig.price > 0) {
        price = await stripe.prices.create({
          product: product.id,
          currency: 'usd',
          unit_amount: productConfig.price,
          ...(productConfig.type === 'recurring'
            ? { recurring: { interval: productConfig.interval! } }
            : {}),
        });
      } else {
        // For free products or variable pricing
        price = await stripe.prices.create({
          product: product.id,
          currency: 'usd',
          unit_amount: 0,
        });
      }

      createdProducts.push({ product, price: price!, config: productConfig });
      console.log(`   ✅ Product: ${product.id}`);
      console.log(`   ✅ Price: ${price!.id}`);
      console.log();
    } catch (error) {
      console.error(`   ❌ Failed: ${error}`);
      console.log();
    }
  }

  // ============================================================================
  // GENERATE ENVIRONMENT VARIABLES
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('📋 ENVIRONMENT VARIABLES');
  console.log('═'.repeat(70));
  console.log();

  const envVars: string[] = [];

  // PM Packages (Monthly)
  const pkgA = createdProducts.find((p) => p.config.metadata.code === 'PKG_A');
  const pkgB = createdProducts.find((p) => p.config.metadata.code === 'PKG_B');
  const pkgC = createdProducts.find((p) => p.config.metadata.code === 'PKG_C');
  const pkgD = createdProducts.find((p) => p.config.metadata.code === 'PKG_D');

  if (pkgA) envVars.push(`STRIPE_PRICE_PACKAGE_A=${pkgA.price.id}`);
  if (pkgB) envVars.push(`STRIPE_PRICE_PACKAGE_B=${pkgB.price.id}`);
  if (pkgC) envVars.push(`STRIPE_PRICE_PACKAGE_C=${pkgC.price.id}`);
  if (pkgD) envVars.push(`STRIPE_PRICE_PACKAGE_D=${pkgD.price.id}`);

  // On-Demand Services (sample of commonly used)
  createdProducts
    .filter((p) => p.config.category.startsWith('on-demand-'))
    .forEach((p) => {
      const envName = `STRIPE_PRICE_${p.config.metadata.code}`;
      envVars.push(`${envName}=${p.price.id}`);
    });

  console.log('Add these to your environment:');
  console.log();
  envVars.forEach((v) => console.log(v));
  console.log();

  // ============================================================================
  // SAVE TO FILE
  // ============================================================================
  const outputPath = path.join(__dirname, 'stripe-catalog-output.env');
  fs.writeFileSync(outputPath, envVars.join('\n'));

  console.log(`💾 Saved to: ${outputPath}`);
  console.log();

  // ============================================================================
  // GENERATE JSON CATALOG
  // ============================================================================
  const catalogPath = path.join(__dirname, 'stripe-catalog.json');
  const catalog = createdProducts.map((p) => ({
    productId: p.product.id,
    priceId: p.price.id,
    name: p.product.name,
    amount: p.price.unit_amount,
    category: p.config.category,
    code: p.config.metadata.code,
  }));

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  console.log(`💾 Catalog saved to: ${catalogPath}`);
  console.log();

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('✅ STRIPE CATALOG CREATION COMPLETE');
  console.log('═'.repeat(70));
  console.log();
  console.log(`Total Products Created: ${createdProducts.length}`);
  console.log();
  console.log('By Category:');
  const categories = [
    ...new Set(createdProducts.map((p) => p.config.category)),
  ];
  categories.forEach((cat) => {
    const count = createdProducts.filter((p) => p.config.category === cat).length;
    console.log(`  • ${cat}: ${count} products`);
  });
  console.log();
  console.log('Next Steps:');
  console.log('  1. Copy environment variables to Railway (API service)');
  console.log('  2. Copy environment variables to Vercel (m-ops-services, m-finance-trust)');
  console.log('  3. Update seed.ts with price IDs');
  console.log('  4. Test checkout flows');
  console.log();
}

createProducts().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
