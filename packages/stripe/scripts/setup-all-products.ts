/**
 * Stripe Product Setup Script
 * Creates all products and prices in Stripe via API
 * 
 * Usage: pnpm setup-products
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface ProductConfig {
  name: string;
  description: string;
  price: number;
  interval?: 'month' | 'year';
  type: 'recurring' | 'one_time';
  metadata: Record<string, string>;
}

const PRODUCTS_TO_CREATE: Record<string, ProductConfig> = {
  // PM Staffing Packages
  STRIPE_PRICE_PACKAGE_A: {
    name: 'PM Staffing - Essential (Package A)',
    description: 'Timeline & task management, document organization, weekly check-ins',
    price: 1750,
    interval: 'month',
    type: 'recurring',
    metadata: {
      package_id: 'package_a',
      tier: 'essential',
      category: 'pm_staffing',
    },
  },
  STRIPE_PRICE_PACKAGE_B: {
    name: 'PM Staffing - Professional (Package B)',
    description: 'Everything in Essential plus contractor coordination and site visits',
    price: 3750,
    interval: 'month',
    type: 'recurring',
    metadata: {
      package_id: 'package_b',
      tier: 'professional',
      category: 'pm_staffing',
    },
  },
  STRIPE_PRICE_PACKAGE_C: {
    name: 'PM Staffing - Premium (Package C)',
    description: 'Everything in Professional plus permit management and full oversight',
    price: 9500,
    interval: 'month',
    type: 'recurring',
    metadata: {
      package_id: 'package_c',
      tier: 'premium',
      category: 'pm_staffing',
      popular: 'true',
    },
  },
  STRIPE_PRICE_PACKAGE_D: {
    name: 'PM Staffing - White Glove (Package D)',
    description: 'Complete hands-off service - we handle everything',
    price: 16500,
    interval: 'month',
    type: 'recurring',
    metadata: {
      package_id: 'package_d',
      tier: 'white_glove',
      category: 'pm_staffing',
    },
  },

  // Marketplace Subscriptions
  STRIPE_PRICE_MARKETPLACE_BASIC: {
    name: 'Marketplace - Basic Listing',
    description: 'Basic contractor profile with limited leads',
    price: 49,
    interval: 'month',
    type: 'recurring',
    metadata: {
      tier: 'basic',
      lead_limit: '3',
      photo_limit: '5',
      category: 'marketplace',
    },
  },
  STRIPE_PRICE_MARKETPLACE_PRO: {
    name: 'Marketplace - Professional',
    description: 'Featured listing with priority placement',
    price: 149,
    interval: 'month',
    type: 'recurring',
    metadata: {
      tier: 'professional',
      lead_limit: '15',
      photo_limit: 'unlimited',
      category: 'marketplace',
      featured: 'true',
    },
  },
  STRIPE_PRICE_MARKETPLACE_PREMIUM: {
    name: 'Marketplace - Premium',
    description: 'Top-tier placement with unlimited leads',
    price: 299,
    interval: 'month',
    type: 'recurring',
    metadata: {
      tier: 'premium',
      lead_limit: 'unlimited',
      photo_limit: 'unlimited',
      category: 'marketplace',
      featured: 'true',
      verified: 'true',
    },
  },

  // Professional Subscriptions
  STRIPE_PRICE_ARCHITECT_PRO: {
    name: 'Architect Pro Subscription',
    description: 'Professional tools and reduced fees for architects',
    price: 99,
    interval: 'month',
    type: 'recurring',
    metadata: {
      tier: 'pro',
      category: 'professional',
      profession: 'architect',
      fee_discount: '2',
    },
  },
  STRIPE_PRICE_PERMIT_PRO: {
    name: 'Permit Pro - Monthly Subscription',
    description: 'Unlimited permit applications with priority processing',
    price: 299,
    interval: 'month',
    type: 'recurring',
    metadata: {
      tier: 'pro',
      category: 'professional',
      service: 'permits',
      applications: 'unlimited',
    },
  },

  // Marketing Package
  STRIPE_PRICE_MARKETING_PRO: {
    name: 'Marketing Pro Package',
    description: 'Complete marketing suite with website, SEO, and ad management',
    price: 799,
    interval: 'month',
    type: 'recurring',
    metadata: {
      tier: 'pro',
      category: 'marketing',
      google_ads_budget: '500',
      social_posts_monthly: '20',
      website_included: 'true',
    },
  },

  // Add-On Services
  STRIPE_PRICE_EXPEDITED: {
    name: 'Expedited Processing - 24hr Rush',
    description: '24-hour rush service for urgent requests',
    price: 500,
    type: 'one_time',
    metadata: {
      type: 'one_time',
      category: 'add_on',
      service: 'expedited',
      turnaround: '24_hours',
    },
  },
  STRIPE_PRICE_WHITE_LABEL: {
    name: 'White-Label Reporting',
    description: 'Custom branded reports for client delivery',
    price: 199,
    interval: 'month',
    type: 'recurring',
    metadata: {
      tier: 'standard',
      category: 'add_on',
      service: 'white_label',
    },
  },
  STRIPE_PRICE_API_ACCESS: {
    name: 'API Access - Professional',
    description: 'Full API access with high rate limits',
    price: 499,
    interval: 'month',
    type: 'recurring',
    metadata: {
      tier: 'professional',
      category: 'add_on',
      service: 'api',
      rate_limit: '10000',
    },
  },

  // Pay-Per-Permit Services
  STRIPE_PRICE_PERMIT_SIMPLE: {
    name: 'Simple Permit Processing',
    description: 'Basic permit applications (fence, deck, minor repairs)',
    price: 50,
    type: 'one_time',
    metadata: {
      type: 'one_time',
      category: 'permit',
      complexity: 'simple',
      processing_days: '10-15',
    },
  },
  STRIPE_PRICE_PERMIT_STANDARD: {
    name: 'Standard Permit Processing',
    description: 'Typical residential/commercial permits',
    price: 150,
    type: 'one_time',
    metadata: {
      type: 'one_time',
      category: 'permit',
      complexity: 'standard',
      processing_days: '15-30',
    },
  },
  STRIPE_PRICE_PERMIT_COMPLEX: {
    name: 'Complex Permit Processing',
    description: 'Major construction and complex projects',
    price: 500,
    type: 'one_time',
    metadata: {
      type: 'one_time',
      category: 'permit',
      complexity: 'complex',
      processing_days: '7-20',
      dedicated_specialist: 'true',
    },
  },
};

async function createProduct(config: ProductConfig): Promise<string> {
  try {
    // Create product
    const product = await stripe.products.create({
      name: config.name,
      description: config.description,
      metadata: config.metadata,
    });

    console.log(`✅ Created product: ${config.name} (${product.id})`);

    // Create price
    const priceData: Stripe.PriceCreateParams = {
      product: product.id,
      currency: 'usd',
      unit_amount: config.price * 100, // Convert to cents
    };

    if (config.type === 'recurring' && config.interval) {
      priceData.recurring = {
        interval: config.interval,
      };
    }

    const price = await stripe.prices.create(priceData);

    console.log(`✅ Created price: ${price.id}`);

    return price.id;
  } catch (error: any) {
    console.error(`❌ Error creating product ${config.name}:`, error.message);
    throw error;
  }
}

async function setupAllProducts() {
  console.log('🚀 Starting Stripe product setup...\n');

  const priceIds: Record<string, string> = {};
  const errors: string[] = [];

  for (const [envVar, config] of Object.entries(PRODUCTS_TO_CREATE)) {
    try {
      console.log(`\n📦 Creating: ${config.name}`);
      const priceId = await createProduct(config);
      priceIds[envVar] = priceId;
      
      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      errors.push(`${envVar}: ${error.message}`);
    }
  }

  // Generate .env file content
  console.log('\n\n📝 Generated Environment Variables:\n');
  console.log('# Copy these to your .env file\n');
  
  const envContent = Object.entries(priceIds)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  console.log(envContent);

  // Save to file
  const outputPath = path.join(__dirname, '../.env.generated');
  fs.writeFileSync(outputPath, envContent);
  console.log(`\n✅ Saved to: ${outputPath}`);

  // Show errors if any
  if (errors.length > 0) {
    console.log('\n\n⚠️  Errors encountered:\n');
    errors.forEach((error) => console.log(`  - ${error}`));
  }

  console.log('\n\n✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Copy the environment variables above to your .env file');
  console.log('2. Add them to Railway (backend)');
  console.log('3. Add public keys (NEXT_PUBLIC_*) to Vercel (frontend)');
  console.log('4. Redeploy your applications\n');
}

// Run the setup
setupAllProducts().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
