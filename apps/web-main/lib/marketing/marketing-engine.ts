/**
 * Kealee Platform: Product-Based Marketing Campaign System
 *
 * Treats the entire platform as a marketing engine with:
 * - Weekly campaigns for each product
 * - Product-specific messaging
 * - Persona-based targeting
 * - Lead routing to campaigns
 * - Performance tracking
 */

// ═══════════════════════════════════════════════════════════════════════════════
// KEALEE PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

export const KEALEE_PRODUCTS = {
  // Design & Concepts
  conceptEngine: {
    id: 'concept-engine',
    name: 'AI Concept Engine',
    description: 'Design concepts powered by AI',
    variants: ['exterior', 'interior', 'garden', 'whole-home'],
    targetPersonas: ['homeowners', 'designers', 'contractors'],
    pricingRange: '$99–$499',
    timeToValue: '2–4 hours',
    conversionPath: 'concept → estimate → permits → build',
  },

  // Estimation
  estimationTool: {
    id: 'estimation',
    name: 'AI Estimation Tool',
    description: 'Accurate project cost estimates',
    variants: ['standard', 'detailed', 'professional'],
    targetPersonas: ['homeowners', 'contractors', 'property-managers'],
    pricingRange: '$199–$799',
    timeToValue: '1–2 days',
    conversionPath: 'estimate → concept → permits → build',
  },

  // Permits
  permitsService: {
    id: 'permits',
    name: 'Permits & Inspections',
    description: 'Complete permit documentation',
    variants: ['standard', 'expedited', 'multi-jurisdiction'],
    targetPersonas: ['contractors', 'architects', 'property-managers'],
    pricingRange: '$399–$1,999',
    timeToValue: '5–10 business days',
    conversionPath: 'permits → concept → estimate → build',
  },

  // Pre-Design
  preDesign: {
    id: 'pre-design',
    name: 'Pre-Design Sessions',
    description: 'Professional design consultation',
    variants: ['starter', 'visualization', 'full-pre-design'],
    targetPersonas: ['homeowners', 'designers', 'architects'],
    pricingRange: '$299–$1,499',
    timeToValue: '1–3 days',
    conversionPath: 'pre-design → concept → build',
  },

  // Professional Drawings
  drawings: {
    id: 'drawings',
    name: 'Professional Drawings',
    description: 'CAD drawings & renderings',
    variants: ['exterior', 'floor-plan', 'rendering', '3d-visualization'],
    targetPersonas: ['architects', 'contractors', 'designers'],
    pricingRange: '$299–$2,499',
    timeToValue: '2–5 days',
    conversionPath: 'drawings → permits → estimate → build',
  },

  // Digital Twin
  ddts: {
    id: 'ddts',
    name: 'Digital Development Twin System',
    description: 'Project management & coordination',
    variants: ['basic', 'professional', 'enterprise'],
    targetPersonas: ['project-managers', 'contractors', 'architects'],
    pricingRange: '$299–$2,999/month',
    timeToValue: 'Immediate',
    conversionPath: 'ddts → manage-all-products',
  },

  // Marketplace
  marketplace: {
    id: 'marketplace',
    name: 'Kealee Marketplace',
    description: 'Browse & hire professionals',
    variants: ['browse', 'post-project', 'hire'],
    targetPersonas: ['homeowners', 'property-managers'],
    pricingRange: 'Free to browse',
    timeToValue: 'Immediate',
    conversionPath: 'marketplace → service → build',
  },

  // Command Center
  commandCenter: {
    id: 'command-center',
    name: 'Command Center',
    description: 'Operations dashboard for teams',
    variants: ['starter', 'professional', 'enterprise'],
    targetPersonas: ['project-managers', 'architects', 'contractors'],
    pricingRange: '$299–$999/month',
    timeToValue: 'Immediate',
    conversionPath: 'command-center → manage-projects',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONAS & MESSAGING
// ═══════════════════════════════════════════════════════════════════════════════

export const MARKETING_PERSONAS = {
  homeowners: {
    id: 'homeowners',
    name: 'Homeowners & DIY',
    description: 'Planning a project, want design + estimates',
    painPoints: [
      'Unsure where to start',
      'Don\'t know actual costs',
      'Want professional opinions',
      'Nervous about contractors',
    ],
    topOfFunnel: ['Concept Engine', 'Pre-Design', 'Marketplace'],
    midOfFunnel: ['Estimation Tool', 'Permits Service'],
    bottomOfFunnel: ['Digital Twin', 'Professional Drawings'],
    bestChannels: ['Email', 'SMS', 'Web'],
    messaging: {
      hook: 'Get professional design ideas in minutes',
      value: 'Know exactly what your project costs before hiring',
      cta: 'Start your project now',
    },
  },

  contractors: {
    id: 'contractors',
    name: 'Contractors & Builders',
    description: 'Running projects, need tools + lead sources',
    painPoints: [
      'Too many manual processes',
      'Hard to track all projects',
      'Need steady lead flow',
      'Estimating takes forever',
    ],
    topOfFunnel: ['Marketplace', 'Command Center'],
    midOfFunnel: ['Digital Twin', 'Estimation Tool'],
    bottomOfFunnel: ['Permits Service', 'Professional Drawings'],
    bestChannels: ['Email', 'Slack', 'Dashboard'],
    messaging: {
      hook: 'Access pre-qualified leads automatically',
      value: 'Automate estimating & project management',
      cta: 'Join the marketplace',
    },
  },

  architects: {
    id: 'architects',
    name: 'Architects & Designers',
    description: 'Need project tools, lead sources, collaboration',
    painPoints: [
      'Design revisions manual',
      'No consistent deliverables',
      'Hard to find qualified leads',
      'Coordinate with contractors',
    ],
    topOfFunnel: ['Concept Engine', 'Professional Drawings'],
    midOfFunnel: ['Pre-Design', 'DDTS'],
    bottomOfFunnel: ['Command Center', 'Marketplace'],
    bestChannels: ['Email', 'Slack', 'LinkedIn'],
    messaging: {
      hook: 'AI-powered design tools + lead generation',
      value: 'Deliver 10x more projects with automation',
      cta: 'Start free trial',
    },
  },

  propertyManagers: {
    id: 'property-managers',
    name: 'Property Managers & Operators',
    description: 'Managing multiple properties, need coordination',
    painPoints: [
      'Scattered project data',
      'Contractor management chaos',
      'Compliance & documentation',
      'Hard to track budgets',
    ],
    topOfFunnel: ['Command Center', 'Digital Twin'],
    midOfFunnel: ['Permits Service', 'Estimation Tool'],
    bottomOfFunnel: ['Marketplace', 'Professional Drawings'],
    bestChannels: ['Email', 'Dashboard', 'Slack'],
    messaging: {
      hook: 'Single dashboard for all properties',
      value: 'Cut project costs by 20% through coordination',
      cta: 'Request demo',
    },
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY CAMPAIGN TEMPLATES (8 products × 52 weeks)
// ═══════════════════════════════════════════════════════════════════════════════

export const CAMPAIGN_TYPES = {
  // Monday: Feature spotlight
  featureSpotlight: {
    name: 'Feature Spotlight',
    day: 'Monday',
    focus: 'Product feature + use case',
    channels: ['email', 'slack'],
  },

  // Tuesday: Customer success story
  successStory: {
    name: 'Customer Success Story',
    day: 'Tuesday',
    focus: 'Real result from user',
    channels: ['email', 'sms', 'web'],
  },

  // Wednesday: Educational content
  educational: {
    name: 'Educational Content',
    day: 'Wednesday',
    focus: 'How-to, tips, industry insights',
    channels: ['email', 'blog', 'slack'],
  },

  // Thursday: Limited offer
  limitedOffer: {
    name: 'Limited Offer',
    day: 'Thursday',
    focus: 'Time-sensitive deal',
    channels: ['email', 'sms', 'web'],
  },

  // Friday: Weekend inspiration
  weekendInspiration: {
    name: 'Weekend Inspiration',
    day: 'Friday',
    focus: 'Project ideas, trends',
    channels: ['email', 'slack', 'web'],
  },

  // Saturday: User-generated content
  ugc: {
    name: 'User-Generated Content',
    day: 'Saturday',
    focus: 'Community projects, showcases',
    channels: ['web', 'social', 'email'],
  },

  // Sunday: Weekly digest
  weeklyDigest: {
    name: 'Weekly Digest',
    day: 'Sunday',
    focus: 'Week summary + next week preview',
    channels: ['email', 'slack'],
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT WEEKLY ROTATION (52-Week Schedule)
// ═══════════════════════════════════════════════════════════════════════════════

export const WEEKLY_CAMPAIGN_ROTATION = {
  // Week 1: Concept Engine
  week1: {
    primary: 'conceptEngine',
    secondary: 'marketplace',
    persona: 'homeowners',
    theme: 'Get design ideas in minutes',
  },

  // Week 2: Estimation Tool
  week2: {
    primary: 'estimationTool',
    secondary: 'conceptEngine',
    persona: 'homeowners',
    theme: 'Know your project costs upfront',
  },

  // Week 3: Permits & Inspections
  week3: {
    primary: 'permitsService',
    secondary: 'estimationTool',
    persona: 'contractors',
    theme: 'Navigate permits like a pro',
  },

  // Week 4: Pre-Design Sessions
  week4: {
    primary: 'preDesign',
    secondary: 'conceptEngine',
    persona: 'architects',
    theme: 'Professional consultation, AI-powered',
  },

  // Week 5: Professional Drawings
  week5: {
    primary: 'drawings',
    secondary: 'preDesign',
    persona: 'architects',
    theme: 'CAD, renderings, 3D visualization',
  },

  // Week 6: Digital Development Twin
  week6: {
    primary: 'ddts',
    secondary: 'commandCenter',
    persona: 'propertyManagers',
    theme: 'Manage everything in one place',
  },

  // Week 7: Marketplace
  week7: {
    primary: 'marketplace',
    secondary: 'conceptEngine',
    persona: 'homeowners',
    theme: 'Find & hire verified professionals',
  },

  // Week 8: Command Center
  week8: {
    primary: 'commandCenter',
    secondary: 'ddts',
    persona: 'contractors',
    theme: 'Operations dashboard for teams',
  },

  // Then repeat...
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN MESSAGE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export const CAMPAIGN_MESSAGE_TEMPLATES = {
  conceptEngine: {
    featureSpotlight: {
      subject: '🎨 Your project deserves a great design',
      preview: 'AI generates 5 concepts in minutes',
      body: `
Get professional design concepts powered by AI.

✓ 5 unique design options
✓ Instant feedback & iterations
✓ From concept to permit-ready drawings

Start your free concept:
https://kealee.com/intake/concept
      `,
      targetPersona: 'homeowners',
    },
    successStory: {
      subject: '😍 See what other homeowners designed',
      preview: 'Kitchen renovation concept in 2 hours',
      body: `
Sarah wanted to redesign her kitchen but didn't know where to start.

Using Kealee's Concept Engine:
→ Got 5 design options in 2 hours
→ Picked her favorite design
→ Moved straight to contractor bids

Her kitchen now looks exactly how she imagined.

Ready to design yours?
https://kealee.com/intake/concept
      `,
      targetPersona: 'homeowners',
    },
  },

  estimationTool: {
    featureSpotlight: {
      subject: '💰 Know your project costs before you hire',
      preview: 'Accurate estimates in 24 hours',
      body: `
Stop guessing on project costs. Get precise estimates fast.

✓ Detailed cost breakdown
✓ Material + labor + timeline
✓ Professional recommendations

Get an estimate:
https://kealee.com/intake/estimate
      `,
      targetPersona: 'homeowners',
    },
  },

  marketplace: {
    featureSpotlight: {
      subject: '🔍 Find & hire vetted professionals',
      preview: 'Browse contractors, architects, designers',
      body: `
Stop searching for the right contractor.

✓ Pre-vetted professionals
✓ Reviews & verified work
✓ Instant quotes & availability

Browse the marketplace:
https://kealee.com/marketplace
      `,
      targetPersona: 'homeowners',
    },
  },

  commandCenter: {
    featureSpotlight: {
      subject: '📊 See all your projects in one dashboard',
      preview: 'Full project visibility, zero chaos',
      body: `
Stop jumping between tools to manage projects.

✓ All projects, budgets, timeline
✓ Team collaboration
✓ Real-time updates

Get started free:
https://kealee.com/command-center
      `,
      targetPersona: 'propertyManagers',
    },
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN PERFORMANCE TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

export const CAMPAIGN_METRICS = {
  trackingFields: {
    campaign_id: 'unique identifier',
    product_id: 'which product',
    week_number: 'calendar week',
    campaign_type: 'feature_spotlight | success_story | educational | offer | digest',
    persona_targeted: 'homeowners | contractors | architects | property_managers',
    channels_used: 'email | sms | web | slack | social',
    send_date: 'when sent',
    open_rate: 'email opens %',
    click_rate: 'link clicks %',
    conversion_rate: 'leads generated %',
    leads_generated: 'count',
    attributed_revenue: 'from this campaign',
  },

  targets: {
    openRate: 0.25,           // 25% minimum
    clickRate: 0.05,          // 5% minimum
    conversionRate: 0.02,     // 2% minimum
    leadsPerCampaign: 5,      // At least 5 leads/week
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETING ENGINE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const KEALEE_MARKETING_ENGINE_CONFIG = {
  name: 'Kealee Platform: Marketing Engine',
  description: 'Treats entire platform as marketing system',

  // Core strategy
  strategy: {
    objective: 'Generate qualified leads weekly for each product',
    approach: 'Product-specific campaigns rotating 52 weeks/year',
    frequency: 'Daily campaigns across all products',
    budget: '52 campaigns × 7 days = 364 campaigns/year',
  },

  // Product portfolio
  products: Object.keys(KEALEE_PRODUCTS).length,
  personas: Object.keys(MARKETING_PERSONAS).length,
  campaignTypesPerWeek: 7,

  // Campaign rhythm
  cadence: {
    weekly: 'Rotating product focus + 7 daily campaigns',
    monthly: 'Product-specific deep dives',
    quarterly: 'Cross-product integration showcases',
    annual: '52-week rotation covers all products × all personas',
  },

  // Channels activated
  channels: ['email', 'sms', 'web', 'slack', 'social', 'blog'],

  // Team ownership
  teamStructure: {
    productMarketing: 'Campaign themes, messaging, creative',
    emailMarketing: 'Email sequencing, automation',
    socialMedia: 'Social posts, hashtags, community',
    analytics: 'Performance tracking, ROI measurement',
  },

  // Integration with sales
  salesIntegration: {
    leadRouting: 'Campaign leads → Phase 1 scoring → sales',
    attribution: 'Track which campaign → which deal',
    feedback: 'Sales reports lead quality back to marketing',
  },

  // Success definition
  targets: {
    leadsPerWeek: 50,         // Minimum
    conversionRate: 0.15,     // 15% from leads to paid
    monthlyRevenue: 50000,    // From campaign leads
    roi: 3.0,                 // 3:1 minimum
  },
}

export default KEALEE_MARKETING_ENGINE_CONFIG
