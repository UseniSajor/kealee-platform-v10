/**
 * Google Ads Campaign Configuration
 *
 * Typed campaign data — pure data, no runtime calls.
 * All prices imported from @kealee/core-rules pricing constants.
 */

import {
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_WHOLE_HOME_PRICE,
  PERMIT_STANDARD_PRICE,
  ESTIMATION_PRICE,
} from '@kealee/core-rules'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdGroup {
  name:       string
  keywords:   string[]
  negatives:  string[]
  headlines:  string[]   // max 30 chars each
  descriptions: string[] // max 90 chars each
  finalUrl:   string
  cpcBidCents: number
}

export interface GoogleAdsCampaign {
  name:         string
  objective:    'LEAD_GENERATION' | 'CONVERSIONS' | 'AWARENESS'
  budgetDailyUsd: number
  targetCpa:    number
  networkSearch: boolean
  networkDisplay: boolean
  location:     string[]   // geo targets
  language:     string
  adGroups:     AdGroup[]
}

// ── Campaign 1: Concept Package (primary revenue driver) ─────────────────────

const conceptCampaign: GoogleAdsCampaign = {
  name:           'Kealee | Concept Packages | Search',
  objective:      'LEAD_GENERATION',
  budgetDailyUsd: 75,
  targetCpa:      45,
  networkSearch:  true,
  networkDisplay: false,
  location:       ['Washington DC', 'Maryland', 'Virginia', 'DMV'],
  language:       'en',
  adGroups: [
    {
      name:      'Kitchen Remodel Concept',
      keywords:  [
        'kitchen remodel concept design',
        'kitchen remodel floor plan',
        'kitchen renovation design service',
        'kitchen remodel planning service',
        'AI kitchen design',
        'kitchen concept package',
      ],
      negatives: ['DIY', 'free', 'template', 'software', 'app', 'jobs', 'careers'],
      headlines: [
        'Kitchen Concept in 48 Hours',
        `Start at $${CONCEPT_KITCHEN_PRICE}`,
        'AI Floor Plans + Permit Scope',
        '3 Layout Options Delivered Fast',
        'Kealee Design Engine',
      ],
      descriptions: [
        `AI-powered kitchen concept with floor plans, permit scope, and cost estimate. From $${CONCEPT_KITCHEN_PRICE}.`,
        `Get 3+ kitchen layout options, permit scope, and a cost band — delivered digitally in 24–48 hours. No subscription.`,
      ],
      finalUrl:    'https://kealee.com/marketplace/kitchen-remodel',
      cpcBidCents: 350,
    },
    {
      name:      'Home Addition / Whole Home',
      keywords:  [
        'home addition design concept',
        'whole home renovation concept',
        'home renovation design service DMV',
        'house addition floor plan service',
        'residential design concept package',
        'home remodel planning service',
      ],
      negatives: ['DIY', 'free', 'template', 'rental', 'commercial', 'jobs'],
      headlines: [
        'Home Addition Concept Design',
        `Starting at $${CONCEPT_WHOLE_HOME_PRICE}`,
        'AI Design + Permit Scope',
        'DMV Design Experts',
        'Kealee Concept Packages',
      ],
      descriptions: [
        `Get your home addition or whole-home renovation concept in days. AI floor plans, permit scope, cost estimate. From $${CONCEPT_WHOLE_HOME_PRICE}.`,
        'Kealee generates AI concept designs with permit scope and cost band — before you hire a contractor. Serving DC, MD, VA.',
      ],
      finalUrl:    'https://kealee.com/marketplace/whole-home',
      cpcBidCents: 400,
    },
    {
      name:      'Permit Filing',
      keywords:  [
        'permit filing service DMV',
        'building permit application service',
        'home permit filing Maryland',
        'permit service Virginia',
        'building permit help DC',
        'home addition permit filing',
      ],
      negatives: ['DIY', 'free', 'fee waiver', 'jobs', 'government jobs'],
      headlines: [
        'Permit Filing Service DMV',
        `Permit Packages from $${PERMIT_STANDARD_PRICE}`,
        'DC MD VA Permit Experts',
        'We File Your Permit',
        'Kealee Permit Service',
      ],
      descriptions: [
        `We prepare and file your building permit application in DC, MD, and VA. Packages start at $${PERMIT_STANDARD_PRICE}.`,
        'Stop wrestling with permit applications. Kealee handles the entire permit process — preparation, filing, and status tracking.',
      ],
      finalUrl:    'https://kealee.com/permits',
      cpcBidCents: 420,
    },
    {
      name:      'Cost Estimation',
      keywords:  [
        'construction cost estimate service',
        'home renovation cost estimate',
        'remodel cost estimator professional',
        'contractor estimate service',
        'home improvement cost analysis',
        'building cost estimate DMV',
      ],
      negatives: ['free calculator', 'online calculator', 'DIY', 'template', 'spreadsheet'],
      headlines: [
        'Professional Cost Estimate',
        `Estimates from $${ESTIMATION_PRICE}`,
        'RSMeans-Calibrated Data',
        'Itemized Remodel Estimates',
        'Kealee Estimation Service',
      ],
      descriptions: [
        `Get a detailed, itemized cost estimate for your renovation or construction project. Calibrated to local market data. From $${ESTIMATION_PRICE}.`,
        'Accurate construction cost estimates with itemized line items, material breakdown, and contractor comparison benchmarks.',
      ],
      finalUrl:    'https://kealee.com/marketplace/estimation',
      cpcBidCents: 300,
    },
  ],
}

// ── Campaign 2: Brand / Remarketing ──────────────────────────────────────────

const brandCampaign: GoogleAdsCampaign = {
  name:           'Kealee | Brand | Search',
  objective:      'CONVERSIONS',
  budgetDailyUsd: 20,
  targetCpa:      25,
  networkSearch:  true,
  networkDisplay: false,
  location:       ['United States'],
  language:       'en',
  adGroups: [
    {
      name:      'Brand',
      keywords:  ['kealee', 'kealee design', 'kealee permits', 'kealee.com', 'kealee construction'],
      negatives: [],
      headlines: [
        'Kealee — AI Design Platform',
        'Concept · Permits · Contractors',
        'Start Your Project Today',
      ],
      descriptions: [
        'AI concept designs, permit filing, and contractor matching — all in one platform. Serving DC, MD, VA.',
        'Get your construction project started with AI-powered design concepts. Permit scope and cost estimate included.',
      ],
      finalUrl:    'https://kealee.com',
      cpcBidCents: 150,
    },
  ],
}

// ── Exported config ───────────────────────────────────────────────────────────

export const GOOGLE_ADS_CAMPAIGNS: GoogleAdsCampaign[] = [
  conceptCampaign,
  brandCampaign,
]

export const GOOGLE_ADS_CONVERSION_EVENTS = [
  { name: 'concept_purchase',   value: CONCEPT_KITCHEN_PRICE },
  { name: 'permit_inquiry',     value: 25 },
  { name: 'lead_form_submit',   value: 15 },
  { name: 'concept_add_to_cart', value: 10 },
] as const
