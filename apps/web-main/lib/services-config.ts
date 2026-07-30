/**
 * Kealee Services Configuration — single source of truth for all services.
 * Used by homepage, service detail pages, concept intake, and pricing.
 */
import { INTAKE_TIER_PRICE_CENTS, formatPriceFromCents } from '@kealee/core-rules'

export interface ServiceTier {
  tier: 1 | 2 | 3
  name: string
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
  /** 'precon' = design/planning services (AI concepts, estimates, permits) · 'build' = construction execution */
  phase: 'precon' | 'build'
  category: 'remodel' | 'addition' | 'landscape' | 'design' | 'construction'
  /** What Kealee actually delivers — e.g. "Design Package", "Concept Package", "Custom Quote" */
  deliverableLabel: string
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
  /** Optional YouTube video ID for promotional embed on service pages */
  promoVideoId?: string
}

// ── Tier helper ────────────────────────────────────────────────────────────────

function tier1(price: number): ServiceTier {
  return { tier: 1, name: 'Concept', price, available: true, video: false }
}

function tier2(price: number): ServiceTier {
  return {
    tier: 2,
    name: 'Concept + Budget',
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
    name: 'Preconstruction Package',
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

function canonicalTiers(intakePath: string): ServiceTier[] {
  const prices = INTAKE_TIER_PRICE_CENTS[intakePath] ?? {}
  return [1, 2, 3].map(tier => {
    const entry = prices[tier as 1 | 2 | 3]
    const dollars = entry ? entry.cents / 100 : 0
    const result = tier === 1 ? tier1(dollars) : tier === 2 ? tier2(dollars) : tier3(dollars)
    return { ...result, name: entry?.label ?? result.name }
  })
}

function canonicalStartingPrice(intakePath: string): string {
  const first = INTAKE_TIER_PRICE_CENTS[intakePath]?.[1]
  return first ? `From ${formatPriceFromCents(first.cents).replace('.00', '')}` : 'Custom Quote'
}

// ── Service catalog ────────────────────────────────────────────────────────────

export const SERVICES: Service[] = [
  {
    slug: 'kitchen',
    intakePath: 'kitchen_remodel',
    label: 'Kitchen Remodel',
    shortLabel: 'Kitchen',
    description: 'Transform your kitchen with AI-generated planning concepts, cost ranges, and a permit-path summary. Permit-ready professional drawings are a separate service when required.',
    priceDisplay: canonicalStartingPrice('kitchen_remodel'),
    heroImage: '/images/services/kitchen-concept.jpg',
    phase: 'precon',
    deliverableLabel: 'Design Package',
    category: 'remodel',
    deliveryDays: '3–5 days',
    tiers: canonicalTiers('kitchen_remodel'),
    usesConceptIntake: true,
    features: ['3 concept visuals (before/after)', 'Bill of Materials with line-item costs', 'MEP specification', 'Detailed cost estimate', 'Zoning & permit scope brief', 'Direct support via portal ask bar'],
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
    priceDisplay: canonicalStartingPrice('bathroom_remodel'),
    heroImage: '/images/services/bathroom-concept.jpg',
    phase: 'precon',
    deliverableLabel: 'Design Package',
    category: 'remodel',
    deliveryDays: '2–4 days',
    tiers: canonicalTiers('bathroom_remodel'),
    usesConceptIntake: true,
    features: ['3 concept visuals (before/after)', 'Plumbing fixture specification', 'Tile & material palette', 'Electrical & lighting plan', 'Permit scope brief', 'Direct support via portal ask bar'],
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
    priceDisplay: canonicalStartingPrice('garden_concept'),
    heroImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80&auto=format&fit=crop',
    phase: 'precon',
    deliverableLabel: 'Landscape Package',
    category: 'landscape',
    deliveryDays: '2–4 days',
    tiers: canonicalTiers('garden_concept'),
    usesConceptIntake: true,
    features: ['Landscape layout plan', 'Plant species guide', 'Irrigation overview', 'Hardscape design concept', 'Seasonal planting schedule', 'Direct support via portal ask bar'],
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
    priceDisplay: canonicalStartingPrice('addition_expansion'),
    heroImage: '/images/services/addition-concept.jpg',
    phase: 'precon',
    deliverableLabel: 'Feasibility Package',
    category: 'addition',
    deliveryDays: '3–5 days',
    tiers: canonicalTiers('addition_expansion'),
    usesConceptIntake: true,
    features: ['Architectural concept renders', 'Feasibility & zoning analysis', 'Site plan overview', 'Full permit scope brief', 'MEP systems plan', 'Direct support via portal ask bar'],
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
    priceDisplay: canonicalStartingPrice('whole_home_concept'),
    heroImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&q=80&auto=format&fit=crop',
    phase: 'precon',
    deliverableLabel: 'Design Package',
    category: 'remodel',
    deliveryDays: '4–6 days',
    tiers: canonicalTiers('whole_home_concept'),
    usesConceptIntake: true,
    features: ['Full interior concept (all rooms)', 'Exterior elevation concept', 'Room-by-room renders', 'Master cost estimate', 'All MEP systems scoped', 'Direct support via portal ask bar'],
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
    priceDisplay: canonicalStartingPrice('interior_renovation'),
    heroImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80&auto=format&fit=crop',
    phase: 'precon',
    deliverableLabel: 'Design Package',
    category: 'remodel',
    deliveryDays: '3–5 days',
    tiers: canonicalTiers('interior_renovation'),
    usesConceptIntake: true,
    features: ['3 concept visuals', 'Room-by-room specification', 'Material & finish palette', 'Lighting design overview', 'Cost estimate by room', 'Direct support via portal ask bar'],
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
    priceDisplay: canonicalStartingPrice('exterior_concept'),
    heroImage: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80&auto=format&fit=crop',
    phase: 'precon',
    deliverableLabel: 'Design Package',
    category: 'remodel',
    deliveryDays: '3–5 days',
    tiers: canonicalTiers('exterior_concept'),
    usesConceptIntake: true,
    features: ['3 exterior renderings (front, side, rear)', 'Material & finish palette', 'Landscape overview sketch', 'MEP exterior spec', 'Detailed cost estimate', 'Direct support via portal ask bar'],
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
    priceDisplay: canonicalStartingPrice('exterior_concept'),
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&auto=format&fit=crop',
    phase: 'precon',
    deliverableLabel: 'Design Package',
    category: 'addition',
    deliveryDays: '2–4 days',
    tiers: canonicalTiers('exterior_concept'),
    usesConceptIntake: true,
    features: ['Deck/patio layout concept', 'Material specification', 'Structural overview', 'Lighting & electrical plan', 'Permit requirements', 'Direct support via portal ask bar'],
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
    priceDisplay: canonicalStartingPrice('interior_reno_concept'),
    heroImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80&auto=format&fit=crop',
    phase: 'precon',
    deliverableLabel: 'Design Package',
    category: 'design',
    deliveryDays: '2–3 days',
    // Tier 2 + 3 NOT available for design services (no video)
    tiers: canonicalTiers('interior_reno_concept'),
    usesConceptIntake: true,
    features: ['Mood board & design direction', 'Material & finish palette', 'Furniture layout plan', 'Color scheme specification', 'Shopping list with links', 'Direct support via portal ask bar'],
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
    phase: 'build',
    deliverableLabel: 'Build Management',
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

export function getPreconServices(): Service[] {
  return SERVICES.filter(s => s.phase === 'precon')
}

export function getBuildServices(): Service[] {
  return SERVICES.filter(s => s.phase === 'build')
}
