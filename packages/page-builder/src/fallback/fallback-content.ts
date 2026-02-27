import type {
  HeroData,
  BudgetBreakdownData,
  TimelineData,
  PricingGridData,
  BudgetLineItem,
  TimelinePhase,
} from '../types'
import type { FunnelProjectType, BudgetRange } from '@prisma/client'

const PROJECT_TYPE_LABELS: Record<string, string> = {
  KITCHEN_REMODEL: 'Kitchen Remodel',
  BATHROOM_REMODEL: 'Bathroom Remodel',
  WHOLE_HOME: 'Whole Home Renovation',
  ADDITION: 'Home Addition',
  NEW_CONSTRUCTION: 'New Construction',
  EXTERIOR: 'Exterior Renovation',
  LANDSCAPING: 'Landscaping',
  COMMERCIAL: 'Commercial Project',
}

const BUDGET_RANGES: Record<string, { low: number; mid: number; high: number }> = {
  UNDER_25K: { low: 10000, mid: 17500, high: 25000 },
  RANGE_25K_50K: { low: 25000, mid: 37500, high: 50000 },
  RANGE_50K_100K: { low: 50000, mid: 75000, high: 100000 },
  RANGE_100K_250K: { low: 100000, mid: 175000, high: 250000 },
  OVER_250K: { low: 250000, mid: 375000, high: 500000 },
}

export function getFallbackHero(
  projectType: FunnelProjectType,
  city: string,
  state: string
): HeroData {
  const label = PROJECT_TYPE_LABELS[projectType] || 'Home Project'
  return {
    headline: `Your ${label} Plan for ${city}, ${state}`,
    subheadline: `We've matched you with top-rated professionals and built a personalized project plan based on your goals and budget.`,
    ctaText: 'Get Started Today',
    ctaHref: '/signup',
    projectTypeLabel: label,
    locationLabel: `${city}, ${state}`,
  }
}

export function getFallbackBudgetBreakdown(
  projectType: FunnelProjectType,
  budget: BudgetRange
): BudgetBreakdownData {
  const range = BUDGET_RANGES[budget] || BUDGET_RANGES.RANGE_50K_100K
  const lineItems: BudgetLineItem[] = [
    { category: 'Materials', lowEstimate: range.low * 0.35, midEstimate: range.mid * 0.35, highEstimate: range.high * 0.35, percentage: 35 },
    { category: 'Labor', lowEstimate: range.low * 0.40, midEstimate: range.mid * 0.40, highEstimate: range.high * 0.40, percentage: 40 },
    { category: 'Design & Planning', lowEstimate: range.low * 0.10, midEstimate: range.mid * 0.10, highEstimate: range.high * 0.10, percentage: 10 },
    { category: 'Permits & Inspections', lowEstimate: range.low * 0.05, midEstimate: range.mid * 0.05, highEstimate: range.high * 0.05, percentage: 5 },
    { category: 'Contingency', lowEstimate: range.low * 0.10, midEstimate: range.mid * 0.10, highEstimate: range.high * 0.10, percentage: 10 },
  ]

  return {
    title: `${PROJECT_TYPE_LABELS[projectType] || 'Project'} Budget Breakdown`,
    totalLow: range.low,
    totalMid: range.mid,
    totalHigh: range.high,
    lineItems,
    notes: 'Estimates based on industry averages for your area. Actual costs may vary based on materials, scope, and contractor selection.',
  }
}

export function getFallbackTimeline(projectType: FunnelProjectType): TimelineData {
  const phases: TimelinePhase[] = [
    { name: 'Planning & Design', durationWeeks: 2, description: 'Finalize plans, select materials, obtain permits', order: 1 },
    { name: 'Demolition & Prep', durationWeeks: 1, description: 'Remove existing structures, prepare site', order: 2 },
    { name: 'Rough Construction', durationWeeks: 3, description: 'Framing, electrical, plumbing rough-ins', order: 3 },
    { name: 'Finishes & Install', durationWeeks: 2, description: 'Drywall, paint, fixtures, flooring', order: 4 },
    { name: 'Final Inspection', durationWeeks: 1, description: 'Quality check, punch list, final walkthrough', order: 5 },
  ]
  const totalWeeks = phases.reduce((sum, p) => sum + p.durationWeeks, 0)

  return {
    title: 'Estimated Project Timeline',
    totalWeeks,
    phases,
  }
}

export function getFallbackPricing(budget: BudgetRange): PricingGridData {
  const range = BUDGET_RANGES[budget] || BUDGET_RANGES.RANGE_50K_100K

  return {
    title: 'Project Cost Tiers',
    tiers: [
      {
        label: 'Budget-Friendly',
        price: range.low,
        description: 'Quality results with cost-conscious choices',
        features: ['Standard materials', 'Essential scope', 'Basic finishes'],
      },
      {
        label: 'Mid-Range',
        price: range.mid,
        description: 'Best balance of quality and value',
        features: ['Quality materials', 'Full scope', 'Upgraded finishes', 'Design consultation'],
      },
      {
        label: 'Premium',
        price: range.high,
        description: 'Top-tier materials and craftsmanship',
        features: ['Premium materials', 'Expanded scope', 'Custom finishes', 'Full design team', 'Extended warranty'],
      },
    ],
  }
}

export { PROJECT_TYPE_LABELS, BUDGET_RANGES }
