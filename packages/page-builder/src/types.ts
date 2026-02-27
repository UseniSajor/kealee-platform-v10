import type {
  FunnelUserType,
  FunnelProjectType,
  BudgetRange,
  FunnelTimeline,
} from '@prisma/client'

export interface PageBuildRequest {
  sessionId: string
  userType: FunnelUserType
  projectType: FunnelProjectType
  city: string
  state: string
  budget: BudgetRange
  timeline: FunnelTimeline
}

export interface PageBuildResult {
  sessionId: string
  sections: SectionData[]
  layout: SectionType[]
  generatedAt: string
}

export type SectionType =
  | 'hero'
  | 'contractor_grid'
  | 'budget_breakdown'
  | 'timeline'
  | 'pricing_grid'
  | 'case_studies'

export interface SectionData {
  type: SectionType
  data: HeroData | ContractorGridData | BudgetBreakdownData | TimelineData | PricingGridData | CaseStudyGridData
}

export interface HeroData {
  headline: string
  subheadline: string
  ctaText: string
  ctaHref: string
  projectTypeLabel: string
  locationLabel: string
}

export interface ContractorCardData {
  id: string
  companyName: string
  contactName: string
  city: string | null
  state: string | null
  trades: string[]
  rating: number
  reviewCount: number
  isVerified: boolean
  yearsInBusiness: number | null
}

export interface ContractorGridData {
  title: string
  contractors: ContractorCardData[]
}

export interface BudgetLineItem {
  category: string
  lowEstimate: number
  midEstimate: number
  highEstimate: number
  percentage: number
}

export interface BudgetBreakdownData {
  title: string
  totalLow: number
  totalMid: number
  totalHigh: number
  lineItems: BudgetLineItem[]
  notes: string
}

export interface TimelinePhase {
  name: string
  durationWeeks: number
  description: string
  order: number
}

export interface TimelineData {
  title: string
  totalWeeks: number
  phases: TimelinePhase[]
}

export interface PricingTier {
  label: string
  price: number
  description: string
  features: string[]
}

export interface PricingGridData {
  title: string
  tiers: PricingTier[]
}

export interface CaseStudyCardData {
  id: string
  title: string
  description: string
  city: string
  state: string
  budget: number
  durationWeeks: number
  beforeImageUrl: string | null
  afterImageUrl: string | null
  highlights: string[]
}

export interface CaseStudyGridData {
  title: string
  caseStudies: CaseStudyCardData[]
}
