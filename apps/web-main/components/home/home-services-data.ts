import {
  CANONICAL_PRICE_CENTS,
  CONCEPT_DEVELOPER_PRICE,
  CONCEPT_START_PRICE,
  ESTIMATION_CERTIFIED_PRICE,
  ESTIMATION_PRICE,
  PERMIT_BASIC_PRICE,
  PERMIT_PREMIUM_PRICE,
} from '@kealee/core-rules'

export type HomeServiceId =
  | 'siteplan'
  | 'design'
  | 'estimate'
  | 'permits'
  | 'contractor'
  | 'escrow'

export type HomeServiceMediaType = 'video' | 'photo'

export interface HomeJourneyService {
  id: HomeServiceId
  slug: string
  title: string
  shortTitle: string
  subtitle: string
  description: string
  outcome: string
  priceHint: string
  deliveryHint: string
  ctaText: string
  ctaLink: string
  gradientFrom: string
  gradientTo: string
  mediaType: HomeServiceMediaType
  photoSrc: string
  /** Retained for the previous before/after card design. */
  beforePhotoSrc?: string
  photoAlt: string
  videoSrc?: string
  videoWebM?: string
  includes: string[]
  aiQuestions: string[]
  nextService?: string
}

function usdRange(min: number, max: number): string {
  const fmt = (n: number) => `$${n.toLocaleString('en-US')}`
  return `${fmt(min)}–${fmt(max)}`
}

/** The six customer-facing services, ordered from property planning to protected construction. */
export const HOME_JOURNEY_SERVICES: HomeJourneyService[] = [
  {
    id: 'siteplan', slug: 'site-plan', shortTitle: 'Site Plan', title: 'Understand Your Property',
    subtitle: 'Step 1 · Property & feasibility',
    description: 'See what may fit, where it can go, and which property constraints need attention before design begins.',
    outcome: 'A visual site plan with buildable-area guidance, constraints, and recommended next steps.',
    priceHint: usdRange(CANONICAL_PRICE_CENTS.siteIntelligence.preliminarySitePlan / 100, CANONICAL_PRICE_CENTS.siteIntelligence.verifiedSiteFeasibility / 100),
    deliveryHint: 'Digital delivery in your owner workspace', ctaText: 'Start Site Plan', ctaLink: '/intake/preliminary_site_plan',
    gradientFrom: '#087f74', gradientTo: '#25b9aa', mediaType: 'video',
    photoSrc: '/media/hero-videos/hero-new-construction.jpg', photoAlt: 'Residential property viewed for site planning and feasibility',
    videoSrc: '/media/hero-videos/hero-new-construction.mp4',
    includes: ['Parcel and property context', 'Buildable-area direction', 'Key constraints and assumptions', 'Clear path to design or verification'],
    aiQuestions: ['What is the property address?', 'What are you hoping to build?', 'Do you have a survey or property documents?'],
    nextService: 'Design Concept',
  },
  {
    id: 'design', slug: 'design-concept', shortTitle: 'Design Concept', title: 'See the Idea Before You Build',
    subtitle: 'Step 2 · Design & visualization',
    description: 'Turn an address, a few photos, and your goals into a visual direction you can understand and share.',
    outcome: 'A coordinated concept package with layouts, renderings, scope, materials, permit guidance, and cost direction.',
    priceHint: usdRange(CONCEPT_START_PRICE, CONCEPT_DEVELOPER_PRICE),
    deliveryHint: 'AI-assisted preparation with portal and PDF delivery', ctaText: 'Create Design Concept', ctaLink: '/get-concept',
    gradientFrom: '#137e96', gradientTo: '#20a9bc', mediaType: 'video',
    photoSrc: '/media/service-photos/home-design.jpg', photoAlt: 'Photorealistic home design concept visualization',
    videoSrc: '/media/service-videos/home-design-video.mp4',
    includes: ['Layout and style direction', 'Photorealistic visualizations', 'Materials and scope', 'Permit and zoning guidance in every tier'],
    aiQuestions: ['What space are you changing?', 'What result do you want?', 'Upload photos or plans if you have them'],
    nextService: 'Cost Estimate',
  },
  {
    id: 'estimate', slug: 'cost-estimate', shortTitle: 'Cost Estimate', title: 'Know the Likely Cost',
    subtitle: 'Step 3 · Scope & budget',
    description: 'Understand labor, materials, allowances, and risk before comparing bids or committing to construction.',
    outcome: 'A documented trade-by-trade estimate with assumptions, quantities, and a downloadable cost report.',
    priceHint: usdRange(ESTIMATION_PRICE, ESTIMATION_CERTIFIED_PRICE),
    deliveryHint: 'Planning and certified options available', ctaText: 'Start Cost Estimate', ctaLink: '/intake/cost_estimate',
    gradientFrom: '#d76132', gradientTo: '#ef8a4b', mediaType: 'video',
    photoSrc: '/media/service-photos/home-estimate.jpg', photoAlt: 'Construction cost estimate and material planning',
    videoSrc: '/media/service-videos/home-estimate-video.mp4',
    includes: ['Trade-by-trade costs', 'Labor and material quantities', 'Allowances and assumptions', 'PDF report for bid comparison'],
    aiQuestions: ['What are you building?', 'What drawings or scope do you already have?', 'What is the property location?'],
    nextService: 'Permits',
  },
  {
    id: 'permits', slug: 'permits', shortTitle: 'Permits', title: 'Get Ready to File',
    subtitle: 'Step 4 · Approvals & filing',
    description: 'Know what your jurisdiction needs, prepare the right package, and keep the submission moving.',
    outcome: 'A jurisdiction-specific permit path, required-document checklist, and the right coordination level for your project.',
    priceHint: usdRange(PERMIT_BASIC_PRICE, PERMIT_PREMIUM_PRICE),
    deliveryHint: 'Assessment, package preparation, and filing paths', ctaText: 'Start Permit Service', ctaLink: '/intake/permit_path_only?product=permit_assessment',
    gradientFrom: '#6745a5', gradientTo: '#9470ca', mediaType: 'video',
    photoSrc: '/media/service-photos/home-permits.jpg', photoAlt: 'Permit drawings being reviewed for a construction project',
    videoSrc: '/media/service-videos/home-permits-video.mp4',
    includes: ['Likely permit types', 'Submission checklist', 'Agency and review path', 'Professional drawing requirements'],
    aiQuestions: ['Where is the project?', 'What work is planned?', 'Do you have drawings, a concept, or an estimate?'],
    nextService: 'Contractor Match',
  },
  {
    id: 'contractor', slug: 'contractor-match', shortTitle: 'Contractor Match', title: 'Find the Right Builder',
    subtitle: 'Step 5 · Bids & contractor selection',
    description: 'Match the approved scope with qualified contractors and compare responses on the same basis.',
    outcome: 'A structured match, comparable bids, contractor credentials, and a clear selection record.',
    // Contractor matching is free — Kealee is paid by the build engagement.
    priceHint: 'Free', deliveryHint: 'Begins after permit readiness is verified',
    ctaText: 'Start Contractor Match', ctaLink: '/intake/contractor_match',
    gradientFrom: '#2c7a53', gradientTo: '#52a66e', mediaType: 'video',
    photoSrc: '/media/service-photos/home-build.jpg', photoAlt: 'Qualified residential construction team on site',
    videoSrc: '/media/service-videos/home-build-video.mp4',
    includes: ['Qualified contractor matching', 'Comparable scope and bids', 'Credential review', 'Owner selection support'],
    aiQuestions: ['What is the approved scope?', 'Where is the project?', 'When do you want construction to start?'],
    nextService: 'Escrow & Payment Protection',
  },
  {
    id: 'escrow', slug: 'escrow-protection', shortTitle: 'Escrow & Protection', title: 'Protect Every Payment',
    subtitle: 'Step 6 · Protected construction',
    description: 'Tie payments to documented milestones so money moves only after work is reviewed and approved.',
    outcome: 'A milestone payment plan with approval records, lien-waiver tracking, and a visible audit trail.',
    priceHint: 'Included with coordinated projects', deliveryHint: 'Active through construction and closeout',
    ctaText: 'Set Up Payment Protection', ctaLink: '/request-service?service=escrow-protection&name=Escrow%20%26%20Payment%20Protection',
    gradientFrom: '#173c63', gradientTo: '#315f8c', mediaType: 'video',
    photoSrc: '/media/hero-videos/hero-addition.jpg', photoAlt: 'Home construction managed through protected project milestones',
    videoSrc: '/media/hero-videos/hero-addition.mp4',
    includes: ['Milestone-based releases', 'Owner approval controls', 'Lien-waiver tracking', 'Payment and decision audit trail'],
    aiQuestions: ['What is the contract amount?', 'What work milestones are agreed?', 'Who are the owner and contractor?'],
  },
]

export function getHomeJourneyService(slug: string): HomeJourneyService | undefined {
  return HOME_JOURNEY_SERVICES.find(service => service.slug === slug)
}
