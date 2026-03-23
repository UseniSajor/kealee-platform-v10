/**
 * AI Concept Journey Configuration
 * Defines the full user journey from homepage → intake → capture → payment → generation → delivery → upsell
 */

// Re-export canonical path types from floorplan/types — single source of truth
export type { ProjectPath, ResidentialProjectPath, CommercialProjectPath } from '../floorplan/types'
import type { ProjectPath, ResidentialProjectPath } from '../floorplan/types'

export type UserType = 'homeowner' | 'investor' | 'developer' | 'contractor' | 'anonymous'

/** Which user types have access to each project path */
export const PATH_USER_TYPES: Record<ProjectPath, UserType[]> = {
  kitchen_remodel:        ['homeowner', 'contractor', 'anonymous'],
  bathroom_remodel:       ['homeowner', 'contractor', 'anonymous'],
  interior_renovation:    ['homeowner', 'contractor', 'anonymous'],
  whole_home_remodel:     ['homeowner', 'contractor', 'anonymous'],
  addition_expansion:     ['homeowner', 'developer', 'contractor', 'anonymous'],
  exterior_concept:       ['homeowner', 'anonymous'],
  capture_site_concept:   ['homeowner', 'developer', 'investor', 'anonymous'],
  // Commercial — developer and investor only
  multi_unit_residential:    ['developer', 'investor'],
  mixed_use:                 ['developer', 'investor'],
  commercial_office:         ['developer', 'investor'],
  development_feasibility:   ['developer', 'investor'],
  townhome_subdivision:      ['developer', 'investor'],
  single_family_subdivision: ['developer', 'investor'],
  single_lot_development:    ['developer', 'investor'],
}

export type JourneyStep =
  | 'homepage'
  | 'path_select'
  | 'intake_form'
  | 'capture_prompt'
  | 'capture_upload'
  | 'capture_sms'
  | 'payment_gate'
  | 'generating'
  | 'review'
  | 'delivery'
  | 'upsell'
  | 'architect_review'

export interface JourneyStepConfig {
  step: JourneyStep
  label: string
  description: string
  requiresAuth: boolean
  requiresPayment: boolean
  estimatedMinutes: number
}

export interface ProjectPathConfig {
  path: ProjectPath
  label: string
  tagline: string
  basePrice: number
  captureRequired: boolean
  captureOptional: boolean
  architectReviewDefault: boolean
  permitPathIncluded: boolean
  deliverables: string[]
  upsellServices: string[]
  minBudget: string
  maxBudget: string
  typicalTimeline: string
}

export const JOURNEY_STEPS: JourneyStepConfig[] = [
  {
    step: 'homepage',
    label: 'Home',
    description: 'Landing page — project path selection CTA',
    requiresAuth: false,
    requiresPayment: false,
    estimatedMinutes: 0,
  },
  {
    step: 'path_select',
    label: 'Choose Your Project',
    description: 'User selects project path',
    requiresAuth: false,
    requiresPayment: false,
    estimatedMinutes: 1,
  },
  {
    step: 'intake_form',
    label: 'Tell Us About Your Project',
    description: 'Full intake form: address, budget, style, constraints',
    requiresAuth: false,
    requiresPayment: false,
    estimatedMinutes: 5,
  },
  {
    step: 'capture_prompt',
    label: 'Capture Your Space',
    description: 'Prompt user to upload photos or use SMS capture',
    requiresAuth: false,
    requiresPayment: false,
    estimatedMinutes: 1,
  },
  {
    step: 'capture_upload',
    label: 'Upload Photos',
    description: 'Web-based photo upload with room tagging',
    requiresAuth: false,
    requiresPayment: false,
    estimatedMinutes: 5,
  },
  {
    step: 'capture_sms',
    label: 'SMS Capture',
    description: 'SMS-based walkthrough capture for mobile users',
    requiresAuth: false,
    requiresPayment: false,
    estimatedMinutes: 10,
  },
  {
    step: 'payment_gate',
    label: 'Unlock Your Concept Package',
    description: 'Stripe checkout for concept package delivery',
    requiresAuth: false,
    requiresPayment: true,
    estimatedMinutes: 2,
  },
  {
    step: 'generating',
    label: 'Building Your Concept',
    description: 'AI generating floor plan, narrative, visuals — polling status',
    requiresAuth: false,
    requiresPayment: true,
    estimatedMinutes: 3,
  },
  {
    step: 'review',
    label: 'Review Your Concept',
    description: 'Command center internal review before delivery',
    requiresAuth: true,
    requiresPayment: true,
    estimatedMinutes: 10,
  },
  {
    step: 'delivery',
    label: 'Your Concept is Ready',
    description: 'PDF delivery + portal access to homeowner deliverables',
    requiresAuth: false,
    requiresPayment: true,
    estimatedMinutes: 0,
  },
  {
    step: 'upsell',
    label: 'Ready to Take the Next Step?',
    description: 'Route to Architectural Final, Permit Services, or Build & Ops',
    requiresAuth: false,
    requiresPayment: true,
    estimatedMinutes: 2,
  },
  {
    step: 'architect_review',
    label: 'Architect Review',
    description: 'Internal architect review task in command center',
    requiresAuth: true,
    requiresPayment: true,
    estimatedMinutes: 60,
  },
]

export const PROJECT_PATH_CONFIGS: Record<ResidentialProjectPath, ProjectPathConfig> = {
  kitchen_remodel: {
    path: 'kitchen_remodel',
    label: 'Kitchen Remodel',
    tagline: 'Transform your most-used space',
    basePrice: 199,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: false,
    permitPathIncluded: true,
    deliverables: [
      'AI floor plan with kitchen layout',
      'Design narrative & material direction',
      'Scope of work with rough cost ranges',
      'Permit path guidance',
      'Visual prompt bundle (Midjourney + SD)',
    ],
    upsellServices: ['schematic_design', 'permit_expediting', 'contractor_matching'],
    minBudget: 'under_10k',
    maxBudget: '100k_plus',
    typicalTimeline: '6–16 weeks',
  },
  bathroom_remodel: {
    path: 'bathroom_remodel',
    label: 'Bathroom Remodel',
    tagline: 'Spa-quality design, any budget',
    basePrice: 149,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: false,
    permitPathIncluded: true,
    deliverables: [
      'AI floor plan with fixture placement',
      'Design narrative',
      'Scope + cost guidance',
      'Permit path notes',
      'Visual prompt bundle',
    ],
    upsellServices: ['schematic_design', 'permit_expediting', 'contractor_matching'],
    minBudget: 'under_10k',
    maxBudget: '50k_to_100k',
    typicalTimeline: '4–10 weeks',
  },
  interior_renovation: {
    path: 'interior_renovation',
    label: 'Interior Renovation',
    tagline: 'Refresh your entire interior',
    basePrice: 249,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: false,
    permitPathIncluded: true,
    deliverables: [
      'Multi-room floor plan',
      'Room-by-room design narrative',
      'Scope by trade',
      'Permit path guidance',
      'Visual prompt bundle per room',
    ],
    upsellServices: ['design_development', 'permit_expediting', 'build_ops'],
    minBudget: 'under_10k',
    maxBudget: '100k_plus',
    typicalTimeline: '8–20 weeks',
  },
  whole_home_remodel: {
    path: 'whole_home_remodel',
    label: 'Whole Home Remodel',
    tagline: 'Complete transformation, start to finish',
    basePrice: 399,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: true,
    permitPathIncluded: true,
    deliverables: [
      'Full home floor plan',
      'Comprehensive design narrative',
      'Trade-by-trade scope',
      'Permit path + structural flag review',
      'Visual bundle per zone',
      'Architect handoff document',
    ],
    upsellServices: ['full_architecture', 'design_development', 'permit_expediting', 'build_ops'],
    minBudget: '25k_to_50k',
    maxBudget: '100k_plus',
    typicalTimeline: '16–52 weeks',
  },
  addition_expansion: {
    path: 'addition_expansion',
    label: 'Addition & Expansion',
    tagline: 'More space, designed with purpose',
    basePrice: 499,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: true,
    permitPathIncluded: true,
    deliverables: [
      'Existing + addition floor plan',
      'Design narrative + massing notes',
      'Scope + structural notes',
      'Permit path (ADU/addition specific)',
      'Visual bundle',
      'Architect handoff with zoning flags',
    ],
    upsellServices: ['full_architecture', 'schematic_design', 'permit_expediting', 'build_ops'],
    minBudget: '50k_to_100k',
    maxBudget: '100k_plus',
    typicalTimeline: '20–60 weeks',
  },
  exterior_concept: {
    path: 'exterior_concept',
    label: 'Exterior Concept',
    tagline: 'Curb appeal and outdoor living',
    basePrice: 149,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: false,
    permitPathIncluded: false,
    deliverables: [
      'Site/exterior layout',
      'Design narrative',
      'Scope guidance',
      'Visual prompt bundle',
    ],
    upsellServices: ['schematic_design', 'contractor_matching'],
    minBudget: 'under_10k',
    maxBudget: '50k_to_100k',
    typicalTimeline: '4–12 weeks',
  },
  capture_site_concept: {
    path: 'capture_site_concept',
    label: 'Capture Site Concept',
    tagline: 'Start with your space, we handle the rest',
    basePrice: 0,
    captureRequired: true,
    captureOptional: false,
    architectReviewDefault: false,
    permitPathIncluded: false,
    deliverables: [
      'Capture-based room inventory',
      'Preliminary floor sketch',
      'Basic design direction',
      'Upsell to full concept package',
    ],
    upsellServices: ['kitchen_remodel', 'interior_renovation', 'whole_home_remodel'],
    minBudget: 'under_10k',
    maxBudget: '100k_plus',
    typicalTimeline: 'TBD',
  },
}

export const COMMERCIAL_PROJECT_PATH_CONFIGS: Record<
  | 'multi_unit_residential'
  | 'mixed_use'
  | 'commercial_office'
  | 'development_feasibility'
  | 'townhome_subdivision'
  | 'single_family_subdivision'
  | 'single_lot_development',
  ProjectPathConfig
> = {
  multi_unit_residential: {
    path: 'multi_unit_residential',
    label: 'Multi-Unit Residential',
    tagline: 'ADU, duplex, or apartment — optimized unit mix and pro forma',
    basePrice: 799,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: true,
    permitPathIncluded: true,
    deliverables: [
      'AI-optimized unit mix (studio/1BR/2BR/3BR allocation)',
      'Multi-floor plate layouts with exterior exposure scoring',
      'Development program (GFA, FAR, parking, amenities)',
      'Pro forma financials (NOI, cap rate, IRR)',
      'Permit path + zoning compliance notes',
      'Investor summary package',
      'Architect handoff document',
    ],
    upsellServices: ['full_architecture', 'permit_expediting', 'build_ops', 'design_development'],
    minBudget: '500k',
    maxBudget: '10M+',
    typicalTimeline: '18–36 months',
  },
  mixed_use: {
    path: 'mixed_use',
    label: 'Mixed-Use Development',
    tagline: 'Retail ground floor + residential above — full stack concept',
    basePrice: 1299,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: true,
    permitPathIncluded: true,
    deliverables: [
      'Mixed-use program (retail GFA + residential unit mix)',
      'Floor-by-floor plate layouts',
      'Retail configuration and tenant-ready sizing',
      'Full pro forma with retail + residential income streams',
      'Zoning compliance + mixed-use permit path',
      'Development cost estimate (hard + soft costs)',
      'Investor package with 3 development scenarios',
      'Architect handoff',
    ],
    upsellServices: ['full_architecture', 'permit_expediting', 'build_ops'],
    minBudget: '1M',
    maxBudget: '50M+',
    typicalTimeline: '24–60 months',
  },
  commercial_office: {
    path: 'commercial_office',
    label: 'Commercial Office',
    tagline: 'Workspace planning with AI — from headcount to floor plan',
    basePrice: 999,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: true,
    permitPathIncluded: true,
    deliverables: [
      'Space program (seat count → room requirements)',
      'AI-optimized floor plan with 3 layout variants',
      'Open plan, private office, and hybrid configurations',
      'Space efficiency metrics (NUF, circulation %)',
      'Workplace design narrative',
      'Permit path notes',
      'Quantity takeoff (workstations, rooms, amenities)',
      'Architect handoff',
    ],
    upsellServices: ['full_architecture', 'permit_expediting', 'contractor_matching'],
    minBudget: '100k',
    maxBudget: '5M+',
    typicalTimeline: '8–20 weeks',
  },
  development_feasibility: {
    path: 'development_feasibility',
    label: 'Development Feasibility',
    tagline: 'Land + vision → bankable concept with pro forma in minutes',
    basePrice: 1499,
    captureRequired: false,
    captureOptional: false,
    architectReviewDefault: true,
    permitPathIncluded: true,
    deliverables: [
      'Full development program with recommended typology',
      'Unit mix optimization across 3 alternative scenarios',
      'Zoning analysis (FAR, height, setbacks)',
      'Development cost estimate (land + hard + soft)',
      'Pro forma financials (NOI, cap rate, IRR, equity multiple)',
      'Break-even analysis and sensitivity table',
      'Investor executive summary',
      'Risk factors + opportunity analysis',
      'Architect handoff with entitlement checklist',
    ],
    upsellServices: ['full_architecture', 'permit_expediting', 'build_ops', 'design_development'],
    minBudget: '500k',
    maxBudget: 'unlimited',
    typicalTimeline: 'Project-dependent',
  },
  townhome_subdivision: {
    path: 'townhome_subdivision',
    label: 'Townhome Subdivision',
    tagline: 'Lot-by-lot site plan, for-sale pro forma, and phasing strategy',
    basePrice: 999,
    captureRequired: false,
    captureOptional: false,
    architectReviewDefault: true,
    permitPathIncluded: true,
    deliverables: [
      'AI-generated site plan with lot layout and street network',
      'Phase plan (3 phases with revenue and cost per phase)',
      'Unit mix and lot configuration (22–26ft wide attached townhomes)',
      'Infrastructure cost estimate (streets, utilities, grading)',
      'For-sale pro forma (revenue, margin, IRR, equity multiple)',
      'Density analysis and open space compliance',
      '3 alternative development scenarios',
      'Architect handoff with entitlement checklist',
    ],
    upsellServices: ['full_architecture', 'permit_expediting', 'build_ops'],
    minBudget: '500k',
    maxBudget: '10M+',
    typicalTimeline: '18–36 months',
  },
  single_family_subdivision: {
    path: 'single_family_subdivision',
    label: 'Single-Family Subdivision',
    tagline: 'Horizontal land development — lot creation, infrastructure, and sellout analysis',
    basePrice: 1199,
    captureRequired: false,
    captureOptional: false,
    architectReviewDefault: true,
    permitPathIncluded: true,
    deliverables: [
      'AI-generated subdivision site plan with lot numbering',
      'Lot layout optimized for yield and setback compliance',
      'Street network design (ROW, paved width, connectivity)',
      'Phase plan with infrastructure and per-phase cash flow',
      'For-sale pro forma (lot-only and build-to-sell options)',
      'Density and FAR compliance analysis',
      '3 alternative scenarios (affordable, luxury, ADU-included)',
      'Architect handoff with subdivision map checklist',
    ],
    upsellServices: ['full_architecture', 'permit_expediting', 'build_ops', 'design_development'],
    minBudget: '1M',
    maxBudget: '25M+',
    typicalTimeline: '24–60 months',
  },
  single_lot_development: {
    path: 'single_lot_development',
    label: 'Single-Lot Development',
    tagline: 'SFR, duplex, or triplex — concept to pro forma on a single parcel',
    basePrice: 599,
    captureRequired: false,
    captureOptional: true,
    architectReviewDefault: false,
    permitPathIncluded: true,
    deliverables: [
      'Building type analysis (SFR vs. duplex vs. triplex — best fit for lot)',
      'Site layout with setbacks, FAR, and lot coverage',
      'Unit floor plan concepts for each building type',
      'Construction cost estimate (hard + soft + contingency)',
      'For-sale and hold/rent financial comparison',
      'Cap rate, NOI, and stabilized value (hold scenario)',
      'Profit margin and IRR (sell scenario)',
      'Permit path and zoning compliance notes',
    ],
    upsellServices: ['schematic_design', 'permit_expediting', 'contractor_matching'],
    minBudget: '100k',
    maxBudget: '2M',
    typicalTimeline: '6–18 months',
  },
}

export function getPathConfig(path: ProjectPath): ProjectPathConfig {
  if (path in PROJECT_PATH_CONFIGS) return PROJECT_PATH_CONFIGS[path as keyof typeof PROJECT_PATH_CONFIGS];
  return COMMERCIAL_PROJECT_PATH_CONFIGS[path as keyof typeof COMMERCIAL_PROJECT_PATH_CONFIGS];
}

export function getJourneyStepsForPath(path: ProjectPath): JourneyStep[] {
  const base: JourneyStep[] = ['homepage', 'path_select', 'intake_form']

  const config = getPathConfig(path)

  if (config.captureRequired) {
    base.push('capture_prompt', 'capture_upload', 'capture_sms')
  } else if (config.captureOptional) {
    base.push('capture_prompt', 'capture_upload')
  }

  if (path !== 'capture_site_concept') {
    base.push('payment_gate')
  }

  base.push('generating', 'review', 'delivery', 'upsell')

  if (config.architectReviewDefault) {
    base.push('architect_review')
  }

  return base
}

