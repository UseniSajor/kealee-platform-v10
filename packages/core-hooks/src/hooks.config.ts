/**
 * packages/core-hooks/src/hooks.config.ts
 *
 * Revenue hook pricing configuration for all 8 lifecycle stages.
 *
 * Each hook fires at a natural moment in the project lifecycle and presents
 * the owner with tiered service options — from free to premium.
 *
 * Stripe price IDs must be set in the STRIPE_PRICES env var or configured
 * in the Stripe dashboard. The priceId field here is the Stripe Price object ID.
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
  id:          string;   // unique tier identifier
  name:        string;
  price:       number;   // USD cents (0 = free)
  priceLabel:  string;   // display string e.g. "$1,500"
  description: string;
  features:    string[];
  cta:         string;   // call-to-action button label
  priceId?:    string;   // Stripe Price ID (null = free tier, no checkout)
  highlighted?: boolean; // show as recommended
  badge?:      string;   // e.g. "Most Popular"
}

export interface RevenueHook {
  stage:      HookStage;
  trigger:    string;    // description of what triggers this hook
  headline:   string;    // main headline shown to user
  subheadline?: string;
  tiers:      HookTier[];
  analyticsEvent: string; // event name for tracking
  dismissable: boolean;  // can user skip/dismiss?
  autoShow:    boolean;  // show without explicit user action?
}

// ─── Revenue Hook Definitions ─────────────────────────────────────────────────

export const REVENUE_HOOKS: Record<HookStage, RevenueHook> = {

  // ── Hook 1: Project Intake ────────────────────────────────────────────────
  project_intake: {
    stage:      'project_intake',
    trigger:    'User creates a new project',
    headline:   'Start your project the right way.',
    subheadline: 'Choose how much support you need from day one.',
    analyticsEvent: 'revenue_hook_project_intake',
    dismissable: false,
    autoShow:    true,
    tiers: [
      {
        id:          'intake_free',
        name:        'Self-Guided',
        price:       0,
        priceLabel:  'Free',
        description: 'Use the Kealee platform tools to manage your project yourself.',
        features:    ['Project dashboard', 'Basic tools', 'Community support'],
        cta:         'Start free',
      },
      {
        id:          'intake_feasibility',
        name:        'Feasibility Review',
        price:       49900,
        priceLabel:  '$499',
        description: 'Our team reviews your project for feasibility, zoning, and budget alignment.',
        features:    ['Zoning check', 'Budget feasibility', 'Risk assessment report', '1 review call'],
        cta:         'Get reviewed',
        priceId:     process.env.STRIPE_PRICE_INTAKE_FEASIBILITY,
        highlighted: true,
        badge:       'Most Popular',
      },
      {
        id:          'intake_full_service',
        name:        'Full Intake Package',
        price:       149900,
        priceLabel:  '$1,499',
        description: 'Complete intake: feasibility, design brief, estimate model, and permit scope.',
        features:    ['Everything in Feasibility', 'Design brief', 'Preliminary estimate', 'Permit scope', '2 review calls'],
        cta:         'Get full package',
        priceId:     process.env.STRIPE_PRICE_INTAKE_FULL,
      },
    ],
  },

  // ── Hook 2: DesignBot Complete ────────────────────────────────────────────
  design_complete: {
    stage:      'design_complete',
    trigger:    'DesignBot generates initial concept',
    headline:   'Your design concept is ready.',
    subheadline: 'Take it further with an architect or a full design package.',
    analyticsEvent: 'revenue_hook_design_complete',
    dismissable: true,
    autoShow:    true,
    tiers: [
      {
        id:          'design_free',
        name:        'AI Concept',
        price:       0,
        priceLabel:  'Included',
        description: 'AI-generated concept layout, floor plan sketch, and design brief.',
        features:    ['Concept layout', 'Floor plan sketch', 'Design brief PDF'],
        cta:         'Use AI concept',
      },
      {
        id:          'design_architect_review',
        name:        'Architect Review',
        price:       99900,
        priceLabel:  '$999',
        description: 'Licensed architect reviews and refines your AI concept.',
        features:    ['AI concept + architect review', 'Refined floor plan', 'Code compliance check', 'Written report'],
        cta:         'Get architect review',
        priceId:     process.env.STRIPE_PRICE_DESIGN_ARCHITECT_REVIEW,
        highlighted: true,
        badge:       'Recommended',
      },
      {
        id:          'design_full_package',
        name:        'Full Design Package',
        price:       449900,
        priceLabel:  '$4,499',
        description: 'Complete design documents — schematic, design development, permit-ready drawings.',
        features:    ['Everything in Architect Review', 'Schematic design', 'Design development', 'Permit-ready drawing set', 'Specification sheet'],
        cta:         'Get full design',
        priceId:     process.env.STRIPE_PRICE_DESIGN_FULL,
      },
    ],
  },

  // ── Hook 3: EstimateBot Complete ──────────────────────────────────────────
  estimate_complete: {
    stage:      'estimate_complete',
    trigger:    'EstimateBot generates project estimate',
    headline:   'Your project estimate is ready.',
    subheadline: 'Unlock a detailed cost analysis or a certified cost report.',
    analyticsEvent: 'revenue_hook_estimate_complete',
    dismissable: true,
    autoShow:    true,
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
        name:        'Detailed Cost Analysis',
        price:       49900,
        priceLabel:  '$499',
        description: 'Professional cost analyst reviews and validates your estimate.',
        features:    ['AI estimate + human review', 'Trade-by-trade breakdown', 'Market rate validation', 'PDF report'],
        cta:         'Get detailed analysis',
        priceId:     process.env.STRIPE_PRICE_ESTIMATE_DETAILED,
        highlighted: true,
        badge:       'Most Popular',
      },
      {
        id:          'estimate_certified',
        name:        'Certified Cost Report',
        price:       149900,
        priceLabel:  '$1,499',
        description: 'Certified cost report for lender submission, insurance, or investor decks.',
        features:    ['Detailed analysis', 'Certified by licensed estimator', 'Lender-ready format', 'RSMeans data'],
        cta:         'Get certified report',
        priceId:     process.env.STRIPE_PRICE_ESTIMATE_CERTIFIED,
      },
    ],
  },

  // ── Hook 4: PermitBot Detects Permit Requirement ──────────────────────────
  permit_detected: {
    stage:      'permit_detected',
    trigger:    'PermitBot identifies permit requirements for the project',
    headline:   'Your project requires permits.',
    subheadline: 'Handle permitting yourself or let us manage the entire process.',
    analyticsEvent: 'revenue_hook_permit_detected',
    dismissable: true,
    autoShow:    true,
    tiers: [
      {
        id:          'permit_free',
        name:        'Permit Checklist',
        price:       0,
        priceLabel:  'Free',
        description: 'AI-generated permit checklist specific to your project and jurisdiction.',
        features:    ['Permit type identification', 'Checklist PDF', 'Jurisdiction contact info'],
        cta:         'Get free checklist',
      },
      {
        id:          'permit_prep',
        name:        'Permit Preparation',
        price:       150000,
        priceLabel:  '$1,500',
        description: 'We prepare your permit application package — drawings, forms, and supporting docs.',
        features:    ['Application forms', 'Drawing preparation', 'Supporting documentation', 'Review meeting'],
        cta:         'Get permit prep',
        priceId:     process.env.STRIPE_PRICE_PERMIT_PREP,
        highlighted: true,
        badge:       'Most Popular',
      },
      {
        id:          'permit_coordination',
        name:        'Permit Coordination',
        price:       300000,
        priceLabel:  '$3,000',
        description: 'We submit and track your permit through the jurisdiction.',
        features:    ['Everything in Prep', 'Submission handling', 'Response to comments', 'Status tracking'],
        cta:         'Get coordination',
        priceId:     process.env.STRIPE_PRICE_PERMIT_COORDINATION,
      },
      {
        id:          'permit_expediting',
        name:        'Permit Expediting',
        price:       500000,
        priceLabel:  '$5,000',
        description: 'Priority expediting service — we push for fastest possible approval.',
        features:    ['Everything in Coordination', 'Expeditor liaison', 'Priority routing', 'Approval guarantee*'],
        cta:         'Expedite my permit',
        priceId:     process.env.STRIPE_PRICE_PERMIT_EXPEDITING,
      },
    ],
  },

  // ── Hook 5: Contractor Assignment ─────────────────────────────────────────
  contractor_assignment: {
    stage:      'contractor_assignment',
    trigger:    'Project owner is ready to assign a contractor',
    headline:   'Ready to assign your contractor?',
    subheadline: 'Protect your project with the right contract and oversight.',
    analyticsEvent: 'revenue_hook_contractor_assignment',
    dismissable: true,
    autoShow:    true,
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
    stage:      'engagement_creation',
    trigger:    'Engagement document is being created for a project',
    headline:   'Create your engagement agreement.',
    subheadline: 'Choose the right level of documentation for your project.',
    analyticsEvent: 'revenue_hook_engagement_creation',
    dismissable: false,
    autoShow:    true,
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
        description: 'Complete legal documentation: engagement, NDA, IP assignment, and dispute clause.',
        features:    ['Custom agreement', 'NDA', 'IP assignment', 'Dispute resolution clause', 'Notarization support'],
        cta:         'Get legal package',
        priceId:     process.env.STRIPE_PRICE_ENGAGEMENT_LEGAL,
      },
    ],
  },

  // ── Hook 7: Project Execution ─────────────────────────────────────────────
  project_execution: {
    stage:      'project_execution',
    trigger:    'Project moves to active execution phase',
    headline:   'Your project is under construction.',
    subheadline: 'Add monitoring and financial protection for your build.',
    analyticsEvent: 'revenue_hook_project_execution',
    dismissable: true,
    autoShow:    false, // show on demand or when milestone is missed
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
        id:          'execution_monitoring',
        name:        'Construction Monitoring',
        price:       99900,
        priceLabel:  '$999/mo',
        description: 'Monthly site inspection reports and milestone verification.',
        features:    ['Monthly inspections', 'Photo documentation', 'Progress reports', 'Milestone sign-off'],
        cta:         'Add monitoring',
        priceId:     process.env.STRIPE_PRICE_EXECUTION_MONITORING,
        highlighted: true,
        badge:       'Recommended',
      },
      {
        id:          'execution_financial_control',
        name:        'Financial Control',
        price:       199900,
        priceLabel:  '$1,999/mo',
        description: 'Full financial oversight — pay-app review, lien management, and budget tracking.',
        features:    ['Monitoring included', 'Pay-app review', 'Lien waiver tracking', 'Budget variance alerts', 'Retainage management'],
        cta:         'Add financial control',
        priceId:     process.env.STRIPE_PRICE_EXECUTION_FINANCIAL,
      },
    ],
  },

  // ── Hook 8: Contractor Growth Tools ───────────────────────────────────────
  contractor_growth: {
    stage:      'contractor_growth',
    trigger:    'Contractor accesses marketing or growth section of portal',
    headline:   'Grow your contractor business.',
    subheadline: 'Get more projects, more visibility, and more leads.',
    analyticsEvent: 'revenue_hook_contractor_growth',
    dismissable: true,
    autoShow:    false,
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
      },
    ],
  },
};

// ─── Helper: get hook by stage ────────────────────────────────────────────────

export function getHook(stage: HookStage): RevenueHook {
  return REVENUE_HOOKS[stage];
}

export function getFreeTier(stage: HookStage): HookTier {
  return REVENUE_HOOKS[stage].tiers.find(t => t.price === 0)!;
}

export function getPaidTiers(stage: HookStage): HookTier[] {
  return REVENUE_HOOKS[stage].tiers.filter(t => t.price > 0);
}
