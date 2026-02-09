/**
 * Kealee Platform — Stripe Product Catalog
 *
 * All products and prices for every app on the platform.
 * Use syncAllProducts() to push to Stripe, or reference the catalog
 * for checkout sessions and subscription management.
 */

export type PriceInterval = 'month' | 'year' | 'one_time';

export interface ProductPrice {
  nickname: string;
  unitAmount: number; // cents
  currency: string;
  interval: PriceInterval;
}

export interface ProductDefinition {
  key: string;
  name: string;
  description: string;
  category: string;
  prices: ProductPrice[];
  features: string[];
  metadata: Record<string, string>;
}

// ============================================================================
// PM SERVICES (Ops Services) — 4 packages
// ============================================================================

const pmServices: ProductDefinition[] = [
  {
    key: 'pm-essential',
    name: 'PM Essential',
    description: 'Timeline & task management, document organization, weekly check-ins',
    category: 'pm_services',
    prices: [
      { nickname: 'PM Essential Monthly', unitAmount: 175000, currency: 'usd', interval: 'month' },
      { nickname: 'PM Essential Annual', unitAmount: 1680000, currency: 'usd', interval: 'year' },
    ],
    features: ['Timeline & task management', 'Document organization', 'Weekly check-ins'],
    metadata: { tier: 'A', app: 'ops-services' },
  },
  {
    key: 'pm-professional',
    name: 'PM Professional',
    description: 'Contractor coordination, budget tracking, site visits',
    category: 'pm_services',
    prices: [
      { nickname: 'PM Professional Monthly', unitAmount: 375000, currency: 'usd', interval: 'month' },
      { nickname: 'PM Professional Annual', unitAmount: 3600000, currency: 'usd', interval: 'year' },
    ],
    features: ['Everything in Essential', 'Contractor coordination', 'Budget tracking', 'Site visits'],
    metadata: { tier: 'B', app: 'ops-services' },
  },
  {
    key: 'pm-premium',
    name: 'PM Premium',
    description: 'Full PM oversight with permit management and inspections',
    category: 'pm_services',
    prices: [
      { nickname: 'PM Premium Monthly', unitAmount: 950000, currency: 'usd', interval: 'month' },
      { nickname: 'PM Premium Annual', unitAmount: 9120000, currency: 'usd', interval: 'year' },
    ],
    features: ['Everything in Professional', 'Permit management', 'Inspection coordination', 'Full contractor oversight'],
    metadata: { tier: 'C', app: 'ops-services' },
  },
  {
    key: 'pm-white-glove',
    name: 'PM White Glove',
    description: 'Complete hands-off project management with contractor hiring and payments',
    category: 'pm_services',
    prices: [
      { nickname: 'PM White Glove Monthly', unitAmount: 1650000, currency: 'usd', interval: 'month' },
      { nickname: 'PM White Glove Annual', unitAmount: 15840000, currency: 'usd', interval: 'year' },
    ],
    features: ['Everything in Premium', 'We hire contractors', 'Handle all payments', 'Complete hands-off management'],
    metadata: { tier: 'D', app: 'ops-services' },
  },
];

// ============================================================================
// ARCHITECTURE SERVICES — 5 products
// ============================================================================

const architectureServices: ProductDefinition[] = [
  {
    key: 'arch-conceptual-design',
    name: 'Conceptual Design Package',
    description: 'Initial design concepts, moodboards, space planning',
    category: 'architecture',
    prices: [
      { nickname: 'Conceptual Design', unitAmount: 350000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Design concepts', 'Moodboards', 'Space planning', '2 revision rounds'],
    metadata: { app: 'architect' },
  },
  {
    key: 'arch-schematic-design',
    name: 'Schematic Design Package',
    description: 'Floor plans, elevations, 3D visualizations',
    category: 'architecture',
    prices: [
      { nickname: 'Schematic Design', unitAmount: 750000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Floor plans', 'Elevations', '3D visualizations', 'Material selections'],
    metadata: { app: 'architect' },
  },
  {
    key: 'arch-construction-docs',
    name: 'Construction Documents',
    description: 'Full construction-ready documentation set',
    category: 'architecture',
    prices: [
      { nickname: 'Construction Documents', unitAmount: 1500000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Permit-ready drawings', 'Structural coordination', 'MEP coordination', 'Specifications'],
    metadata: { app: 'architect' },
  },
  {
    key: 'arch-pro-subscription',
    name: 'Architect Pro Subscription',
    description: 'Pro tools for architects: unlimited uploads, BIM, reduced fees',
    category: 'architecture',
    prices: [
      { nickname: 'Architect Pro Monthly', unitAmount: 9900, currency: 'usd', interval: 'month' },
      { nickname: 'Architect Pro Annual', unitAmount: 95000, currency: 'usd', interval: 'year' },
    ],
    features: ['Unlimited project uploads', 'Advanced BIM integration', 'Version control', 'PE stamp workflow', 'Priority review', 'Reduced platform fees (3%)'],
    metadata: { app: 'architect' },
  },
  {
    key: 'arch-pe-stamp-review',
    name: 'PE Stamp Review',
    description: 'Professional engineer stamp and review service',
    category: 'architecture',
    prices: [
      { nickname: 'PE Stamp Review', unitAmount: 250000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Licensed PE review', 'Structural verification', 'Stamped drawings', '48-hour turnaround'],
    metadata: { app: 'architect' },
  },
];

// ============================================================================
// PROJECT OWNER SERVICES — 5 products
// ============================================================================

const projectOwnerServices: ProductDefinition[] = [
  {
    key: 'owner-basic',
    name: 'Owner Basic',
    description: 'Basic project visibility and milestone tracking',
    category: 'project_owner',
    prices: [
      { nickname: 'Owner Basic Monthly', unitAmount: 4900, currency: 'usd', interval: 'month' },
      { nickname: 'Owner Basic Annual', unitAmount: 47000, currency: 'usd', interval: 'year' },
    ],
    features: ['Project dashboard', 'Milestone tracking', 'Document access', 'Basic reporting'],
    metadata: { app: 'project-owner' },
  },
  {
    key: 'owner-standard',
    name: 'Owner Standard',
    description: 'Enhanced visibility with approval workflows',
    category: 'project_owner',
    prices: [
      { nickname: 'Owner Standard Monthly', unitAmount: 14900, currency: 'usd', interval: 'month' },
      { nickname: 'Owner Standard Annual', unitAmount: 143000, currency: 'usd', interval: 'year' },
    ],
    features: ['Everything in Basic', 'Approval workflows', 'Budget visibility', 'Photo documentation', 'Weekly reports'],
    metadata: { app: 'project-owner' },
  },
  {
    key: 'owner-premium',
    name: 'Owner Premium',
    description: 'Full transparency with financial oversight and analytics',
    category: 'project_owner',
    prices: [
      { nickname: 'Owner Premium Monthly', unitAmount: 29900, currency: 'usd', interval: 'month' },
      { nickname: 'Owner Premium Annual', unitAmount: 287000, currency: 'usd', interval: 'year' },
    ],
    features: ['Everything in Standard', 'Financial analytics', 'Change order management', 'Contractor evaluations', 'Priority support'],
    metadata: { app: 'project-owner' },
  },
  {
    key: 'owner-escrow-fee',
    name: 'Escrow Management Fee',
    description: 'Per-project escrow account management',
    category: 'project_owner',
    prices: [
      { nickname: 'Escrow Setup Fee', unitAmount: 50000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Dedicated escrow account', 'Milestone-based releases', 'Holdback management', 'Financial reporting'],
    metadata: { app: 'project-owner', type: 'escrow' },
  },
  {
    key: 'owner-consultation',
    name: "Owner's Rep Consultation",
    description: 'One-time project consultation with experienced PM',
    category: 'project_owner',
    prices: [
      { nickname: 'PM Consultation (1hr)', unitAmount: 25000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['1-hour video consultation', 'Project assessment', 'Budget review', 'Written recommendations'],
    metadata: { app: 'project-owner' },
  },
];

// ============================================================================
// MARKETPLACE — 3 tiers + listing fees
// ============================================================================

const marketplaceServices: ProductDefinition[] = [
  {
    key: 'marketplace-basic',
    name: 'Marketplace Basic Listing',
    description: 'Basic contractor profile and limited leads',
    category: 'marketplace',
    prices: [
      { nickname: 'Marketplace Basic Monthly', unitAmount: 4900, currency: 'usd', interval: 'month' },
      { nickname: 'Marketplace Basic Annual', unitAmount: 47000, currency: 'usd', interval: 'year' },
    ],
    features: ['Basic profile listing', 'Up to 5 project photos', '3 leads/month', 'Basic analytics', 'Community forum'],
    metadata: { app: 'marketplace', tier: 'basic', leadLimit: '3', photoLimit: '5' },
  },
  {
    key: 'marketplace-professional',
    name: 'Marketplace Professional',
    description: 'Featured profile with more leads and verified badge',
    category: 'marketplace',
    prices: [
      { nickname: 'Marketplace Pro Monthly', unitAmount: 14900, currency: 'usd', interval: 'month' },
      { nickname: 'Marketplace Pro Annual', unitAmount: 143000, currency: 'usd', interval: 'year' },
    ],
    features: ['Featured listing', 'Unlimited photos & portfolio', '15 leads/month', 'Advanced analytics', 'Priority support', 'Verified badge'],
    metadata: { app: 'marketplace', tier: 'professional', leadLimit: '15', photoLimit: '-1' },
  },
  {
    key: 'marketplace-premium',
    name: 'Marketplace Premium',
    description: 'Top-tier placement with unlimited leads and background check',
    category: 'marketplace',
    prices: [
      { nickname: 'Marketplace Premium Monthly', unitAmount: 29900, currency: 'usd', interval: 'month' },
      { nickname: 'Marketplace Premium Annual', unitAmount: 287000, currency: 'usd', interval: 'year' },
    ],
    features: ['Top-tier placement', 'Unlimited leads & gallery', 'Background check', 'License verification', 'Premium badge', 'SEO optimization', 'Custom landing page', 'API access'],
    metadata: { app: 'marketplace', tier: 'premium', leadLimit: '-1', photoLimit: '-1' },
  },
  {
    key: 'marketplace-featured-boost',
    name: 'Marketplace Featured Boost',
    description: 'Temporary boost to top of search results',
    category: 'marketplace',
    prices: [
      { nickname: 'Featured Boost (7 days)', unitAmount: 4900, currency: 'usd', interval: 'one_time' },
    ],
    features: ['7-day featured placement', 'Highlighted in search results', 'Email promotion to homeowners'],
    metadata: { app: 'marketplace' },
  },
];

// ============================================================================
// PERMITS & INSPECTIONS — 5 products
// ============================================================================

const permitsServices: ProductDefinition[] = [
  {
    key: 'permit-pro',
    name: 'Permit Pro Monthly',
    description: 'Unlimited permit applications with priority processing',
    category: 'permits',
    prices: [
      { nickname: 'Permit Pro Monthly', unitAmount: 29900, currency: 'usd', interval: 'month' },
      { nickname: 'Permit Pro Annual', unitAmount: 287000, currency: 'usd', interval: 'year' },
    ],
    features: ['Unlimited permit applications', 'Priority processing', 'Automated compliance checks', 'Jurisdiction integration', 'Real-time tracking', 'Inspection scheduling'],
    metadata: { app: 'permits-inspections' },
  },
  {
    key: 'permit-acceleration',
    name: 'Permit Acceleration',
    description: 'Expedite a single permit application',
    category: 'permits',
    prices: [
      { nickname: 'Permit Acceleration', unitAmount: 29900, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Expedited review', 'Direct jurisdiction liaison', 'Status notifications', 'Document preparation'],
    metadata: { app: 'permits-inspections' },
  },
  {
    key: 'permit-inspection-package',
    name: 'Inspection Coordination Package',
    description: 'Pre-inspection prep, scheduling, and documentation',
    category: 'permits',
    prices: [
      { nickname: 'Inspection Package', unitAmount: 49900, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Pre-inspection checklist', 'Inspector scheduling', 'Photo documentation', 'Deficiency tracking', 'Re-inspection coordination'],
    metadata: { app: 'permits-inspections' },
  },
  {
    key: 'permit-compliance-audit',
    name: 'Code Compliance Audit',
    description: 'Comprehensive code compliance review for your project',
    category: 'permits',
    prices: [
      { nickname: 'Compliance Audit', unitAmount: 75000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Full code review', 'Zoning verification', 'ADA compliance check', 'Fire safety review', 'Written report'],
    metadata: { app: 'permits-inspections' },
  },
  {
    key: 'permit-jurisdiction-sub',
    name: 'Jurisdiction Subscription',
    description: 'Ongoing jurisdiction monitoring and updates',
    category: 'permits',
    prices: [
      { nickname: 'Jurisdiction Sub Monthly', unitAmount: 9900, currency: 'usd', interval: 'month' },
    ],
    features: ['Code change alerts', 'Fee schedule updates', 'Process change notifications', 'Jurisdiction-specific forms'],
    metadata: { app: 'permits-inspections' },
  },
];

// ============================================================================
// OPS SERVICES (GC/Contractor) — 5 products
// ============================================================================

const opsServices: ProductDefinition[] = [
  {
    key: 'ops-project-setup',
    name: 'Project Setup Service',
    description: 'Professional project setup and scheduling',
    category: 'ops_services',
    prices: [
      { nickname: 'Project Setup', unitAmount: 99900, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Scope definition', 'Schedule creation', 'Budget framework', 'Contractor pre-qualification'],
    metadata: { app: 'ops-services' },
  },
  {
    key: 'ops-site-visit',
    name: 'Site Visit',
    description: 'Professional on-site inspection and reporting',
    category: 'ops_services',
    prices: [
      { nickname: 'Site Visit', unitAmount: 35000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['On-site inspection', 'Photo documentation', 'Progress verification', 'Written report'],
    metadata: { app: 'ops-services' },
  },
  {
    key: 'ops-change-order-review',
    name: 'Change Order Review',
    description: 'Expert review and negotiation of change orders',
    category: 'ops_services',
    prices: [
      { nickname: 'Change Order Review', unitAmount: 25000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Cost analysis', 'Schedule impact assessment', 'Negotiation support', 'Documentation'],
    metadata: { app: 'ops-services' },
  },
  {
    key: 'ops-closeout-management',
    name: 'Project Closeout Management',
    description: 'End-to-end project closeout coordination',
    category: 'ops_services',
    prices: [
      { nickname: 'Closeout Management', unitAmount: 150000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Punch list coordination', 'Final inspections', 'Warranty documentation', 'Lien waiver collection', 'Certificate of occupancy'],
    metadata: { app: 'ops-services' },
  },
  {
    key: 'ops-safety-audit',
    name: 'Safety Compliance Audit',
    description: 'OSHA compliance review and safety plan',
    category: 'ops_services',
    prices: [
      { nickname: 'Safety Audit', unitAmount: 75000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['OSHA compliance check', 'Safety plan review', 'Hazard identification', 'Corrective actions report'],
    metadata: { app: 'ops-services' },
  },
];

// ============================================================================
// ESTIMATION TOOL — 4 products
// ============================================================================

const estimationServices: ProductDefinition[] = [
  {
    key: 'estimation-basic',
    name: 'Basic Estimate',
    description: 'AI-powered preliminary cost estimate',
    category: 'estimation',
    prices: [
      { nickname: 'Basic Estimate', unitAmount: 9900, currency: 'usd', interval: 'one_time' },
    ],
    features: ['AI-generated estimate', 'CSI division breakdown', 'Regional cost factors', 'PDF report'],
    metadata: { app: 'estimation-tool', tier: 'basic' },
  },
  {
    key: 'estimation-detailed',
    name: 'Detailed Estimate',
    description: 'Comprehensive line-item cost estimate',
    category: 'estimation',
    prices: [
      { nickname: 'Detailed Estimate', unitAmount: 29900, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Line-item breakdown', 'Material takeoffs', 'Labor calculations', 'Equipment costs', 'Contingency analysis'],
    metadata: { app: 'estimation-tool', tier: 'detailed' },
  },
  {
    key: 'estimation-pro-subscription',
    name: 'Estimation Pro',
    description: 'Unlimited estimates with advanced features',
    category: 'estimation',
    prices: [
      { nickname: 'Estimation Pro Monthly', unitAmount: 19900, currency: 'usd', interval: 'month' },
      { nickname: 'Estimation Pro Annual', unitAmount: 191000, currency: 'usd', interval: 'year' },
    ],
    features: ['Unlimited estimates', 'Custom assemblies', 'Historical data access', 'RSMeans integration', 'Value engineering suggestions', 'Excel/PDF export'],
    metadata: { app: 'estimation-tool', tier: 'pro' },
  },
  {
    key: 'estimation-value-engineering',
    name: 'Value Engineering Report',
    description: 'AI-powered cost optimization analysis',
    category: 'estimation',
    prices: [
      { nickname: 'Value Engineering Report', unitAmount: 49900, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Cost optimization analysis', 'Material substitutions', 'Method alternatives', 'Savings projections', 'Implementation roadmap'],
    metadata: { app: 'estimation-tool' },
  },
];

// ============================================================================
// ADD-ON SERVICES — 4 products
// ============================================================================

const addOnServices: ProductDefinition[] = [
  {
    key: 'addon-api-access',
    name: 'API Access - Professional',
    description: 'Full REST and GraphQL API access',
    category: 'addon',
    prices: [
      { nickname: 'API Access Monthly', unitAmount: 49900, currency: 'usd', interval: 'month' },
      { nickname: 'API Access Annual', unitAmount: 479000, currency: 'usd', interval: 'year' },
    ],
    features: ['Full REST API', 'GraphQL endpoint', 'Webhook support', '10,000 requests/day', 'Dedicated API support'],
    metadata: { rateLimit: '10000' },
  },
  {
    key: 'addon-white-label',
    name: 'White-Label Reporting',
    description: 'Custom-branded reports and dashboards',
    category: 'addon',
    prices: [
      { nickname: 'White-Label Monthly', unitAmount: 19900, currency: 'usd', interval: 'month' },
      { nickname: 'White-Label Annual', unitAmount: 191000, currency: 'usd', interval: 'year' },
    ],
    features: ['Custom branded reports', 'Remove Kealee branding', 'Custom logo and colors', 'Client-facing dashboards'],
    metadata: {},
  },
  {
    key: 'addon-engineering',
    name: 'Engineering Review',
    description: 'Structural or MEP engineering review',
    category: 'addon',
    prices: [
      { nickname: 'Engineering Review', unitAmount: 120000, currency: 'usd', interval: 'one_time' },
    ],
    features: ['Licensed engineer review', 'Structural analysis', 'Load calculations', 'Stamped documents'],
    metadata: {},
  },
  {
    key: 'addon-priority-support',
    name: 'Priority Support',
    description: 'Dedicated support with SLA guarantees',
    category: 'addon',
    prices: [
      { nickname: 'Priority Support Monthly', unitAmount: 9900, currency: 'usd', interval: 'month' },
    ],
    features: ['4-hour response SLA', 'Dedicated account manager', 'Phone support', 'Priority bug fixes'],
    metadata: {},
  },
];

// ============================================================================
// PLATFORM FEES
// ============================================================================

export const PLATFORM_FEES = {
  standard: { percentage: 3.0, fixed: 0 },
  escrow: { percentage: 1.0, maximum: 50000 }, // $500 max in cents
  milestone: { percentage: 2.9, fixed: 30 }, // 2.9% + $0.30
  architect: { percentage: 5.0, minimum: 50000 }, // $500 min in cents
  architectPro: { percentage: 3.0, minimum: 50000 },
} as const;

// ============================================================================
// COMBINED CATALOG
// ============================================================================

export const PRODUCT_CATALOG: ProductDefinition[] = [
  ...pmServices,
  ...architectureServices,
  ...projectOwnerServices,
  ...marketplaceServices,
  ...permitsServices,
  ...opsServices,
  ...estimationServices,
  ...addOnServices,
];

// ============================================================================
// HELPERS
// ============================================================================

/** Get all products in a category */
export function getProductsByCategory(category: string): ProductDefinition[] {
  return PRODUCT_CATALOG.filter((p) => p.category === category);
}

/** Get a single product by key */
export function getProductByKey(key: string): ProductDefinition | undefined {
  return PRODUCT_CATALOG.find((p) => p.key === key);
}

/** Get all subscription products (those with recurring prices) */
export function getSubscriptionProducts(): ProductDefinition[] {
  return PRODUCT_CATALOG.filter((p) =>
    p.prices.some((pr) => pr.interval !== 'one_time')
  );
}

/** Get all one-time purchase products */
export function getOneTimeProducts(): ProductDefinition[] {
  return PRODUCT_CATALOG.filter((p) =>
    p.prices.every((pr) => pr.interval === 'one_time')
  );
}

/** Calculate platform fee for a given amount and type */
export function calculatePlatformFee(
  amountCents: number,
  feeType: keyof typeof PLATFORM_FEES
): number {
  const fee = PLATFORM_FEES[feeType];
  let total = Math.round(amountCents * (fee.percentage / 100));

  if ('fixed' in fee) {
    total += fee.fixed;
  }
  if ('maximum' in fee) {
    total = Math.min(total, fee.maximum);
  }
  if ('minimum' in fee) {
    total = Math.max(total, fee.minimum);
  }

  return total;
}

/** Format price for display */
export function formatPrice(amountCents: number): string {
  return `$${(amountCents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Total product count */
export const TOTAL_PRODUCTS = PRODUCT_CATALOG.length;
