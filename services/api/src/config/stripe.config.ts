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
  pmServices: {
    packageA: {
      priceId: process.env.STRIPE_PRICE_PACKAGE_A!,
      name: 'PM Staffing - Starter (Package A)',
      amount: 170000, // $1,700 in cents
      interval: 'month',
      features: [
        '5-10 hours/week PM time',
        'Single project management',
        'Basic reporting',
        'Email support',
        'Monthly check-ins',
      ],
      hoursPerWeek: '5-10',
      projectLimit: 1,
    },
    packageB: {
      priceId: process.env.STRIPE_PRICE_PACKAGE_B!,
      name: 'PM Staffing - Professional (Package B)',
      amount: 450000, // $4,500 in cents
      interval: 'month',
      features: [
        '15-20 hours/week PM time',
        'Up to 3 concurrent projects',
        'Advanced reporting & analytics',
        'Priority email & phone support',
        'Weekly check-ins',
        'Dedicated PM assignment',
      ],
      hoursPerWeek: '15-20',
      projectLimit: 3,
    },
    packageC: {
      priceId: process.env.STRIPE_PRICE_PACKAGE_C!,
      name: 'PM Staffing - Premium (Package C)',
      amount: 850000, // $8,500 in cents
      interval: 'month',
      features: [
        '30-40 hours/week PM time',
        'Unlimited concurrent projects',
        'Real-time reporting & insights',
        '24/7 priority support',
        'Daily check-ins available',
        'Senior PM assignment',
        'Custom workflow automation',
      ],
      hoursPerWeek: '30-40',
      projectLimit: -1, // unlimited
    },
    packageD: {
      priceId: process.env.STRIPE_PRICE_PACKAGE_D!,
      name: 'PM Staffing - Enterprise (Package D)',
      amount: 1650000, // $16,500 in cents
      interval: 'month',
      features: [
        'Full-time PM team (40+ hours/week)',
        'Unlimited projects & portfolio management',
        'Executive reporting suite',
        'Dedicated account manager',
        'Custom integration & API access',
        'White-glove onboarding',
        'Quarterly business reviews',
      ],
      hoursPerWeek: '40+',
      projectLimit: -1, // unlimited
      enterprise: true,
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

  // Platform Transaction Fees
  fees: {
    standard: {
      percentage: 3.5,
      fixed: 0.30,
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
  return Object.entries(stripeConfig.pmServices).map(([key, value]) => ({
    id: key,
    ...value,
  }));
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
