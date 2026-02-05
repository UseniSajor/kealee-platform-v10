// packages/shared/src/data/product-schema.ts
// Kealee Platform - Complete Product Schema
// Last updated: 2026-02-04

export const PLATFORM_INFO = {
  name: 'Kealee Platform',
  tagline: 'Build Better, Build Smarter',
  description:
    'The end-to-end construction platform for the DC-Baltimore corridor. From permits to project completion.',
  differentiator:
    'Kealee provides SERVICE - Remote Project Management and Construction Operations, not just software.',
  coverage: 'DC-Baltimore Corridor',
  jurisdictions: 3000,
  approvalRate: 85,
  projectsManaged: '$50M+',
} as const;

// =============================================================================
// BRAND & LOGO
// =============================================================================

export const BRAND_LOGO = {
  // Icon colors (bubble cluster)
  iconColors: {
    yellow: '#F5C542', // Large primary bubble
    orange: '#E8793A', // Medium secondary bubble
    coral: '#E85A4F', // Small accent bubble
    skyBlue: '#4A90D9', // Outlines
    white: '#FFFFFF', // Highlight dots
  },
  // Wordmark styling
  wordmark: {
    text: 'Kealee',
    tagline: 'CONSTRUCTION',
    altTagline: 'PLATFORM', // Alternative for tech contexts
    font: 'Rounded sans-serif (Quicksand, Nunito, Varela Round, or custom)',
    fontWeight: 600, // Semibold
    color: '#4A90D9',
    darkModeColor: '#FFFFFF',
  },
  // Logo variants
  variants: [
    { id: 'full', name: 'Full Logo', description: 'Icon + Kealee + CONSTRUCTION' },
    { id: 'no-tagline', name: 'Without Tagline', description: 'Icon + Kealee' },
    { id: 'stacked', name: 'Stacked', description: 'Icon above, text below' },
    { id: 'icon-only', name: 'Icon Only', description: 'Bubble cluster only' },
    { id: 'wordmark', name: 'Wordmark Only', description: 'Kealee text only' },
    { id: 'dark-mode', name: 'Dark Mode', description: 'White wordmark, vibrant bubbles' },
    { id: 'mono-sky-blue', name: 'Monochrome Sky Blue', description: 'Single color sky blue' },
    { id: 'mono-white', name: 'Monochrome White', description: 'Single color white' },
  ],
  // Sizing guidelines
  sizing: {
    minWidthFull: 80, // Minimum width for full logo in pixels
    minHeightIcon: 24, // Minimum height for icon only
    clearSpaceUnit: 'K-height', // Clear space equal to K character height
  },
  // File paths (relative to public/assets/logo/)
  files: {
    svg: 'kealee-logo.svg',
    pngFull: 'kealee-logo-full.png',
    pngIcon: 'kealee-icon.png',
    favicon: 'favicon.ico',
    appleTouchIcon: 'apple-touch-icon.png',
  },
} as const;

// =============================================================================
// PRECON SERVICES (m-project-owner)
// =============================================================================

export type PreConPhase =
  | 'INTAKE'
  | 'DESIGN_IN_PROGRESS'
  | 'DESIGN_REVIEW'
  | 'DESIGN_APPROVED'
  | 'SRP_GENERATED'
  | 'MARKETPLACE_READY'
  | 'BIDDING_OPEN'
  | 'AWARDED'
  | 'CONTRACT_PENDING'
  | 'CONTRACT_RATIFIED'
  | 'COMPLETED';

export const PRECON_PHASES: Record<
  PreConPhase,
  { label: string; color: string; description: string }
> = {
  INTAKE: {
    label: 'Intake',
    color: 'gray',
    description: 'Initial project information gathering',
  },
  DESIGN_IN_PROGRESS: {
    label: 'Design In Progress',
    color: 'blue',
    description: 'Architect working on designs',
  },
  DESIGN_REVIEW: {
    label: 'Design Review',
    color: 'yellow',
    description: 'Owner reviewing design deliverables',
  },
  DESIGN_APPROVED: {
    label: 'Design Approved',
    color: 'green',
    description: 'Design finalized and approved',
  },
  SRP_GENERATED: {
    label: 'SRP Generated',
    color: 'teal',
    description: 'Suggested Retail Price calculated',
  },
  MARKETPLACE_READY: {
    label: 'Marketplace Ready',
    color: 'purple',
    description: 'Project ready for contractor bidding',
  },
  BIDDING_OPEN: {
    label: 'Bidding Open',
    color: 'orange',
    description: 'Contractors submitting bids',
  },
  AWARDED: {
    label: 'Awarded',
    color: 'green',
    description: 'Contractor selected',
  },
  CONTRACT_PENDING: {
    label: 'Contract Pending',
    color: 'yellow',
    description: 'Contract under negotiation',
  },
  CONTRACT_RATIFIED: {
    label: 'Contract Ratified',
    color: 'green',
    description: 'Contract signed by all parties',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'gray',
    description: 'Project completed',
  },
};

export type DesignPackageTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface DesignPackage {
  tier: DesignPackageTier;
  name: string;
  price: number;
  description: string;
  deliverables: string[];
  turnaround: string;
  revisions: number;
  popular?: boolean;
}

export const DESIGN_PACKAGES: DesignPackage[] = [
  {
    tier: 'BASIC',
    name: 'Basic Design',
    price: 199,
    description: 'Essential drawings for simple projects',
    deliverables: [
      'Floor plan layout',
      'Basic elevations',
      'Site plan',
      'Project specifications',
    ],
    turnaround: '5-7 business days',
    revisions: 1,
  },
  {
    tier: 'STANDARD',
    name: 'Standard Design',
    price: 499,
    description: 'Complete design package for most residential projects',
    deliverables: [
      'Detailed floor plans',
      'All elevations',
      'Site plan with setbacks',
      'Electrical layout',
      'Structural notes',
      'Material specifications',
    ],
    turnaround: '7-10 business days',
    revisions: 2,
    popular: true,
  },
  {
    tier: 'PREMIUM',
    name: 'Premium Design',
    price: 999,
    description: 'Comprehensive package with 3D renderings and full coordination',
    deliverables: [
      'Complete construction drawings',
      '3D renderings',
      'MEP coordination',
      'Structural engineering',
      'Energy calculations',
      'Permit-ready package',
      'Material schedule',
      'Cost estimate',
    ],
    turnaround: '10-14 business days',
    revisions: 3,
  },
];

export interface PreConService {
  id: string;
  name: string;
  price: number | string;
  priceUnit: string;
  description: string;
  features: string[];
  roi?: string;
}

export const PRECON_SERVICES: PreConService[] = [
  {
    id: 'feasibility-study',
    name: 'Feasibility Study',
    price: 2500,
    priceUnit: 'from',
    description: 'Comprehensive project viability assessment',
    features: [
      'Site assessment & analysis',
      'Zoning & code research',
      'Preliminary budget development',
      'Risk identification',
      'Go/no-go recommendation',
    ],
    roi: '5-10x ROI on planning investment',
  },
  {
    id: 'conceptual-estimate',
    name: 'Conceptual Estimate',
    price: 1500,
    priceUnit: 'from',
    description: 'Early-stage cost projections',
    features: [
      'Square footage cost analysis',
      'Comparables research',
      'Cost range estimate',
      'Contingency recommendations',
    ],
  },
  {
    id: 'schematic-estimate',
    name: 'Schematic Design Estimate',
    price: 3500,
    priceUnit: 'from',
    description: 'Detailed estimates from schematic drawings',
    features: [
      'Quantity takeoffs',
      'System-level pricing',
      'Value engineering options',
      'Budget allocation by trade',
    ],
  },
  {
    id: 'dd-estimate',
    name: 'Design Development Estimate',
    price: 5500,
    priceUnit: 'from',
    description: 'Complete construction budgeting',
    features: [
      'Complete quantity takeoffs',
      'Trade-specific pricing',
      'Subcontractor budgets',
      'Cash flow projections',
      'Bid package preparation',
    ],
  },
  {
    id: 'bid-package-prep',
    name: 'Bid Package Preparation',
    price: 7500,
    priceUnit: 'from',
    description: 'Ready-to-bid contractor packages',
    features: [
      'Scope development',
      'Bid instructions',
      'Qualification requirements',
      'Evaluation criteria',
      'Contract templates',
    ],
  },
];

// Platform commission on awarded contracts
// IMPORTANT: Do NOT display on service/landing pages - only show at final checkout
export const PLATFORM_COMMISSION = {
  rate: 0.035, // 3.5%
  paidBy: 'contractor',
  description: 'Platform commission on contract value',
  displayRule: 'CHECKOUT_ONLY', // Only display at checkout/total price page
};

// =============================================================================
// HOMEOWNER PORTAL (app.kealee.com)
// For residential homeowners. Developers, commercial building owners, and
// investors use the Contractor Portal for more advanced features.
// =============================================================================

export interface PricingTier {
  id: string;
  name: string;
  price: number | string;
  period: string;
  description: string;
  features: string[];
  limits?: {
    projects?: number | 'unlimited';
    users?: number | 'unlimited';
    storage?: string;
  };
  popular?: boolean;
  cta: { label: string; href: string };
}

export const HOMEOWNER_PLANS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    period: '/month',
    description: 'For individual homeowners with a single project',
    features: [
      'Basic readiness checklists',
      'Contract e-signing',
      'Payment tracking',
      'Email support',
    ],
    limits: { projects: 1, storage: '2GB' },
    cta: { label: 'Start Free Trial', href: '/signup?plan=starter' },
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 149,
    period: '/month',
    description: 'For property owners managing multiple projects',
    features: [
      'Everything in Starter',
      'Escrow protection included',
      'Advanced checklists',
      'Milestone tracking',
      'Priority support',
    ],
    limits: { projects: 3, storage: '5GB' },
    cta: { label: 'Start Free Trial', href: '/signup?plan=growth' },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    period: '/month',
    description: 'For investors and developers',
    features: [
      'Everything in Growth',
      'Custom checklists',
      'Contractor network access',
      'Portfolio dashboard',
      'Phone support',
    ],
    limits: { projects: 10, storage: '25GB' },
    popular: true,
    cta: { label: 'Start Free Trial', href: '/signup?plan=professional' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    period: '/month',
    description: 'For large organizations with custom needs',
    features: [
      'Everything in Professional',
      'Unlimited projects',
      'White-label options',
      'Custom integrations',
      'API access',
      'Dedicated account manager',
    ],
    limits: { projects: 'unlimited', users: 'unlimited', storage: 'unlimited' },
    cta: { label: 'Contact Sales', href: '/contact' },
  },
];

// =============================================================================
// CONTRACTOR PORTAL (contractor.kealee.com)
// For GCs, builders, developers, commercial building owners, investors
// =============================================================================

export const CONTRACTOR_PLANS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    period: '/month',
    description: 'For small contractors and individual builders',
    features: [
      'Up to 3 active projects',
      'Basic bid management',
      'Estimation tools',
      'Document storage (5GB)',
      'Email support',
    ],
    limits: { projects: 3, users: 3, storage: '5GB' },
    cta: { label: 'Start Free Trial', href: '/signup?plan=starter' },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 249,
    period: '/month',
    description: 'For growing construction companies',
    features: [
      'Up to 10 active projects',
      'Advanced bid management',
      'Full estimation suite',
      'Assembly library access',
      'Team collaboration (10 users)',
      'Subcontractor portal',
      'Priority support',
    ],
    limits: { projects: 10, users: 10, storage: '25GB' },
    popular: true,
    cta: { label: 'Start Free Trial', href: '/signup?plan=professional' },
  },
  {
    id: 'business',
    name: 'Business',
    price: 499,
    period: '/month',
    description: 'For established contractors and developers',
    features: [
      'Up to 25 active projects',
      'Unlimited team members',
      'Custom assembly library',
      'Advanced reporting & analytics',
      'Marketplace priority placement',
      'API access',
      'Phone support',
    ],
    limits: { projects: 25, users: 'unlimited', storage: '100GB' },
    cta: { label: 'Start Free Trial', href: '/signup?plan=business' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited projects',
      'White-label options',
      'Custom integrations',
      'SSO & advanced security',
      'Dedicated account manager',
      'SLA guarantee',
      '24/7 support',
    ],
    limits: { projects: 'unlimited', users: 'unlimited', storage: 'unlimited' },
    cta: { label: 'Contact Sales', href: '/contact' },
  },
];

// =============================================================================
// PROFESSIONAL PORTAL (professional.kealee.com)
// For architects, designers, and engineers
// =============================================================================

export const PROFESSIONAL_PLANS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'For individual architects getting started',
    features: [
      'Up to 3 active projects',
      'Basic deliverable tracking',
      'Client review portal',
      'Email support',
    ],
    limits: { projects: 3 },
    cta: { label: 'Get Started Free', href: '/signup' },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '3%',
    period: 'of project value',
    description: 'For architects with active client projects',
    features: [
      'Unlimited projects',
      'Advanced phase management',
      'Team collaboration',
      'Permit integration',
      'Payment processing',
      'Priority support',
    ],
    limits: { projects: 'unlimited' },
    popular: true,
    cta: { label: 'Start Free Trial', href: '/signup?plan=professional' },
  },
  {
    id: 'firm',
    name: 'Firm',
    price: 'Custom',
    period: '',
    description: 'For architecture firms with multiple architects',
    features: [
      'Everything in Professional',
      'Multi-architect support',
      'Firm-wide analytics',
      'Custom workflows',
      'API access',
      'Dedicated support',
    ],
    limits: { projects: 'unlimited', users: 'unlimited' },
    cta: { label: 'Contact Sales', href: '/contact' },
  },
];

export type ArchitectPhase =
  | 'PRE_DESIGN'
  | 'SCHEMATIC'
  | 'DESIGN_DEVELOPMENT'
  | 'CONSTRUCTION_DOCS'
  | 'PERMIT'
  | 'CONSTRUCTION_ADMIN';

export const ARCHITECT_PHASES: Record<ArchitectPhase, { label: string; percentage: string }> = {
  PRE_DESIGN: { label: 'Pre-Design', percentage: '10%' },
  SCHEMATIC: { label: 'Schematic Design', percentage: '15%' },
  DESIGN_DEVELOPMENT: { label: 'Design Development', percentage: '20%' },
  CONSTRUCTION_DOCS: { label: 'Construction Documents', percentage: '35%' },
  PERMIT: { label: 'Permitting', percentage: '5%' },
  CONSTRUCTION_ADMIN: { label: 'Construction Administration', percentage: '15%' },
};

// Legacy alias for backwards compatibility
export const ARCHITECT_PLANS = PROFESSIONAL_PLANS;

// =============================================================================
// PERMITS & INSPECTIONS (permits.kealee.com)
// =============================================================================

export const PERMIT_PACKAGES: PricingTier[] = [
  {
    id: 'permit-a',
    name: 'Basic',
    price: 495,
    period: 'per permit',
    description: 'Single permit application assistance',
    features: [
      'Application preparation',
      'Document compilation',
      'Jurisdiction submission',
      'Status tracking',
      '1 resubmittal included',
    ],
    cta: { label: 'Get Started', href: '/permits/new?package=basic' },
  },
  {
    id: 'permit-b',
    name: 'Full Service',
    price: 1295,
    period: 'per permit',
    description: 'Complete permit management with AI review',
    features: [
      'Everything in Basic',
      'AI compliance review',
      'Expedited processing',
      'Inspection scheduling',
      '3 resubmittals included',
      'Approval guarantee',
    ],
    popular: true,
    cta: { label: 'Get Started', href: '/permits/new?package=full' },
  },
  {
    id: 'permit-c',
    name: 'Premium',
    price: 2995,
    period: 'per permit',
    description: 'White-glove permit coordination',
    features: [
      'Everything in Full Service',
      'Architect/engineer coordination',
      'Jurisdiction liaison',
      'On-site support as needed',
      'Certificate of Occupancy',
      'Unlimited resubmittals',
      'Dedicated coordinator',
    ],
    cta: { label: 'Get Started', href: '/permits/new?package=premium' },
  },
  {
    id: 'permit-d',
    name: 'Enterprise',
    price: 7500,
    period: '/month',
    description: 'Portfolio-level permit management',
    features: [
      'Dedicated permit team',
      'Bulk processing',
      'Multi-jurisdiction support',
      'Compliance monitoring',
      'Relationship management',
      'Monthly reporting',
      'Priority processing',
    ],
    cta: { label: 'Contact Sales', href: '/contact' },
  },
];

export const PERMIT_STATS = {
  approvalRate: 85,
  jurisdictions: 3000,
  aiReviewTime: '5 minutes',
  moneyBackGuarantee: true,
};

// =============================================================================
// OPS & PM SERVICES (ops.kealee.com)
// =============================================================================

export const PM_SOFTWARE_PLANS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    period: '/month',
    description: 'For small contractors and individuals',
    features: [
      '1-3 active projects',
      '5 team members',
      'Basic scheduling',
      'Document storage (5GB)',
      'Email support',
    ],
    limits: { projects: 3, users: 5, storage: '5GB' },
    cta: { label: 'Start Free Trial', href: '/signup?plan=starter' },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 249,
    period: '/month',
    description: 'For growing construction firms',
    features: [
      'Up to 10 projects',
      '15 team members',
      'Gantt charts & CPM',
      'RFI & submittal tracking',
      'Budget tracking',
      'Priority support',
    ],
    limits: { projects: 10, users: 15, storage: '25GB' },
    cta: { label: 'Start Free Trial', href: '/signup?plan=professional' },
  },
  {
    id: 'business',
    name: 'Business',
    price: 499,
    period: '/month',
    description: 'For established contractors',
    features: [
      'Up to 25 projects',
      'Unlimited team members',
      'Advanced reporting',
      'Custom workflows',
      'Subcontractor portal',
      'Phone support',
    ],
    limits: { projects: 25, users: 'unlimited', storage: '100GB' },
    popular: true,
    cta: { label: 'Start Free Trial', href: '/signup?plan=business' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Unlimited projects',
      'Custom integrations',
      'SSO & advanced security',
      'SLA guarantee',
      'API access',
      '24/7 support',
    ],
    limits: { projects: 'unlimited', users: 'unlimited', storage: 'unlimited' },
    cta: { label: 'Contact Sales', href: '/contact' },
  },
];

export interface ManagedServicePackage {
  id: string;
  name: string;
  price: number;
  period: string;
  hoursPerWeek: string;
  projects: number | 'unlimited';
  description: string;
  features: string[];
  automationLevel: number;
  popular?: boolean;
}

export const PM_MANAGED_PACKAGES: ManagedServicePackage[] = [
  {
    id: 'package-a',
    name: 'Starter',
    price: 1750,
    period: '/month',
    hoursPerWeek: '5-10',
    projects: 1,
    description: 'Essential PM support for single projects',
    features: [
      'Weekly progress reports',
      'Basic task tracking',
      'Contractor coordination',
      'Email & chat support',
    ],
    automationLevel: 40,
  },
  {
    id: 'package-b',
    name: 'Professional',
    price: 3750,
    period: '/month',
    hoursPerWeek: '15-20',
    projects: 3,
    description: 'Comprehensive PM for multiple projects',
    features: [
      'Bi-weekly reports with photos',
      'Advanced task tracking',
      'Full contractor coordination',
      'Budget optimization',
      'Quality assurance',
    ],
    automationLevel: 50,
  },
  {
    id: 'package-c',
    name: 'Premium',
    price: 9500,
    period: '/month',
    hoursPerWeek: '30-40',
    projects: 'unlimited',
    description: 'Dedicated PM with site presence',
    features: [
      'Daily reports with photos',
      'Dedicated project manager',
      'Permit management included',
      'Inspection coordination',
      'Site visits (2-4/month)',
      'Change order management',
    ],
    automationLevel: 60,
    popular: true,
  },
  {
    id: 'package-d',
    name: 'Enterprise',
    price: 16500,
    period: '/month',
    hoursPerWeek: '40+',
    projects: 'unlimited',
    description: 'Full construction management',
    features: [
      'Everything in Premium',
      'We hire & manage contractors',
      'We handle all payments',
      'Portfolio management',
      'Custom reporting & analytics',
      'Design coordination',
      'Warranty management',
    ],
    automationLevel: 70,
  },
];

export interface OperationsService {
  id: string;
  name: string;
  price: number;
  priceUnit?: string;
  category: 'project-controls' | 'estimation' | 'specialized';
  description: string;
  turnaround?: string;
}

export const OPERATIONS_SERVICES: OperationsService[] = [
  // Project Controls
  {
    id: 'site-analysis',
    name: 'Site Analysis Report',
    price: 125,
    category: 'project-controls',
    description:
      'Comprehensive site assessment documenting existing conditions, constraints, and opportunities.',
  },
  {
    id: 'scope-development',
    name: 'Scope of Work Development',
    price: 195,
    category: 'project-controls',
    description: 'Detailed scope document defining project requirements and specifications.',
  },
  {
    id: 'permit-research',
    name: 'Permit Requirements Research',
    price: 95,
    category: 'project-controls',
    description: 'Research and documentation of all permit requirements for your project.',
  },
  {
    id: 'contractor-vetting',
    name: 'Contractor Vetting & Verification',
    price: 175,
    category: 'project-controls',
    description: 'Background verification, license check, and reference validation.',
  },
  {
    id: 'bid-leveling',
    name: 'Bid Leveling & Analysis',
    price: 245,
    category: 'project-controls',
    description: 'Normalize and compare contractor bids for fair comparison.',
  },
  {
    id: 'contract-review',
    name: 'Construction Contract Review',
    price: 295,
    category: 'project-controls',
    description: 'Expert review of construction contracts to protect your interests.',
  },
  {
    id: 'draw-request-review',
    name: 'Draw Request Review',
    price: 145,
    category: 'project-controls',
    description: 'Verify work completion before releasing milestone payments.',
  },
  {
    id: 'punch-list',
    name: 'Punch List Development',
    price: 225,
    category: 'project-controls',
    description: 'Comprehensive punch list documenting all items requiring correction.',
  },
  {
    id: 'closeout-review',
    name: 'Project Closeout Review',
    price: 175,
    category: 'project-controls',
    description: 'Final review ensuring all project requirements are met.',
  },
  {
    id: 'warranty-assistance',
    name: 'Warranty Claim Assistance',
    price: 150,
    category: 'project-controls',
    description: 'Help filing and managing warranty claims with contractors.',
  },
  {
    id: 'permit-prep',
    name: 'Permit Application Preparation',
    price: 295,
    category: 'project-controls',
    description: 'Prepare permit applications for jurisdiction submission.',
  },

  // Estimation Services
  {
    id: 'quick-estimate',
    name: 'Quick Estimate',
    price: 195,
    priceUnit: 'from',
    category: 'estimation',
    description: 'Ballpark estimate for budgeting and feasibility.',
    turnaround: '24-48 hours',
  },
  {
    id: 'detailed-estimate',
    name: 'Detailed Estimate',
    price: 595,
    priceUnit: 'from',
    category: 'estimation',
    description: 'Line-item estimate with quantities, unit costs, and labor breakdown.',
    turnaround: '5-7 business days',
  },
  {
    id: 'contractor-bid-estimate',
    name: 'Contractor Bid Estimate',
    price: 795,
    priceUnit: 'from',
    category: 'estimation',
    description: 'Detailed estimate formatted for competitive bidding.',
    turnaround: '7-10 business days',
  },
  {
    id: 'design-phase-estimate',
    name: 'Design-Phase Estimate',
    price: 1295,
    category: 'estimation',
    description: 'Early-stage cost guidance during design development.',
    turnaround: 'Ongoing',
  },
  {
    id: 'value-engineering',
    name: 'Value Engineering Analysis',
    price: 495,
    category: 'estimation',
    description: 'Cost optimization without sacrificing quality.',
    turnaround: '5-7 business days',
  },
  {
    id: 'change-order-estimate',
    name: 'Change Order Review',
    price: 175,
    category: 'estimation',
    description: 'Review contractor change order pricing for fairness.',
    turnaround: '2-3 business days',
  },
  {
    id: 'insurance-estimate',
    name: 'Insurance Claim Estimate',
    price: 395,
    priceUnit: 'from',
    category: 'estimation',
    description: 'Xactimate-compatible estimates for insurance claims.',
    turnaround: '3-5 business days',
  },
  {
    id: 'feasibility-analysis',
    name: 'Project Feasibility Analysis',
    price: 695,
    category: 'estimation',
    description: 'Financial analysis with cost estimate, timeline, and ROI projections.',
    turnaround: '7-10 business days',
  },

  // Specialized Operations
  {
    id: 'cpm-scheduling',
    name: 'CPM Scheduling',
    price: 125,
    category: 'specialized',
    description: 'Critical path method scheduling for project timelines.',
  },
  {
    id: 'document-control',
    name: 'Document Control Setup',
    price: 150,
    category: 'specialized',
    description: 'Organize and set up project document management system.',
  },
  {
    id: 'rfi-management',
    name: 'RFI Management',
    price: 175,
    category: 'specialized',
    description: 'Request for Information tracking and resolution.',
  },
  {
    id: 'submittal-management',
    name: 'Submittal Management',
    price: 175,
    category: 'specialized',
    description: 'Track and manage product submittals and approvals.',
  },
  {
    id: 'material-takeoff',
    name: 'Material Takeoff',
    price: 250,
    category: 'specialized',
    description: 'Quantity takeoff from construction documents.',
  },
  {
    id: 'safety-plan',
    name: 'Safety Plan Development',
    price: 195,
    category: 'specialized',
    description: 'Site-specific safety plan development.',
  },
  {
    id: 'osha-compliance',
    name: 'OSHA Compliance Review',
    price: 295,
    category: 'specialized',
    description: 'Review project for OSHA compliance requirements.',
  },
  {
    id: 'qc-inspection',
    name: 'Quality Control Inspection',
    price: 225,
    category: 'specialized',
    description: 'On-site quality control inspection and reporting.',
  },
  {
    id: 'bim-coordination',
    name: 'BIM Coordination',
    price: 495,
    category: 'specialized',
    description: 'Building Information Modeling coordination.',
  },
  {
    id: 'site-logistics',
    name: 'Site Logistics Planning',
    price: 595,
    category: 'specialized',
    description: 'Comprehensive site logistics and staging plan.',
  },
  {
    id: 'closeout-docs',
    name: 'Closeout Documentation',
    price: 395,
    category: 'specialized',
    description: 'Compile complete project closeout documentation.',
  },
  {
    id: 'sub-bid-package',
    name: 'Subcontractor Bid Package',
    price: 350,
    category: 'specialized',
    description: 'Prepare bid packages for subcontractor solicitation.',
  },
];

// Volume discounts
export const VOLUME_DISCOUNTS = [
  { threshold: 5, discount: 0.1, label: '10% off' },
  { threshold: 10, discount: 0.15, label: '15% off' },
  { threshold: 25, discount: 0.2, label: '20% off' },
];

// =============================================================================
// ESTIMATION MODULE (estimation.kealee.com)
// =============================================================================

export type EstimateType =
  | 'QUICK_BUDGET'
  | 'CONCEPTUAL'
  | 'PRELIMINARY'
  | 'DETAILED'
  | 'BID_ESTIMATE'
  | 'CHANGE_ORDER_ESTIMATE'
  | 'VALUE_ENGINEERING'
  | 'AS_BUILT';

export interface EstimationServiceTier {
  id: string;
  name: string;
  price: number;
  turnaround: string;
  description: string;
  features: string[];
  deliverables: string[];
  bestFor: string;
  popular?: boolean;
}

export const ESTIMATION_SERVICE_TIERS: EstimationServiceTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 299,
    turnaround: '24 hours',
    description: 'Quick estimates for small residential projects',
    bestFor: 'Small residential projects under $50K',
    features: [
      'Labor cost breakdown',
      'Material quantity takeoff',
      'Basic timeline estimate',
      'PDF report',
    ],
    deliverables: ['PDF estimate report', 'Material list'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 799,
    turnaround: '48 hours',
    description: 'Detailed estimates for mid-size residential & light commercial',
    bestFor: 'Mid-size residential & light commercial',
    features: [
      'Detailed labor analysis',
      'Material pricing with suppliers',
      'Phased timeline projection',
      'Profit margin analysis',
      'Excel + PDF deliverables',
    ],
    deliverables: ['PDF estimate report', 'Excel breakdown', 'Supplier quotes'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    turnaround: '3-5 business days',
    description: 'Comprehensive estimates for large commercial projects',
    bestFor: 'Large commercial projects',
    features: [
      'Comprehensive Bill of Quantities (BOQ)',
      'Multi-vendor pricing comparison',
      'Resource allocation plan',
      'Risk contingency analysis',
      'Cash flow projection',
      'Dedicated estimator review',
    ],
    deliverables: [
      'PDF estimate report',
      'Excel BOQ',
      'Cash flow schedule',
      'Risk analysis',
      'Vendor comparison',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    turnaround: 'Custom',
    description: 'Full-service estimation for multi-phase complex builds',
    bestFor: 'Multi-phase & complex builds',
    features: [
      'Everything in Premium',
      'Value engineering options',
      'Alternative material analysis',
      'Subcontractor bid packages',
      'On-site consultation',
      'Ongoing support',
    ],
    deliverables: [
      'Complete bid package',
      'Value engineering report',
      'Sub bid packages',
      'Site visit report',
      'Ongoing revisions',
    ],
  },
];

export interface EstimationAlaCarteService {
  id: string;
  name: string;
  price: number;
  priceUnit?: string;
  turnaround: string;
  description: string;
  useCase: string;
}

export const ESTIMATION_ALACARTE_SERVICES: EstimationAlaCarteService[] = [
  {
    id: 'quick-budget',
    name: 'Quick Budget Service',
    price: 195,
    turnaround: '24 hours',
    description: 'Rough SF pricing for initial budgeting',
    useCase: 'Early feasibility and budgeting',
  },
  {
    id: 'basic-takeoff',
    name: 'Basic Takeoff',
    price: 495,
    turnaround: '48 hours',
    description: 'Material quantities by CSI division',
    useCase: 'Quantity verification',
  },
  {
    id: 'detailed-estimate',
    name: 'Detailed Estimate Service',
    price: 1295,
    turnaround: '72 hours',
    description: 'Full line-item breakdown with labor and materials',
    useCase: 'Budget development',
  },
  {
    id: 'estimate-review',
    name: 'Estimate Review',
    price: 695,
    turnaround: '48 hours',
    description: 'Expert review of existing estimates',
    useCase: 'Second opinion on contractor bids',
  },
  {
    id: 'bid-package',
    name: 'Professional Bid Package',
    price: 2495,
    turnaround: '5 business days',
    description: 'Complete bid-ready documentation',
    useCase: 'Competitive bidding',
  },
  {
    id: 'monthly-support',
    name: 'Monthly Estimation Support',
    price: 1995,
    priceUnit: '/month',
    turnaround: 'Ongoing',
    description: 'Dedicated estimation support',
    useCase: 'Contractors with regular needs',
  },
];

// CSI MasterFormat Divisions
export const CSI_DIVISIONS = [
  { code: '01', name: 'General Requirements' },
  { code: '02', name: 'Existing Conditions' },
  { code: '03', name: 'Concrete' },
  { code: '04', name: 'Masonry' },
  { code: '05', name: 'Metals' },
  { code: '06', name: 'Wood, Plastics & Composites' },
  { code: '07', name: 'Thermal & Moisture Protection' },
  { code: '08', name: 'Openings' },
  { code: '09', name: 'Finishes' },
  { code: '10', name: 'Specialties' },
  { code: '11', name: 'Equipment' },
  { code: '12', name: 'Furnishings' },
  { code: '21', name: 'Fire Suppression' },
  { code: '22', name: 'Plumbing' },
  { code: '23', name: 'HVAC' },
  { code: '26', name: 'Electrical' },
  { code: '27', name: 'Communications' },
  { code: '31', name: 'Earthwork' },
  { code: '32', name: 'Exterior Improvements' },
  { code: '33', name: 'Utilities' },
] as const;

// Sample Assembly Categories
export const ASSEMBLY_CATEGORIES = [
  'Sitework',
  'Foundations',
  'Concrete Flatwork',
  'Framing',
  'Roofing',
  'Exterior Finishes',
  'Interior Finishes',
  'Drywall',
  'Painting',
  'Flooring',
  'Tile',
  'Cabinetry',
  'Countertops',
  'Doors & Hardware',
  'Windows',
  'Plumbing Rough',
  'Plumbing Finish',
  'Electrical Rough',
  'Electrical Finish',
  'HVAC Rough',
  'HVAC Finish',
  'Insulation',
  'Demolition',
  'Cleanup',
  'Permits & Fees',
  'General Conditions',
] as const;

// Regional Cost Indices (DC-Baltimore focus)
export const REGIONAL_COST_INDICES = {
  national: 1.0,
  'Washington, DC': 1.18,
  'Baltimore, MD': 1.08,
  'Arlington, VA': 1.15,
  'Bethesda, MD': 1.12,
  'Silver Spring, MD': 1.1,
  'Annapolis, MD': 1.06,
  'Frederick, MD': 1.02,
  'Columbia, MD': 1.05,
  // Comparison cities
  'New York, NY': 1.32,
  'Los Angeles, CA': 1.14,
  'Chicago, IL': 1.15,
  'Houston, TX': 0.92,
  'Phoenix, AZ': 0.93,
} as const;

// AI-Powered Features
export const ESTIMATION_AI_FEATURES = {
  scopeAnalyzer: {
    name: 'AI Scope Analyzer',
    description: 'Identifies gaps and risks in project scope',
    capabilities: [
      'Completeness analysis',
      'Gap identification',
      'Risk assessment (10 risk types)',
      'Recommendations',
      'Confidence scoring',
    ],
  },
  costPredictor: {
    name: 'AI Cost Predictor',
    description: 'ML-based cost prediction and forecasting',
    capabilities: [
      'Confidence intervals',
      'Market trend analysis',
      'Inflation adjustment',
      'Historical comparison',
      'Percentile ranking',
    ],
  },
  valueEngineer: {
    name: 'AI Value Engineer',
    description: 'Automated cost optimization analysis',
    capabilities: [
      'Material substitution',
      'Design simplification',
      'Specification reduction',
      'Quantity optimization',
      'Bulk procurement opportunities',
    ],
    opportunityTypes: [
      'MATERIAL_SUBSTITUTION',
      'DESIGN_SIMPLIFICATION',
      'SPECIFICATION_REDUCTION',
      'QUANTITY_OPTIMIZATION',
      'SCOPE_REDUCTION',
      'PROCESS_IMPROVEMENT',
      'BULK_PROCUREMENT',
      'STANDARDIZATION',
      'PHASING_ADJUSTMENT',
    ],
  },
  planAnalyzer: {
    name: 'AI Plan Analyzer',
    description: 'Automated quantity extraction from drawings',
    capabilities: [
      'PDF/image analysis',
      'Automatic measurements',
      'Area/volume calculations',
      'Count extractions',
      'CSI categorization',
    ],
  },
};

// Market Trends (Sample Data)
export const MARKET_TRENDS = {
  concrete: { trend: 'UP', percentage: 5.2, source: 'BLS' },
  steel: { trend: 'UP', percentage: 8.5, source: 'BLS' },
  lumber: { trend: 'DOWN', percentage: 3.2, source: 'BLS' },
  labor: { trend: 'UP', percentage: 4.5, source: 'BLS' },
  equipment: { trend: 'UP', percentage: 3.8, source: 'BLS' },
  electrical: { trend: 'UP', percentage: 6.1, source: 'BLS' },
  plumbing: { trend: 'UP', percentage: 4.3, source: 'BLS' },
  hvac: { trend: 'UP', percentage: 5.7, source: 'BLS' },
} as const;

// Default Markup Structure
export const DEFAULT_ESTIMATE_MARKUPS = {
  overhead: 0.1, // 10%
  profit: 0.1, // 10%
  contingency: 0.05, // 5%
  wasteFactor: 0.1, // 10%
  laborBurden: 0.35, // 35% (fringe, taxes, insurance)
};

// Labor Trades (25+ supported)
export const LABOR_TRADES = [
  'General Labor',
  'Carpenter',
  'Electrician',
  'Plumber',
  'HVAC Technician',
  'Painter',
  'Drywall Finisher',
  'Tile Setter',
  'Roofer',
  'Mason',
  'Concrete Finisher',
  'Ironworker',
  'Sheet Metal Worker',
  'Insulator',
  'Glazier',
  'Flooring Installer',
  'Cabinet Maker',
  'Demolition Worker',
  'Equipment Operator',
  'Crane Operator',
  'Foreman',
  'Superintendent',
  'Project Manager',
  'Safety Officer',
  'Quality Control Inspector',
] as const;

// Estimation Workflow Status
export const ESTIMATE_STATUS_FLOW = [
  'DRAFT_ESTIMATE',
  'IN_PROGRESS_ESTIMATE',
  'UNDER_REVIEW_ESTIMATE',
  'PENDING_APPROVAL_ESTIMATE',
  'APPROVED_ESTIMATE',
  'SENT_ESTIMATE',
  'ACCEPTED_ESTIMATE',
  'REJECTED_ESTIMATE',
  'EXPIRED_ESTIMATE',
  'SUPERSEDED',
  'ARCHIVED_ESTIMATE',
] as const;

// Integration Points
export const ESTIMATION_INTEGRATIONS = {
  bidEngine: {
    name: 'Bid Engine Integration',
    description: 'Export estimates to bid requests',
    features: ['Link estimates to bids', 'Share cost data', 'Bid analysis'],
  },
  budgetTracker: {
    name: 'Budget Tracker Integration',
    description: 'Seed project budgets from estimates',
    features: ['Create budget items', 'Update totals', 'CSI code mapping'],
  },
  rsMeans: {
    name: 'RS Means Integration',
    description: 'Import RS Means cost data',
    features: ['City cost indices', 'Material costs', 'Labor rates'],
  },
};

// Sample Assemblies Preview
export const SAMPLE_ASSEMBLIES = [
  {
    code: '03-1000',
    name: 'Concrete Slab on Grade - 4"',
    unit: 'SF',
    productivity: '800 SF/day',
    crew: 4,
  },
  {
    code: '06-1100',
    name: 'Wood Stud Wall - 2x4 @ 16" OC',
    unit: 'SF',
    productivity: '200 SF/day',
    crew: 2,
  },
  {
    code: '07-3100',
    name: 'Asphalt Shingles - Architectural',
    unit: 'SQ',
    productivity: '15 SQ/day',
    crew: 3,
  },
  {
    code: '09-2900',
    name: 'Drywall - 1/2" Standard',
    unit: 'SF',
    productivity: '600 SF/day',
    crew: 2,
  },
  {
    code: '09-9100',
    name: 'Interior Latex Paint - 2 Coats',
    unit: 'SF',
    productivity: '400 SF/day',
    crew: 2,
  },
  {
    code: '22-4100',
    name: 'Toilet Installation - Standard',
    unit: 'EA',
    productivity: '4/day',
    crew: 1,
  },
  {
    code: '26-2700',
    name: 'Duplex Receptacle',
    unit: 'EA',
    productivity: '10/day',
    crew: 1,
  },
] as const;

// =============================================================================
// FINANCE & TRUST (m-finance-trust)
// =============================================================================

export const FINANCIAL_SERVICES = {
  escrow: {
    rate: 0.01, // 1%
    maxFee: 500,
    description: 'Milestone-based fund protection',
    features: [
      '3-party approval required',
      'Milestone-based releases',
      'Fraud protection',
      'Dispute resolution',
    ],
  },
  paymentProcessing: {
    rate: 0.029, // 2.9%
    perTransaction: 0.3, // $0.30
    description: 'Secure payment processing',
    methods: ['Credit Cards', 'ACH Bank Transfer', 'Invoice'],
  },
  rushProcessing: {
    fee: 150,
    turnaround: '4 business hours',
    description: 'Expedited fund release',
  },
  disputeResolution: {
    fee: 150,
    description: 'Professional mediation for payment disputes',
  },
};

// =============================================================================
// MARKETPLACE (marketplace.kealee.com)
// =============================================================================

export const MARKETPLACE_INFO = {
  model: 'Fair Bidding',
  features: [
    'No pay-to-play',
    'Fair rotation algorithm',
    'Transparent pricing',
    'Verified contractors',
    'Insurance verification',
    'License verification',
  ],
  commission: {
    rate: 0.035, // 3.5%
    paidBy: 'contractor',
    description: 'Platform commission on awarded contracts',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getServicesByCategory(category: OperationsService['category']) {
  return OPERATIONS_SERVICES.filter((s) => s.category === category);
}

export function calculateVolumeDiscount(quantity: number): number {
  const applicable = VOLUME_DISCOUNTS.filter((d) => quantity >= d.threshold).sort(
    (a, b) => b.threshold - a.threshold
  );
  return applicable[0]?.discount ?? 0;
}

export function calculateEscrowFee(projectAmount: number): number {
  return Math.min(projectAmount * FINANCIAL_SERVICES.escrow.rate, FINANCIAL_SERVICES.escrow.maxFee);
}

export function formatPrice(price: number | string, unit?: string): string {
  if (typeof price === 'string') return price;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
  return unit ? `${unit} ${formatted}` : formatted;
}

export function getEstimationTierByProject(projectValue: number): EstimationServiceTier {
  if (projectValue < 50000) return ESTIMATION_SERVICE_TIERS[0]; // Basic
  if (projectValue < 250000) return ESTIMATION_SERVICE_TIERS[1]; // Standard
  if (projectValue < 1000000) return ESTIMATION_SERVICE_TIERS[2]; // Premium
  return ESTIMATION_SERVICE_TIERS[3]; // Enterprise
}

export function getRegionalCostFactor(region: keyof typeof REGIONAL_COST_INDICES): number {
  return REGIONAL_COST_INDICES[region] ?? 1.0;
}

export function calculateEstimateMarkups(
  directCost: number,
  overrides?: Partial<typeof DEFAULT_ESTIMATE_MARKUPS>
): {
  directCost: number;
  overhead: number;
  profit: number;
  contingency: number;
  total: number;
} {
  const markups = { ...DEFAULT_ESTIMATE_MARKUPS, ...overrides };
  const overhead = directCost * markups.overhead;
  const subtotal = directCost + overhead;
  const profit = subtotal * markups.profit;
  const withProfit = subtotal + profit;
  const contingency = withProfit * markups.contingency;
  const total = withProfit + contingency;

  return {
    directCost,
    overhead,
    profit,
    contingency,
    total,
  };
}

// =============================================================================
// SEO & AI OPTIMIZATION DATA
// =============================================================================

export const SEO_KEYWORDS = {
  primary: [
    'construction project management',
    'building permits DC',
    'building permits Maryland',
    'construction operations',
    'remote project management',
    'construction estimation',
    'construction cost estimating',
    'contractor management',
  ],
  secondary: [
    'DC Baltimore construction',
    'permit application help',
    'construction cost estimate',
    'homeowner construction portal',
    'architect project management',
    'construction payment escrow',
    'contractor bidding platform',
    'material takeoff services',
    'quantity surveying',
    'bid leveling',
  ],
  longTail: [
    'how to get building permits in DC',
    'construction project management software',
    'remote construction operations services',
    'building permit application assistance',
    'construction cost estimation services',
    'find verified contractors DC Maryland',
    'AI construction estimating software',
    'CSI MasterFormat cost database',
    'RS Means cost data DC Maryland',
    'construction value engineering services',
    'material takeoff from blueprints',
    'construction bid package preparation',
  ],
  estimation: [
    'construction estimating services',
    'detailed construction estimate',
    'contractor bid estimate',
    'value engineering analysis',
    'change order review',
    'insurance claim estimate Xactimate',
    'material quantity takeoff',
    'labor cost breakdown',
    'cash flow projection construction',
    'construction feasibility analysis',
  ],
};

export const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kealee Platform',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: 0,
    highPrice: 16500,
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.8,
    ratingCount: 1250,
  },
};

// =============================================================================
// NAVIGATION & APP STRUCTURE
// =============================================================================

// =============================================================================
// USER ROLES & PERSONAS
// Note: Each role has its own portal - they are NOT comparable
// - Homeowner/Developer/BusinessOwner/PropertyManager: Looking for services
// - Contractor/Professional: Providing services
// =============================================================================

export type UserRole =
  | 'homeowner' // Residential homeowners
  | 'developer' // Real estate developers + Property managers (multi-property)
  | 'owner' // Property owners + Business owners (individual property)
  | 'contractor' // GCs, builders
  | 'professional' // Architects, designers, engineers
  | 'subcontractor'
  | 'estimator';

// User personas with detailed descriptions
export interface UserPersona {
  role: UserRole;
  name: string;
  description: string;
  lookingFor: string[];
  portalUrl: string;
  icon: string;
  color: string;
}

// Service SEEKERS - Looking for platform services and contractors
// NOTE: Consolidated portal structure:
// - Developer Portal: Developers + Property Managers (multi-property/portfolio management)
// - Owner Portal: Business Owners + Property Owners (individual property management)
export const SERVICE_SEEKERS: UserPersona[] = [
  {
    role: 'homeowner',
    name: 'Homeowner',
    description: 'Residential homeowners planning renovations, additions, or new construction',
    lookingFor: [
      'Verified contractors',
      'Project cost estimates',
      'Permit assistance',
      'Project management support',
      'Payment protection (escrow)',
    ],
    portalUrl: 'app.kealee.com',
    icon: 'Home',
    color: 'skyBlue',
  },
  {
    role: 'developer',
    name: 'Developer & Property Manager',
    description: 'Real estate developers and property managers handling multiple properties or development projects',
    lookingFor: [
      'Contractor sourcing at scale',
      'Multi-project estimation',
      'Permit management across jurisdictions',
      'Portfolio tracking & analytics',
      'Team coordination',
      'Work order management',
      'Vendor network management',
    ],
    portalUrl: 'developer.kealee.com',
    icon: 'Building2',
    color: 'purple',
  },
  {
    role: 'owner',
    name: 'Property & Business Owner',
    description: 'Commercial and residential property owners managing their buildings',
    lookingFor: [
      'Contractor network',
      'Tenant improvement estimates',
      'Maintenance scheduling',
      'Permit coordination',
      'Budget tracking',
      'Compliance management',
    ],
    portalUrl: 'owner.kealee.com',
    icon: 'Building',
    color: 'orange',
  },
];

// Service PROVIDERS - Providing services to seekers
export const SERVICE_PROVIDERS: UserPersona[] = [
  {
    role: 'contractor',
    name: 'Contractor',
    description: 'General contractors and builders',
    lookingFor: [
      'Project opportunities',
      'Estimation tools',
      'Team management',
      'Schedule management',
      'Payment processing',
    ],
    portalUrl: 'contractor.kealee.com',
    icon: 'HardHat',
    color: 'orange',
  },
  {
    role: 'professional',
    name: 'Professional',
    description: 'Architects, designers, and engineers',
    lookingFor: [
      'Client project management',
      'Deliverable tracking',
      'Fee management',
      'Permit coordination',
      'Collaboration tools',
    ],
    portalUrl: 'professional.kealee.com',
    icon: 'PenTool',
    color: 'teal',
  },
];

// =============================================================================
// NAVIGATION STRUCTURE (TOPBAR WITH DROPDOWNS)
// All portals use topbar navigation - no sidebars
// =============================================================================

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavItem[];
}

export interface TopbarNavItem {
  id: string;
  label: string;
  href?: string; // Optional - if dropdown, no direct href
  icon?: string;
  isDropdown?: boolean;
  dropdownSections?: TopbarDropdownSection[];
}

export interface TopbarDropdownSection {
  title?: string;
  items: TopbarDropdownItem[];
}

export interface TopbarDropdownItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: string;
  badge?: string;
}

// Portal topbar navigation structure
export interface PortalTopbarNav {
  logo: { href: string; label: string };
  mainItems: TopbarNavItem[];
  rightItems: TopbarNavItem[];
}

export interface ClientPortal {
  id: string;
  name: string;
  shortName: string;
  url: string;
  description: string;
  primaryUsers: UserRole[];
  icon: string;
  color: string;
  loginRequired: true;
  features: string[];
}

export interface PlatformService {
  id: string;
  name: string;
  shortName: string;
  url?: string; // Some services are integrated, not standalone
  description: string;
  availableTo: UserRole[];
  icon: string;
  color: string;
  integrated: boolean; // true = available within portal dashboards
}

// =============================================================================
// CLIENT PORTALS (Login Required - Paid Clients)
// 5 portals - consolidated structure for distinct user types
// - Developer Portal: Developers + Property Managers (multi-property professionals)
// - Owner Portal: Business Owners + Property Owners (individual building management)
// =============================================================================

export const CLIENT_PORTALS: ClientPortal[] = [
  // SERVICE SEEKERS - Looking for contractors and platform services
  {
    id: 'm-homeowner',
    name: 'Homeowner Portal',
    shortName: 'Homeowner',
    url: 'app.kealee.com',
    description: 'Project visibility and control for residential homeowners',
    primaryUsers: ['homeowner'],
    icon: 'Home',
    color: 'skyBlue',
    loginRequired: true,
    features: [
      'Project dashboard',
      'Find verified contractors',
      'Cost estimates',
      'Permit assistance',
      'Payment protection (escrow)',
      'Document storage',
      'Progress reports',
    ],
  },
  {
    id: 'm-developer',
    name: 'Developer Portal',
    shortName: 'Developer',
    url: 'developer.kealee.com',
    description: 'Multi-project management for developers and property managers',
    primaryUsers: ['developer'],
    icon: 'Building2',
    color: 'purple',
    loginRequired: true,
    features: [
      'Portfolio dashboard',
      'Multi-project management',
      'Contractor sourcing at scale',
      'Portfolio-wide estimation',
      'Permit management across jurisdictions',
      'Work order management',
      'Budget tracking & cash flow',
      'Team coordination',
      'Vendor network management',
      'Investor & owner reporting',
    ],
  },
  {
    id: 'm-owner',
    name: 'Owner Portal',
    shortName: 'Owner',
    url: 'owner.kealee.com',
    description: 'Property management for business and property owners',
    primaryUsers: ['owner'],
    icon: 'Building',
    color: 'orange',
    loginRequired: true,
    features: [
      'Property dashboard',
      'Tenant improvement management',
      'Contractor network',
      'Maintenance scheduling',
      'Vendor management',
      'Budget tracking',
      'Compliance tracking',
      'Permit coordination',
    ],
  },
  // SERVICE PROVIDERS - Providing services to seekers
  {
    id: 'm-contractor',
    name: 'Contractor Portal',
    shortName: 'Contractor',
    url: 'contractor.kealee.com',
    description: 'Full project management for general contractors and builders',
    primaryUsers: ['contractor'],
    icon: 'HardHat',
    color: 'orange',
    loginRequired: true,
    features: [
      'Multi-project dashboard',
      'Bid management',
      'Estimation tools & assembly library',
      'Team & subcontractor management',
      'Schedule & Gantt charts',
      'Budget tracking',
      'Payment processing',
    ],
  },
  {
    id: 'm-professional',
    name: 'Professional Portal',
    shortName: 'Professional',
    url: 'professional.kealee.com',
    description: 'Project management for architects, designers, and engineers',
    primaryUsers: ['professional'],
    icon: 'PenTool',
    color: 'teal',
    loginRequired: true,
    features: [
      'Design project dashboard',
      'Phase & deliverable tracking',
      'Client collaboration',
      'Fee & payment management',
      'Permit coordination',
      'Document management',
    ],
  },
];

// =============================================================================
// PLATFORM SERVICES (Available within Client Portals)
// These are services that clients can access from their dashboard
// =============================================================================

export const PLATFORM_SERVICES: PlatformService[] = [
  {
    id: 'estimation',
    name: 'Estimation Services',
    shortName: 'Estimation',
    url: 'estimation.kealee.com',
    description: 'AI-powered construction cost estimation',
    availableTo: ['homeowner', 'contractor', 'professional', 'estimator'],
    icon: 'Calculator',
    color: 'teal',
    integrated: true,
  },
  {
    id: 'permits',
    name: 'Permits & Inspections',
    shortName: 'Permits',
    url: 'permits.kealee.com',
    description: 'AI-powered permit processing and inspection coordination',
    availableTo: ['homeowner', 'contractor', 'professional'],
    icon: 'FileCheck',
    color: 'green',
    integrated: true,
  },
  {
    id: 'marketplace',
    name: 'Contractor Marketplace',
    shortName: 'Marketplace',
    url: 'marketplace.kealee.com',
    description: 'Fair bidding platform for verified contractors',
    availableTo: ['homeowner', 'contractor', 'subcontractor'],
    icon: 'Store',
    color: 'skyBlue',
    integrated: true,
  },
  {
    id: 'finance',
    name: 'Finance & Trust',
    shortName: 'Finance',
    description: 'Escrow, payments, and financial services',
    availableTo: ['homeowner', 'contractor', 'professional'],
    icon: 'Shield',
    color: 'green',
    integrated: true,
  },
  {
    id: 'pm-services',
    name: 'PM Services',
    shortName: 'PM Services',
    url: 'ops.kealee.com',
    description: 'Managed project management services',
    availableTo: ['homeowner', 'contractor'],
    icon: 'Briefcase',
    color: 'orange',
    integrated: true,
  },
];

// Legacy export for backwards compatibility
export const APP_PORTALS = CLIENT_PORTALS;

// Navigation structure for Homeowner dashboard (residential homeowners)
export const HOMEOWNER_NAVIGATION: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'projects',
    label: 'My Projects',
    href: '/projects',
    icon: 'FolderKanban',
    children: [
      { id: 'projects-active', label: 'Active Projects', href: '/projects?status=active' },
      { id: 'projects-completed', label: 'Completed', href: '/projects?status=completed' },
      { id: 'projects-new', label: 'Start New Project', href: '/projects/new' },
    ],
  },
  {
    id: 'precon',
    label: 'Pre-Construction',
    href: '/precon',
    icon: 'ClipboardList',
    children: [
      { id: 'precon-pipeline', label: 'Project Pipeline', href: '/precon' },
      { id: 'precon-design', label: 'Design Packages', href: '/precon/design' },
      { id: 'precon-srp', label: 'Cost Estimates', href: '/precon/estimates' },
    ],
  },
  {
    id: 'estimation',
    label: 'Estimation',
    href: '/estimation',
    icon: 'Calculator',
    badge: 'New',
    children: [
      { id: 'estimation-request', label: 'Request Estimate', href: '/estimation/new' },
      { id: 'estimation-history', label: 'My Estimates', href: '/estimation' },
      { id: 'estimation-compare', label: 'Compare Estimates', href: '/estimation/compare' },
    ],
  },
  {
    id: 'permits',
    label: 'Permits',
    href: '/permits',
    icon: 'FileCheck',
    children: [
      { id: 'permits-active', label: 'Active Permits', href: '/permits' },
      { id: 'permits-new', label: 'New Application', href: '/permits/new' },
      { id: 'permits-inspections', label: 'Inspections', href: '/permits/inspections' },
    ],
  },
  {
    id: 'marketplace',
    label: 'Find Contractors',
    href: '/marketplace',
    icon: 'Users',
    children: [
      { id: 'marketplace-search', label: 'Search Contractors', href: '/marketplace' },
      { id: 'marketplace-bids', label: 'Active Bids', href: '/marketplace/bids' },
      { id: 'marketplace-saved', label: 'Saved Contractors', href: '/marketplace/saved' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/payments',
    icon: 'CreditCard',
    children: [
      { id: 'payments-escrow', label: 'Escrow Account', href: '/payments/escrow' },
      { id: 'payments-history', label: 'Payment History', href: '/payments/history' },
      { id: 'payments-schedule', label: 'Payment Schedule', href: '/payments/schedule' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/documents',
    icon: 'FileText',
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
];

// Navigation structure for Contractor dashboard
// Includes: GCs, developers, commercial building owners, investors
export const CONTRACTOR_NAVIGATION: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    icon: 'FolderKanban',
  },
  {
    id: 'estimation',
    label: 'Estimation',
    href: '/estimation',
    icon: 'Calculator',
    children: [
      { id: 'estimation-new', label: 'New Estimate', href: '/estimation/new' },
      { id: 'estimation-library', label: 'Assembly Library', href: '/estimation/assemblies' },
      { id: 'estimation-history', label: 'Estimate History', href: '/estimation' },
      { id: 'estimation-templates', label: 'Templates', href: '/estimation/templates' },
    ],
  },
  {
    id: 'bids',
    label: 'Bidding',
    href: '/bids',
    icon: 'Gavel',
    children: [
      { id: 'bids-opportunities', label: 'Opportunities', href: '/bids/opportunities' },
      { id: 'bids-submitted', label: 'Submitted Bids', href: '/bids/submitted' },
      { id: 'bids-won', label: 'Won Projects', href: '/bids/won' },
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    href: '/schedule',
    icon: 'Calendar',
  },
  {
    id: 'team',
    label: 'Team',
    href: '/team',
    icon: 'Users',
    children: [
      { id: 'team-members', label: 'Team Members', href: '/team' },
      { id: 'team-subs', label: 'Subcontractors', href: '/team/subcontractors' },
      { id: 'team-invites', label: 'Invitations', href: '/team/invites' },
    ],
  },
  {
    id: 'permits',
    label: 'Permits',
    href: '/permits',
    icon: 'FileCheck',
    children: [
      { id: 'permits-active', label: 'Active Permits', href: '/permits' },
      { id: 'permits-new', label: 'New Application', href: '/permits/new' },
      { id: 'permits-inspections', label: 'Inspections', href: '/permits/inspections' },
    ],
  },
  {
    id: 'finances',
    label: 'Finances',
    href: '/finances',
    icon: 'DollarSign',
    children: [
      { id: 'finances-overview', label: 'Overview', href: '/finances' },
      { id: 'finances-invoices', label: 'Invoices', href: '/finances/invoices' },
      { id: 'finances-payments', label: 'Payments', href: '/finances/payments' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/documents',
    icon: 'FileText',
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
];

// =============================================================================
// CONTRACTOR PORTAL DASHBOARD PAGES
// Detailed page definitions with features, plan limits, and descriptions
// =============================================================================

export interface DashboardPage {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  href: string;
  icon: string;
  features: string[];
  planRequirements?: {
    starter?: string | boolean;
    professional?: string | boolean;
    business?: string | boolean;
    enterprise?: string | boolean;
  };
  tabs?: { id: string; label: string; description: string }[];
}

export const CONTRACTOR_DASHBOARD_PAGES: DashboardPage[] = [
  {
    id: 'multi-project-dashboard',
    name: 'Multi-Project Dashboard',
    shortDescription: 'Manage all your projects from a single command center.',
    description:
      'Central hub showing all active projects, pending bids, revenue metrics, and quick actions. View project status at a glance with kanban-style organization.',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    features: [
      'Project status overview (Active, Scheduled, Bidding, Completed)',
      'Revenue metrics (MTD, YTD, trends)',
      'Pending bid alerts',
      'Quick action shortcuts',
      'Kanban-style project view',
      'Recent activity feed',
    ],
    planRequirements: {
      starter: '3 projects max',
      professional: '10 projects max',
      business: '25 projects max',
      enterprise: 'Unlimited projects',
    },
  },
  {
    id: 'bid-management',
    name: 'Bid Management',
    shortDescription: 'Find opportunities, submit bids, and track win rates.',
    description:
      'Complete bid lifecycle management from finding marketplace opportunities to tracking submitted bids and won projects. Integrated with Kealee Marketplace.',
    href: '/bids',
    icon: 'Gavel',
    features: [
      'Marketplace opportunity browser with filters',
      'Bid submission workflow',
      'Submitted bids tracking',
      'Won projects management',
      'Win rate analytics',
      'Bid expiration alerts',
    ],
    tabs: [
      { id: 'opportunities', label: 'Opportunities', description: 'Browse projects from Kealee Marketplace' },
      { id: 'submitted', label: 'Submitted Bids', description: 'Track your pending and reviewed bids' },
      { id: 'won', label: 'Won Projects', description: 'Manage awarded contracts' },
    ],
    planRequirements: {
      starter: 'Basic bid management',
      professional: 'Advanced bid management',
      business: 'Priority marketplace placement',
      enterprise: 'Custom bid workflows',
    },
  },
  {
    id: 'estimation-tools',
    name: 'Estimation Tools',
    shortDescription: 'Full estimation suite with 100+ pre-built assemblies.',
    description:
      'Professional-grade estimation workspace with line-item builder, assembly library, templates, and markup controls. Create accurate bids in minutes.',
    href: '/estimation',
    icon: 'Calculator',
    features: [
      'Line-item estimate builder',
      'CSI MasterFormat divisions',
      '1,000+ pre-built assemblies',
      'Custom assembly creation',
      'Template library',
      'Markup controls (overhead, profit, contingency)',
      'PDF and Excel export',
      'AI-assisted estimation',
    ],
    tabs: [
      { id: 'new', label: 'New Estimate', description: 'Create a new project estimate' },
      { id: 'library', label: 'Assembly Library', description: 'Browse and manage assemblies' },
      { id: 'templates', label: 'Templates', description: 'Save and reuse estimate templates' },
      { id: 'history', label: 'History', description: 'View past estimates' },
    ],
    planRequirements: {
      starter: 'Basic estimation tools',
      professional: 'Full estimation suite + assembly library',
      business: 'Custom assembly library',
      enterprise: 'Unlimited + API access',
    },
  },
  {
    id: 'team-collaboration',
    name: 'Team Collaboration',
    shortDescription: 'Invite team members and subcontractors with role-based access.',
    description:
      'Manage your internal team and subcontractor network. Set role-based permissions, send portal invitations, and track collaboration across projects.',
    href: '/team',
    icon: 'Users',
    features: [
      'Team member management',
      'Role-based permissions',
      'Subcontractor network',
      'Subcontractor portal access',
      'Invitation management',
      'Activity tracking',
    ],
    tabs: [
      { id: 'members', label: 'Team Members', description: 'Manage your internal team' },
      { id: 'subcontractors', label: 'Subcontractors', description: 'Your subcontractor network' },
      { id: 'invitations', label: 'Invitations', description: 'Pending team invitations' },
    ],
    planRequirements: {
      starter: '3 team members',
      professional: '10 team members + subcontractor portal',
      business: 'Unlimited team members',
      enterprise: 'Unlimited + SSO',
    },
  },
  {
    id: 'scheduling-gantt',
    name: 'Scheduling & Gantt',
    shortDescription: 'Visual scheduling with dependencies and resource allocation.',
    description:
      'Professional scheduling tools with Gantt charts, calendar views, resource allocation, and task dependencies. Keep all projects on track.',
    href: '/schedule',
    icon: 'Calendar',
    features: [
      'Interactive Gantt charts',
      'Task dependencies (FS, SS, FF, SF)',
      'Resource allocation view',
      'Calendar integration',
      'Milestone tracking',
      'Progress visualization',
      'Multi-project timeline',
    ],
    tabs: [
      { id: 'gantt', label: 'Gantt', description: 'Visual timeline with dependencies' },
      { id: 'calendar', label: 'Calendar', description: 'Calendar view of tasks' },
      { id: 'list', label: 'List', description: 'Table view with sorting' },
      { id: 'resources', label: 'Resources', description: 'Team allocation and utilization' },
    ],
    planRequirements: {
      starter: 'Basic scheduling',
      professional: 'Gantt charts + dependencies',
      business: 'Resource allocation + multi-project',
      enterprise: 'Advanced scheduling + integrations',
    },
  },
  {
    id: 'financial-tracking',
    name: 'Financial Tracking',
    shortDescription: 'Invoice clients, track payments, and manage cash flow.',
    description:
      'Complete financial management with invoicing, payment tracking, escrow integration, and reporting. Monitor project profitability and cash flow.',
    href: '/finances',
    icon: 'DollarSign',
    features: [
      'Revenue and expense tracking',
      'Invoice creation and management',
      'Payment tracking',
      'Escrow integration',
      'Project profitability analysis',
      'Cash flow forecasting',
      'Financial reports',
      'Tax-ready exports (1099)',
    ],
    tabs: [
      { id: 'overview', label: 'Overview', description: 'Financial dashboard and metrics' },
      { id: 'invoices', label: 'Invoices', description: 'Create and manage invoices' },
      { id: 'payments', label: 'Payments', description: 'Track incoming payments' },
      { id: 'reports', label: 'Reports', description: 'Financial reports and exports' },
    ],
    planRequirements: {
      starter: 'Basic invoicing',
      professional: 'Full financial tracking',
      business: 'Advanced reporting + analytics',
      enterprise: 'Custom reports + API',
    },
  },
];

// =============================================================================
// À LA CARTE SERVICES (Available to Homeowners & Contractors)
// Individual services purchasable without subscription
// =============================================================================

export interface AlaCarteService {
  id: string;
  name: string;
  price: number;
  priceUnit?: 'from' | 'starting at' | 'per';
  category: 'project-controls' | 'estimation' | 'permits' | 'finance';
  description: string;
  turnaround?: string;
  availableTo: UserRole[];
  deliverables?: string[];
}

export const ALACARTE_SERVICES: AlaCarteService[] = [
  // Project Controls
  {
    id: 'site-analysis',
    name: 'Site Analysis Report',
    price: 125,
    category: 'project-controls',
    description: 'Comprehensive site assessment documenting existing conditions, constraints, and opportunities.',
    turnaround: '2-3 business days',
    availableTo: ['homeowner', 'contractor'],
    deliverables: ['PDF report', 'Photo documentation', 'Recommendations'],
  },
  {
    id: 'scope-development',
    name: 'Scope of Work Development',
    price: 195,
    category: 'project-controls',
    description: 'Detailed scope document defining project requirements and specifications.',
    turnaround: '3-5 business days',
    availableTo: ['homeowner', 'contractor'],
    deliverables: ['Scope document', 'Specifications list'],
  },
  {
    id: 'permit-research',
    name: 'Permit Requirements Research',
    price: 95,
    category: 'project-controls',
    description: 'Research and documentation of all permit requirements for your project.',
    turnaround: '1-2 business days',
    availableTo: ['homeowner', 'contractor', 'professional'],
    deliverables: ['Requirements checklist', 'Jurisdiction contacts'],
  },
  {
    id: 'contractor-vetting',
    name: 'Contractor Vetting & Verification',
    price: 175,
    category: 'project-controls',
    description: 'Background verification, license check, insurance validation, and reference calls.',
    turnaround: '3-5 business days',
    availableTo: ['homeowner'],
    deliverables: ['Verification report', 'License status', 'Insurance certificate', 'References'],
  },
  {
    id: 'bid-leveling',
    name: 'Bid Leveling & Analysis',
    price: 245,
    category: 'project-controls',
    description: 'Normalize and compare contractor bids for fair, apples-to-apples comparison.',
    turnaround: '2-3 business days',
    availableTo: ['homeowner'],
    deliverables: ['Comparison matrix', 'Recommendations', 'Questions for contractors'],
  },
  {
    id: 'contract-review',
    name: 'Construction Contract Review',
    price: 295,
    category: 'project-controls',
    description: 'Expert review of construction contracts to protect your interests.',
    turnaround: '3-5 business days',
    availableTo: ['homeowner', 'contractor'],
    deliverables: ['Review summary', 'Red flags', 'Suggested modifications'],
  },
  {
    id: 'draw-request-review',
    name: 'Draw Request Review',
    price: 145,
    category: 'project-controls',
    description: 'Verify work completion before releasing milestone payments.',
    turnaround: '1-2 business days',
    availableTo: ['homeowner'],
    deliverables: ['Verification report', 'Photo documentation', 'Release recommendation'],
  },
  {
    id: 'punch-list',
    name: 'Punch List Development',
    price: 225,
    category: 'project-controls',
    description: 'Comprehensive punch list documenting all items requiring correction.',
    turnaround: '2-3 business days',
    availableTo: ['homeowner', 'contractor'],
    deliverables: ['Punch list document', 'Photo documentation', 'Priority ranking'],
  },
  {
    id: 'closeout-review',
    name: 'Project Closeout Review',
    price: 175,
    category: 'project-controls',
    description: 'Final review ensuring all project requirements are met before final payment.',
    turnaround: '2-3 business days',
    availableTo: ['homeowner'],
    deliverables: ['Closeout checklist', 'Final documentation', 'Warranty information'],
  },
  {
    id: 'warranty-assistance',
    name: 'Warranty Claim Assistance',
    price: 150,
    category: 'project-controls',
    description: 'Help filing and managing warranty claims with contractors.',
    turnaround: 'Ongoing',
    availableTo: ['homeowner'],
    deliverables: ['Claim documentation', 'Communication support', 'Resolution tracking'],
  },
  {
    id: 'permit-prep',
    name: 'Permit Application Preparation',
    price: 295,
    category: 'permits',
    description: 'Prepare complete permit applications for jurisdiction submission.',
    turnaround: '3-5 business days',
    availableTo: ['homeowner', 'contractor', 'professional'],
    deliverables: ['Completed application', 'Required documents', 'Submission instructions'],
  },
  // Estimation Services
  {
    id: 'quick-estimate',
    name: 'Quick Estimate',
    price: 195,
    priceUnit: 'from',
    category: 'estimation',
    description: 'Ballpark estimate for budgeting and feasibility analysis.',
    turnaround: '24-48 hours',
    availableTo: ['homeowner', 'contractor', 'professional'],
    deliverables: ['PDF estimate', 'Budget range', 'Key assumptions'],
  },
  {
    id: 'detailed-estimate',
    name: 'Detailed Estimate',
    price: 595,
    priceUnit: 'from',
    category: 'estimation',
    description: 'Line-item estimate with quantities, unit costs, and labor breakdown.',
    turnaround: '5-7 business days',
    availableTo: ['homeowner', 'contractor', 'professional'],
    deliverables: ['PDF report', 'Excel breakdown', 'Material list', 'Labor analysis'],
  },
];

// Volume discounts for à la carte services
export const ALACARTE_VOLUME_DISCOUNTS = [
  { threshold: 3, discount: 0.05, label: '5% off 3+ services' },
  { threshold: 5, discount: 0.10, label: '10% off 5+ services' },
  { threshold: 10, discount: 0.15, label: '15% off 10+ services' },
];

// Plan-based discounts for à la carte services
export const ALACARTE_PLAN_DISCOUNTS: Record<string, number> = {
  starter: 0,
  professional: 0.10, // 10% off
  business: 0.15, // 15% off
  enterprise: 0.20, // 20% off
};

// =============================================================================
// ASSEMBLY LIBRARY - CSI MASTERFORMAT DIVISIONS
// 1000+ Pre-built construction cost assemblies
// =============================================================================

export interface CSIDivision {
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  subdivisions: CSISubdivision[];
  assemblyCount: number;
}

export interface CSISubdivision {
  code: string;
  name: string;
  assemblyCount: number;
}

export interface AssemblyItem {
  id: string;
  code: string;
  name: string;
  description: string;
  divisionCode: string;
  subdivisionCode?: string;
  category: string;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  totalCost: number;
  laborHours: number;
  tags: string[];
}

// CSI MasterFormat 2020 Divisions (Construction Industry Standard)
export const CSI_DIVISIONS: CSIDivision[] = [
  {
    code: '01',
    name: 'General Requirements',
    description: 'Administrative and procedural requirements for construction',
    icon: 'ClipboardList',
    color: '#6B7280',
    assemblyCount: 45,
    subdivisions: [
      { code: '01 10 00', name: 'Summary', assemblyCount: 5 },
      { code: '01 20 00', name: 'Price and Payment Procedures', assemblyCount: 8 },
      { code: '01 30 00', name: 'Administrative Requirements', assemblyCount: 12 },
      { code: '01 40 00', name: 'Quality Requirements', assemblyCount: 10 },
      { code: '01 50 00', name: 'Temporary Facilities and Controls', assemblyCount: 10 },
    ],
  },
  {
    code: '03',
    name: 'Concrete',
    description: 'Cast-in-place concrete, precast concrete, and cementitious materials',
    icon: 'Box',
    color: '#9CA3AF',
    assemblyCount: 85,
    subdivisions: [
      { code: '03 10 00', name: 'Concrete Forming and Accessories', assemblyCount: 15 },
      { code: '03 20 00', name: 'Concrete Reinforcing', assemblyCount: 12 },
      { code: '03 30 00', name: 'Cast-in-Place Concrete', assemblyCount: 25 },
      { code: '03 40 00', name: 'Precast Concrete', assemblyCount: 18 },
      { code: '03 50 00', name: 'Cast Decks and Underlayment', assemblyCount: 8 },
      { code: '03 60 00', name: 'Grouting', assemblyCount: 7 },
    ],
  },
  {
    code: '04',
    name: 'Masonry',
    description: 'Unit masonry, stone, and masonry restoration',
    icon: 'Layers',
    color: '#B45309',
    assemblyCount: 72,
    subdivisions: [
      { code: '04 20 00', name: 'Unit Masonry', assemblyCount: 35 },
      { code: '04 40 00', name: 'Stone Assemblies', assemblyCount: 15 },
      { code: '04 50 00', name: 'Refractory Masonry', assemblyCount: 8 },
      { code: '04 70 00', name: 'Manufactured Masonry', assemblyCount: 14 },
    ],
  },
  {
    code: '05',
    name: 'Metals',
    description: 'Structural metal framing, metal fabrications, and ornamental metals',
    icon: 'Wrench',
    color: '#4B5563',
    assemblyCount: 68,
    subdivisions: [
      { code: '05 10 00', name: 'Structural Metal Framing', assemblyCount: 22 },
      { code: '05 20 00', name: 'Metal Joists', assemblyCount: 10 },
      { code: '05 30 00', name: 'Metal Decking', assemblyCount: 12 },
      { code: '05 40 00', name: 'Cold-Formed Metal Framing', assemblyCount: 14 },
      { code: '05 50 00', name: 'Metal Fabrications', assemblyCount: 10 },
    ],
  },
  {
    code: '06',
    name: 'Wood, Plastics, and Composites',
    description: 'Rough carpentry, finish carpentry, and architectural woodwork',
    icon: 'TreePine',
    color: '#92400E',
    assemblyCount: 95,
    subdivisions: [
      { code: '06 10 00', name: 'Rough Carpentry', assemblyCount: 30 },
      { code: '06 20 00', name: 'Finish Carpentry', assemblyCount: 25 },
      { code: '06 40 00', name: 'Architectural Woodwork', assemblyCount: 20 },
      { code: '06 50 00', name: 'Structural Plastics', assemblyCount: 8 },
      { code: '06 60 00', name: 'Plastic Fabrications', assemblyCount: 12 },
    ],
  },
  {
    code: '07',
    name: 'Thermal and Moisture Protection',
    description: 'Waterproofing, insulation, roofing, and siding',
    icon: 'Umbrella',
    color: '#0369A1',
    assemblyCount: 88,
    subdivisions: [
      { code: '07 10 00', name: 'Dampproofing and Waterproofing', assemblyCount: 12 },
      { code: '07 20 00', name: 'Thermal Protection', assemblyCount: 18 },
      { code: '07 30 00', name: 'Steep Slope Roofing', assemblyCount: 20 },
      { code: '07 40 00', name: 'Roofing and Siding Panels', assemblyCount: 15 },
      { code: '07 50 00', name: 'Membrane Roofing', assemblyCount: 12 },
      { code: '07 60 00', name: 'Flashing and Sheet Metal', assemblyCount: 11 },
    ],
  },
  {
    code: '08',
    name: 'Openings',
    description: 'Doors, windows, entrances, and glazing',
    icon: 'DoorOpen',
    color: '#7C3AED',
    assemblyCount: 76,
    subdivisions: [
      { code: '08 10 00', name: 'Doors and Frames', assemblyCount: 22 },
      { code: '08 30 00', name: 'Specialty Doors and Frames', assemblyCount: 10 },
      { code: '08 40 00', name: 'Entrances, Storefronts', assemblyCount: 14 },
      { code: '08 50 00', name: 'Windows', assemblyCount: 18 },
      { code: '08 80 00', name: 'Glazing', assemblyCount: 12 },
    ],
  },
  {
    code: '09',
    name: 'Finishes',
    description: 'Plaster, gypsum board, tile, flooring, ceilings, and paint',
    icon: 'Paintbrush',
    color: '#DC2626',
    assemblyCount: 120,
    subdivisions: [
      { code: '09 20 00', name: 'Plaster and Gypsum Board', assemblyCount: 25 },
      { code: '09 30 00', name: 'Tiling', assemblyCount: 22 },
      { code: '09 50 00', name: 'Ceilings', assemblyCount: 18 },
      { code: '09 60 00', name: 'Flooring', assemblyCount: 28 },
      { code: '09 70 00', name: 'Wall Finishes', assemblyCount: 12 },
      { code: '09 90 00', name: 'Painting and Coating', assemblyCount: 15 },
    ],
  },
  {
    code: '10',
    name: 'Specialties',
    description: 'Visual display, compartments, lockers, and signage',
    icon: 'Tags',
    color: '#059669',
    assemblyCount: 42,
    subdivisions: [
      { code: '10 10 00', name: 'Visual Display Units', assemblyCount: 8 },
      { code: '10 20 00', name: 'Interior Specialties', assemblyCount: 15 },
      { code: '10 40 00', name: 'Safety Specialties', assemblyCount: 10 },
      { code: '10 70 00', name: 'Exterior Specialties', assemblyCount: 9 },
    ],
  },
  {
    code: '11',
    name: 'Equipment',
    description: 'Commercial, residential, and industrial equipment',
    icon: 'Settings2',
    color: '#0891B2',
    assemblyCount: 55,
    subdivisions: [
      { code: '11 20 00', name: 'Commercial Equipment', assemblyCount: 18 },
      { code: '11 30 00', name: 'Residential Equipment', assemblyCount: 20 },
      { code: '11 40 00', name: 'Foodservice Equipment', assemblyCount: 12 },
      { code: '11 70 00', name: 'Healthcare Equipment', assemblyCount: 5 },
    ],
  },
  {
    code: '12',
    name: 'Furnishings',
    description: 'Art, window treatments, furniture, and rugs',
    icon: 'Armchair',
    color: '#D97706',
    assemblyCount: 38,
    subdivisions: [
      { code: '12 20 00', name: 'Window Treatments', assemblyCount: 10 },
      { code: '12 30 00', name: 'Casework', assemblyCount: 15 },
      { code: '12 50 00', name: 'Furniture', assemblyCount: 8 },
      { code: '12 60 00', name: 'Multiple Seating', assemblyCount: 5 },
    ],
  },
  {
    code: '21',
    name: 'Fire Suppression',
    description: 'Fire suppression sprinkler systems and equipment',
    icon: 'Flame',
    color: '#EF4444',
    assemblyCount: 28,
    subdivisions: [
      { code: '21 10 00', name: 'Water-Based Fire-Suppression', assemblyCount: 18 },
      { code: '21 20 00', name: 'Fire-Extinguishing Systems', assemblyCount: 10 },
    ],
  },
  {
    code: '22',
    name: 'Plumbing',
    description: 'Plumbing piping, fixtures, and equipment',
    icon: 'Droplet',
    color: '#3B82F6',
    assemblyCount: 78,
    subdivisions: [
      { code: '22 10 00', name: 'Plumbing Piping and Pumps', assemblyCount: 25 },
      { code: '22 30 00', name: 'Plumbing Equipment', assemblyCount: 18 },
      { code: '22 40 00', name: 'Plumbing Fixtures', assemblyCount: 35 },
    ],
  },
  {
    code: '23',
    name: 'HVAC',
    description: 'Heating, ventilating, and air conditioning',
    icon: 'Wind',
    color: '#06B6D4',
    assemblyCount: 92,
    subdivisions: [
      { code: '23 10 00', name: 'Facility Fuel Systems', assemblyCount: 8 },
      { code: '23 20 00', name: 'HVAC Piping and Pumps', assemblyCount: 20 },
      { code: '23 30 00', name: 'HVAC Air Distribution', assemblyCount: 25 },
      { code: '23 50 00', name: 'Central Heating Equipment', assemblyCount: 18 },
      { code: '23 70 00', name: 'Central HVAC Equipment', assemblyCount: 21 },
    ],
  },
  {
    code: '26',
    name: 'Electrical',
    description: 'Electrical distribution, lighting, and communications',
    icon: 'Zap',
    color: '#FBBF24',
    assemblyCount: 105,
    subdivisions: [
      { code: '26 10 00', name: 'Medium-Voltage Electrical', assemblyCount: 12 },
      { code: '26 20 00', name: 'Low-Voltage Electrical', assemblyCount: 28 },
      { code: '26 30 00', name: 'Facility Electrical Power', assemblyCount: 18 },
      { code: '26 40 00', name: 'Electrical and Cathodic Protection', assemblyCount: 8 },
      { code: '26 50 00', name: 'Lighting', assemblyCount: 39 },
    ],
  },
  {
    code: '31',
    name: 'Earthwork',
    description: 'Site clearing, excavation, and earth moving',
    icon: 'Mountain',
    color: '#78716C',
    assemblyCount: 35,
    subdivisions: [
      { code: '31 10 00', name: 'Site Clearing', assemblyCount: 8 },
      { code: '31 20 00', name: 'Earth Moving', assemblyCount: 15 },
      { code: '31 30 00', name: 'Earthwork Methods', assemblyCount: 12 },
    ],
  },
  {
    code: '32',
    name: 'Exterior Improvements',
    description: 'Paving, site improvements, and planting',
    icon: 'TreeDeciduous',
    color: '#22C55E',
    assemblyCount: 48,
    subdivisions: [
      { code: '32 10 00', name: 'Bases, Ballasts, and Paving', assemblyCount: 20 },
      { code: '32 30 00', name: 'Site Improvements', assemblyCount: 15 },
      { code: '32 90 00', name: 'Planting', assemblyCount: 13 },
    ],
  },
  {
    code: '33',
    name: 'Utilities',
    description: 'Water, sewer, electrical, and communications utilities',
    icon: 'Cable',
    color: '#6366F1',
    assemblyCount: 42,
    subdivisions: [
      { code: '33 10 00', name: 'Water Utilities', assemblyCount: 14 },
      { code: '33 30 00', name: 'Sanitary Sewerage', assemblyCount: 12 },
      { code: '33 40 00', name: 'Storm Drainage', assemblyCount: 10 },
      { code: '33 70 00', name: 'Electrical Utilities', assemblyCount: 6 },
    ],
  },
];

// Sample assemblies (representative examples from each category)
export const SAMPLE_ASSEMBLIES: AssemblyItem[] = [
  // Division 03 - Concrete
  {
    id: 'KA-03-001',
    code: 'KA-03-001',
    name: '4" Concrete Slab on Grade',
    description: 'Standard 4-inch reinforced concrete slab on grade with vapor barrier and wire mesh',
    divisionCode: '03',
    subdivisionCode: '03 30 00',
    category: 'Concrete',
    unit: 'SF',
    materialCost: 3.25,
    laborCost: 2.85,
    equipmentCost: 0.45,
    totalCost: 6.55,
    laborHours: 0.045,
    tags: ['slab', 'foundation', 'concrete', 'residential'],
  },
  {
    id: 'KA-03-002',
    code: 'KA-03-002',
    name: '6" Concrete Slab on Grade',
    description: 'Heavy-duty 6-inch reinforced concrete slab for garage or commercial applications',
    divisionCode: '03',
    subdivisionCode: '03 30 00',
    category: 'Concrete',
    unit: 'SF',
    materialCost: 4.85,
    laborCost: 3.25,
    equipmentCost: 0.55,
    totalCost: 8.65,
    laborHours: 0.052,
    tags: ['slab', 'garage', 'commercial', 'heavy-duty'],
  },
  // Division 04 - Masonry
  {
    id: 'KA-04-001',
    code: 'KA-04-001',
    name: '8" CMU Block Wall',
    description: 'Standard 8-inch CMU block wall with mortar, grout cores at 48" O.C., vertical rebar',
    divisionCode: '04',
    subdivisionCode: '04 20 00',
    category: 'Masonry',
    unit: 'SF',
    materialCost: 8.50,
    laborCost: 9.75,
    equipmentCost: 0.35,
    totalCost: 18.60,
    laborHours: 0.125,
    tags: ['CMU', 'block', 'wall', 'foundation'],
  },
  {
    id: 'KA-04-002',
    code: 'KA-04-002',
    name: 'Brick Veneer Wall',
    description: 'Modular brick veneer with metal ties, air space, and mortar',
    divisionCode: '04',
    subdivisionCode: '04 20 00',
    category: 'Masonry',
    unit: 'SF',
    materialCost: 12.25,
    laborCost: 14.50,
    equipmentCost: 0.45,
    totalCost: 27.20,
    laborHours: 0.185,
    tags: ['brick', 'veneer', 'exterior', 'facade'],
  },
  // Division 06 - Wood
  {
    id: 'KA-06-001',
    code: 'KA-06-001',
    name: '2x4 Wood Stud Wall',
    description: 'Interior 2x4 wood stud wall at 16" O.C. with single top and bottom plates',
    divisionCode: '06',
    subdivisionCode: '06 10 00',
    category: 'Wood Framing',
    unit: 'SF',
    materialCost: 2.15,
    laborCost: 3.45,
    equipmentCost: 0.12,
    totalCost: 5.72,
    laborHours: 0.055,
    tags: ['framing', 'stud wall', 'interior', 'residential'],
  },
  {
    id: 'KA-06-002',
    code: 'KA-06-002',
    name: '2x6 Exterior Wall Framing',
    description: 'Exterior 2x6 wood stud wall at 16" O.C. with double top plate',
    divisionCode: '06',
    subdivisionCode: '06 10 00',
    category: 'Wood Framing',
    unit: 'SF',
    materialCost: 3.45,
    laborCost: 4.25,
    equipmentCost: 0.15,
    totalCost: 7.85,
    laborHours: 0.068,
    tags: ['framing', 'exterior', 'structural', 'residential'],
  },
  // Division 09 - Finishes
  {
    id: 'KA-09-001',
    code: 'KA-09-001',
    name: '1/2" Drywall - Level 4 Finish',
    description: 'Standard 1/2-inch gypsum board with Level 4 finish, taped and mudded',
    divisionCode: '09',
    subdivisionCode: '09 20 00',
    category: 'Finishes',
    unit: 'SF',
    materialCost: 0.85,
    laborCost: 1.95,
    equipmentCost: 0.08,
    totalCost: 2.88,
    laborHours: 0.032,
    tags: ['drywall', 'gypsum', 'interior', 'finish'],
  },
  {
    id: 'KA-09-002',
    code: 'KA-09-002',
    name: 'Ceramic Floor Tile',
    description: '12x12 ceramic floor tile with thinset mortar and grout',
    divisionCode: '09',
    subdivisionCode: '09 30 00',
    category: 'Finishes',
    unit: 'SF',
    materialCost: 4.50,
    laborCost: 6.25,
    equipmentCost: 0.15,
    totalCost: 10.90,
    laborHours: 0.095,
    tags: ['tile', 'ceramic', 'flooring', 'bathroom', 'kitchen'],
  },
  {
    id: 'KA-09-003',
    code: 'KA-09-003',
    name: 'Interior Paint - 2 Coats',
    description: 'Two coats latex paint on prepared drywall surfaces',
    divisionCode: '09',
    subdivisionCode: '09 90 00',
    category: 'Finishes',
    unit: 'SF',
    materialCost: 0.35,
    laborCost: 0.85,
    equipmentCost: 0.05,
    totalCost: 1.25,
    laborHours: 0.014,
    tags: ['paint', 'interior', 'latex', 'walls'],
  },
  // Division 22 - Plumbing
  {
    id: 'KA-22-001',
    code: 'KA-22-001',
    name: 'Standard Bathroom Rough-In',
    description: 'Complete bathroom rough-in including supply, waste, and vent piping for toilet, sink, and tub/shower',
    divisionCode: '22',
    subdivisionCode: '22 10 00',
    category: 'Plumbing',
    unit: 'EA',
    materialCost: 485.00,
    laborCost: 725.00,
    equipmentCost: 35.00,
    totalCost: 1245.00,
    laborHours: 12.5,
    tags: ['bathroom', 'rough-in', 'plumbing', 'residential'],
  },
  {
    id: 'KA-22-002',
    code: 'KA-22-002',
    name: 'Kitchen Sink Installation',
    description: 'Double-bowl stainless steel kitchen sink with faucet, disposal, and connections',
    divisionCode: '22',
    subdivisionCode: '22 40 00',
    category: 'Plumbing',
    unit: 'EA',
    materialCost: 425.00,
    laborCost: 285.00,
    equipmentCost: 0,
    totalCost: 710.00,
    laborHours: 4.5,
    tags: ['kitchen', 'sink', 'fixture', 'stainless'],
  },
  // Division 26 - Electrical
  {
    id: 'KA-26-001',
    code: 'KA-26-001',
    name: 'Duplex Receptacle Installation',
    description: '20A duplex receptacle with box, wiring, and coverplate',
    divisionCode: '26',
    subdivisionCode: '26 20 00',
    category: 'Electrical',
    unit: 'EA',
    materialCost: 28.50,
    laborCost: 65.00,
    equipmentCost: 0,
    totalCost: 93.50,
    laborHours: 1.0,
    tags: ['outlet', 'receptacle', 'electrical', '20A'],
  },
  {
    id: 'KA-26-002',
    code: 'KA-26-002',
    name: 'Recessed LED Downlight',
    description: '6-inch LED recessed downlight with housing, trim, and wiring',
    divisionCode: '26',
    subdivisionCode: '26 50 00',
    category: 'Electrical',
    unit: 'EA',
    materialCost: 85.00,
    laborCost: 95.00,
    equipmentCost: 0,
    totalCost: 180.00,
    laborHours: 1.5,
    tags: ['lighting', 'LED', 'recessed', 'downlight'],
  },
];

// Assembly categories for filtering
export const ASSEMBLY_CATEGORIES = [
  { id: 'kitchen', name: 'Kitchen', icon: 'ChefHat', count: 85 },
  { id: 'bathroom', name: 'Bathroom', icon: 'Bath', count: 72 },
  { id: 'bedroom', name: 'Bedroom', icon: 'Bed', count: 28 },
  { id: 'living-spaces', name: 'Living Spaces', icon: 'Sofa', count: 45 },
  { id: 'basement', name: 'Basement', icon: 'ArrowDown', count: 38 },
  { id: 'garage', name: 'Garage', icon: 'Car', count: 25 },
  { id: 'exterior', name: 'Exterior', icon: 'Home', count: 95 },
  { id: 'roofing', name: 'Roofing', icon: 'Umbrella', count: 42 },
  { id: 'foundation', name: 'Foundation', icon: 'Layers', count: 35 },
  { id: 'framing', name: 'Framing', icon: 'Grid3X3', count: 55 },
  { id: 'mechanical', name: 'Mechanical', icon: 'Cog', count: 88 },
  { id: 'electrical', name: 'Electrical', icon: 'Zap', count: 105 },
  { id: 'plumbing', name: 'Plumbing', icon: 'Droplet', count: 78 },
  { id: 'hvac', name: 'HVAC', icon: 'Wind', count: 92 },
  { id: 'sitework', name: 'Sitework', icon: 'TreeDeciduous', count: 65 },
];

// Assembly library stats
export const ASSEMBLY_LIBRARY_STATS = {
  totalAssemblies: 1247,
  totalDivisions: 18,
  totalSubdivisions: 85,
  lastUpdated: '2026-02-01',
  costDatabaseVersion: '2026.1',
  regionalCoverages: ['DC', 'Baltimore', 'NOVA', 'Prince Georges', 'Montgomery', 'Howard'],
};

// Navigation structure for Professional dashboard
// Includes: Architects, designers, engineers
export const PROFESSIONAL_NAVIGATION: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    icon: 'FolderKanban',
    children: [
      { id: 'projects-active', label: 'Active Projects', href: '/projects?status=active' },
      { id: 'projects-completed', label: 'Completed', href: '/projects?status=completed' },
      { id: 'projects-proposals', label: 'Proposals', href: '/projects/proposals' },
    ],
  },
  {
    id: 'deliverables',
    label: 'Deliverables',
    href: '/deliverables',
    icon: 'Package',
    children: [
      { id: 'deliverables-active', label: 'In Progress', href: '/deliverables?status=active' },
      { id: 'deliverables-review', label: 'Under Review', href: '/deliverables?status=review' },
      { id: 'deliverables-approved', label: 'Approved', href: '/deliverables?status=approved' },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    href: '/clients',
    icon: 'Users',
    children: [
      { id: 'clients-active', label: 'Active Clients', href: '/clients' },
      { id: 'clients-leads', label: 'Leads', href: '/clients/leads' },
    ],
  },
  {
    id: 'estimation',
    label: 'Estimation',
    href: '/estimation',
    icon: 'Calculator',
    children: [
      { id: 'estimation-request', label: 'Request Estimate', href: '/estimation/new' },
      { id: 'estimation-history', label: 'Estimate History', href: '/estimation' },
    ],
  },
  {
    id: 'permits',
    label: 'Permits',
    href: '/permits',
    icon: 'FileCheck',
    children: [
      { id: 'permits-active', label: 'Active Permits', href: '/permits' },
      { id: 'permits-new', label: 'New Application', href: '/permits/new' },
      { id: 'permits-inspections', label: 'Inspections', href: '/permits/inspections' },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & Fees',
    href: '/billing',
    icon: 'CreditCard',
    children: [
      { id: 'billing-invoices', label: 'Invoices', href: '/billing/invoices' },
      { id: 'billing-payments', label: 'Payments', href: '/billing/payments' },
      { id: 'billing-fees', label: 'Fee Schedule', href: '/billing/fees' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/documents',
    icon: 'FileText',
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
];

// =============================================================================
// TOPBAR NAVIGATION STRUCTURES
// All portals use topbar navigation with Features and Services dropdowns
// =============================================================================

// Homeowner Portal Topbar Navigation
export const HOMEOWNER_TOPBAR: PortalTopbarNav = {
  logo: { href: '/dashboard', label: 'Kealee' },
  mainItems: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    {
      id: 'features',
      label: 'Features',
      isDropdown: true,
      dropdownSections: [
        {
          title: 'Project Management',
          items: [
            { id: 'projects', label: 'My Projects', href: '/projects', description: 'View and manage your projects', icon: 'FolderKanban' },
            { id: 'documents', label: 'Documents', href: '/documents', description: 'Project files and contracts', icon: 'FileText' },
            { id: 'reports', label: 'Progress Reports', href: '/reports', description: 'Track project milestones', icon: 'BarChart3' },
          ],
        },
        {
          title: 'Payments & Trust',
          items: [
            { id: 'escrow', label: 'Escrow Account', href: '/payments/escrow', description: 'Secure payment protection', icon: 'Shield' },
            { id: 'payments', label: 'Payment History', href: '/payments', description: 'View payment records', icon: 'CreditCard' },
          ],
        },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      isDropdown: true,
      dropdownSections: [
        {
          items: [
            { id: 'find-contractors', label: 'Find Contractors', href: '/marketplace', description: 'Browse verified contractors', icon: 'Users' },
            { id: 'get-estimate', label: 'Get Estimate', href: '/estimation', description: 'AI-powered cost estimates', icon: 'Calculator', badge: 'Popular' },
            { id: 'permits', label: 'Permit Assistance', href: '/permits', description: 'Building permit help', icon: 'FileCheck' },
            { id: 'pm-services', label: 'PM Services', href: '/pm-services', description: 'Managed project management', icon: 'Briefcase' },
          ],
        },
      ],
    },
  ],
  rightItems: [
    { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'Bell' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
    { id: 'profile', label: 'Profile', href: '/profile', icon: 'User' },
  ],
};

// Developer Portal Topbar Navigation
export const DEVELOPER_TOPBAR: PortalTopbarNav = {
  logo: { href: '/dashboard', label: 'Kealee Developer' },
  mainItems: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    {
      id: 'features',
      label: 'Features',
      isDropdown: true,
      dropdownSections: [
        {
          title: 'Portfolio Management',
          items: [
            { id: 'projects', label: 'All Projects', href: '/projects', description: 'Multi-project portfolio view', icon: 'Building2' },
            { id: 'pipeline', label: 'Development Pipeline', href: '/pipeline', description: 'Track projects by phase', icon: 'GitBranch' },
            { id: 'analytics', label: 'Portfolio Analytics', href: '/analytics', description: 'Performance & ROI tracking', icon: 'TrendingUp' },
          ],
        },
        {
          title: 'Operations',
          items: [
            { id: 'team', label: 'Team Management', href: '/team', description: 'Manage project teams', icon: 'Users' },
            { id: 'documents', label: 'Documents', href: '/documents', description: 'Contracts & files', icon: 'FileText' },
            { id: 'budget', label: 'Budget Tracking', href: '/budget', description: 'Cash flow & budgets', icon: 'DollarSign' },
          ],
        },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      isDropdown: true,
      dropdownSections: [
        {
          items: [
            { id: 'contractor-sourcing', label: 'Contractor Sourcing', href: '/contractors', description: 'Find contractors at scale', icon: 'HardHat' },
            { id: 'estimation', label: 'Portfolio Estimation', href: '/estimation', description: 'Multi-project estimates', icon: 'Calculator' },
            { id: 'permits', label: 'Permit Management', href: '/permits', description: 'Cross-jurisdiction permits', icon: 'FileCheck' },
            { id: 'investor-reports', label: 'Investor Reports', href: '/reports/investors', description: 'Generate investor updates', icon: 'PieChart' },
          ],
        },
      ],
    },
  ],
  rightItems: [
    { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'Bell' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
    { id: 'profile', label: 'Profile', href: '/profile', icon: 'User' },
  ],
};

// Business Owner Portal Topbar Navigation
export const BUSINESS_OWNER_TOPBAR: PortalTopbarNav = {
  logo: { href: '/dashboard', label: 'Kealee Business' },
  mainItems: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    {
      id: 'features',
      label: 'Features',
      isDropdown: true,
      dropdownSections: [
        {
          title: 'Property Management',
          items: [
            { id: 'properties', label: 'My Properties', href: '/properties', description: 'View all properties', icon: 'Building' },
            { id: 'tenants', label: 'Tenant Improvements', href: '/tenant-improvements', description: 'TI project management', icon: 'Hammer' },
            { id: 'maintenance', label: 'Maintenance', href: '/maintenance', description: 'Building maintenance', icon: 'Wrench' },
          ],
        },
        {
          title: 'Vendors & Finance',
          items: [
            { id: 'vendors', label: 'Vendor Management', href: '/vendors', description: 'Contractor relationships', icon: 'Users' },
            { id: 'budget', label: 'Budget Tracking', href: '/budget', description: 'CapEx & OpEx tracking', icon: 'DollarSign' },
            { id: 'compliance', label: 'Compliance', href: '/compliance', description: 'Building compliance', icon: 'CheckCircle' },
          ],
        },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      isDropdown: true,
      dropdownSections: [
        {
          items: [
            { id: 'find-contractors', label: 'Find Contractors', href: '/contractors', description: 'Vetted contractor network', icon: 'HardHat' },
            { id: 'estimation', label: 'Get Estimates', href: '/estimation', description: 'TI cost estimates', icon: 'Calculator' },
            { id: 'permits', label: 'Permit Services', href: '/permits', description: 'Commercial permits', icon: 'FileCheck' },
          ],
        },
      ],
    },
  ],
  rightItems: [
    { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'Bell' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
    { id: 'profile', label: 'Profile', href: '/profile', icon: 'User' },
  ],
};

// Property Manager Portal Topbar Navigation
export const PROPERTY_MANAGER_TOPBAR: PortalTopbarNav = {
  logo: { href: '/dashboard', label: 'Kealee Property' },
  mainItems: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    {
      id: 'features',
      label: 'Features',
      isDropdown: true,
      dropdownSections: [
        {
          title: 'Property Portfolio',
          items: [
            { id: 'properties', label: 'All Properties', href: '/properties', description: 'Multi-property dashboard', icon: 'Building' },
            { id: 'work-orders', label: 'Work Orders', href: '/work-orders', description: 'Track maintenance requests', icon: 'ClipboardList' },
            { id: 'inspections', label: 'Inspections', href: '/inspections', description: 'Property inspections', icon: 'Search' },
          ],
        },
        {
          title: 'Operations',
          items: [
            { id: 'vendors', label: 'Vendor Network', href: '/vendors', description: 'Preferred contractor list', icon: 'Users' },
            { id: 'budget', label: 'Budget Management', href: '/budget', description: 'Property budgets', icon: 'DollarSign' },
            { id: 'reports', label: 'Owner Reports', href: '/reports', description: 'Generate owner reports', icon: 'BarChart3' },
          ],
        },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      isDropdown: true,
      dropdownSections: [
        {
          items: [
            { id: 'contractor-sourcing', label: 'Contractor Sourcing', href: '/contractors', description: 'Find reliable contractors', icon: 'HardHat' },
            { id: 'estimation', label: 'Project Estimates', href: '/estimation', description: 'Maintenance estimates', icon: 'Calculator' },
            { id: 'permits', label: 'Permit Services', href: '/permits', description: 'Building permits', icon: 'FileCheck' },
          ],
        },
      ],
    },
  ],
  rightItems: [
    { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'Bell' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
    { id: 'profile', label: 'Profile', href: '/profile', icon: 'User' },
  ],
};

// Contractor Portal Topbar Navigation
export const CONTRACTOR_TOPBAR: PortalTopbarNav = {
  logo: { href: '/dashboard', label: 'Kealee Contractor' },
  mainItems: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    {
      id: 'features',
      label: 'Features',
      isDropdown: true,
      dropdownSections: [
        {
          title: 'Project Management',
          items: [
            { id: 'projects', label: 'Projects', href: '/projects', description: 'Active & completed projects', icon: 'FolderKanban' },
            { id: 'bids', label: 'Bid Management', href: '/bids', description: 'Track bids & opportunities', icon: 'Gavel' },
            { id: 'schedule', label: 'Schedule & Gantt', href: '/schedule', description: 'Visual scheduling', icon: 'Calendar' },
          ],
        },
        {
          title: 'Team & Finance',
          items: [
            { id: 'team', label: 'Team Management', href: '/team', description: 'Team & subcontractors', icon: 'Users' },
            { id: 'finances', label: 'Financial Tracking', href: '/finances', description: 'Invoices & payments', icon: 'DollarSign' },
            { id: 'documents', label: 'Documents', href: '/documents', description: 'Contracts & files', icon: 'FileText' },
          ],
        },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      isDropdown: true,
      dropdownSections: [
        {
          items: [
            { id: 'estimation', label: 'Estimation Tools', href: '/estimation', description: 'Full estimation suite', icon: 'Calculator' },
            { id: 'assemblies', label: 'Assembly Library', href: '/estimation/assemblies', description: '1,200+ pre-built assemblies', icon: 'Boxes', badge: 'New' },
            { id: 'permits', label: 'Permit Services', href: '/permits', description: 'Building permits', icon: 'FileCheck' },
          ],
        },
      ],
    },
  ],
  rightItems: [
    { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'Bell' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
    { id: 'profile', label: 'Profile', href: '/profile', icon: 'User' },
  ],
};

// Professional Portal Topbar Navigation
export const PROFESSIONAL_TOPBAR: PortalTopbarNav = {
  logo: { href: '/dashboard', label: 'Kealee Professional' },
  mainItems: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    {
      id: 'features',
      label: 'Features',
      isDropdown: true,
      dropdownSections: [
        {
          title: 'Project Management',
          items: [
            { id: 'projects', label: 'Projects', href: '/projects', description: 'Active design projects', icon: 'FolderKanban' },
            { id: 'deliverables', label: 'Deliverables', href: '/deliverables', description: 'Track deliverables', icon: 'Package' },
            { id: 'clients', label: 'Clients', href: '/clients', description: 'Client management', icon: 'Users' },
          ],
        },
        {
          title: 'Business',
          items: [
            { id: 'fees', label: 'Fee Management', href: '/fees', description: 'Track fees & billing', icon: 'DollarSign' },
            { id: 'documents', label: 'Documents', href: '/documents', description: 'Drawings & specs', icon: 'FileText' },
            { id: 'reports', label: 'Reports', href: '/reports', description: 'Business reports', icon: 'BarChart3' },
          ],
        },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      isDropdown: true,
      dropdownSections: [
        {
          items: [
            { id: 'estimation', label: 'Estimation Services', href: '/estimation', description: 'Cost estimation for designs', icon: 'Calculator' },
            { id: 'permits', label: 'Permit Coordination', href: '/permits', description: 'Permit submissions', icon: 'FileCheck' },
            { id: 'collaboration', label: 'Contractor Connect', href: '/contractors', description: 'Connect with contractors', icon: 'Handshake' },
          ],
        },
      ],
    },
  ],
  rightItems: [
    { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'Bell' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
    { id: 'profile', label: 'Profile', href: '/profile', icon: 'User' },
  ],
};

// All portal topbar navigations
export const PORTAL_TOPBAR_NAVIGATIONS = {
  homeowner: HOMEOWNER_TOPBAR,
  developer: DEVELOPER_TOPBAR,
  'business-owner': BUSINESS_OWNER_TOPBAR,
  'property-manager': PROPERTY_MANAGER_TOPBAR,
  contractor: CONTRACTOR_TOPBAR,
  professional: PROFESSIONAL_TOPBAR,
};

// =============================================================================
// LANDING PAGE DEFINITIONS FOR NEW PORTALS
// =============================================================================

export interface PortalLandingPage {
  portalId: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  features: { icon: string; title: string; description: string }[];
  services: { icon: string; title: string; description: string; href: string }[];
  testimonials?: { quote: string; author: string; role: string; company: string }[];
}

export const DEVELOPER_LANDING: PortalLandingPage = {
  portalId: 'm-developer',
  heroTitle: 'Build Your Portfolio, Not Spreadsheets',
  heroSubtitle: 'Real Estate Developer Platform',
  heroDescription:
    'Manage multi-project developments with AI-powered estimation, contractor sourcing, and permit management across jurisdictions.',
  primaryCta: { label: 'Start Free', href: '/signup?portal=developer' },
  secondaryCta: { label: 'See Demo', href: '/demo/developer' },
  features: [
    { icon: 'Building2', title: 'Portfolio Dashboard', description: 'Track all projects in one view with real-time status updates' },
    { icon: 'HardHat', title: 'Contractor Sourcing', description: 'Access our vetted network of contractors for any project scale' },
    { icon: 'Calculator', title: 'Multi-Project Estimation', description: 'Get accurate estimates across your entire portfolio' },
    { icon: 'FileCheck', title: 'Cross-Jurisdiction Permits', description: 'Manage permits across multiple jurisdictions seamlessly' },
    { icon: 'TrendingUp', title: 'Portfolio Analytics', description: 'Track ROI, timelines, and budget performance' },
    { icon: 'PieChart', title: 'Investor Reports', description: 'Generate professional reports for investors and stakeholders' },
  ],
  services: [
    { icon: 'HardHat', title: 'Contractor Sourcing', description: 'Find contractors at scale for multiple projects', href: '/services/contractor-sourcing' },
    { icon: 'Calculator', title: 'Estimation Services', description: 'Professional multi-project estimates', href: '/services/estimation' },
    { icon: 'FileCheck', title: 'Permit Management', description: 'Cross-jurisdiction permit handling', href: '/services/permits' },
    { icon: 'Briefcase', title: 'PM Services', description: 'Managed project management for developments', href: '/services/pm' },
  ],
};

export const BUSINESS_OWNER_LANDING: PortalLandingPage = {
  portalId: 'm-business-owner',
  heroTitle: 'Commercial Property, Simplified',
  heroSubtitle: 'Business Owner Platform',
  heroDescription:
    'Manage tenant improvements, building maintenance, and contractor relationships from a single platform designed for commercial building owners.',
  primaryCta: { label: 'Start Free', href: '/signup?portal=business' },
  secondaryCta: { label: 'See Demo', href: '/demo/business' },
  features: [
    { icon: 'Building', title: 'Property Dashboard', description: 'Centralized view of all your commercial properties' },
    { icon: 'Hammer', title: 'Tenant Improvements', description: 'Streamline TI project management' },
    { icon: 'Wrench', title: 'Maintenance Management', description: 'Track and schedule building maintenance' },
    { icon: 'Users', title: 'Vendor Network', description: 'Build relationships with reliable contractors' },
    { icon: 'DollarSign', title: 'Budget Tracking', description: 'Monitor CapEx and OpEx across properties' },
    { icon: 'CheckCircle', title: 'Compliance Tracking', description: 'Stay on top of building compliance requirements' },
  ],
  services: [
    { icon: 'HardHat', title: 'Find Contractors', description: 'Access vetted commercial contractors', href: '/services/contractors' },
    { icon: 'Calculator', title: 'TI Estimates', description: 'Accurate tenant improvement estimates', href: '/services/estimation' },
    { icon: 'FileCheck', title: 'Permit Services', description: 'Commercial permit assistance', href: '/services/permits' },
  ],
};

export const PROPERTY_MANAGER_LANDING: PortalLandingPage = {
  portalId: 'm-property-manager',
  heroTitle: 'Multi-Property Management Made Easy',
  heroSubtitle: 'Property Manager Platform',
  heroDescription:
    'Manage maintenance projects, contractor relationships, and owner reporting across your entire property portfolio from one powerful platform.',
  primaryCta: { label: 'Start Free', href: '/signup?portal=property' },
  secondaryCta: { label: 'See Demo', href: '/demo/property' },
  features: [
    { icon: 'Building', title: 'Multi-Property Dashboard', description: 'All properties at a glance with status tracking' },
    { icon: 'ClipboardList', title: 'Work Order Management', description: 'Track and manage maintenance requests efficiently' },
    { icon: 'Users', title: 'Preferred Vendor List', description: 'Build and manage your contractor network' },
    { icon: 'Search', title: 'Inspection Tracking', description: 'Schedule and track property inspections' },
    { icon: 'DollarSign', title: 'Budget Management', description: 'Track budgets across all managed properties' },
    { icon: 'BarChart3', title: 'Owner Reports', description: 'Generate professional reports for property owners' },
  ],
  services: [
    { icon: 'HardHat', title: 'Contractor Sourcing', description: 'Find reliable contractors quickly', href: '/services/contractors' },
    { icon: 'Calculator', title: 'Project Estimates', description: 'Get estimates for maintenance projects', href: '/services/estimation' },
    { icon: 'FileCheck', title: 'Permit Services', description: 'Building permit assistance', href: '/services/permits' },
  ],
};

// All landing pages
export const PORTAL_LANDING_PAGES = {
  developer: DEVELOPER_LANDING,
  'business-owner': BUSINESS_OWNER_LANDING,
  'property-manager': PROPERTY_MANAGER_LANDING,
};

// Legacy - keep for backwards compatibility
export const MARKETING_NAVIGATION: NavItem[] = [
  {
    id: 'solutions',
    label: 'Solutions',
    href: '#',
    children: [
      { id: 'solutions-homeowners', label: 'For Homeowners', href: '/solutions/homeowners' },
      { id: 'solutions-developers', label: 'For Developers', href: '/solutions/developers' },
      { id: 'solutions-business', label: 'For Business Owners', href: '/solutions/business' },
      { id: 'solutions-property', label: 'For Property Managers', href: '/solutions/property' },
      { id: 'solutions-contractors', label: 'For Contractors', href: '/solutions/contractors' },
      { id: 'solutions-professionals', label: 'For Architects & Engineers', href: '/solutions/professionals' },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    href: '#',
    children: [
      { id: 'services-estimation', label: 'Estimation Services', href: '/estimation' },
      { id: 'services-permits', label: 'Permits & Inspections', href: '/permits' },
      { id: 'services-contractors', label: 'Contractor Sourcing', href: '/contractors' },
      { id: 'services-pm', label: 'PM Services', href: '/pm-services' },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    href: '/pricing',
  },
  {
    id: 'resources',
    label: 'Resources',
    href: '#',
    children: [
      { id: 'resources-blog', label: 'Blog', href: '/blog' },
      { id: 'resources-guides', label: 'Guides', href: '/guides' },
      { id: 'resources-webinars', label: 'Webinars', href: '/webinars' },
      { id: 'resources-help', label: 'Help Center', href: '/help' },
    ],
  },
];
