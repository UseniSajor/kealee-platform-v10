/**
 * packages/core-hooks/src/hooks.config.ts
 *
 * Revenue hook pricing configuration — Sprint 7 canonical prices.
 *
 * IMPORTANT billing notes:
 *   - design, estimate, permit, pm, developer = one-time ('payment' mode)
 *   - listing, growth, ops = recurring ('subscription' mode)
 *   - PM (project_execution) = one-time per project — NOT recurring
 */

export type HookStage =
  | 'project_intake'
  | 'design_complete'
  | 'estimate_complete'
  | 'permit_detected'
  | 'contractor_assignment'
  | 'engagement_creation'
  | 'project_execution'
  | 'contractor_growth';

export interface HookTier {
  id:           string;
  name:         string;
  price:        number;    // USD cents (0 = free)
  priceLabel:   string;
  description:  string;
  features:     string[];
  cta:          string;
  priceId?:     string;    // Stripe Price ID
  highlighted?: boolean;
  badge?:       string;
  billing?:     'one_time' | 'monthly'; // default: one_time
}

export interface RevenueHook {
  stage:          HookStage;
  trigger:        string;
  headline:       string;
  subheadline?:   string;
  tiers:          HookTier[];
  analyticsEvent: string;
  dismissable:    boolean;
  autoShow:       boolean;
}

export const REVENUE_HOOKS: Record<HookStage, RevenueHook> = {

  // ── Hook 1: Project Intake ────────────────────────────────────────────────
  project_intake: {
    stage:          'project_intake',
    trigger:        'User creates a new project',
    headline:       'Start your project the right way.',
    subheadline:    'Get an AI concept, zoning check, cost band, and permit risk — all in one $395 report.',
    analyticsEvent: 'revenue_hook_project_intake',
    dismissable:    false,
    autoShow:       true,
    tiers: [
      {
        id:          'intake_free',
        name:        'Self-Guided',
        price:       0,
        priceLabel:  'Free',
        description: 'Use Kealee platform tools to manage your project yourself.',
        features:    ['Project dashboard', 'Basic tools', 'Community support'],
        cta:         'Start free',
      },
      {
        id:          'intake_concept_validation',
        name:        'Project Concept + Validation',
        price:       39500,
        priceLabel:  '$395',
        description: 'AI concept + zoning check + structural review + cost band + permit risk. Delivered in 24 hours.',
        features:    ['AI concept & floor plan', 'Zoning confirmed', 'Structural risk assessment', 'Cost band ($X–$Y)', 'Permit risk rating', 'Contractor scope notes'],
        cta:         'Get my concept + validation',
        priceId:     process.env.STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION,
        highlighted: true,
        badge:       'Start Here — $395',
      },
    ],
  },

  // ── Hook 2: Design Upgrades (AI_ONLY route only) ──────────────────────────
  design_complete: {
    stage:          'design_complete',
    trigger:        'ProjectConceptValidation delivered with AI_ONLY route — offer design upgrades',
    headline:       'Your concept is ready — take it further.',
    subheadline:    'Upgrade to more floor plan options or a permit-ready drawing set.',
    analyticsEvent: 'revenue_hook_design_complete',
    dismissable:    true,
    autoShow:       true,
    tiers: [
      {
        id:          'design_advanced',
        name:        'Advanced AI Concept',
        price:       89900,
        priceLabel:  '$899',
        description: '3 floor plan options, 3D exterior views, and detailed material suggestions.',
        features:    ['3 floor plan variations', '3D exterior views', 'Material palette', 'Room-by-room specs'],
        cta:         'Get advanced concept',
        priceId:     process.env.STRIPE_PRICE_DESIGN_ADVANCED,
        highlighted: true,
        badge:       'Recommended',
      },
      {
        id:          'design_full_package',
        name:        'Full Design Package',
        price:       449900,
        priceLabel:  '$4,499',
        description: 'Complete design documents — schematic through permit-ready drawing set.',
        features:    ['Schematic design', 'Design development', 'Permit-ready drawings', 'Specification sheet', 'Structural details'],
        cta:         'Get full design',
        priceId:     process.env.STRIPE_PRICE_DESIGN_FULL,
      },
    ],
  },

  // ── Hook 3: Estimate Upgrades ─────────────────────────────────────────────
  estimate_complete: {
    stage:          'estimate_complete',
    trigger:        'EstimateBot generates project estimate',
    headline:       'Your project estimate is ready.',
    subheadline:    'Unlock a detailed cost analysis or a certified cost report.',
    analyticsEvent: 'revenue_hook_estimate_complete',
    dismissable:    true,
    autoShow:       true,
    tiers: [
      {
        id:          'estimate_basic',
        name:        'AI Estimate',
        price:       0,
        priceLabel:  'Included',
        description: 'AI-generated estimate with line items and totals.',
        features:    ['Line item estimate', 'Total cost summary', 'Contingency model'],
        cta:         'Use AI estimate',
      },
      {
        id:          'estimate_detailed',
        name:        'Detailed Estimate',
        price:       59500,
        priceLabel:  '$595',
        description: 'Professional cost analyst reviews and validates your estimate.',
        features:    ['AI estimate + human review', 'Trade-by-trade breakdown', 'Market rate validation', 'PDF report'],
        cta:         'Get detailed estimate',
        priceId:     process.env.STRIPE_PRICE_ESTIMATE_DETAILED,
        highlighted: true,
        badge:       'Most Popular',
      },
      {
        id:          'estimate_certified',
        name:        'Certified Estimate',
        price:       185000,
        priceLabel:  '$1,850',
        description: 'Certified cost report for lender submission, insurance, or investor decks.',
        features:    ['Detailed estimate', 'Certified by licensed estimator', 'Lender-ready format', 'RSMeans data'],
        cta:         'Get certified report',
        priceId:     process.env.STRIPE_PRICE_ESTIMATE_CERTIFIED,
      },
    ],
  },

  // ── Hook 4: Permit Services ───────────────────────────────────────────────
  permit_detected: {
    stage:          'permit_detected',
    trigger:        'PermitBot identifies permit requirements for the project',
    headline:       'Your project requires permits.',
    subheadline:    'Handle permitting yourself or let us manage the entire process.',
    analyticsEvent: 'revenue_hook_permit_detected',
    dismissable:    true,
    autoShow:       true,
    tiers: [
      {
        id:          'permit_free',
        name:        'Permit Guidance',
        price:       0,
        priceLabel:  'Free',
        description: 'AI-generated permit checklist for your project and jurisdiction.',
        features:    ['Permit type identification', 'Checklist PDF', 'Jurisdiction contact info'],
        cta:         'Get free guidance',
      },
      {
        id:          'permit_simple',
        name:        'Simple Permit Filing',
        price:       14900,
        priceLabel:  '$149',
        description: 'Filing service for straightforward single-trade permits.',
        features:    ['Application forms', 'Single-trade scope', 'Status tracking'],
        cta:         'File my permit',
        priceId:     process.env.STRIPE_PRICE_PERMIT_SIMPLE,
      },
      {
        id:          'permit_package',
        name:        'Permit Package',
        price:       95000,
        priceLabel:  '$950',
        description: 'Full application prep, submission, and tracking for standard residential permits.',
        features:    ['Application forms', 'Drawing preparation', 'Supporting documentation', 'Submission + tracking'],
        cta:         'Get permit package',
        priceId:     process.env.STRIPE_PRICE_PERMIT_PACKAGE,
        highlighted: true,
        badge:       'Most Popular',
      },
      {
        id:          'permit_coordination',
        name:        'Permit Coordination',
        price:       275000,
        priceLabel:  '$2,750',
        description: 'Submit, track, and respond to comments — full coordination through approval.',
        features:    ['Everything in Package', 'Response to comments', 'Multiple jurisdiction contacts'],
        cta:         'Get coordination',
        priceId:     process.env.STRIPE_PRICE_PERMIT_COORDINATION,
      },
    ],
  },

  // ── Hook 5: Contractor Assignment ─────────────────────────────────────────
  contractor_assignment: {
    stage:          'contractor_assignment',
    trigger:        'Project owner is ready to assign a contractor',
    headline:       'Ready to assign your contractor?',
    subheadline:    'Protect your project with the right contract and oversight.',
    analyticsEvent: 'revenue_hook_contractor_assignment',
    dismissable:    true,
    autoShow:       true,
    tiers: [
      {
        id:          'assignment_basic',
        name:        'Standard Assignment',
        price:       0,
        priceLabel:  'Included',
        description: 'Assign from the verified contractor pool using platform tools.',
        features:    ['Contractor matching', 'Digital assignment', 'Platform terms'],
        cta:         'Assign contractor',
      },
      {
        id:          'assignment_contract',
        name:        'Custom Contract',
        price:       99900,
        priceLabel:  '$999',
        description: 'Attorney-reviewed contract with project-specific terms.',
        features:    ['Standard assignment', 'Attorney-reviewed contract', 'Custom scope', 'e-Signature'],
        cta:         'Get custom contract',
        priceId:     process.env.STRIPE_PRICE_ASSIGNMENT_CONTRACT,
        highlighted: true,
      },
      {
        id:          'assignment_oversight',
        name:        'Project Oversight',
        price:       249900,
        priceLabel:  '$2,499',
        description: 'Dedicated project manager monitors contractor performance throughout the build.',
        features:    ['Custom contract', 'Dedicated PM', 'Weekly check-ins', 'Milestone approval', 'Dispute support'],
        cta:         'Add project oversight',
        priceId:     process.env.STRIPE_PRICE_ASSIGNMENT_OVERSIGHT,
      },
    ],
  },

  // ── Hook 6: Engagement Creation ───────────────────────────────────────────
  engagement_creation: {
    stage:          'engagement_creation',
    trigger:        'Engagement document is being created for a project',
    headline:       'Create your engagement agreement.',
    subheadline:    'Choose the right level of documentation for your project.',
    analyticsEvent: 'revenue_hook_engagement_creation',
    dismissable:    false,
    autoShow:       true,
    tiers: [
      {
        id:          'engagement_standard',
        name:        'Standard Agreement',
        price:       0,
        priceLabel:  'Included',
        description: 'Standard Kealee platform engagement agreement.',
        features:    ['Platform terms', 'Digital signing', 'Cloud storage'],
        cta:         'Use standard agreement',
      },
      {
        id:          'engagement_custom',
        name:        'Custom Agreement',
        price:       149900,
        priceLabel:  '$1,499',
        description: 'Custom engagement agreement with project-specific terms.',
        features:    ['Custom terms', 'Attorney review', 'Multi-party signing', 'Version control'],
        cta:         'Get custom agreement',
        priceId:     process.env.STRIPE_PRICE_ENGAGEMENT_CUSTOM,
        highlighted: true,
      },
      {
        id:          'engagement_full_legal',
        name:        'Full Legal Package',
        price:       349900,
        priceLabel:  '$3,499',
        description: 'Complete legal documentation package.',
        features:    ['Custom agreement', 'NDA', 'IP assignment', 'Dispute resolution clause', 'Notarization support'],
        cta:         'Get legal package',
        priceId:     process.env.STRIPE_PRICE_ENGAGEMENT_LEGAL,
      },
    ],
  },

  // ── Hook 7: PM Services (one-time per project — NOT recurring) ────────────
  project_execution: {
    stage:          'project_execution',
    trigger:        'Project moves to active execution phase',
    headline:       'Your project is under construction.',
    subheadline:    'Add professional PM oversight for your build — one-time fee per project.',
    analyticsEvent: 'revenue_hook_project_execution',
    dismissable:    true,
    autoShow:       false,
    tiers: [
      {
        id:          'execution_basic',
        name:        'Self-Managed',
        price:       0,
        priceLabel:  'Included',
        description: 'Use platform tools to track progress yourself.',
        features:    ['Progress tracking', 'Document storage', 'Contractor messaging'],
        cta:         'Continue self-managed',
      },
      {
        id:          'execution_pm_advisory',
        name:        'PM Advisory',
        price:       95000,
        priceLabel:  '$950',
        description: 'Milestone reviews, budget oversight, and owner guidance — one-time per project.',
        features:    ['Milestone review calls', 'Budget variance alerts', 'Owner guidance', 'Photo documentation'],
        cta:         'Add PM Advisory',
        priceId:     process.env.STRIPE_PRICE_PM_ADVISORY,
        highlighted: true,
        badge:       'Recommended',
        billing:     'one_time',
      },
      {
        id:          'execution_pm_oversight',
        name:        'PM Oversight',
        price:       295000,
        priceLabel:  '$2,950',
        description: 'Full PM oversight from groundbreaking to closeout — one-time per project.',
        features:    ['Advisory included', 'Dedicated PM', 'Weekly check-ins', 'Pay-app review', 'Closeout management'],
        cta:         'Add PM Oversight',
        priceId:     process.env.STRIPE_PRICE_PM_OVERSIGHT,
        billing:     'one_time',
      },
    ],
  },

  // ── Hook 8: Contractor Growth ─────────────────────────────────────────────
  contractor_growth: {
    stage:          'contractor_growth',
    trigger:        'Contractor accesses marketing or growth section of portal',
    headline:       'Grow your contractor business.',
    subheadline:    'Get more projects, more visibility, and more leads.',
    analyticsEvent: 'revenue_hook_contractor_growth',
    dismissable:    true,
    autoShow:       false,
    tiers: [
      {
        id:          'growth_starter',
        name:        'Starter',
        price:       9900,
        priceLabel:  '$99/mo',
        description: 'Basic contractor profile optimization and listing boost.',
        features:    ['Profile optimization', 'Marketplace listing priority', 'Monthly performance report'],
        cta:         'Get Starter',
        priceId:     process.env.STRIPE_PRICE_GROWTH_STARTER,
        billing:     'monthly',
      },
      {
        id:          'growth_pro',
        name:        'Growth',
        price:       29900,
        priceLabel:  '$299/mo',
        description: 'Dedicated landing page, SEO, and lead capture funnel.',
        features:    ['Starter features', 'Custom landing page', 'SEO optimization', 'Lead capture form', 'CRM integration'],
        cta:         'Get Growth',
        priceId:     process.env.STRIPE_PRICE_GROWTH_PRO,
        highlighted: true,
        badge:       'Most Popular',
        billing:     'monthly',
      },
      {
        id:          'growth_enterprise',
        name:        'Pro',
        price:       79900,
        priceLabel:  '$799/mo',
        description: 'Full marketing automation: Google Ads, SEO, email/SMS funnels, and CRM.',
        features:    ['Growth features', 'Google Ads management', 'Monthly ad spend ($500 included)', 'Email/SMS sequences', 'Dedicated account manager'],
        cta:         'Get Pro',
        priceId:     process.env.STRIPE_PRICE_GROWTH_ENTERPRISE,
        billing:     'monthly',
      },
    ],
  },
};

export function getHook(stage: HookStage): RevenueHook {
  return REVENUE_HOOKS[stage];
}

export function getFreeTier(stage: HookStage): HookTier | undefined {
  return REVENUE_HOOKS[stage].tiers.find(t => t.price === 0);
}

export function getPaidTiers(stage: HookStage): HookTier[] {
  return REVENUE_HOOKS[stage].tiers.filter(t => t.price > 0);
}
