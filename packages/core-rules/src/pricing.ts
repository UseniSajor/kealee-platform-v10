/**
 * Kealee Pricing Constants
 *
 * Single source of truth for all product prices.
 * All marketing files MUST import from here — never hardcode prices.
 */

// ── Concept Package Prices ────────────────────────────────────────────────────

export const CONCEPT_KITCHEN_PRICE        = 395   // dollars
export const CONCEPT_KITCHEN_ADVANCED     = 695
export const CONCEPT_KITCHEN_FULL         = 2500  // "from"

export const CONCEPT_BATH_PRICE           = 395
export const CONCEPT_BATH_ADVANCED        = 695
export const CONCEPT_BATH_FULL            = 2000  // "from"

export const CONCEPT_WHOLE_HOME_PRICE     = 585
export const CONCEPT_WHOLE_HOME_ADVANCED  = 1200
export const CONCEPT_WHOLE_HOME_FULL      = 6500  // "from"

export const CONCEPT_INTERIOR_RENO_PRICE  = 395   // interior reno/addition base
export const CONCEPT_EXTERIOR_PRICE       = 295
export const CONCEPT_LANDSCAPE_PRICE      = 195
export const CONCEPT_COMMERCIAL_PRICE     = 1200  // "from"
export const CONCEPT_DEVELOPER_PRICE      = 1500  // "from"

/** Generic lowest starting price shown in broad marketing */
export const CONCEPT_START_PRICE         = 195

// ── Tier label map (numeric tier → display string) ────────────────────────────

export const CONCEPT_TIER_PRICES: Record<1 | 2 | 3, number> = {
  1: CONCEPT_KITCHEN_PRICE,       // entry-tier concept
  2: CONCEPT_WHOLE_HOME_PRICE,    // mid-tier concept
  3: CONCEPT_DEVELOPER_PRICE,     // high-tier concept
}

// ── Permit Prices ─────────────────────────────────────────────────────────────

export const PERMIT_BASIC_PRICE    = 299   // permit path assessment
export const PERMIT_STANDARD_PRICE = 799   // permit package filing
export const PERMIT_PREMIUM_PRICE  = 1499  // full permit management

// ── Estimation Prices ─────────────────────────────────────────────────────────

export const ESTIMATION_PRICE           = 249  // standalone cost estimate
export const ESTIMATION_CERTIFIED_PRICE = 499  // RSMeans-certified estimate

// ── Other Products ────────────────────────────────────────────────────────────

export const ADU_BUNDLE_PRICE           = 999
export const PM_ADVISORY_PRICE          = 299   // per month
export const CONTRACTOR_MATCH_PRICE     = 0     // free (monetized via contractor)
export const DESIGN_ESTIMATE_PERMIT_BUNDLE = 1499

// ── Intake checkout — the single, server-trusted price book ──────────────────
//
// Stripe charges in CENTS. This map is the ONLY price source consumed by:
//   • apps/web-main/app/api/intake/checkout/route.ts  (server)
//   • apps/web-main/app/intake/[projectPath]/page.tsx (client display)
//
// The server MUST look up `cents` here using the URL-safe `projectPath`. It
// MUST NOT trust an `amount` field supplied by the client (P0-1 fix).
//
// Values represent prices currently being charged in production. Some entries
// intentionally diverge from the dollar constants above (which are surfaced in
// marketing copy / ads) — reconciling the two is a separate business decision.
// Until that decision is made, *checkout* is the source of truth.
export interface IntakePriceEntry {
  /** Display label shown on the intake card and Stripe checkout line item. */
  label: string
  /** Price charged in USD cents. */
  cents: number
  /** Customer-facing delivery window. */
  deliveryDays: string
}

export const INTAKE_PRICE_CENTS: Record<string, IntakePriceEntry> = {
  // ── Concept packages ────────────────────────────────────────────────────
  exterior_concept:          { label: 'Exterior Concept Package',                 cents: 39_500,  deliveryDays: '3–5 days'  },
  garden_concept:            { label: 'Garden Concept',                           cents: 29_500,  deliveryDays: '2–4 days'  },
  whole_home_concept:        { label: 'Whole Home Concept',                       cents: 59_500,  deliveryDays: '4–6 days'  },
  interior_reno_concept:     { label: 'Interior Reno Concept',                    cents: 34_500,  deliveryDays: '3–5 days'  },
  developer_concept:         { label: 'Developer Concept',                        cents: 79_500,  deliveryDays: '5–7 days'  },

  // ── Remodels ────────────────────────────────────────────────────────────
  kitchen_remodel:           { label: 'Kitchen Design Package',                   cents: 39_500,  deliveryDays: '3–5 days'  },
  bathroom_remodel:          { label: 'Bathroom Design Package',                  cents: 29_500,  deliveryDays: '2–4 days'  },
  interior_renovation:       { label: 'Interior Renovation',                      cents: 34_500,  deliveryDays: '3–5 days'  },
  whole_home_remodel:        { label: 'Whole-Home Remodel',                       cents: 69_500,  deliveryDays: '4–6 days'  },
  addition_expansion:        { label: 'Addition / Expansion',                     cents: 49_500,  deliveryDays: '3–5 days'  },

  // ── Permits + estimation ────────────────────────────────────────────────
  permit_path_only:          { label: 'Permit Package',                           cents: 49_900,  deliveryDays: '3–5 days'  },
  cost_estimate:             { label: 'Detailed Cost Estimate — RSMeans validated', cents: 59_500, deliveryDays: '3–5 days'  },
  certified_estimate:        { label: 'Certified Estimate — Notarized for lenders', cents: 185_000, deliveryDays: '5–7 days' },

  // ── Bundles + matchmaking ───────────────────────────────────────────────
  contractor_match:          { label: 'Contractor Match',                         cents: 19_900,  deliveryDays: '1 day'     },
  design_build:              { label: 'Design + Build Package',                   cents: 79_500,  deliveryDays: '5–7 days'  },
  capture_site_concept:      { label: 'Site Capture + Concept',                   cents: 12_500,  deliveryDays: '1–2 days'  },

  // ── Commercial / multi-family / development ─────────────────────────────
  multi_unit_residential:    { label: 'Multi-Unit Residential',                   cents: 99_900,  deliveryDays: '5–7 days'  },
  mixed_use:                 { label: 'Mixed-Use Concept',                        cents: 129_900, deliveryDays: '6–8 days'  },
  commercial_office:         { label: 'Commercial Office',                        cents: 119_900, deliveryDays: '5–7 days'  },
  development_feasibility:   { label: 'Feasibility Study',                        cents: 149_900, deliveryDays: '5–7 days'  },
  townhome_subdivision:      { label: 'Townhome Subdivision',                     cents: 169_900, deliveryDays: '7–10 days' },
  single_family_subdivision: { label: 'Single-Family Subdivision',                cents: 149_900, deliveryDays: '6–8 days'  },
  single_lot_development:    { label: 'Single-Lot Development',                   cents: 89_900,  deliveryDays: '4–6 days'  },
}

/** Site-visit add-on (additive line item on Stripe checkout). */
export const SITE_VISIT_FEE_CENTS = 12_500

/** Server-trusted lookup. Returns null if `projectPath` is unknown. */
export function getIntakePrice(projectPath: string): IntakePriceEntry | null {
  return INTAKE_PRICE_CENTS[projectPath] ?? null
}

// ── AI model registry — single source of truth for model strings ─────────────
//
// Pin model identifiers in ONE place. Audited 2026-05-09 against:
//   • https://docs.anthropic.com/en/docs/about-claude/models
//   • https://developers.openai.com/api/docs/models/sora-2
//   • https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/
//   • Replicate model pages
//
// Routes MUST import these constants instead of inlining strings.

export const AI_MODELS = {
  // ── Text / reasoning (Anthropic Claude) ────────────────────────────────
  /** Concept JSON, design briefs, agent reasoning — default tier. */
  conceptText:        'claude-sonnet-4-5',
  /** Heavier reasoning for developer / commercial / multi-unit tiers. */
  conceptTextPremium: 'claude-opus-4-1',
  /** Vision: photo / floor-plan → editable geometry. */
  vision:             'claude-sonnet-4-5',

  // ── Image generation ───────────────────────────────────────────────────
  /** Photorealistic single-image render (Replicate slug). 4MP, ~$0.06/image. */
  imageRender:        'black-forest-labs/flux-1.1-pro-ultra',
  /** Photorealistic with input-image guidance (img2img). */
  imageRenderImg2Img: 'black-forest-labs/flux-1.1-pro',
  /** Floor-plan / labelled drawings — best text accuracy. */
  imageDrawing:       'recraft-ai/recraft-v3',
  /** Legacy fallback (only kept for backward-compat with old DB rows). */
  imageRenderLegacy:  'stability-ai/sdxl:39ed52f2319f9bfb5cc8a19eccf9d8e90261c2a7c5e31e1dab895d29fba1aa4',

  // ── Video generation ───────────────────────────────────────────────────
  /** Highest quality short-form video (8s, 1080p, native audio). $0.30/sec. */
  videoSora2Pro:      'sora-2-pro',
  /** Cheaper / faster Sora variant. $0.10/sec. */
  videoSora2:         'sora-2',
  /** Google Veo 3.1 — equal-quality, native synced audio, up to 4K. */
  videoVeo:           'veo-3.1',
  /** Replicate-hosted Kling — production-ready, ~$0.10/sec. */
  videoKling:         'kwaivgi/kling-v2.5-turbo-pro',
} as const

export type AiModelKey = keyof typeof AI_MODELS

// Provider-resolution config. The video pipeline picks the first provider
// whose api-key is present, unless overridden by `VIDEO_PROVIDER` env.
export type VideoProvider = 'sora-2-pro' | 'sora-2' | 'veo-3.1' | 'kling-2.5'
export type ImageProvider = 'flux-1.1-pro-ultra' | 'flux-1.1-pro' | 'recraft-v3' | 'sdxl'

/** Tier → recommended video provider. Premium+ get the best-in-class model;
 *  Premium gets a balanced quality/cost choice; Essential never gets video. */
export const TIER_VIDEO_DEFAULTS: Record<1 | 2 | 3, VideoProvider | null> = {
  1: null,                  // Essential — no video deliverable
  2: 'kling-2.5',           // Premium — production-ready, low cost
  3: 'sora-2-pro',          // Premium+ — cinematic real-life quality
}

/** Tier → number of high-realism still renders included in the deliverable. */
export const TIER_IMAGE_COUNT: Record<1 | 2 | 3, number> = {
  1: 3,
  2: 6,
  3: 12,
}

// ── String formatters ─────────────────────────────────────────────────────────

/** Format a dollar amount as "$X,XXX" */
export function formatPrice(cents: number): string {
  return `$${cents.toLocaleString('en-US')}`
}

/** Format a "starting at" string */
export function startingAt(price: number): string {
  return `Starting at ${formatPrice(price)}`
}

/** Format a CENTS value as "$X.XX". Use for intake/checkout display. */
export function formatPriceFromCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
