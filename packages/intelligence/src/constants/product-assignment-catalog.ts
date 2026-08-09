import type { KealeeProduct } from './products.js'

/** Kealee bot identifiers for routing — maps to existing platform bots */
export type KealeeBotId =
  | 'DesignBot'
  | 'DesignLandBot'
  | 'EstimateBot'
  | 'PermitBot'
  | 'ContractorBot'
  | 'FinanceBot'
  | 'PMBot'
  | 'DeveloperBot'

export interface ProductAssignmentDefinition {
  product: KealeeProduct
  displayName: string
  campaign: string
  landingPage: string
  landingPageLabel: string
  offer: string
  offerPriceUsd: number
  bot: KealeeBotId
  nurtureSequence: string
  nextServiceInJourney?: KealeeProduct
  crmPipelineStage: string
}

/** Predefined assignment for every Kealee product — no human needed when score qualifies */
export const PRODUCT_ASSIGNMENT_CATALOG: Record<KealeeProduct, ProductAssignmentDefinition> = {
  kitchen_bath_remodel: {
    product: 'kitchen_bath_remodel',
    displayName: 'Kitchen Remodel',
    campaign: 'Kitchen Remodel',
    landingPage: '/intake/kitchen_remodel',
    landingPageLabel: 'Kitchen Remodel Design Concept',
    offer: '$299 Design Concept',
    offerPriceUsd: 299,
    bot: 'DesignBot',
    nurtureSequence: 'kitchen_remodel_14d',
    nextServiceInJourney: 'permit_package',
    crmPipelineStage: 'design_concept',
  },
  design_concept_validation: {
    product: 'design_concept_validation',
    displayName: 'Design Concept',
    campaign: 'Design Concept',
    landingPage: '/concept-package',
    landingPageLabel: 'Design Concept Validation',
    offer: '$299 Design Concept (estimate included)',
    offerPriceUsd: 299,
    bot: 'DesignBot',
    nurtureSequence: 'design_concept_14d',
    nextServiceInJourney: 'permit_package',
    crmPipelineStage: 'design_concept',
  },
  adu_feasibility: {
    product: 'adu_feasibility',
    displayName: 'ADU',
    campaign: 'ADU',
    landingPage: '/intake/adu',
    landingPageLabel: 'ADU Feasibility',
    offer: '$299 Feasibility Package',
    offerPriceUsd: 299,
    bot: 'DesignLandBot',
    nurtureSequence: 'adu_education_21d',
    nextServiceInJourney: 'permit_package',
    crmPipelineStage: 'adu_feasibility',
  },
  addition_feasibility: {
    product: 'addition_feasibility',
    displayName: 'Home Addition',
    campaign: 'Home Addition',
    landingPage: '/intake/addition',
    landingPageLabel: 'Addition Feasibility',
    offer: '$299 Feasibility Package',
    offerPriceUsd: 299,
    bot: 'DesignLandBot',
    nurtureSequence: 'addition_14d',
    nextServiceInJourney: 'permit_package',
    crmPipelineStage: 'addition_feasibility',
  },
  basement_finish: {
    product: 'basement_finish',
    displayName: 'Basement Finish',
    campaign: 'Basement Finish',
    landingPage: '/intake/basement_finish',
    landingPageLabel: 'Basement Design Concept',
    offer: '$299 Design Concept (estimate included)',
    offerPriceUsd: 299,
    bot: 'DesignBot',
    nurtureSequence: 'basement_14d',
    nextServiceInJourney: 'permit_package',
    crmPipelineStage: 'design_concept',
  },
  estimate_detailed: {
    product: 'estimate_detailed',
    displayName: 'Detailed Estimate',
    campaign: 'Included with Design',
    landingPage: '/concept-package',
    landingPageLabel: 'Estimate Included with Design Concept',
    offer: 'Included with design concept, professional drawings, or permit package',
    offerPriceUsd: 0,
    bot: 'EstimateBot',
    nurtureSequence: 'permit_status_7d',
    nextServiceInJourney: 'permit_package',
    crmPipelineStage: 'design_concept',
  },
  permit_package: {
    product: 'permit_package',
    displayName: 'Permit Package',
    campaign: 'Permit Package',
    landingPage: '/permits-only/intake',
    landingPageLabel: 'Permit Package',
    offer: 'Permit Filing Package',
    offerPriceUsd: 1295,
    bot: 'PermitBot',
    nurtureSequence: 'permit_status_7d',
    nextServiceInJourney: 'contractor_match',
    crmPipelineStage: 'permit',
  },
  contractor_match: {
    product: 'contractor_match',
    displayName: 'Contractor Match',
    campaign: 'Contractor Match',
    landingPage: '/marketplace',
    landingPageLabel: 'Contractor Match',
    offer: 'Vetted Contractor Bids',
    offerPriceUsd: 0,
    bot: 'ContractorBot',
    nurtureSequence: 'contractor_bid_14d',
    nextServiceInJourney: 'pm_advisory',
    crmPipelineStage: 'contractor',
  },
  pm_advisory: {
    product: 'pm_advisory',
    displayName: 'PM Advisory',
    campaign: 'PM Advisory',
    landingPage: '/homeowners/pm-advisory',
    landingPageLabel: 'PM Advisory',
    offer: 'Construction PM Advisory',
    offerPriceUsd: 0,
    bot: 'PMBot',
    nurtureSequence: 'pm_weekly_checkin',
    crmPipelineStage: 'active_project',
  },
  owner_rep: {
    product: 'owner_rep',
    displayName: 'Owner Rep',
    campaign: 'Owner Rep',
    landingPage: '/homeowners/pm-advisory',
    landingPageLabel: 'Owner Representation',
    offer: 'Owner Rep Services',
    offerPriceUsd: 0,
    bot: 'PMBot',
    nurtureSequence: 'owner_rep_14d',
    crmPipelineStage: 'active_project',
  },
  finance_draw_schedule: {
    product: 'finance_draw_schedule',
    displayName: 'Financing Review',
    campaign: 'Financing Review',
    landingPage: '/financing',
    landingPageLabel: 'Financing Review',
    offer: 'Financing Fit Assessment',
    offerPriceUsd: 0,
    bot: 'FinanceBot',
    nurtureSequence: 'finance_review_7d',
    nextServiceInJourney: 'permit_package',
    crmPipelineStage: 'financing',
  },
  developer_feasibility: {
    product: 'developer_feasibility',
    displayName: 'Developer Feasibility',
    campaign: 'Developer Feasibility',
    landingPage: '/concept-engine/developer',
    landingPageLabel: 'Developer Feasibility Study',
    offer: '$995 Feasibility Study',
    offerPriceUsd: 995,
    bot: 'DeveloperBot',
    nurtureSequence: 'developer_outreach_10d',
    nextServiceInJourney: 'permit_package',
    crmPipelineStage: 'developer',
  },
  investor_renovation_package: {
    product: 'investor_renovation_package',
    displayName: 'Investor Renovation',
    campaign: 'Investor Renovation',
    landingPage: '/investors',
    landingPageLabel: 'Investor Renovation Package',
    offer: 'Investor Scope + Estimate',
    offerPriceUsd: 695,
    bot: 'EstimateBot',
    nurtureSequence: 'investor_flip_14d',
    nextServiceInJourney: 'contractor_match',
    crmPipelineStage: 'investor',
  },
  commercial_tenant_improvement: {
    product: 'commercial_tenant_improvement',
    displayName: 'Commercial TI',
    campaign: 'Commercial Renovation',
    landingPage: '/commercial',
    landingPageLabel: 'Commercial Tenant Improvement',
    offer: 'TI Concept + Estimate',
    offerPriceUsd: 995,
    bot: 'DesignBot',
    nurtureSequence: 'commercial_ti_21d',
    nextServiceInJourney: 'permit_package',
    crmPipelineStage: 'commercial',
  },
}

/** Customer journey: concept (estimate included) → permit → contractor → PM */
export const POST_PURCHASE_JOURNEY: KealeeProduct[] = [
  'design_concept_validation',
  'permit_package',
  'contractor_match',
  'pm_advisory',
]

export const AUTO_ASSIGN_MIN_PRODUCT_SCORE = 75
export const AUTO_ASSIGN_NO_REVIEW_MIN_SCORE = 90

export function getProductAssignment(product: KealeeProduct): ProductAssignmentDefinition {
  return PRODUCT_ASSIGNMENT_CATALOG[product]
}
