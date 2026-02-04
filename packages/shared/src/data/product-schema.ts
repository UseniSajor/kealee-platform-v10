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

export type UserRole =
  | 'homeowner' // Residential homeowners
  | 'contractor' // GCs, builders, developers, commercial building owners, investors
  | 'professional' // Architects, designers, engineers
  | 'subcontractor'
  | 'estimator';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavItem[];
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
// These are the 3 main client-facing dashboards
// =============================================================================

export const CLIENT_PORTALS: ClientPortal[] = [
  {
    id: 'm-homeowner',
    name: 'Homeowner Portal',
    shortName: 'Homeowner',
    url: 'app.kealee.com',
    description: 'Project visibility and control for residential homeowners',
    primaryUsers: ['homeowner'],
    icon: 'Home',
    color: 'navy',
    loginRequired: true,
    features: [
      'Project dashboard',
      'Contractor management',
      'Payment tracking & escrow',
      'Document storage',
      'Progress reports',
      'Access to Estimation services',
      'Access to Permits services',
      'Access to Marketplace',
    ],
  },
  {
    id: 'm-contractor',
    name: 'Contractor Portal',
    shortName: 'Contractor',
    url: 'contractor.kealee.com',
    description:
      'Full project management for GCs, builders, developers, and commercial building owners',
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
      'Access to Marketplace (receive bids)',
      'Access to Permits services',
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
      'Access to Estimation services',
      'Access to Permits services',
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
    color: 'navy',
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

// Marketing site navigation (public pages with login CTAs)
export const MARKETING_NAVIGATION: NavItem[] = [
  {
    id: 'solutions',
    label: 'Solutions',
    href: '#',
    children: [
      {
        id: 'solutions-homeowners',
        label: 'For Homeowners',
        href: '/solutions/homeowners',
      },
      {
        id: 'solutions-contractors',
        label: 'For Contractors & Developers',
        href: '/solutions/contractors',
      },
      {
        id: 'solutions-professionals',
        label: 'For Architects & Engineers',
        href: '/solutions/professionals',
      },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    href: '#',
    children: [
      { id: 'services-permits', label: 'Permits & Inspections', href: '/permits' },
      { id: 'services-estimation', label: 'Estimation Services', href: '/estimation' },
      { id: 'services-pm', label: 'PM Services', href: '/pm-services' },
      { id: 'services-ops', label: 'Operations Services', href: '/ops-services' },
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
