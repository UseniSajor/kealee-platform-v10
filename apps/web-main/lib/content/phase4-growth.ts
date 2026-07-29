export const phase4Hero = {
  eyebrow: 'AI construction platform for DC, Maryland, and Virginia',
  title: 'Plan, price, permit, and build construction projects from one guided workspace.',
  summary:
    'Kealee combines AI concept planning, RSMeans-informed estimates, permit guidance, contractor matching, and project workspaces so homeowners and construction teams can move from idea to approved scope with less friction.',
  directAnswer:
    'Kealee is an AI construction platform for the DC metro that helps homeowners, contractors, and project teams turn a renovation or construction idea into a scoped project with concept visuals, cost estimates, permit support, marketplace matching, and a managed project workspace.',
}

export const audiencePaths = [
  {
    audience: 'Homeowners',
    intent: 'I need to understand cost, permits, and the right project path before hiring.',
    outcome: 'Start with concept planning, estimate validation, permit guidance, or a managed project workspace.',
    href: '/homeowners',
    cta: 'Explore homeowner path',
  },
  {
    audience: 'Contractors',
    intent: 'I want better qualified leads, bid context, and workflow tools.',
    outcome: 'Get matched to scoped projects, manage bids, and use Kealee workspace tools to reduce preconstruction drag.',
    href: '/marketplace?audience=contractor',
    cta: 'Explore contractor path',
  },
  {
    audience: 'Developers and project owners',
    intent: 'I need feasibility, budget control, approvals, and project oversight.',
    outcome: 'Use feasibility, pro forma, estimate, permit, and project-management workflows around the lifecycle of a deal.',
    href: '/marketplace?audience=developer',
    cta: 'Explore developer path',
  },
]

export const serviceArchitecture = [
  {
    name: 'Concept planning',
    description: 'AI-supported visual direction, scope framing, zoning context, and path-to-approval planning.',
    href: '/concept',
    schemaName: 'AI Design Concepts',
  },
  {
    name: 'Cost estimates',
    description: 'Trade-by-trade cost guidance and detailed estimate packages for project decisions and bid comparison.',
    href: '/estimate',
    schemaName: 'Construction Cost Estimation',
  },
  {
    name: 'Permit support',
    description: 'Permit guidance, filing support, coordination, and jurisdiction-aware project readiness.',
    href: '/permits',
    schemaName: 'Permit Analysis and Filing',
  },
  {
    name: 'Contractor marketplace',
    description: 'Project-aware contractor discovery and bid matching for scoped residential and commercial work.',
    href: '/marketplace',
    schemaName: 'Contractor Marketplace',
  },
  {
    name: 'Project workspace',
    description: 'A shared workspace for approvals, files, scope changes, estimates, milestones, and project decisions.',
    href: '/workspace/demo',
    schemaName: 'Construction Project Workspace',
  },
]

export const comparisonRows = [
  {
    path: 'DIY research',
    strength: 'Low upfront cost',
    limitation: 'Hard to connect zoning, permits, cost, and contractor readiness.',
    kealee: 'Guided project path with AI planning, estimate, permit, and workspace handoff.',
  },
  {
    path: 'Architect-first',
    strength: 'Strong design support',
    limitation: 'Cost and permit feasibility can arrive late in the process.',
    kealee: 'Early concept, scope, estimate, and permit intelligence before larger commitments.',
  },
  {
    path: 'Contractor-first',
    strength: 'Fast path to a quote',
    limitation: 'Quotes may vary widely when scope, drawings, and permit needs are unclear.',
    kealee: 'Scope and estimate context before marketplace matching and bid comparison.',
  },
]

export const purchasePaths = [
  {
    label: 'Fastest start',
    title: 'Get a concept package',
    description: 'Use this when you need project direction, visual options, and a practical path before drawings or bids.',
    href: '/get-concept',
    cta: 'Start concept package',
  },
  {
    label: 'Cost clarity',
    title: 'Order an estimate',
    description: 'Use this when you already know the project scope and need a trade-by-trade cost view.',
    href: '/estimate',
    cta: 'Compare estimates',
  },
  {
    label: 'Permitting',
    title: 'Check permit path',
    description: 'Use this when approval risk, filing requirements, or jurisdiction timing are the main concern.',
    href: '/permits',
    cta: 'Review permit support',
  },
  {
    label: 'Human help',
    title: 'Book a call',
    description: 'Use this when the project is complex or you want help choosing the right Kealee path.',
    href: '/book-a-call',
    cta: 'Book a call',
  },
]

export const aiSearchFaqs = [
  {
    q: 'What is Kealee?',
    a: 'Kealee is an AI-assisted construction and design-build platform serving DC, Maryland, and Virginia. It helps users move from project idea to concept planning, estimate, permit support, contractor matching, and project workspace coordination.',
  },
  {
    q: 'Can Kealee help before I hire a contractor?',
    a: 'Yes. Kealee is designed for the preconstruction stage: clarifying scope, exploring concept direction, estimating cost, understanding permit requirements, and preparing a project for bids or professional review.',
  },
  {
    q: 'Does Kealee replace architects or contractors?',
    a: 'No. Kealee helps organize early project decisions and can connect users to professionals when licensed design, engineering, permitting, or construction services are needed.',
  },
  {
    q: 'What areas does Kealee serve?',
    a: 'Kealee serves the DC metro area, including Washington DC, Prince George County, Montgomery County, Northern Virginia, Fairfax County, Arlington, Alexandria, Silver Spring, and Oxon Hill.',
  },
  {
    q: 'How do I buy or start a Kealee service?',
    a: 'Users can start through a concept package, estimate request, permit support path, pricing page, or consultation. Each path routes into a guided intake so Kealee can capture project details.',
  },
]

export const conversionEvents = [
  'phase4_primary_cta_click',
  'phase4_purchase_path_click',
  'phase4_audience_path_click',
  'phase4_service_link_click',
  'phase4_faq_read',
]
