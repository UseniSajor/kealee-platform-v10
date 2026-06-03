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
    title: 'AI Design Concepts',
    subtitle: 'Planning workspace included',
    description:
      'AI renders, floor plan, permit scope, and cost band. Your concept order opens your project workspace.',
    priceHint: usdRange(CONCEPT_START_PRICE, CONCEPT_DEVELOPER_PRICE),
    ctaText: 'Start Design Concept',
    ctaLink: '/concept',
    gradientFrom: '#1F252A',
    gradientTo: '#2E5090',
    progress: 25,
    mediaType: 'video',
    photoSrc: PHOTOS.design,
    photoAlt: 'Modern home interior AI design concept render',
    videoSrc: '/media/service-videos/home-design-video.mp4',
  },
  {
    id: 'permits',
    title: 'Permit Analysis',
    subtitle: 'DC · MD · VA filing',
    description:
      'Licensed specialists handle every form, agency submission, and comment cycle from your concept scope.',
    priceHint: usdRange(PERMIT_BASIC_PRICE, PERMIT_PREMIUM_PRICE),
    ctaText: 'File Permits',
    ctaLink: '/permits',
    gradientFrom: '#2E5090',
    gradientTo: '#C38B5F',
    progress: 50,
    mediaType: 'video',
    photoSrc: PHOTOS.permits,
    photoAlt: 'Architect reviewing blueprints at residential construction site',
    videoSrc: '/media/service-videos/home-permits-video.mp4',
  },
  {
    id: 'estimate',
    title: 'Cost Estimation',
    subtitle: 'RSMeans-validated',
    description:
      'Trade-by-trade cost breakdown validated against RSMeans regional data. Lender-ready PDF.',
    priceHint: usdRange(ESTIMATION_PRICE, ESTIMATION_CERTIFIED_PRICE),
    ctaText: 'Get Cost Estimate',
    ctaLink: '/estimate',
    gradientFrom: '#C38B5F',
    gradientTo: '#1F252A',
    progress: 75,
    mediaType: 'video',
    photoSrc: PHOTOS.estimate,
    photoAlt: 'Construction materials and lumber at active residential job site',
    videoSrc: '/media/service-videos/home-estimate-video.mp4',
  },
  {
    id: 'build',
    title: 'Build & Manage',
    subtitle: 'Workspace + contractors',
    description:
      'Matched bids from vetted DMV contractors, milestone escrow, and your owner workspace tracking every phase.',
    priceHint: `From $${PM_ADVISORY_PRICE}/mo advisory`,
    ctaText: 'View Build Services',
    ctaLink: '/contractors',
    gradientFrom: '#1F252A',
    gradientTo: '#C38B5F',
    progress: 100,
    mediaType: 'video',
    photoSrc: PHOTOS.build,
    photoAlt: 'Construction crew building a residential home addition',
    videoSrc: '/media/service-videos/home-build-video.mp4',
  },
]
