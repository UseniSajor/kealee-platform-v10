/**
 * Kealee Software-Only Package Tiers
 * Feature gating definitions and usage limits.
 *
 * See: _docs/Kealee-Software-Only-Packages.md
 */

// ── Types ───────────────────────────────────────────────────────

export type SoftwareTier = 'S1' | 'S2' | 'S3' | 'S4';
export type PackageType = 'SOFTWARE_ONLY' | 'PM_SERVICE';

export interface TierConfig {
  tier: SoftwareTier;
  name: string;
  tagline: string;
  features: string[];
  featureCount: number;
  pricingTiers: {
    label: string;
    monthlyPrice: number;
    annualPrice: number; // per month (20% off)
    maxProjects: number;
    maxUsers: number;
    stripeLookupKey: string;
    stripeAnnualLookupKey: string;
  }[];
  support: string;
  onboarding: string;
}

export interface UsageLimits {
  maxProjects: number;
  maxUsers: number;
  tier: SoftwareTier;
}

// ── Feature Keys ────────────────────────────────────────────────

export const FEATURE_KEYS = {
  // S1 (8 features)
  BID_TRACKER: 'bid-tracker',
  DAILY_REPORTS: 'daily-reports',
  PUNCH_LIST: 'punch-list',
  PROGRESS_REPORTS: 'progress-reports',
  MOBILE_FIELD_ACCESS: 'mobile-field-access',
  CHANGE_ORDER_TRACKING: 'change-order-tracking',
  CONTRACT_MANAGER: 'contract-manager',
  SAFETY_MANAGER: 'safety-manager',

  // S2 additional (12 features → 20 total)
  OWNER_DASHBOARD: 'owner-dashboard',
  SCHEDULE_MANAGER: 'schedule-manager',
  LIEN_WAIVER_WORKFLOW: 'lien-waiver-workflow',
  BUDGET_REPORTS: 'budget-reports',
  SCOPE_MATRIX: 'scope-matrix',
  PERMIT_WIZARD: 'permit-wizard',
  INSPECTION_SCHEDULER: 'inspection-scheduler',
  RFI_PORTAL: 'rfi-portal',
  SUBMITTAL_MANAGER: 'submittal-manager',
  COI_TRACKER: 'coi-tracker',
  QC_INSPECTIONS: 'qc-inspections',
  DOCUMENT_CONTROL: 'document-control',

  // S3 additional (15 features → 35 total)
  AIA_PAY_APPLICATIONS: 'aia-pay-applications',
  RETENTION_MANAGER: 'retention-manager',
  SUB_PREQUALIFICATION: 'sub-prequalification',
  LOOK_AHEAD_SCHEDULER: 'look-ahead-scheduler',
  BID_BROADCAST: 'bid-broadcast',
  CASH_FLOW_DASHBOARD: 'cash-flow-dashboard',
  JOB_COST_REPORTS: 'job-cost-reports',
  BACK_CHARGE_MANAGER: 'back-charge-manager',
  SUB_RATINGS: 'sub-ratings',
  SUB_PAY_APP_REVIEW: 'sub-pay-app-review',
  AI_TAKEOFF_ANALYSIS: 'ai-takeoff-analysis',
  LABOR_ANALYTICS: 'labor-analytics',
  AS_BUILT_MANAGER: 'as-built-manager',
  SELECTION_MANAGER: 'selection-manager',
  WARRANTY_PORTAL: 'warranty-portal',

  // S4 additional (15 features → 50 total)
  SUPPLIER_CONNECT: 'supplier-connect',
  MEETING_MINUTES: 'meeting-minutes',
  WEATHER_TRACKING: 'weather-tracking',
  AP_MANAGER: 'ap-manager',
  CODE_MONITOR: 'code-monitor',
  COST_INTELLIGENCE: 'cost-intelligence',
  LICENSE_MANAGER: 'license-manager',
  AI_SCOPE_ANALYZER: 'ai-scope-analyzer',
  BID_ANALYTICS: 'bid-analytics',
  BONDING_DASHBOARD: 'bonding-dashboard',
  TAX_MANAGER: 'tax-manager',
  CAPACITY_TRACKER: 'capacity-tracker',
  ENVIRONMENTAL_TRACKER: 'environmental-tracker',
  ISSUE_TRACKER: 'issue-tracker',
  INTEGRATION_HUB_API: 'integration-hub-api',
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

// ── Feature → Tier Mapping ──────────────────────────────────────

const S1_FEATURES: FeatureKey[] = [
  FEATURE_KEYS.BID_TRACKER,
  FEATURE_KEYS.DAILY_REPORTS,
  FEATURE_KEYS.PUNCH_LIST,
  FEATURE_KEYS.PROGRESS_REPORTS,
  FEATURE_KEYS.MOBILE_FIELD_ACCESS,
  FEATURE_KEYS.CHANGE_ORDER_TRACKING,
  FEATURE_KEYS.CONTRACT_MANAGER,
  FEATURE_KEYS.SAFETY_MANAGER,
];

const S2_FEATURES: FeatureKey[] = [
  ...S1_FEATURES,
  FEATURE_KEYS.OWNER_DASHBOARD,
  FEATURE_KEYS.SCHEDULE_MANAGER,
  FEATURE_KEYS.LIEN_WAIVER_WORKFLOW,
  FEATURE_KEYS.BUDGET_REPORTS,
  FEATURE_KEYS.SCOPE_MATRIX,
  FEATURE_KEYS.PERMIT_WIZARD,
  FEATURE_KEYS.INSPECTION_SCHEDULER,
  FEATURE_KEYS.RFI_PORTAL,
  FEATURE_KEYS.SUBMITTAL_MANAGER,
  FEATURE_KEYS.COI_TRACKER,
  FEATURE_KEYS.QC_INSPECTIONS,
  FEATURE_KEYS.DOCUMENT_CONTROL,
];

const S3_FEATURES: FeatureKey[] = [
  ...S2_FEATURES,
  FEATURE_KEYS.AIA_PAY_APPLICATIONS,
  FEATURE_KEYS.RETENTION_MANAGER,
  FEATURE_KEYS.SUB_PREQUALIFICATION,
  FEATURE_KEYS.LOOK_AHEAD_SCHEDULER,
  FEATURE_KEYS.BID_BROADCAST,
  FEATURE_KEYS.CASH_FLOW_DASHBOARD,
  FEATURE_KEYS.JOB_COST_REPORTS,
  FEATURE_KEYS.BACK_CHARGE_MANAGER,
  FEATURE_KEYS.SUB_RATINGS,
  FEATURE_KEYS.SUB_PAY_APP_REVIEW,
  FEATURE_KEYS.AI_TAKEOFF_ANALYSIS,
  FEATURE_KEYS.LABOR_ANALYTICS,
  FEATURE_KEYS.AS_BUILT_MANAGER,
  FEATURE_KEYS.SELECTION_MANAGER,
  FEATURE_KEYS.WARRANTY_PORTAL,
];

const S4_FEATURES: FeatureKey[] = [
  ...S3_FEATURES,
  FEATURE_KEYS.SUPPLIER_CONNECT,
  FEATURE_KEYS.MEETING_MINUTES,
  FEATURE_KEYS.WEATHER_TRACKING,
  FEATURE_KEYS.AP_MANAGER,
  FEATURE_KEYS.CODE_MONITOR,
  FEATURE_KEYS.COST_INTELLIGENCE,
  FEATURE_KEYS.LICENSE_MANAGER,
  FEATURE_KEYS.AI_SCOPE_ANALYZER,
  FEATURE_KEYS.BID_ANALYTICS,
  FEATURE_KEYS.BONDING_DASHBOARD,
  FEATURE_KEYS.TAX_MANAGER,
  FEATURE_KEYS.CAPACITY_TRACKER,
  FEATURE_KEYS.ENVIRONMENTAL_TRACKER,
  FEATURE_KEYS.ISSUE_TRACKER,
  FEATURE_KEYS.INTEGRATION_HUB_API,
];

/** All features available per tier */
export const TIER_FEATURES: Record<SoftwareTier, FeatureKey[]> = {
  S1: S1_FEATURES,
  S2: S2_FEATURES,
  S3: S3_FEATURES,
  S4: S4_FEATURES,
};

// ── Tier Configurations ─────────────────────────────────────────

export const SOFTWARE_TIERS: Record<SoftwareTier, TierConfig> = {
  S1: {
    tier: 'S1',
    name: 'Starter',
    tagline: 'Essential tools for solo GCs and small subs',
    featureCount: 8,
    features: [
      'Bid Tracker', 'Daily Reports', 'Punch List', 'Progress Reports',
      'Mobile Field Access', 'Change Order Tracking', 'Contract Manager', 'Safety Manager',
    ],
    pricingTiers: [
      { label: 'S1 Basic', monthlyPrice: 29, annualPrice: 23, maxProjects: 1, maxUsers: 1, stripeLookupKey: 'software-s1-starter-basic-monthly', stripeAnnualLookupKey: 'software-s1-starter-basic-annual' },
      { label: 'S1 Standard', monthlyPrice: 49, annualPrice: 39, maxProjects: 2, maxUsers: 1, stripeLookupKey: 'software-s1-starter-standard-monthly', stripeAnnualLookupKey: 'software-s1-starter-standard-annual' },
      { label: 'S1 Plus', monthlyPrice: 79, annualPrice: 63, maxProjects: 3, maxUsers: 1, stripeLookupKey: 'software-s1-starter-plus-monthly', stripeAnnualLookupKey: 'software-s1-starter-plus-annual' },
    ],
    support: 'Help center + community forum',
    onboarding: 'Self-serve (video tutorials + templates)',
  },
  S2: {
    tier: 'S2',
    name: 'Builder',
    tagline: 'Complete project management for growing GCs',
    featureCount: 20,
    features: [], // Populated below (can't self-reference during const declaration)
    pricingTiers: [
      { label: 'S2 Basic', monthlyPrice: 149, annualPrice: 119, maxProjects: 5, maxUsers: 3, stripeLookupKey: 'software-s2-builder-basic-monthly', stripeAnnualLookupKey: 'software-s2-builder-basic-annual' },
      { label: 'S2 Standard', monthlyPrice: 249, annualPrice: 199, maxProjects: 7, maxUsers: 4, stripeLookupKey: 'software-s2-builder-standard-monthly', stripeAnnualLookupKey: 'software-s2-builder-standard-annual' },
      { label: 'S2 Plus', monthlyPrice: 349, annualPrice: 279, maxProjects: 10, maxUsers: 5, stripeLookupKey: 'software-s2-builder-plus-monthly', stripeAnnualLookupKey: 'software-s2-builder-plus-annual' },
    ],
    support: 'Email support (48hr response)',
    onboarding: 'Self-serve + 1 onboarding call (30 min)',
  },
  S3: {
    tier: 'S3',
    name: 'Pro',
    tagline: 'Advanced tools with AI for mid-size firms',
    featureCount: 35,
    features: [
      'AIA Pay Applications', 'Retention Manager', 'Sub Prequalification',
      'Look-Ahead Scheduler', 'Bid Broadcast', 'Cash Flow Dashboard',
      'Job Cost Reports', 'Back-Charge Manager', 'Sub Ratings',
      'Sub Pay App Review', 'AI Takeoff Analysis', 'Labor Analytics',
      'As-Built Manager', 'Selection Manager', 'Warranty Portal',
    ],
    pricingTiers: [
      { label: 'S3 Basic', monthlyPrice: 599, annualPrice: 479, maxProjects: 15, maxUsers: 8, stripeLookupKey: 'software-s3-pro-basic-monthly', stripeAnnualLookupKey: 'software-s3-pro-basic-annual' },
      { label: 'S3 Standard', monthlyPrice: 899, annualPrice: 719, maxProjects: 20, maxUsers: 10, stripeLookupKey: 'software-s3-pro-standard-monthly', stripeAnnualLookupKey: 'software-s3-pro-standard-annual' },
      { label: 'S3 Plus', monthlyPrice: 1299, annualPrice: 1039, maxProjects: 30, maxUsers: 15, stripeLookupKey: 'software-s3-pro-plus-monthly', stripeAnnualLookupKey: 'software-s3-pro-plus-annual' },
    ],
    support: 'Priority email + chat (24hr response)',
    onboarding: '2 onboarding calls + data migration assistance',
  },
  S4: {
    tier: 'S4',
    name: 'Enterprise',
    tagline: 'Full platform access for large operations',
    featureCount: 50,
    features: [
      'Supplier Connect', 'Meeting Minutes', 'Weather Tracking', 'AP Manager',
      'Code Monitor', 'Cost Intelligence', 'License Manager', 'AI Scope Analyzer',
      'Bid Analytics', 'Bonding Dashboard', 'Tax Manager', 'Capacity Tracker',
      'Environmental Tracker', 'Issue Tracker', 'Integration Hub / API',
    ],
    pricingTiers: [
      { label: 'S4 Basic', monthlyPrice: 1999, annualPrice: 1599, maxProjects: 50, maxUsers: 25, stripeLookupKey: 'software-s4-enterprise-basic-monthly', stripeAnnualLookupKey: 'software-s4-enterprise-basic-annual' },
      { label: 'S4 Standard', monthlyPrice: 3499, annualPrice: 2799, maxProjects: 75, maxUsers: 35, stripeLookupKey: 'software-s4-enterprise-standard-monthly', stripeAnnualLookupKey: 'software-s4-enterprise-standard-annual' },
      { label: 'S4 Plus', monthlyPrice: 4999, annualPrice: 3999, maxProjects: 100, maxUsers: 50, stripeLookupKey: 'software-s4-enterprise-plus-monthly', stripeAnnualLookupKey: 'software-s4-enterprise-plus-annual' },
    ],
    support: 'Dedicated account manager + phone support',
    onboarding: 'Full onboarding program + custom training + data migration',
  },
};

// Fix S2 features (can't self-reference during object literal)
SOFTWARE_TIERS.S2.features = [
  ...SOFTWARE_TIERS.S1.features,
  'Owner Dashboard', 'Schedule Manager', 'Lien Waiver Workflow', 'Budget Reports',
  'Scope Matrix', 'Permit Wizard', 'Inspection Scheduler', 'RFI Portal',
  'Submittal Manager', 'COI Tracker', 'QC Inspections', 'Document Control',
];

// ── Helper Functions ────────────────────────────────────────────

/**
 * Check if a specific feature is available for a given tier.
 */
export function hasFeature(tier: SoftwareTier, featureKey: FeatureKey): boolean {
  return TIER_FEATURES[tier].includes(featureKey);
}

/**
 * Get the minimum tier required for a feature.
 */
export function getMinimumTier(featureKey: FeatureKey): SoftwareTier | null {
  const tiers: SoftwareTier[] = ['S1', 'S2', 'S3', 'S4'];
  for (const tier of tiers) {
    if (TIER_FEATURES[tier].includes(featureKey)) return tier;
  }
  return null;
}

/**
 * Get all features for a tier (including lower tier features).
 */
export function getTierFeatures(tier: SoftwareTier): FeatureKey[] {
  return [...TIER_FEATURES[tier]];
}

/**
 * Get features that are locked for a tier (available in higher tiers).
 */
export function getLockedFeatures(tier: SoftwareTier): { feature: FeatureKey; requiredTier: SoftwareTier }[] {
  const available = new Set(TIER_FEATURES[tier]);
  const allFeatures = TIER_FEATURES.S4;
  const locked: { feature: FeatureKey; requiredTier: SoftwareTier }[] = [];

  for (const feature of allFeatures) {
    if (!available.has(feature)) {
      const requiredTier = getMinimumTier(feature);
      if (requiredTier) {
        locked.push({ feature, requiredTier });
      }
    }
  }

  return locked;
}

/**
 * Get usage limits for a specific pricing tier within a software tier.
 */
export function getUsageLimits(tier: SoftwareTier, pricingTierIndex: number): UsageLimits {
  const config = SOFTWARE_TIERS[tier];
  const pricing = config.pricingTiers[pricingTierIndex] ?? config.pricingTiers[0];
  return {
    maxProjects: pricing.maxProjects,
    maxUsers: pricing.maxUsers,
    tier,
  };
}

/**
 * Check if the user is approaching their limit (80% threshold).
 */
export function isApproachingLimit(current: number, max: number): boolean {
  if (max <= 0) return false; // unlimited
  return current >= Math.ceil(max * 0.8);
}

/**
 * Check if the user is at or over their limit.
 */
export function isAtLimit(current: number, max: number): boolean {
  if (max <= 0) return false; // unlimited
  return current >= max;
}

/**
 * Check if the user is hard-locked (over limit + 1).
 */
export function isHardLocked(current: number, max: number): boolean {
  if (max <= 0) return false; // unlimited
  return current > max;
}

// ── PM Service Tiers ────────────────────────────────────────────

export type PMServiceTier = 'PACKAGE_A' | 'PACKAGE_B' | 'PACKAGE_C' | 'PACKAGE_D';

export interface PMServiceConfig {
  tier: PMServiceTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  maxProjects: number | 'unlimited';
  hoursPerWeek: string;
  features: string[];
  support: string;
  maxProjectValue: number;       // in cents
  maxPortfolioValue: number;     // in cents
  siteVisitsPerMonth: number;
  tierLevel: string;
  marketplaceTransactionFee?: number;
}

export const PM_SERVICE_TIERS: Record<PMServiceTier, PMServiceConfig> = {
  PACKAGE_A: {
    tier: 'PACKAGE_A',
    name: 'Starter',
    monthlyPrice: 1750,
    annualPrice: Math.round(1750 * 0.85),
    maxProjects: 2,
    hoursPerWeek: '5-10',
    features: [
      '5-10 hours/week PM time', 'Up to 2 concurrent projects',
      'Email support (48hr response)', 'Monthly call', 'Weekly progress reports', 'Basic task tracking',
    ],
    support: 'Email 48hr, monthly call',
    maxProjectValue: 50000000,
    maxPortfolioValue: 100000000,
    siteVisitsPerMonth: 0,
    tierLevel: 'A',
  },
  PACKAGE_B: {
    tier: 'PACKAGE_B',
    name: 'Professional',
    monthlyPrice: 7850,
    annualPrice: Math.round(7850 * 0.85),
    maxProjects: 7,
    hoursPerWeek: '15-20',
    features: [
      '15-20 hours/week PM time', 'Up to 7 concurrent projects',
      'Priority email/phone support (24hr)', 'Weekly calls',
      'Contractor coordination', 'Permit management',
    ],
    support: 'Priority email/phone 24hr, weekly calls',
    maxProjectValue: 200000000,
    maxPortfolioValue: 1400000000,
    siteVisitsPerMonth: 0,
    tierLevel: 'B',
  },
  PACKAGE_C: {
    tier: 'PACKAGE_C',
    name: 'Premium',
    monthlyPrice: 17560,
    annualPrice: Math.round(17560 * 0.85),
    maxProjects: 15,
    hoursPerWeek: '30-40',
    features: [
      '30-40 hours/week PM time', 'Up to 15 concurrent projects',
      '24/7 priority support', 'Dedicated PM assigned', 'Daily progress reports',
      'Full contractor management', 'Budget optimization', 'Risk management',
      'Permit management', 'QA/QC observation', 'CO management', 'OAC meeting support',
      '4 site visits/month',
    ],
    support: '24/7 priority, dedicated PM',
    maxProjectValue: 500000000,
    maxPortfolioValue: 7500000000,
    siteVisitsPerMonth: 4,
    tierLevel: 'C',
    marketplaceTransactionFee: 0,
  },
  PACKAGE_D: {
    tier: 'PACKAGE_D',
    name: 'Enterprise',
    monthlyPrice: 112000,
    annualPrice: Math.round(112000 * 0.85),
    maxProjects: 15,
    hoursPerWeek: '40+',
    features: [
      '40+ hours/week PM time', 'Up to 15 projects (D1 Base)', 'Dedicated account manager',
      'Custom reporting', 'Strategic planning support', 'Multi-project coordination',
      'Executive-level insights', 'White-glove service', 'Custom integrations',
      '8 site visits/month',
    ],
    support: 'Dedicated account manager, 24/7',
    maxProjectValue: 1000000000,
    maxPortfolioValue: 15000000000,
    siteVisitsPerMonth: 8,
    tierLevel: 'D1',
  },
};

export const ENTERPRISE_SUB_TIERS = {
  D1: { name: 'D1 Base', projects: 15, monthlyPrice: 112000, maxProjectValue: 1000000000 },
  D2: { name: 'D2 Growth', projects: 17, monthlyPrice: 122000, maxProjectValue: 1000000000 },
  D3: { name: 'D3 Scale', projects: 20, monthlyPrice: 142000, maxProjectValue: 1000000000 },
  D4: { name: 'D4 Custom', projects: 999, monthlyPrice: 0, maxProjectValue: 9999999999 }, // custom pricing
};

// ---------------------------------------------------------------------------
// Add-On Packages
// ---------------------------------------------------------------------------

export interface AddOnConfig {
  id: string;
  name: string;
  tiers: { name: string; monthlyPrice: number; features: string[] }[];
  requiredPackage: string[]; // which PM packages can use this ('A','B','C','D') or ['*'] for standalone
  featureFlags: string[];
}

export const ADD_ON_PACKAGES: Record<string, AddOnConfig> = {
  FIELD_TOOLS: {
    id: 'field-tools',
    name: 'Field Tools Add-On',
    tiers: [
      { name: 'Basic', monthlyPrice: 500, features: ['Mobilization checklists', 'Field conflict reporter'] },
      { name: 'Pro', monthlyPrice: 1000, features: ['Mobilization checklists', 'Field conflict reporter', 'QA/QC observation tools', 'Photo documentation'] },
      { name: 'Enterprise', monthlyPrice: 1500, features: ['Mobilization checklists', 'Field conflict reporter', 'QA/QC observation tools', 'Photo documentation', 'Custom templates', 'API access'] },
    ],
    requiredPackage: ['A', 'B'],
    featureFlags: ['field.mobilization', 'field.conflicts', 'field.qaqc', 'field.photos'],
  },
  MULTIFAMILY_PREMIUM: {
    id: 'multifamily-premium',
    name: 'Multifamily Premium Add-On',
    tiers: [
      { name: 'Basic', monthlyPrice: 2000, features: ['Unit tracker', 'Lender draws'] },
      { name: 'Pro', monthlyPrice: 3500, features: ['Unit tracker', 'Lender draws', 'TCO management', 'Area phasing'] },
      { name: 'Enterprise', monthlyPrice: 5000, features: ['Unit tracker', 'Lender draws', 'TCO management', 'Area phasing', 'Custom unit types', 'Portfolio rollup'] },
    ],
    requiredPackage: ['C', 'D'],
    featureFlags: ['multifamily.units', 'multifamily.draws', 'multifamily.tco', 'multifamily.phasing'],
  },
  SAFETY_DOCS: {
    id: 'safety-docs',
    name: 'Safety Documentation Package',
    tiers: [
      { name: 'Basic', monthlyPrice: 295, features: ['JHA templates', 'Toolbox talk library'] },
      { name: 'Pro', monthlyPrice: 495, features: ['JHA templates', 'Toolbox talk library', 'OSHA logs', 'Incident reporting'] },
      { name: 'Enterprise', monthlyPrice: 595, features: ['JHA templates', 'Toolbox talk library', 'OSHA logs', 'Incident reporting', 'Safety analytics', 'Custom forms'] },
    ],
    requiredPackage: ['*'], // standalone
    featureFlags: ['safety.jha', 'safety.toolbox', 'safety.osha', 'safety.incidents'],
  },
  LENDER_REPORTING: {
    id: 'lender-reporting',
    name: 'Lender Reporting Service',
    tiers: [
      { name: 'Basic', monthlyPrice: 199, features: ['AIA G702/G703 generation'] },
      { name: 'Pro', monthlyPrice: 349, features: ['AIA G702/G703 generation', 'Draw request workflow'] },
      { name: 'Enterprise', monthlyPrice: 499, features: ['AIA G702/G703 generation', 'Draw request workflow', 'Lender portal view', 'Custom reports'] },
    ],
    requiredPackage: ['B', 'C', 'D'],
    featureFlags: ['lender.aia', 'lender.draws', 'lender.portal'],
  },
};
