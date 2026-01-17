/**
 * Stripe Configuration
 * Centralized config for all Stripe products and prices
 */

export const stripeConfig = {
  // API Keys
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,

  // PM Services (Ops Services) Pricing
  packages: {
    A: {
      priceId: process.env.STRIPE_PRICE_PACKAGE_A!,
      name: 'Essential',
      price: 1750, // $1,750 per month
      amount: 175000, // in cents
      interval: 'month',
      features: [
        'Timeline & task management',
        'Document organization',
        'Weekly check-ins',
      ],
    },
    B: {
      priceId: process.env.STRIPE_PRICE_PACKAGE_B!,
      name: 'Professional',
      price: 3750, // $3,750 per month
      amount: 375000, // in cents
      interval: 'month',
      features: [
        'Everything in Essential',
        'Contractor coordination',
        'Budget tracking',
        'Site visits',
      ],
    },
    C: {
      priceId: process.env.STRIPE_PRICE_PACKAGE_C!,
      name: 'Premium',
      price: 9500, // $9,500 per month
      amount: 950000, // in cents
      interval: 'month',
      popular: true,
      features: [
        'Everything in Professional',
        'Permit management',
        'Inspection coordination',
        'Full contractor oversight',
      ],
    },
    D: {
      priceId: process.env.STRIPE_PRICE_PACKAGE_D!,
      name: 'White Glove',
      price: 16500, // $16,500 per month
      amount: 1650000, // in cents
      interval: 'month',
      features: [
        'Everything in Premium',
        'We hire contractors',
        'Handle all payments',
        'Complete hands-off',
      ],
    },
  },

  // Professional Services
  services: {
    architecture: {
      name: 'Architecture & Design',
      priceRange: [3500, 15000],
      type: 'custom',
    },
    engineering: {
      name: 'Engineering Services',
      priceRange: [1200, 5000],
      type: 'custom',
    },
    permit: {
      priceId: process.env.STRIPE_PRICE_PERMIT!,
      name: 'Permit Acceleration',
      price: 299,
      amount: 29900, // in cents
      type: 'one_time',
    },
  },

  // Marketplace Subscriptions
  marketplace: {
    basic: {
      priceId: process.env.STRIPE_PRICE_MARKETPLACE_BASIC!,
      name: 'Marketplace - Basic Listing',
      amount: 4900, // $49 in cents
      interval: 'month',
      leadLimit: 3,
      photoLimit: 5,
      features: [
        'Basic profile listing',
        'Up to 5 project photos',
        'Receive up to 3 leads/month',
        'Basic analytics',
        'Community forum access',
      ],
    },
    professional: {
      priceId: process.env.STRIPE_PRICE_MARKETPLACE_PRO!,
      name: 'Marketplace - Professional',
      amount: 14900, // $149 in cents
      interval: 'month',
      leadLimit: 15,
      photoLimit: -1, // unlimited
      features: [
        'Featured profile listing',
        'Unlimited project photos & portfolio',
        'Receive up to 15 leads/month',
        'Advanced analytics & insights',
        'Priority support',
        'Verified badge',
        'Quote request notifications',
      ],
    },
    premium: {
      priceId: process.env.STRIPE_PRICE_MARKETPLACE_PREMIUM!,
      name: 'Marketplace - Premium',
      amount: 29900, // $299 in cents
      interval: 'month',
      leadLimit: -1, // unlimited
      photoLimit: -1, // unlimited
      features: [
        'Top-tier featured placement',
        'Unlimited leads & project gallery',
        'Background check verification',
        'License & insurance verification',
        'Premium badge',
        'SEO optimization',
        'Custom landing page',
        'API access for lead management',
      ],
    },
  },

  // Architect Services
  architect: {
    pro: {
      priceId: process.env.STRIPE_PRICE_ARCHITECT_PRO!,
      name: 'Architect Pro Subscription',
      amount: 9900, // $99 in cents
      interval: 'month',
      platformFeeDiscount: 3, // 3% instead of 5%
      features: [
        'Unlimited project uploads',
        'Advanced BIM integration',
        'Version control & collaboration',
        'PE stamp workflow integration',
        'Priority review processing',
        'Reduced platform fees (3% instead of 5%)',
      ],
    },
  },

  // Permit Services
  permits: {
    pro: {
      priceId: process.env.STRIPE_PRICE_PERMIT_PRO!,
      name: 'Permit Pro - Monthly Subscription',
      amount: 29900, // $299 in cents
      interval: 'month',
      features: [
        'Unlimited permit applications',
        'Priority processing',
        'Automated compliance checks',
        'Jurisdiction integration',
        'Real-time status tracking',
        'Inspection scheduling included',
      ],
    },
  },

  // Add-On Services
  addOns: {
    apiAccess: {
      priceId: process.env.STRIPE_PRICE_API_ACCESS!,
      name: 'API Access - Professional',
      amount: 49900, // $499 in cents
      interval: 'month',
      rateLimit: 10000,
      features: [
        'Full REST API access',
        'GraphQL endpoint access',
        'Webhook support',
        'Rate limit: 10,000 requests/day',
        'Dedicated API support',
      ],
    },
    whiteLabel: {
      priceId: process.env.STRIPE_PRICE_WHITE_LABEL!,
      name: 'White-Label Reporting',
      amount: 19900, // $199 in cents
      interval: 'month',
      features: [
        'Custom branded reports for clients',
        'Remove Kealee branding',
        'Custom logo and colors',
        'Client-facing dashboards',
      ],
    },
  },

  // Marketplace & Platform Fees
  marketplace: {
    platformFee: 0.03, // 3%
    escrowFee: 0.01, // 1%
    maxEscrowFee: 500, // $500 maximum
  },

  // Platform Transaction Fees
  fees: {
    standard: {
      percentage: 3.0, // 3% platform fee
      fixed: 0.0,
    },
    escrow: {
      percentage: 1.0, // 1% escrow fee
      maximum: 500, // $500 max
    },
    milestone: {
      percentage: 2.9,
      fixed: 0.30,
    },
    architect: {
      percentage: 5.0,
      minimum: 500, // $500 minimum
    },
    architectPro: {
      percentage: 3.0, // Reduced for pro subscribers
      minimum: 500,
    },
  },
};

/**
 * Helper function to get all PM service packages
 */
export function getPMServicePackages() {
  return Object.entries(stripeConfig.packages).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}

/**
 * Get package by ID
 */
export function getPackageById(packageId: 'A' | 'B' | 'C' | 'D') {
  return stripeConfig.packages[packageId];
}

/**
 * Helper function to get all marketplace tiers
 */
export function getMarketplaceTiers() {
  return Object.entries(stripeConfig.marketplace).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}

/**
 * Helper function to calculate platform fee
 */
export function calculatePlatformFee(
  amount: number,
  feeType: 'standard' | 'milestone' | 'architect' | 'architectPro'
): number {
  const fee = stripeConfig.fees[feeType];
  const percentageFee = (amount * fee.percentage) / 100;
  const totalFee = percentageFee + (fee.fixed || 0) * 100; // Convert fixed to cents

  if (feeType.includes('architect')) {
    return Math.max(totalFee, (fee.minimum || 0) * 100);
  }

  return totalFee;
}

/**
 * Validate that all required Stripe environment variables are set
 */
export function validateStripeConfig(): void {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PRICE_PACKAGE_A',
    'STRIPE_PRICE_PACKAGE_B',
    'STRIPE_PRICE_PACKAGE_C',
    'STRIPE_PRICE_PACKAGE_D',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missing.join(', ')}`
    );
  }
}
