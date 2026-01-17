/**
 * Stripe Product Constants
 * Organized product catalogs and feature matrices
 */

import { STRIPE_PRODUCTS } from './stripe-products';
import type { PricingTableEntry } from './types';

/**
 * PM Staffing Package Comparison Matrix
 */
export const PM_STAFFING_COMPARISON = {
  packages: ['packageA', 'packageB', 'packageC', 'packageD'],
  features: [
    {
      name: 'Timeline & Task Management',
      packageA: true,
      packageB: true,
      packageC: true,
      packageD: true,
    },
    {
      name: 'Document Organization',
      packageA: true,
      packageB: true,
      packageC: true,
      packageD: true,
    },
    {
      name: 'Weekly Check-ins',
      packageA: true,
      packageB: true,
      packageC: true,
      packageD: true,
    },
    {
      name: 'Contractor Coordination',
      packageA: false,
      packageB: true,
      packageC: true,
      packageD: true,
    },
    {
      name: 'Budget Tracking',
      packageA: false,
      packageB: true,
      packageC: true,
      packageD: true,
    },
    {
      name: 'Site Visits',
      packageA: false,
      packageB: true,
      packageC: true,
      packageD: true,
    },
    {
      name: 'Permit Management',
      packageA: false,
      packageB: false,
      packageC: true,
      packageD: true,
    },
    {
      name: 'Inspection Coordination',
      packageA: false,
      packageB: false,
      packageC: true,
      packageD: true,
    },
    {
      name: 'Full Contractor Oversight',
      packageA: false,
      packageB: false,
      packageC: true,
      packageD: true,
    },
    {
      name: 'We Hire Contractors',
      packageA: false,
      packageB: false,
      packageC: false,
      packageD: true,
    },
    {
      name: 'Handle All Payments',
      packageA: false,
      packageB: false,
      packageC: false,
      packageD: true,
    },
    {
      name: 'Complete Hands-Off',
      packageA: false,
      packageB: false,
      packageC: false,
      packageD: true,
    },
  ],
} as const;

/**
 * Marketplace Tier Comparison Matrix
 */
export const MARKETPLACE_COMPARISON = {
  tiers: ['basic', 'professional', 'premium'],
  features: [
    {
      name: 'Profile Listing',
      basic: 'Basic',
      professional: 'Featured',
      premium: 'Top-tier Featured',
    },
    {
      name: 'Monthly Leads',
      basic: '3',
      professional: '15',
      premium: 'Unlimited',
    },
    {
      name: 'Project Photos',
      basic: '5',
      professional: 'Unlimited',
      premium: 'Unlimited',
    },
    {
      name: 'Analytics',
      basic: 'Basic',
      professional: 'Advanced',
      premium: 'Advanced + SEO',
    },
    {
      name: 'Support',
      basic: 'Standard',
      professional: 'Priority',
      premium: 'Priority',
    },
    {
      name: 'Verified Badge',
      basic: false,
      professional: true,
      premium: true,
    },
    {
      name: 'Background Check',
      basic: false,
      professional: false,
      premium: true,
    },
    {
      name: 'Custom Landing Page',
      basic: false,
      professional: false,
      premium: true,
    },
    {
      name: 'API Access',
      basic: false,
      professional: false,
      premium: true,
    },
  ],
} as const;

/**
 * Pricing Tables for Display
 */
export const PRICING_TABLES: PricingTableEntry[] = [
  {
    category: 'PM Staffing Packages',
    products: [
      {
        id: 'package_a',
        name: 'Essential',
        price: 1750,
        interval: 'month',
        features: STRIPE_PRODUCTS.pmStaffing.packageA.features,
        cta: 'Start Essential',
      },
      {
        id: 'package_b',
        name: 'Professional',
        price: 3750,
        interval: 'month',
        features: STRIPE_PRODUCTS.pmStaffing.packageB.features,
        cta: 'Start Professional',
      },
      {
        id: 'package_c',
        name: 'Premium',
        price: 9500,
        interval: 'month',
        features: STRIPE_PRODUCTS.pmStaffing.packageC.features,
        popular: true,
        cta: 'Start Premium',
      },
      {
        id: 'package_d',
        name: 'White Glove',
        price: 16500,
        interval: 'month',
        features: STRIPE_PRODUCTS.pmStaffing.packageD.features,
        cta: 'Start White Glove',
      },
    ],
  },
  {
    category: 'Marketplace Subscriptions',
    products: [
      {
        id: 'marketplace_basic',
        name: 'Basic',
        price: 49,
        interval: 'month',
        features: STRIPE_PRODUCTS.marketplace.basic.features,
        cta: 'Get Basic',
      },
      {
        id: 'marketplace_professional',
        name: 'Professional',
        price: 149,
        interval: 'month',
        features: STRIPE_PRODUCTS.marketplace.professional.features,
        cta: 'Get Professional',
      },
      {
        id: 'marketplace_premium',
        name: 'Premium',
        price: 299,
        interval: 'month',
        features: STRIPE_PRODUCTS.marketplace.premium.features,
        cta: 'Get Premium',
      },
    ],
  },
  {
    category: 'Professional Tools',
    products: [
      {
        id: 'architect_pro',
        name: 'Architect Pro',
        price: 99,
        interval: 'month',
        features: STRIPE_PRODUCTS.professional.architectPro.features,
        cta: 'Subscribe',
      },
      {
        id: 'permit_pro',
        name: 'Permit Pro',
        price: 299,
        interval: 'month',
        features: STRIPE_PRODUCTS.professional.permitPro.features,
        cta: 'Subscribe',
      },
    ],
  },
  {
    category: 'Marketing',
    products: [
      {
        id: 'marketing_pro',
        name: 'Marketing Pro',
        price: 799,
        interval: 'month',
        features: STRIPE_PRODUCTS.marketing.pro.features,
        cta: 'Get Marketing Pro',
      },
    ],
  },
];

/**
 * Permit Processing Times by Complexity
 */
export const PERMIT_PROCESSING_TIMES = {
  simple: {
    min: 10,
    max: 15,
    unit: 'business days',
  },
  standard: {
    min: 15,
    max: 30,
    unit: 'business days',
  },
  complex: {
    min: 7,
    max: 20,
    unit: 'business days',
  },
} as const;

/**
 * Add-On Services Catalog
 */
export const ADD_ON_CATALOG = {
  expedited: {
    name: 'Expedited Processing',
    price: 500,
    turnaround: '24 hours',
    description: '24-hour rush service for urgent requests',
  },
  whiteLabel: {
    name: 'White-Label Reporting',
    price: 199,
    interval: 'month',
    description: 'Custom branded reports for clients',
  },
  apiAccess: {
    name: 'API Access',
    price: 499,
    interval: 'month',
    rateLimit: '10,000 requests/day',
    description: 'Full API access with webhooks',
  },
} as const;

/**
 * Transaction Fee Schedule
 */
export const FEE_SCHEDULE = {
  standard: {
    percentage: 3.5,
    fixed: 0.30,
    description: 'Standard platform fee',
  },
  milestone: {
    percentage: 2.9,
    fixed: 0.30,
    description: 'Milestone payment fee',
  },
  architect: {
    percentage: 5.0,
    minimum: 500,
    description: 'Architect services fee',
  },
  architectPro: {
    percentage: 3.0,
    minimum: 500,
    description: 'Architect Pro (reduced) fee',
    savings: '2% discount',
  },
  escrow: {
    percentage: 1.0,
    maximum: 500,
    description: 'Escrow processing fee',
  },
} as const;

/**
 * Product Categories for Navigation
 */
export const PRODUCT_NAVIGATION = [
  {
    category: 'PM Staffing',
    slug: 'pm-staffing',
    description: 'Professional project management services',
    icon: '📊',
  },
  {
    category: 'Marketplace',
    slug: 'marketplace',
    description: 'Contractor listings and lead generation',
    icon: '🏪',
  },
  {
    category: 'Professional',
    slug: 'professional',
    description: 'Specialized tools for professionals',
    icon: '👨‍💼',
  },
  {
    category: 'Marketing',
    slug: 'marketing',
    description: 'Complete marketing suite',
    icon: '📈',
  },
  {
    category: 'Permits',
    slug: 'permits',
    description: 'Permit processing services',
    icon: '📋',
  },
  {
    category: 'Add-Ons',
    slug: 'add-ons',
    description: 'Additional services and features',
    icon: '🔧',
  },
] as const;

/**
 * Currency Formatting
 */
export const CURRENCY_CONFIG = {
  currency: 'USD',
  locale: 'en-US',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
} as const;
