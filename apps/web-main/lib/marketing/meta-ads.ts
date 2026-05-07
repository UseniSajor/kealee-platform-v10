/**
 * Meta (Facebook / Instagram) Ad Campaign Configuration
 *
 * Typed campaign data — pure data, no runtime calls.
 * Prices imported from @kealee/core-rules.
 */

import {
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_WHOLE_HOME_PRICE,
  PERMIT_STANDARD_PRICE,
  CONCEPT_START_PRICE,
} from '@/lib/marketing/pricing'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MetaObjective =
  | 'LEAD_GENERATION'
  | 'CONVERSIONS'
  | 'TRAFFIC'
  | 'BRAND_AWARENESS'
  | 'REACH'

export interface MetaAudience {
  name:         string
  ageMin:       number
  ageMax:       number
  genders:      ('all' | 'male' | 'female')[]
  locations:    string[]
  interests?:   string[]
  behaviors?:   string[]
  lookalike?:   string   // seed audience description
  customAudience?: string
}

export interface MetaAdCreative {
  format:      'single_image' | 'carousel' | 'video' | 'lead_form'
  headline:    string
  primaryText: string
  description: string
  cta:         string
  imageSpec?:  { ratio: string; minWidth: number; minHeight: number }
  videoSpec?:  { minDuration: number; maxDuration: number; aspectRatio: string }
}

export interface MetaLeadFormField {
  key:   string
  label: string
  type:  'EMAIL' | 'PHONE' | 'FULL_NAME' | 'FIRST_NAME' | 'LAST_NAME' | 'CUSTOM'
  required: boolean
}

export interface MetaCampaign {
  name:           string
  objective:      MetaObjective
  budgetDailyUsd: number
  audience:       MetaAudience
  creative:       MetaAdCreative[]
  leadFormFields?: MetaLeadFormField[]
  webhookUrl?:    string
  pixelEvents:    string[]
}

// ── Campaign 1: Concept Package — DMV Homeowners ──────────────────────────────

const conceptCampaign: MetaCampaign = {
  name:           'Kealee | Concept Packages | DMV Homeowners',
  objective:      'LEAD_GENERATION',
  budgetDailyUsd: 60,
  audience: {
    name:      'DMV Homeowners 30-65',
    ageMin:    30,
    ageMax:    65,
    genders:   ['all'],
    locations: ['Washington DC', 'Montgomery County MD', 'Prince Georges County MD', 'Fairfax County VA', 'Arlington VA', 'Alexandria VA'],
    interests: [
      'home improvement',
      'interior design',
      'home renovation',
      'HGTV',
      'kitchen renovation',
      'bathroom remodeling',
    ],
    behaviors: ['homeowners', 'home improvement retail visitors'],
  },
  creative: [
    {
      format:      'single_image',
      headline:    `AI Kitchen Concept — $${CONCEPT_KITCHEN_PRICE}`,
      primaryText: `Get your kitchen remodel concept designed by AI in 48 hours. Floor plan options, permit scope, and cost estimate — all in one package. Starting at $${CONCEPT_KITCHEN_PRICE}.`,
      description: 'AI design · Permit scope · Cost estimate',
      cta:         'Learn More',
      imageSpec:   { ratio: '1:1', minWidth: 1080, minHeight: 1080 },
    },
    {
      format:      'carousel',
      headline:    'Kitchen → Permits → Contractor — All in One Platform',
      primaryText: `Stop guessing on your renovation. Kealee gives you an AI concept, permit path, and matched contractors — before you spend a dollar on construction. Concepts from $${CONCEPT_START_PRICE}.`,
      description: 'The complete renovation platform',
      cta:         'Get Started',
      imageSpec:   { ratio: '1:1', minWidth: 1080, minHeight: 1080 },
    },
  ],
  leadFormFields: [
    { key: 'email',        label: 'Email Address',   type: 'EMAIL',       required: true },
    { key: 'first_name',   label: 'First Name',      type: 'FIRST_NAME',  required: true },
    { key: 'phone_number', label: 'Phone Number',    type: 'PHONE',       required: false },
    { key: 'project_type', label: 'Project Type',    type: 'CUSTOM',      required: true },
    { key: 'zip_code',     label: 'ZIP Code',        type: 'CUSTOM',      required: false },
  ],
  webhookUrl:  'https://api.kealee.com/marketing/meta-lead',
  pixelEvents: ['Lead', 'ViewContent', 'InitiateCheckout', 'Purchase'],
}

// ── Campaign 2: Permit Filing — Homeowners with projects in progress ──────────

const permitCampaign: MetaCampaign = {
  name:           'Kealee | Permit Filing | In-Market',
  objective:      'LEAD_GENERATION',
  budgetDailyUsd: 40,
  audience: {
    name:      'In-Market Home Improvement DMV',
    ageMin:    28,
    ageMax:    60,
    genders:   ['all'],
    locations: ['Washington DC', 'Maryland', 'Virginia'],
    interests: [
      'home improvement',
      'building permits',
      'home addition',
      'deck construction',
      'finished basement',
    ],
    behaviors: ['homeowners', 'recently moved'],
  },
  creative: [
    {
      format:      'single_image',
      headline:    `Permit Filing Service — from $${PERMIT_STANDARD_PRICE}`,
      primaryText: `Skip the permit headache. Kealee prepares and files your building permit in DC, MD, and VA — so you can start construction without delays. Packages from $${PERMIT_STANDARD_PRICE}.`,
      description: 'DC · MD · VA permit experts',
      cta:         'Get a Quote',
      imageSpec:   { ratio: '4:5', minWidth: 864, minHeight: 1080 },
    },
  ],
  webhookUrl:  'https://api.kealee.com/marketing/meta-lead',
  pixelEvents: ['Lead', 'ViewContent'],
}

// ── Campaign 3: Remarketing — Concept page visitors ───────────────────────────

const remarketingCampaign: MetaCampaign = {
  name:           'Kealee | Remarketing | Concept Visitors',
  objective:      'CONVERSIONS',
  budgetDailyUsd: 30,
  audience: {
    name:         'Concept Page Visitors (30d)',
    ageMin:       25,
    ageMax:       65,
    genders:      ['all'],
    locations:    ['United States'],
    customAudience: 'Website visitors — /concept or /marketplace — last 30 days, excluding purchasers',
  },
  creative: [
    {
      format:      'single_image',
      headline:    'Still thinking about your project?',
      primaryText: `Your concept package is waiting. Get AI floor plans, permit scope, and cost estimate — delivered in 24–48 hours. Starting at $${CONCEPT_WHOLE_HOME_PRICE}.`,
      description: 'Concept · Permits · Contractor Match',
      cta:         'Start Now',
      imageSpec:   { ratio: '1:1', minWidth: 1080, minHeight: 1080 },
    },
  ],
  pixelEvents: ['Purchase', 'InitiateCheckout'],
}

// ── Exported config ───────────────────────────────────────────────────────────

export const META_AD_CAMPAIGNS: MetaCampaign[] = [
  conceptCampaign,
  permitCampaign,
  remarketingCampaign,
]
