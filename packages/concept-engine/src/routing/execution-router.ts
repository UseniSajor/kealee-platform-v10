/**
 * Execution Router
 *
 * Determines whether a pre-design project can be delivered by AI alone,
 * requires an architect, or benefits from architect involvement.
 *
 * Inputs: confidence score, complexity score, tier, project type, buildability flags.
 * Output: ExecutionRoute + requiresArchitect flag.
 */

export type PreDesignProjectType = 'INTERIOR_ADDITION' | 'EXTERIOR_FACADE' | 'LANDSCAPE_OUTDOOR'
export type PreDesignTier = 'STARTER' | 'VISUALIZATION' | 'PRE_DESIGN'
export type ExecutionRoute = 'AI_ONLY' | 'ARCHITECT_RECOMMENDED' | 'ARCHITECT_REQUIRED'

export interface RouterInput {
  projectType: PreDesignProjectType
  tier: PreDesignTier
  confidenceScore?: number      // 0.0–1.0 from AI analysis
  complexityScore?: number      // 0.0–1.0 from AI analysis
  buildabilityFlags?: string[]  // e.g. ['STRUCTURAL_CHANGE', 'HEIGHT_VARIANCE_NEEDED']
  structuralChange?: boolean
  permitRequired?: boolean
  budgetHighCents?: number      // estimated high budget in cents
}

export interface RouterOutput {
  executionRoute: ExecutionRoute
  requiresArchitect: boolean
  architectRouted: boolean
  routingNotes: string[]
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const HIGH_COMPLEXITY = 0.75
const LOW_CONFIDENCE = 0.55

// Flags that always require an architect
const ARCHITECT_REQUIRED_FLAGS = new Set([
  'STRUCTURAL_CHANGE',
  'LOAD_BEARING_WALL',
  'FOUNDATION_WORK',
  'ADU_ABOVE_GARAGE',
  'ADDITION_OVER_400_SQFT',
  'HEIGHT_VARIANCE_NEEDED',
  'LOT_LINE_VARIANCE',
])

// Flags that recommend an architect
const ARCHITECT_RECOMMENDED_FLAGS = new Set([
  'HVAC_REROUTE',
  'ELECTRICAL_PANEL_UPGRADE',
  'PLUMBING_REROUTE',
  'ZONING_REVIEW_NEEDED',
  'SETBACK_TIGHT',
])

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function routeExecution(input: RouterInput): RouterOutput {
  const notes: string[] = []
  let required = false
  let recommended = false

  // --- Tier override: PRE_DESIGN always routes to architect ---
  if (input.tier === 'PRE_DESIGN') {
    recommended = true
    notes.push('PRE_DESIGN tier: architect handoff enabled')
  }

  // --- STARTER: AI-only unless complexity forces otherwise ---
  if (input.tier === 'STARTER') {
    notes.push('STARTER tier: AI-only delivery by default')
  }

  // --- Check buildability flags ---
  for (const flag of input.buildabilityFlags ?? []) {
    if (ARCHITECT_REQUIRED_FLAGS.has(flag)) {
      required = true
      notes.push(`Flag ${flag}: architect required`)
    } else if (ARCHITECT_RECOMMENDED_FLAGS.has(flag)) {
      recommended = true
      notes.push(`Flag ${flag}: architect recommended`)
    }
  }

  // --- Structural change override ---
  if (input.structuralChange) {
    required = true
    notes.push('Structural change detected: architect required')
  }

  // --- Complexity / confidence checks ---
  if (input.complexityScore !== undefined && input.complexityScore >= HIGH_COMPLEXITY) {
    recommended = true
    notes.push(`High complexity score (${input.complexityScore.toFixed(2)}): architect recommended`)
  }

  if (input.confidenceScore !== undefined && input.confidenceScore < LOW_CONFIDENCE) {
    recommended = true
    notes.push(`Low confidence score (${input.confidenceScore.toFixed(2)}): architect review recommended`)
  }

  // --- Project type overrides ---
  if (input.projectType === 'INTERIOR_ADDITION' && input.permitRequired) {
    recommended = true
    notes.push('Interior addition with permit requirement: architect recommended')
  }

  // --- Budget threshold: projects >$500k should have architect involvement ---
  if (input.budgetHighCents && input.budgetHighCents > 50000000) {
    required = true
    notes.push('High budget project (>$500k): architect required')
  }

  // --- Derive final route ---
  let executionRoute: ExecutionRoute
  if (required) {
    executionRoute = 'ARCHITECT_REQUIRED'
  } else if (recommended) {
    executionRoute = 'ARCHITECT_RECOMMENDED'
  } else {
    executionRoute = 'AI_ONLY'
  }

  return {
    executionRoute,
    requiresArchitect: required,
    architectRouted: required || recommended,
    routingNotes: notes,
  }
}
