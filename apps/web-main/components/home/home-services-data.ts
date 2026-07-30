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
  beforePhotoSrc?: string
  videoSrc?: string
  videoWebM?: string
}

function usdRange(min: number, max: number): string {
  const fmt = (n: number) => `$${n.toLocaleString('en-US')}`
  return `${fmt(min)} – ${fmt(max)}`
}

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
    photoSrc: '/media/service-photos/interior-reno-concept-after.jpg',
    beforePhotoSrc: '/media/service-photos/interior-reno-concept-before.jpg',
    photoAlt: 'Renovated open-plan home interior concept',
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
    photoSrc: '/media/service-photos/product-addition.jpg',
    beforePhotoSrc: '/media/service-photos/product-addition-before.jpg',
    photoAlt: 'Completed residential home addition',
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
    photoSrc: '/media/service-photos/product-facade.jpg',
    beforePhotoSrc: '/media/service-photos/product-facade-before.jpg',
    photoAlt: 'Completed permitted residential facade renovation',
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
    photoSrc: '/media/service-photos/design-build-after.jpg',
    beforePhotoSrc: '/media/service-photos/design-build-before.jpg',
    photoAlt: 'Completed professionally managed residential renovation',
    videoSrc: '/media/service-videos/home-build-video.mp4',
  },
]
