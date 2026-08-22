import {
  CANONICAL_PRICE_CENTS,
  CONCEPT_START_PRICE,
  CONCEPT_DEVELOPER_PRICE,
  PERMIT_BASIC_PRICE,
  PERMIT_PREMIUM_PRICE,
  ESTIMATION_PRICE,
  ESTIMATION_CERTIFIED_PRICE,
  PM_ADVISORY_PRICE,
} from '@kealee/core-rules'

export type HomeServiceId = 'design' | 'estimate' | 'siteplan' | 'permits' | 'build'
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
  beforePhotoSrc?: string
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
  // design concepts — stunning interior/exterior design render
  design:
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=900&q=80&auto=format&fit=crop',
  // Permit Analysis — architect reviewing blueprints at construction site
  permits:
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&q=80&auto=format&fit=crop',
  // Cost Estimation — construction materials and lumber at active job site
  estimate:
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=900&q=80&auto=format&fit=crop',
  // Site Plan — surveyor / site layout work on a residential lot
  siteplan:
    'https://images.unsplash.com/photo-1590986701253-e0b0a9ac4f5f?w=900&q=80&auto=format&fit=crop',
  // Build & Manage — construction crew framing a residential home
  build:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80&auto=format&fit=crop',
} as const

export const HOME_JOURNEY_SERVICES: HomeJourneyService[] = [
  {
    id: 'design',
    // Concept package delivery — 2–5 business days. NOT construction.
    title: 'design concepts',
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
    photoAlt: 'Modern home interior design concept render',
    videoSrc: '/media/service-videos/home-design-video.mp4',
  },
  {
    id: 'estimate',
    // Cost estimate document — delivered with the concept package, not a construction milestone.
    title: 'Cost Estimation',
    subtitle: 'RSMeans-validated · lender-ready PDF',
    description:
      'Line-item material and labor breakdown validated against RSMeans DMV regional data. Not a ballpark — a certified cost plan your lender will accept.',
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
    id: 'siteplan',
    // Site intelligence — parcel constraints and buildable area, not construction.
    title: 'Site Plan',
    subtitle: 'Parcel constraints · buildable area',
    description:
      'Setbacks, lot coverage, access, utilities, and flood or environmental flags where data exists — with a preliminary buildable-area diagram. Every finding is labelled with its source, date, and confidence.',
    priceHint: usdRange(
      CANONICAL_PRICE_CENTS.siteIntelligence.preliminarySitePlan / 100,
      CANONICAL_PRICE_CENTS.siteIntelligence.verifiedSiteFeasibility / 100,
    ),
    ctaText: 'Start Site Plan',
    ctaLink: '/site-plans',
    gradientFrom: '#0F766E',
    gradientTo: '#2ABFBF',
    progress: 60,
    mediaType: 'photo',
    photoSrc: PHOTOS.siteplan,
    photoAlt: 'Site layout and grading work on a residential building lot',
  },
  {
    id: 'permits',
    // Kealee files the permit; jurisdiction determines approval timing (4–12 weeks).
    title: 'Permitting',
    subtitle: 'Kealee prepares & coordinates · the jurisdiction approves',
    description:
      'We identify your jurisdiction anywhere in the US, determine the permit types your scope needs, build the document checklist, and prepare and coordinate the submission. Approval, fees, and timelines are set by the agency — Kealee does not issue permits.',
    priceHint: usdRange(PERMIT_BASIC_PRICE, PERMIT_PREMIUM_PRICE),
    ctaText: 'File Permits',
    ctaLink: '/permits',
    gradientFrom: '#805AD5',
    gradientTo: '#B794F4',
    progress: 80,
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
      'Vetted contractor bids, milestone-based escrow, and a live owner dashboard. Scope and schedule set by permit-approved plans. Contractor coverage varies by market.',
    priceHint: `From $${PM_ADVISORY_PRICE}/mo advisory`,
    ctaText: 'View Build Services',
    ctaLink: '/contractors',
    gradientFrom: '#38A169',
    gradientTo: '#68D391',
    progress: 100,
    mediaType: 'video',
    photoSrc: PHOTOS.build,
    photoAlt: 'Construction crew framing a residential home addition on an active job site',
    videoSrc: '/media/service-videos/home-build-video.mp4',
  },
]
