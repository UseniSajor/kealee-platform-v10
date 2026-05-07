/**
 * Kealee Brand Strategy — Source of Truth
 *
 * These constants are injected into marketing bot system prompts so every
 * AI-generated output stays on-brand. Do not modify without a strategy review.
 */

// ── Core brand identity ───────────────────────────────────────────────────────

export const BRAND_PROMISE =
  "We turn your vision into permit-ready reality — faster, clearer, and with less friction than any firm you've worked with before."

export const BRAND_DIFFERENTIATOR =
  'AI-accelerated design + licensed architecture + jurisdiction-native permitting — all under one platform, not three vendors.'

export const BRAND_VOICE = `
Confident. Specific. Approachable. Never jargon-heavy.
Speak like a knowledgeable friend who happens to be an architect.
`.trim()

export const BRAND_TONE_AVOID = `
- Salesy urgency ("Act now!")
- Vague promises ("We make dreams come true")
- Overly corporate language
- Fear-based messaging ("Don't get your permit rejected")
- Rhetorical questions as subject lines or headlines
- Exclamation marks in ads
- Emojis unless explicitly requested
`.trim()

// ── Audience segments ─────────────────────────────────────────────────────────

export const AUDIENCE_SEGMENTS = {
  homeowners: {
    label: 'DC/MD/VA Homeowners',
    demographics: 'HHI $120K+, ages 34–58, own primary home 3+ years, researching online before hiring anyone.',
    primaryPath: 'AI Concept + Architect — $599 → $4,400+',
    painPoints: [
      "Don't know what's actually possible on their lot",
      'Fear cost overruns',
      "Don't trust generic contractors",
      'Want clarity before committing money',
    ],
    headlineAngle: 'See what your property can become — before you hire anyone.',
  },
  investors: {
    label: 'Real Estate Investors',
    demographics: 'Portfolio of 2–10 properties, focused on ROI and timeline, DMV market.',
    primaryPath: 'Developer Concept + Permits',
    painPoints: [
      'Unpredictable permit timelines kill deal economics',
      'Need accurate cost data before acquisition',
      'Tired of architect delays and vague scopes',
    ],
    headlineAngle: 'Know your permit timeline before you close.',
  },
  contractors: {
    label: 'Contractors',
    demographics: 'Licensed GCs and specialty trades in DMV, bidding residential and light commercial.',
    primaryPath: 'Contractor Match + Estimate',
    painPoints: [
      'Chasing unqualified leads',
      'Clients with no design or permit clarity',
      'Need takeoffs and specs before bidding',
    ],
    headlineAngle: 'Win bids on projects that are already permit-ready.',
  },
  developers: {
    label: 'Developers',
    demographics: 'Small-to-mid developers, ADU/infill/multifamily, DMV market.',
    primaryPath: 'Developer Package + Feasibility',
    painPoints: [
      'Entitlement risk on speculative land',
      'Need feasibility before capital deployment',
      'Jurisdiction-specific zoning complexity',
    ],
    headlineAngle: 'Feasibility, zoning, and permits — before you break ground.',
  },
} as const

// ── Copy pillars ──────────────────────────────────────────────────────────────

export const COPY_PILLARS = {
  speed: 'AI Concept in 24–72 hrs. Permit-ready drawings in 1–2 weeks. Always include the number — vague speed claims don\'t convert.',
  jurisdiction: 'Name the jurisdiction in copy whenever possible. "We know Montgomery County\'s process" is more persuasive than "we handle all permits."',
  pricing: 'Lead with price ranges in ads and emails. "$495 permit research" converts better than "affordable permitting solutions."',
  portal: 'Mention secure portal delivery as a feature, not a footnote. Clients who\'ve been burned by email file chaos will notice this immediately.',
}

// ── Pricing decisions ─────────────────────────────────────────────────────────

export const PRICING_STRATEGY = {
  entryPoint: 'AI Concept — position as the low-risk starting point for all segments. $599 converts cold traffic and naturally upsells.',
  anchor: 'Anchor on timeline, not price. "Permit-ready drawings in 1–2 weeks" differentiates more than competing on price.',
  segmentation: 'Segment email lists by jurisdiction. Montgomery County leads get MC-specific copy. Arlington leads get Arlington-specific.',
  creative: 'Test investor vs. homeowner creative separately. Investor copy leads with ROI/timeline. Homeowner copy leads with vision/possibility.',
}

// ── Jurisdictions (DMV focus) ─────────────────────────────────────────────────

export const JURISDICTIONS = [
  'Washington, DC',
  'Montgomery County, MD',
  'Prince George\'s County, MD',
  'Arlington, VA',
  'Fairfax County, VA',
  'Alexandria, VA',
  'Loudoun County, VA',
]

// ── Service price anchors (for ad copy) ──────────────────────────────────────

export const PRICE_ANCHORS = {
  concept:              'from $599',
  permitResearch:       '$495',
  professionalDrawings: 'from $1,499',
  fullArchPackage:      '$2,999',
  costEstimate:         '$595',
  contractorMatch:      '$199',
}

// ── Shared brand context string (injected into all strategy bot prompts) ──────

export const BRAND_CONTEXT = `
KEALEE BRAND CONTEXT
====================
Brand promise: ${BRAND_PROMISE}

Differentiator: ${BRAND_DIFFERENTIATOR}

Voice: ${BRAND_VOICE}

Avoid: ${BRAND_TONE_AVOID}

Copy pillars:
- Speed: ${COPY_PILLARS.speed}
- Jurisdiction: ${COPY_PILLARS.jurisdiction}
- Pricing: ${COPY_PILLARS.pricing}
- Portal: ${COPY_PILLARS.portal}

Primary entry product: AI Concept Package — ${PRICE_ANCHORS.concept}
Permit-ready drawings: ${PRICE_ANCHORS.professionalDrawings}
Cost estimate: ${PRICE_ANCHORS.costEstimate}

Target markets: DC, MD, VA (DMV region)
Key jurisdictions: ${JURISDICTIONS.join(', ')}
`.trim()
