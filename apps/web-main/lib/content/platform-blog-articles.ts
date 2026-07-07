export type PlatformBlogSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export type PlatformBlogArticle = {
  slug: string
  title: string
  description: string
  category: string
  datePublished: string
  readTime: string
  keywords: string[]
  sections: PlatformBlogSection[]
  cta: { label: string; href: string }
}

export const PLATFORM_BLOG_ARTICLES: PlatformBlogArticle[] = [
  {
    slug: 'digital-twins-construction',
    title: 'How Digital Twins Are Transforming Construction Project Management',
    description:
      'Digital twins combine schedule, budget, and field data into a living project model — how Kealee uses them for homeowner and GC visibility.',
    category: 'Technology',
    datePublished: '2026-03-05',
    readTime: '6 min',
    keywords: ['construction digital twin', 'project management software', 'construction analytics'],
    cta: { label: 'Explore project workspace', href: '/get-started' },
    sections: [
      {
        heading: 'What is a construction digital twin?',
        paragraphs: [
          'A digital twin is a continuously updated model of your project — not just a 3D rendering, but schedule status, payment milestones, permit checkpoints, and generated using AI tools risk flags tied to real data.',
          'For residential and light commercial work in the DMV, twins help owners answer: Are we on budget? Is the permit still active? Did the last inspection pass?',
        ],
      },
      {
        heading: 'Why it matters for DC-area projects',
        paragraphs: [
          'DMV jurisdictions have different inspection cadences and fee structures. A twin that tracks jurisdiction-specific milestones reduces surprises when DLCP, Montgomery DPS, or Fairfax LDS requests revisions.',
        ],
        bullets: [
          'Single dashboard for permits, draws, and change orders',
          'Alerts when a milestone blocks the next trade',
          'Historical record for resale or refinance',
        ],
      },
    ],
  },
  {
    slug: 'keabots-ai-construction',
    title: 'Meet the KeaBots: AI Assistants for Every Phase of Construction',
    description:
      'Specialized AI agents for land, design, permits, estimates, and operations — how KeaBots fit the Kealee platform without replacing licensed pros.',
    category: 'AI',
    datePublished: '2026-03-01',
    readTime: '8 min',
    keywords: ['AI construction assistant', 'KeaBots', 'construction automation'],
    cta: { label: 'Start design concept', href: '/concept' },
    sections: [
      {
        heading: 'Agents, not autopilot',
        paragraphs: [
          'KeaBots handle repeatable analysis — parcel screening, concept variations, permit checklist prep, and estimate scaffolding. Stamped drawings, structural engineering, and official filings still flow through licensed professionals.',
        ],
      },
      {
        heading: 'Typical homeowner path',
        paragraphs: [
          'Most owners begin with an Concept Package, then route to permit-ready drawings or permit filing depending on scope. KeaBots keep context across those steps so you do not re-enter the same data three times.',
        ],
        bullets: [
          'ConceptBot — design directions and renderings',
          'PermitBot — jurisdiction requirements and submission prep',
          'EstimateBot — quantity and cost direction from scope',
        ],
      },
    ],
  },
  {
    slug: 'escrow-payments-guide',
    title: 'The Complete Guide to Construction Escrow Payments',
    description:
      'Milestone-based escrow protects owners and contractors. Learn how Kealee milestone pay aligns work verification with releases.',
    category: 'Finance',
    datePublished: '2026-02-20',
    readTime: '8 min',
    keywords: ['construction escrow', 'milestone payments', 'contractor payment protection'],
    cta: { label: 'Learn milestone pay', href: '/milestone-pay' },
    sections: [
      {
        heading: 'Why escrow beats lump-sum checks',
        paragraphs: [
          'Large single payments create imbalance: owners fear paying before work is done; contractors fear finishing work without payment. Milestone escrow ties each release to documented progress.',
        ],
      },
      {
        heading: 'Structuring milestones',
        paragraphs: [
          'Match releases to inspectable deliverables — foundation, framing, rough-in, finals — not calendar dates alone. In the DMV, align milestones with inspection schedules where possible.',
        ],
        bullets: [
          'Define acceptance criteria in writing before work starts',
          'Hold retainage until punch list completion',
          'Document change orders before releasing additional funds',
        ],
      },
    ],
  },
  {
    slug: 'os-land-parcel-analysis',
    title: 'powered by AI tools Land Intelligence: Parcel Analysis for Developers',
    description:
      'Zoning, setbacks, and development readiness scoring for DMV parcels — how OS-Land supports feasibility before you option land.',
    category: 'Land',
    datePublished: '2026-02-15',
    readTime: '7 min',
    keywords: ['parcel analysis', 'zoning analysis DC', 'land development feasibility'],
    cta: { label: 'Developer intake', href: '/developers/start' },
    sections: [
      {
        heading: 'From address to go/no-go',
        paragraphs: [
          'OS-Land aggregates zoning districts, overlay zones, historic constraints, and rough yield estimates so developers can filter sites before hiring civil and architectural teams.',
        ],
      },
      {
        heading: 'DMV-specific complexity',
        paragraphs: [
          'Prince George\'s County, Montgomery, DC, and Northern Virginia each use different GIS layers and approval paths. Automated parcel briefs surface the right agency and typical timeline band early.',
        ],
      },
    ],
  },
  {
    slug: 'ai-cost-estimation',
    title: 'powered by AI tools Cost Estimation: Accuracy Meets Speed',
    description:
      'How AI reads scope and plans to produce construction cost direction for renovations, additions, and light commercial work in DC, MD, and VA.',
    category: 'AI',
    datePublished: '2026-02-10',
    readTime: '5 min',
    keywords: ['construction cost estimator', 'AI estimate', 'renovation cost calculator'],
    cta: { label: 'Get an estimate', href: '/estimate' },
    sections: [
      {
        heading: 'What AI estimates include',
        paragraphs: [
          'Kealee estimates organize scope by CSI-style divisions with unit-cost direction grounded in regional databases — not a single lump number. You see where budget risk concentrates (structure, MEP, finishes).',
        ],
      },
      {
        heading: 'When to upgrade to formal estimating',
        paragraphs: [
          'AI direction is ideal for early budgeting and contractor interviews. Bank draws, bonded work, or competitive bid packages may still require a licensed estimator or GC bid.',
        ],
      },
    ],
  },
  {
    slug: 'housing-act-technology',
    title: 'How Technology Aligns with Affordable Housing Policy',
    description:
      'Construction platforms can shorten delivery timelines and improve transparency — relevant to housing affordability goals in the DC region.',
    category: 'Policy',
    datePublished: '2026-02-01',
    readTime: '6 min',
    keywords: ['affordable housing technology', 'housing policy construction'],
    cta: { label: 'View platform services', href: '/services' },
    sections: [
      {
        heading: 'Time is cost',
        paragraphs: [
          'Every month of delay on infill or ADU projects carries carrying costs and financing drag. Digital permitting prep, standardized concepts, and milestone pay reduce friction between design, approval, and build.',
        ],
      },
      {
        heading: 'Transparency builds trust',
        paragraphs: [
          'Owners, lenders, and housing partners benefit from shared dashboards — permit status, draw schedules, and documented change orders — especially on multi-unit small projects.',
        ],
      },
    ],
  },
  {
    slug: 'choosing-contractor',
    title: '7 Things to Verify Before Hiring a Contractor',
    description:
      'License, insurance, references, and scope alignment — a practical DMV checklist before you sign a renovation or addition contract.',
    category: 'Guides',
    datePublished: '2026-01-28',
    readTime: '4 min',
    keywords: ['hire contractor DC', 'contractor license verification', 'home renovation contractor'],
    cta: { label: 'Find vetted contractors', href: '/marketplace' },
    sections: [
      {
        heading: 'Non-negotiable verifications',
        paragraphs: [
          'Confirm active license status with DC DLCP, Maryland DLLR, or Virginia DPOR depending on where work occurs. Ask for current GL and workers comp certificates naming you as additional insured when required.',
        ],
        bullets: [
          'Written scope tied to permit drawings',
          'Payment schedule aligned to milestones',
          'Clear warranty and punch-list process',
          'References for similar project type — not just oldest friend',
        ],
      },
    ],
  },
  {
    slug: 'feasibility-studies',
    title: 'The Developer\'s Guide to Feasibility Studies with AI',
    description:
      'Multi-scenario pro formas and sensitivity analysis for small-scale development in the DC metro — faster iteration with assisted by AI tools inputs.',
    category: 'Finance',
    datePublished: '2026-01-20',
    readTime: '7 min',
    keywords: ['feasibility study', 'real estate pro forma', 'development analysis'],
    cta: { label: 'Book a feasibility call', href: '/book-a-call' },
    sections: [
      {
        heading: 'Core feasibility outputs',
        paragraphs: [
          'A useful study answers: What can be built? What will it cost? What rent or sale price makes the deal work? AI accelerates scenario setup; your team still validates assumptions.',
        ],
      },
      {
        heading: 'Sensitivity matters',
        paragraphs: [
          'Test hard costs ±10%, lease-up delay, and interest rate bands. In Oxon Hill and PG County infill, parking and stormwater assumptions often swing NOI more than finish level.',
        ],
      },
    ],
  },
  {
    slug: 'construction-trends-2026',
    title: 'Top Construction Industry Trends for 2026',
    description:
      'AI assistants, digital twins, modular methods, and tighter permit digitization — trends shaping DMV residential construction this year.',
    category: 'Industry',
    datePublished: '2026-01-02',
    readTime: '6 min',
    keywords: ['construction trends 2026', 'residential construction technology'],
    cta: { label: 'Start your project', href: '/get-concept' },
    sections: [
      {
        heading: 'AI moves upstream',
        paragraphs: [
          'Owners expect fast concept visualization before committing to architectural fees. Platforms that combine design concepts with a clear path to permit-ready drawings win on trust.',
        ],
      },
      {
        heading: 'Local expertise still wins',
        paragraphs: [
          'National marketplaces struggle with jurisdiction nuance. Kealee is headquartered in Oxon Hill, MD — deep PG County and DMV experience paired with platform speed.',
        ],
      },
    ],
  },
]

export const PLATFORM_BLOG_SLUGS = PLATFORM_BLOG_ARTICLES.map((a) => a.slug)

export function getPlatformBlogArticle(slug: string): PlatformBlogArticle | undefined {
  return PLATFORM_BLOG_ARTICLES.find((a) => a.slug === slug)
}
