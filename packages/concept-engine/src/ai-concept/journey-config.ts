/**
 * AI Concept Journey Configuration
 * Defines the full user journey from homepage → intake → capture → payment → generation → delivery → upsell
 */

export type ProjectPath =
  | 'kitchen_remodel'
  | 'bathroom_remodel'
  | 'interior_renovation'
  | 'whole_home_remodel'
  | 'addition_expansion'
  | 'exterior_concept'
  | 'capture_site_concept'

export type UserType = 'homeowner' | 'investor' | 'developer' | 'contractor' | 'anonymous'

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

export const PROJECT_PATH_CONFIGS: Record<ProjectPath, ProjectPathConfig> = {
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

export function getJourneyStepsForPath(path: ProjectPath): JourneyStep[] {
  const base: JourneyStep[] = ['homepage', 'path_select', 'intake_form']

  const config = PROJECT_PATH_CONFIGS[path]

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

export function getPathConfig(path: ProjectPath): ProjectPathConfig {
  return PROJECT_PATH_CONFIGS[path]
}
