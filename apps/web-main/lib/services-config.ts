/**
 * Kealee Services Configuration — single source of truth for all services.
 * Used by homepage, service detail pages, concept intake, and pricing.
 */

export interface ServiceTier {
  tier: 1 | 2 | 3
  name: 'Basic' | 'Premium' | 'Premium+'
  price: number            // 0 = not available
  available: boolean
  video: boolean
  videoDeliverables?: string[]
  badge?: string
}

export interface Service {
  slug: string             // URL slug: /services/[slug]
  intakePath: string       // Legacy intake projectPath key
  label: string
  shortLabel: string
  description: string
  priceDisplay: string     // Display range for homepage cards
  heroImage: string        // Unsplash URL
  category: 'remodel' | 'addition' | 'landscape' | 'design' | 'construction'
  deliveryDays: string
  tiers: ServiceTier[]
  /** Whether this service uses /concept intake (vs. custom flow) */
  usesConceptIntake: boolean
  /** Custom routing override if not using concept intake */
  customIntakePath?: string
  features: string[]
  costRange: string        // e.g. "$35K – $100K"
  timeline: string         // e.g. "12–16 weeks"
  permits: number          // typical permit count
}

// ── Tier helper ────────────────────────────────────────────────────────────────

function tier1(price: number): ServiceTier {
  return { tier: 1, name: 'Basic', price, available: true, video: false }
}

function tier2(price: number): ServiceTier {
  return {
    tier: 2,
    name: 'Premium',
    price,
    available: price > 0,
    video: price > 0,
    badge: 'Popular',
    videoDeliverables: price > 0 ? ['60s AI transformation video', 'Professional narration overlay', 'Downloadable MP4', 'Shareable link'] : undefined,
  }
}

function tier3(price: number): ServiceTier {
  return {
    tier: 3,
    name: 'Premium+',
    price,
    available: price > 0,
    video: price > 0,
    badge: 'Best Value',
    videoDeliverables: price > 0 ? [
      '60s full version (YouTube/email)',
      '30s mobile version (Facebook/Instagram)',
      '15s short clip (TikTok/Reels)',
      '10s preview (social)',
      '3 music variations',
      'HD/4K download',
    ] : undefined,
  }
}

// ── Service catalog ────────────────────────────────────────────────────────────

export const SERVICES: Service[] = [
  {
    slug: 'kitchen',
    intakePath: 'kitchen_remodel',
    label: 'Kitchen Remodel',
    shortLabel: 'Kitchen',
    description: 'Transform your kitchen with AI-generated concepts, detailed cost estimates, and permit-ready plans. From updated cabinets to full gut-renovations with custom islands.',
    priceDisplay: 'From $149',
    heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80&auto=format&fit=crop',
    category: 'remodel',
    deliveryDays: '3–5 days',
    tiers: [tier1(149), tier2(699), tier3(1299)],
    usesConceptIntake: true,
    features: ['3 concept visuals (before/after)', 'Bill of Materials with line-item costs', 'MEP specification', 'Detailed cost estimate', 'Zoning & permit scope brief', '30-min consultation'],
    costRange: '$25K – $120K',
    timeline: '12–16 weeks',
    permits: 4,
  },
  {
    slug: 'bathroom',
    intakePath: 'bathroom_remodel',
    label: 'Bathroom Remodel',
    shortLabel: 'Bathroom',
    description: 'Create your dream bathroom — from spa-level primary suites to efficient powder room refreshes. Full AI concepts with plumbing, electrical, and tile specifications.',
    priceDisplay: 'From $129',
    heroImage: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80&auto=format&fit=crop',
    category: 'remodel',
    deliveryDays: '2–4 days',
    tiers: [tier1(129), tier2(549), tier3(999)],
    usesConceptIntake: true,
    features: ['3 concept visuals (before/after)', 'Plumbing fixture specification', 'Tile & material palette', 'Electrical & lighting plan', 'Permit scope brief', '30-min consultation'],
    costRange: '$10K – $60K',
    timeline: '6–10 weeks',
    permits: 3,
  },
  {
    slug: 'garden',
    intakePath: 'garden_concept',
    label: 'Garden & Landscape',
    shortLabel: 'Garden',
    description: 'Design your outdoor living space with AI-generated landscape concepts, plant selection guides, irrigation overviews, and hardscape design — tailored to your climate zone.',
    priceDisplay: 'From $99',
    heroImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80&auto=format&fit=crop',
    category: 'landscape',
    deliveryDays: '2–4 days',
    tiers: [tier1(99), tier2(399), tier3(799)],
    usesConceptIntake: true,
    features: ['Landscape layout plan', 'Plant species guide', 'Irrigation overview', 'Hardscape design concept', 'Seasonal planting schedule', '30-min consultation'],
    costRange: '$8K – $80K',
    timeline: '4–8 weeks',
    permits: 1,
  },
  {
    slug: 'addition',
    intakePath: 'addition_expansion',
    label: 'Home Addition',
    shortLabel: 'Addition',
    description: 'Add space and value with a seamlessly integrated addition — primary suite, family room, ADU, or garage. Full feasibility analysis with zoning, structural, and permit scope.',
    priceDisplay: 'From $199',
    heroImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80&auto=format&fit=crop',
    category: 'addition',
    deliveryDays: '3–5 days',
    tiers: [tier1(199), tier2(799), tier3(1499)],
    usesConceptIntake: true,
    features: ['Architectural concept renders', 'Feasibility & zoning analysis', 'Site plan overview', 'Full permit scope brief', 'MEP systems plan', '30-min consultation'],
    costRange: '$80K – $400K',
    timeline: '16–28 weeks',
    permits: 6,
  },
  {
    slug: 'whole-house',
    intakePath: 'whole_home_concept',
    label: 'Whole House Renovation',
    shortLabel: 'Whole House',
    description: 'Complete home transformation — coordinated interior, exterior, and systems upgrade. One unified design direction, one master cost plan, one permit scope covering every trade.',
    priceDisplay: 'From $249',
    heroImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&q=80&auto=format&fit=crop',
    category: 'remodel',
    deliveryDays: '4–6 days',
    tiers: [tier1(249), tier2(899), tier3(1699)],
    usesConceptIntake: true,
    features: ['Full interior concept (all rooms)', 'Exterior elevation concept', 'Room-by-room renders', 'Master cost estimate', 'All MEP systems scoped', '30-min consultation'],
    costRange: '$150K – $800K',
    timeline: '24–48 weeks',
    permits: 8,
  },
  {
    slug: 'interior',
    intakePath: 'interior_renovation',
    label: 'Interior Renovation',
    shortLabel: 'Interior',
    description: 'Refresh your home\'s interior spaces — flooring, walls, trim, lighting, and built-ins — with cohesive design direction and room-by-room specifications.',
    priceDisplay: 'From $149',
    heroImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80&auto=format&fit=crop',
    category: 'remodel',
    deliveryDays: '3–5 days',
    tiers: [tier1(149), tier2(649), tier3(1199)],
    usesConceptIntake: true,
    features: ['3 concept visuals', 'Room-by-room specification', 'Material & finish palette', 'Lighting design overview', 'Cost estimate by room', '30-min consultation'],
    costRange: '$20K – $150K',
    timeline: '8–16 weeks',
    permits: 2,
  },
  {
    slug: 'facade',
    intakePath: 'exterior_concept',
    label: 'Exterior Facade',
    shortLabel: 'Exterior',
    description: 'Dramatically improve your home\'s curb appeal — new siding, windows, roofline, entry, and landscaping — with AI-generated concepts and a full material specification.',
    priceDisplay: 'From $139',
    heroImage: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80&auto=format&fit=crop',
    category: 'remodel',
    deliveryDays: '3–5 days',
    tiers: [tier1(139), tier2(599), tier3(1099)],
    usesConceptIntake: true,
    features: ['3 exterior renderings (front, side, rear)', 'Material & finish palette', 'Landscape overview sketch', 'MEP exterior spec', 'Detailed cost estimate', '30-min consultation'],
    costRange: '$15K – $80K',
    timeline: '6–12 weeks',
    permits: 2,
  },
  {
    slug: 'deck',
    intakePath: 'exterior_concept',
    label: 'Deck & Patio',
    shortLabel: 'Deck',
    description: 'Design your outdoor living and entertaining space — deck, patio, pergola, or covered outdoor room — with structural plans, material specs, and permit requirements.',
    priceDisplay: 'From $119',
    heroImage: 'https://images.unsplash.com/photo-1558618047-f4739d2dbe3e?w=900&q=80&auto=format&fit=crop',
    category: 'addition',
    deliveryDays: '2–4 days',
    tiers: [tier1(119), tier2(449), tier3(899)],
    usesConceptIntake: true,
    features: ['Deck/patio layout concept', 'Material specification', 'Structural overview', 'Lighting & electrical plan', 'Permit requirements', '30-min consultation'],
    costRange: '$12K – $60K',
    timeline: '4–8 weeks',
    permits: 2,
  },
  {
    slug: 'design-services',
    intakePath: 'interior_reno_concept',
    label: 'Design Services',
    shortLabel: 'Design',
    description: 'Get professional-grade interior design direction — mood boards, material palettes, furniture layout, and space planning — without committing to a full renovation.',
    priceDisplay: 'From $79',
    heroImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80&auto=format&fit=crop',
    category: 'design',
    deliveryDays: '2–3 days',
    // Tier 2 + 3 NOT available for design services (no video)
    tiers: [tier1(79), tier2(0), tier3(0)],
    usesConceptIntake: true,
    features: ['Mood board & design direction', 'Material & finish palette', 'Furniture layout plan', 'Color scheme specification', 'Shopping list with links', '30-min consultation'],
    costRange: 'Design fee only',
    timeline: '1–2 weeks',
    permits: 0,
  },
  {
    slug: 'new-construction',
    intakePath: 'design_build',
    label: 'New Construction',
    shortLabel: 'New Build',
    description: 'Full-scope new construction: architectural design, site planning, permit coordination, and build management — from vacant lot to move-in. Custom engagement for serious builders.',
    priceDisplay: 'Custom Quote',
    heroImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80&auto=format&fit=crop',
    category: 'construction',
    deliveryDays: 'Custom',
    // No concept intake, no video — routes to custom 5-step sales flow
    tiers: [tier1(299), tier2(0), tier3(0)],
    usesConceptIntake: false,
    customIntakePath: '/new-construction/intake',
    features: ['Full architectural design', 'Complete MEP systems', 'Permit coordination', 'Zoning & code compliance', 'Construction management', 'Contractor coordination'],
    costRange: '$500K – $5M+',
    timeline: '6–24+ months',
    permits: 12,
  },
]

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export const SERVICE_MAP = Object.fromEntries(SERVICES.map(s => [s.slug, s]))
export const SERVICE_BY_INTAKE = Object.fromEntries(SERVICES.map(s => [s.intakePath, s]))

export function getService(slug: string): Service | undefined {
  return SERVICE_MAP[slug]
}

export function getConceptServices(): Service[] {
  return SERVICES.filter(s => s.usesConceptIntake)
}
