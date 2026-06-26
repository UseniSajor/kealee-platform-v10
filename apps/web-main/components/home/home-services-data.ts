import {
  CONCEPT_START_PRICE,
  CONCEPT_DEVELOPER_PRICE,
  PERMIT_BASIC_PRICE,
  PERMIT_PREMIUM_PRICE,
  ESTIMATION_PRICE,
  ESTIMATION_CERTIFIED_PRICE,
  PM_ADVISORY_PRICE,
} from '@kealee/core-rules'
import { HOME_DESIGN_CARD_VIDEO } from '@/lib/marketing/homepage-feature-videos'

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
    videoSrc: HOME_DESIGN_CARD_VIDEO.src,
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
    id: 'permits',
    // Kealee files the permit; jurisdiction determines approval timing (4–12 weeks).
    title: 'Permit Filing',
    subtitle: 'Kealee files · jurisdiction approves',
    description:
      'Licensed specialists prepare and submit every form to DC, MD, or VA agencies. Kealee manages all comment cycles. Permit approval is set by the jurisdiction — typically 4–12 weeks after submission.',
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
      'Vetted DMV contractor bids, milestone-based escrow, and a live owner dashboard. Scope and schedule set by permit-approved plans.',
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
