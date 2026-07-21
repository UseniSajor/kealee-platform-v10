import type { PropertyIntelligenceInput } from '../schemas/property-intelligence.js'
import type { MarketingSegmentKey } from '../constants/segments.js'
import type { OpportunityPriority } from '../constants/scoring-bands.js'

export interface MarketingLeadFixture {
  id: string
  label: string
  property: PropertyIntelligenceInput
  lead: {
    email?: string
    phone?: string
    name?: string
    source?: string
    budget?: number
    timeline?: string
    service?: string
    hasPhoto?: boolean
    hasDocuments?: boolean
    crmStatus?: string
  }
  expect: {
    segment: MarketingSegmentKey
    minOpportunityScore: number
    maxOpportunityScore: number
    priority: OpportunityPriority
    shouldRoute: boolean
    topProduct: string
  }
}

/** Realistic marketing lead scenarios aligned with web-main lead-scorer patterns */
export const MARKETING_LEAD_SCENARIOS: MarketingLeadFixture[] = [
  {
    id: 'hot-kitchen-remodel-meta',
    label: 'Hot kitchen remodel lead from Meta ads',
    property: {
      address: '4521 Wilson Blvd, Arlington, VA 22203',
      propertyType: 'single_family',
      yearBuilt: 1968,
      buildingSquareFootage: 2100,
      lotSize: 7200,
      assessedValue: 685000,
      ownerOccupancy: true,
    },
    lead: {
      email: 'homeowner@example.com',
      phone: '703-555-0101',
      source: 'meta',
      budget: 55000,
      timeline: 'asap',
      service: 'concept',
      hasPhoto: true,
      hasDocuments: true,
    },
    expect: {
      segment: 'homeowner_remodel_candidate',
      minOpportunityScore: 70,
      maxOpportunityScore: 100,
      priority: 'immediate',
      shouldRoute: true,
      topProduct: 'kitchen_bath_remodel',
    },
  },
  {
    id: 'permit-help-google',
    label: 'Permit help lead from Google search',
    property: {
      address: '890 Maple Ave, Fairfax, VA 22030',
      propertyType: 'townhouse',
      yearBuilt: 2005,
      permitHistory: [{ type: 'electrical', status: 'expired' }],
      ownerOccupancy: true,
    },
    lead: {
      source: 'google',
      budget: 35000,
      timeline: '1-2-weeks',
      service: 'permit',
      hasDocuments: true,
    },
    expect: {
      segment: 'permit_help_candidate',
      minOpportunityScore: 65,
      maxOpportunityScore: 100,
      priority: 'immediate',
      shouldRoute: true,
      topProduct: 'permit_package',
    },
  },
  {
    id: 'adu-feasibility-organic',
    label: 'ADU feasibility organic web lead',
    property: {
      address: '1200 Duke St, Alexandria, VA 22314',
      propertyType: 'single_family',
      lotSize: 5500,
      zoning: { code: 'R-20', aduAllowed: true },
      ownerOccupancy: true,
    },
    lead: {
      source: 'organic',
      budget: 120000,
      timeline: '2-3-months',
      service: 'adu',
    },
    expect: {
      segment: 'adu_candidate',
      minOpportunityScore: 55,
      maxOpportunityScore: 100,
      priority: 'immediate',
      shouldRoute: true,
      topProduct: 'adu_feasibility',
    },
  },
  {
    id: 'cold-low-budget-direct',
    label: 'Cold lead — low budget, distant timeline',
    property: {
      address: '55 Oak Ln, Woodbridge, VA 22191',
      propertyType: 'condo',
      yearBuilt: 1998,
    },
    lead: {
      source: 'direct',
      budget: 800,
      timeline: '3plus-months',
      service: 'concept',
    },
    expect: {
      segment: 'homeowner_remodel_candidate',
      minOpportunityScore: 0,
      maxOpportunityScore: 45,
      priority: 'suppress',
      shouldRoute: false,
      topProduct: 'design_concept_validation',
    },
  },
  {
    id: 'developer-feasibility-referral',
    label: 'Developer feasibility — high value referral',
    property: {
      address: '2000 Duke St, Alexandria, VA 22314',
      propertyType: 'multifamily',
      lotSize: 22000,
      buildingSquareFootage: 45000,
      assessedValue: 4200000,
      zoning: { code: 'MU-1' },
    },
    lead: {
      source: 'referral',
      budget: 2500000,
      timeline: 'asap',
      service: 'full-design',
      hasDocuments: true,
      name: 'Apex Development LLC',
    },
    expect: {
      segment: 'developer_feasibility_candidate',
      minOpportunityScore: 75,
      maxOpportunityScore: 100,
      priority: 'immediate',
      shouldRoute: true,
      topProduct: 'developer_feasibility',
    },
  },
  {
    id: 'investor-renovation-meta',
    label: 'Investor renovation lead from paid social',
    property: {
      address: '3310 Georgia Ave NW, Washington, DC 20010',
      propertyType: 'duplex',
      yearBuilt: 1942,
      ownershipType: 'investor',
      lastSaleDate: '2024-11-15T00:00:00.000Z',
    },
    lead: {
      source: 'meta',
      budget: 180000,
      timeline: '1-month',
      service: 'estimate',
      hasPhoto: true,
    },
    expect: {
      segment: 'investor_renovation_candidate',
      minOpportunityScore: 60,
      maxOpportunityScore: 100,
      priority: 'immediate',
      shouldRoute: true,
      topProduct: 'estimate_detailed',
    },
  },
]
