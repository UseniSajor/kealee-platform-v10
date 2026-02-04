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
export const PLATFORM_COMMISSION = {
  rate: 0.035, // 3.5%
  paidBy: 'contractor',
  description: 'Platform commission on contract value',
};

// =============================================================================
// PROJECT OWNER PORTAL (app.kealee.com)
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

export const PROJECT_OWNER_PLANS: PricingTier[] = [
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
// ARCHITECT PORTAL (architect.kealee.com)
// =============================================================================

export const ARCHITECT_PLANS: PricingTier[] = [
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
    'contractor management',
  ],
  secondary: [
    'DC Baltimore construction',
    'permit application help',
    'construction cost estimate',
    'project owner portal',
    'architect project management',
    'construction payment escrow',
    'contractor bidding platform',
  ],
  longTail: [
    'how to get building permits in DC',
    'construction project management software',
    'remote construction operations services',
    'building permit application assistance',
    'construction cost estimation services',
    'find verified contractors DC Maryland',
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
