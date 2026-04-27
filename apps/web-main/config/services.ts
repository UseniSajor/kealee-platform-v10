import type { ServiceMedia } from '@/components/media/types'
import { STOCK_IMAGES } from '@/lib/stock-images'
import { STOCK_VIDEOS } from '@/lib/stock-videos'

export type ServiceCategory = 'design' | 'development' | 'permit' | 'estimate' | 'match'

export interface ServiceConfig {
  key: string
  slug: string
  label: string
  tagline: string
  description: string
  category: ServiceCategory
  priceDisplay: string
  priceRange: [number, number]
  deliveryDays: string
  permitRequired: boolean
  features: string[]
  mepHighlights: string[]
  media: ServiceMedia
  intakePath: string
  heroColor: string
}

export const SERVICES: ServiceConfig[] = [
  {
    key: 'kitchen_remodel',
    slug: 'kitchen-remodel',
    label: 'Kitchen Design Package',
    tagline: 'Transform your kitchen with an AI-powered concept package.',
    description:
      'Get 3 concept visuals, a detailed bill of materials, full MEP specification, and a cost estimate—all in 3–5 days. Our AI design engine combined with staff review ensures every deliverable is project-ready.',
    category: 'design',
    priceDisplay: '$395',
    priceRange: [39500, 39500],
    deliveryDays: '3–5 days',
    permitRequired: true,
    features: [
      '3 concept visuals (before/after renders)',
      'Bill of Materials (BOM) with line-item costs',
      'MEP specification (electrical, plumbing, HVAC, lighting)',
      'Detailed cost estimate',
      'Design brief with style direction',
      'Zoning & permit scope brief',
      'Path-to-approval summary',
      '30-min consultation call',
    ],
    mepHighlights: ['200A panel upgrade', 'Island outlet circuits', 'Under-cabinet lighting', 'Dishwasher/disposal plumbing'],
    media: {
      heroVideo: STOCK_VIDEOS.kitchen_remodel,
      galleryImages: STOCK_IMAGES.kitchen_remodel,
    },
    intakePath: '/intake/kitchen_remodel',
    heroColor: 'from-orange-900 to-orange-800',
  },
  {
    key: 'bathroom_remodel',
    slug: 'bathroom-remodel',
    label: 'Bathroom Design Package',
    tagline: 'A spa-worthy bathroom concept in 2–4 days.',
    description:
      'Full concept package for your bathroom renovation—renders, BOM, plumbing and electrical specification, and a permit scope brief. Everything your contractor needs to bid accurately.',
    category: 'design',
    priceDisplay: '$295',
    priceRange: [29500, 29500],
    deliveryDays: '2–4 days',
    permitRequired: true,
    features: [
      '3 concept visuals (before/after renders)',
      'Bill of Materials (BOM) with line-item costs',
      'MEP specification (electrical, plumbing, lighting)',
      'Detailed cost estimate',
      'Design brief with style direction',
      'Zoning & permit scope brief',
      '30-min consultation call',
    ],
    mepHighlights: ['GFCI outlets per code', 'Exhaust fan upgrade', 'Shower valve & rough-in', 'Radiant floor heating'],
    media: {
      heroVideo: STOCK_VIDEOS.bathroom_remodel,
      galleryImages: STOCK_IMAGES.bathroom_remodel,
    },
    intakePath: '/intake/bathroom_remodel',
    heroColor: 'from-blue-900 to-blue-800',
  },
  {
    key: 'addition_expansion',
    slug: 'home-addition',
    label: 'Addition / Expansion',
    tagline: 'Add living space with a concept built for permits.',
    description:
      'Planning a home addition or expansion? Get concept renderings, structural considerations, permit scope, and full MEP specification—designed to move directly into permitting.',
    category: 'design',
    priceDisplay: '$495',
    priceRange: [49500, 49500],
    deliveryDays: '3–5 days',
    permitRequired: true,
    features: [
      'Addition concept renderings (interior + exterior)',
      'Structural considerations brief',
      'Permit & zoning scope brief',
      'MEP specification for new addition',
      'Bill of Materials (BOM)',
      '30-min consultation call',
    ],
    mepHighlights: ['Sub-panel requirements', 'HVAC zone extension', 'Plumbing rough-in scope', 'Exterior waterproofing'],
    media: {
      heroVideo: STOCK_VIDEOS.addition_expansion,
      galleryImages: STOCK_IMAGES.addition_expansion,
    },
    intakePath: '/intake/addition_expansion',
    heroColor: 'from-teal-900 to-teal-800',
  },
  {
    key: 'whole_home_remodel',
    slug: 'whole-home-renovation',
    label: 'Whole-Home Remodel',
    tagline: 'A complete renovation concept for every room.',
    description:
      'Full-home concept renderings, floor plan direction, complete MEP specification, and a phased remodel plan. Ideal for homeowners doing a full renovation before selling or moving in.',
    category: 'design',
    priceDisplay: '$695',
    priceRange: [69500, 69500],
    deliveryDays: '4–6 days',
    permitRequired: true,
    features: [
      'Full-home concept renderings',
      'Floor plan direction with remodel scope',
      'MEP specification for all systems',
      'Bill of Materials (BOM)',
      'Remodel phase plan',
      '30-min consultation call',
    ],
    mepHighlights: ['200A service upgrade', 'Full plumbing reroute scope', 'Whole-home HVAC design', 'LED lighting plan'],
    media: {
      heroVideo: STOCK_VIDEOS.whole_home_remodel,
      galleryImages: STOCK_IMAGES.whole_home_remodel,
    },
    intakePath: '/intake/whole_home_remodel',
    heroColor: 'from-indigo-900 to-indigo-800',
  },
  {
    key: 'garden_concept',
    slug: 'garden-landscape',
    label: 'Garden Concept',
    tagline: 'A landscape concept with irrigation and plant selections.',
    description:
      'Get a full garden layout concept, smart irrigation design, plant list with seasonal selections, and a maintenance calendar—all in 2–4 days.',
    category: 'design',
    priceDisplay: '$295',
    priceRange: [29500, 29500],
    deliveryDays: '2–4 days',
    permitRequired: false,
    features: [
      'Garden layout concept rendering',
      'Irrigation design with smart controller spec',
      'Plant list with seasonal selection',
      'Seasonal maintenance calendar',
      'Bill of Materials (BOM)',
      '30-min consultation call',
    ],
    mepHighlights: ['Drip irrigation zones', 'Smart controller (Rachio)', 'Outdoor lighting circuit', 'Drainage scope'],
    media: {
      heroVideo: STOCK_VIDEOS.garden_concept,
      galleryImages: STOCK_IMAGES.garden_concept,
    },
    intakePath: '/intake/garden_concept',
    heroColor: 'from-green-900 to-green-800',
  },
  {
    key: 'interior_renovation',
    slug: 'interior-renovation',
    label: 'Interior Renovation',
    tagline: 'A room-by-room renovation concept, delivered fast.',
    description:
      'Interior concept visuals, layout recommendations, MEP specification, and a detailed BOM—covering flooring, paint, lighting, and finishes for your renovation.',
    category: 'design',
    priceDisplay: '$345',
    priceRange: [34500, 34500],
    deliveryDays: '3–5 days',
    permitRequired: false,
    features: [
      'Interior concept visuals (3 renders)',
      'Layout recommendations with flow analysis',
      'MEP specification (electrical, plumbing, lighting)',
      'Bill of Materials (BOM) with cost breakdown',
      '30-min consultation call',
    ],
    mepHighlights: ['Lighting circuit layout', 'Outlet placement per code', 'Plumbing fixture scope', 'Ceiling fan wiring'],
    media: {
      heroVideo: STOCK_VIDEOS.interior_renovation,
      galleryImages: STOCK_IMAGES.interior_renovation,
    },
    intakePath: '/intake/interior_renovation',
    heroColor: 'from-purple-900 to-purple-800',
  },
  {
    key: 'exterior_concept',
    slug: 'exterior-facade',
    label: 'Exterior Concept Package',
    tagline: 'Stunning curb appeal—concept and materials in 3–5 days.',
    description:
      'Three exterior renderings (front, side, rear), a complete material palette, landscape overview, and exterior MEP specification. Ideal for facade upgrades, additions, or pre-sale renovations.',
    category: 'design',
    priceDisplay: '$395',
    priceRange: [39500, 39500],
    deliveryDays: '3–5 days',
    permitRequired: true,
    features: [
      '3 exterior renderings (front, side, rear views)',
      'Material palette with finish selections',
      'Landscape overview sketch',
      'MEP specification (exterior systems)',
      'Bill of Materials (BOM)',
      '30-min consultation call',
    ],
    mepHighlights: ['Exterior outlet circuits', 'Porch/garage lighting', 'Hose bib plumbing', 'HVAC condenser placement'],
    media: {
      heroVideo: STOCK_VIDEOS.exterior_concept,
      galleryImages: STOCK_IMAGES.exterior_concept,
    },
    intakePath: '/intake/exterior_concept',
    heroColor: 'from-amber-900 to-amber-800',
  },
  {
    key: 'interior_reno_concept',
    slug: 'interior-design',
    label: 'Interior Reno Concept',
    tagline: 'A focused interior concept to guide your renovation.',
    description:
      'Interior renders, layout flow analysis, MEP scope, and cost breakdown—tailored for homeowners who want a clear design direction before hiring a contractor.',
    category: 'design',
    priceDisplay: '$345',
    priceRange: [34500, 34500],
    deliveryDays: '3–5 days',
    permitRequired: false,
    features: [
      'Interior concept visuals (3 renders)',
      'Layout recommendations with flow analysis',
      'MEP specification (electrical, plumbing, lighting)',
      'Bill of Materials (BOM) with cost breakdown',
      '30-min consultation call',
    ],
    mepHighlights: ['Recessed lighting plan', 'Switch/outlet layout', 'Plumbing relocation scope', 'Smart home rough-in'],
    media: {
      heroVideo: STOCK_VIDEOS.interior_reno_concept,
      galleryImages: STOCK_IMAGES.interior_reno_concept,
    },
    intakePath: '/intake/interior_reno_concept',
    heroColor: 'from-rose-900 to-rose-800',
  },
  {
    key: 'design_build',
    slug: 'design-build',
    label: 'Design + Build Package',
    tagline: 'From concept to construction-ready in one package.',
    description:
      'The complete package: design concept, build-ready scope, MEP specification, BOM, permit scope brief, and a contractor match recommendation. Start building faster with everything in one place.',
    category: 'design',
    priceDisplay: '$795',
    priceRange: [79500, 79500],
    deliveryDays: '5–7 days',
    permitRequired: true,
    features: [
      'Full concept design package',
      'Build-ready scope document',
      'MEP specification for all systems',
      'Bill of Materials (BOM)',
      'Permit scope brief',
      'Contractor match recommendation',
      '30-min consultation call',
    ],
    mepHighlights: ['Full electrical design', 'Plumbing scope & riser', 'HVAC load calculation', 'Smart home pre-wire'],
    media: {
      heroVideo: STOCK_VIDEOS.design_build,
      galleryImages: STOCK_IMAGES.design_build,
    },
    intakePath: '/intake/design_build',
    heroColor: 'from-slate-900 to-slate-800',
  },
]

export const SERVICE_BY_SLUG: Record<string, ServiceConfig> = Object.fromEntries(
  SERVICES.map((s) => [s.slug, s])
)

export const SERVICE_BY_KEY: Record<string, ServiceConfig> = Object.fromEntries(
  SERVICES.map((s) => [s.key, s])
)
