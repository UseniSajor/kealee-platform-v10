import {
  CONCEPT_START_PRICE,
  CONCEPT_DEVELOPER_PRICE,
  PERMIT_BASIC_PRICE,
  PERMIT_PREMIUM_PRICE,
  ESTIMATION_PRICE,
  ESTIMATION_CERTIFIED_PRICE,
  PM_ADVISORY_PRICE,
} from '@kealee/core-rules'

export type HomeServiceId = 'design' | 'permits' | 'estimate' | 'build'
export type HomeServiceMediaType = 'video' | 'photo'

export interface HomeJourneyService {
  id: HomeServiceId
  title: string
  subtitle: string
  description: string
  priceHint: string
  ctaText: string
  ctaLink: string
  gradientFrom: string
  gradientTo: string
  progress: number
  mediaType: HomeServiceMediaType
  photoSrc: string
  photoAlt: string
  videoSrc?: string
  videoWebM?: string
}

function usdRange(min: number, max: number): string {
  const fmt = (n: number) => `$${n.toLocaleString('en-US')}`
  return `${fmt(min)} – ${fmt(max)}`
}

/**
 * Square photos for the four home journey circle cards.
 * Rules: must show live residential/commercial construction content.
 * No tax forms, no spreadsheets, no financial paperwork.
 * Swap for /public/media/service-photos/* when AI-generated assets are uploaded.
 */
const PHOTOS = {
  // AI Design Concepts — stunning interior/exterior design render
  design:
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=900&q=80&auto=format&fit=crop',
  // Permit Analysis — architect reviewing blueprints at construction site
  permits:
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&q=80&auto=format&fit=crop',
  // Cost Estimation — construction materials and lumber at active job site
  estimate:
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=900&q=80&auto=format&fit=crop',
  // Build & Manage — construction crew framing a residential home
  build:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80&auto=format&fit=crop',
} as const

export const HOME_JOURNEY_SERVICES: HomeJourneyService[] = [
  {
    id: 'design',
    // Concept package delivery — 2–5 business days. NOT construction.
    title: 'AI Design Concepts',
    subtitle: 'Concept package · 2–5 day delivery',
    description:
      'AI renders, floor plan, permit scope outline, and cost band. This is your planning package — not construction. Order opens your project workspace.',
    priceHint: usdRange(CONCEPT_START_PRICE, CONCEPT_DEVELOPER_PRICE),
    ctaText: 'Start Design Concept',
    ctaLink: '/concept',
    gradientFrom: '#2ABFBF',
    gradientTo: '#00A3C4',
    progress: 25,
    mediaType: 'video',
    photoSrc: PHOTOS.design,
    photoAlt: 'Modern home interior AI design concept render',
    videoSrc: '/media/service-videos/home-design-video.mp4',
  },
  {
    id: 'estimate',
    // Cost estimate document — delivered with the concept package, not a construction milestone.
    title: 'Cost Estimation',
    subtitle: 'Regional cost references · review options',
    description:
      'Line-item material and labor planning ranges using DMV regional cost references. Certified or lender-facing review is included only in packages that explicitly say so.',
    priceHint: usdRange(ESTIMATION_PRICE, ESTIMATION_CERTIFIED_PRICE),
    ctaText: 'Get Cost Estimate',
    ctaLink: '/estimate',
    gradientFrom: '#E8793A',
    gradientTo: '#F6AD55',
    progress: 50,
    mediaType: 'video',
    photoSrc: PHOTOS.estimate,
    photoAlt: 'Construction materials and lumber at active residential job site',
    videoSrc: '/media/service-videos/home-estimate-video.mp4',
  },
  {
    id: 'permits',
    // Kealee files the permit; jurisdiction determines approval timing (4–12 weeks).
    title: 'Permit Filing',
    subtitle: 'Kealee files · jurisdiction approves',
    description:
      'Kealee coordinates application preparation and submission for purchased filing packages, with qualified professionals engaged when required. The jurisdiction controls requirements, review time, and approval.',
    priceHint: usdRange(PERMIT_BASIC_PRICE, PERMIT_PREMIUM_PRICE),
    ctaText: 'File Permits',
    ctaLink: '/permits',
    gradientFrom: '#805AD5',
    gradientTo: '#B794F4',
    progress: 75,
    mediaType: 'video',
    photoSrc: PHOTOS.permits,
    photoAlt: 'Architect reviewing blueprints at residential construction site',
    videoSrc: '/media/service-videos/home-permits-video.mp4',
  },
  {
    id: 'build',
    title: 'Build & Manage',
    // Construction execution phase — weeks to months of active build work, not package delivery.
    subtitle: 'Active construction · contractor-matched',
    description:
      'Browse screened DMV construction providers in the Marketplace. Credential status, payment protection, and project controls are shown for each available engagement.',
    priceHint: `From $${PM_ADVISORY_PRICE}/mo advisory`,
    ctaText: 'View Build Services',
    ctaLink: '/marketplace',
    gradientFrom: '#38A169',
    gradientTo: '#68D391',
    progress: 100,
    mediaType: 'video',
    photoSrc: PHOTOS.build,
    photoAlt: 'Construction crew framing a residential home addition on an active job site',
    videoSrc: '/media/service-videos/home-build-video.mp4',
  },
]
