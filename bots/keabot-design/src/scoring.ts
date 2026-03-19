/**
 * bots/keabot-design/src/scoring.ts
 *
 * Design Complexity Score (DCS) — determines whether a project follows
 * the AI_ONLY or ARCHITECT_REQUIRED design route.
 *
 * Score range: 0–100
 * Routing rules:
 *   DCS 0–40 AND budget < $65,000    → AI_ONLY
 *   DCS 41–70 OR budget >= $65,000   → ARCHITECT_REQUIRED (AI concept as reference)
 *   DCS 71+                           → ARCHITECT_REQUIRED (skip AI concept)
 */

export type DesignRoute = 'AI_ONLY' | 'ARCHITECT_REQUIRED';

export interface DCSInput {
  // Structural complexity
  structuralChanges: 'none' | 'non_load_bearing' | 'load_bearing' | 'span_or_roof';
  // Square footage
  sqft: number;
  // Project type
  projectType:
    | 'remodel'      // bath/kitchen/basement/deck/garage conversion
    | 'addition_adu' // addition or ADU
    | 'new_construction' | 'multifamily' | 'commercial' | 'major_addition';
  // Zoning risk
  zoningRisk: 'none' | 'setback_height' | 'lot_coverage_overlay';
  // Permit complexity
  permitComplexity: 'simple_single_trade' | 'multi_trade' | 'structural_multi_trade';
  // Budget for routing threshold
  budgetEstimated?: number; // USD
}

export interface DCSResult {
  total:       number; // 0–100
  components: {
    structural: number; // 0–25
    sqft:       number; // 0–20
    projectType: number; // 0–25
    zoning:     number; // 0–15
    permit:     number; // 0–15
  };
  route:       DesignRoute;
  skipAiConcept: boolean; // true if DCS >= 71
  routingReason: string;
}

/**
 * Score the Design Complexity Score for a project.
 */
export function scoreDCS(input: DCSInput): DCSResult {
  // 1. Structural Complexity (0–25)
  const structural =
    input.structuralChanges === 'none'              ? 0  :
    input.structuralChanges === 'non_load_bearing'  ? 8  :
    input.structuralChanges === 'load_bearing'      ? 16 : 25;

  // 2. Square Footage (0–20)
  const sqft =
    input.sqft < 1000  ? 5  :
    input.sqft <= 2500 ? 12 : 20;

  // 3. Project Type (0–25)
  const projectType =
    input.projectType === 'remodel'          ? 5  :
    input.projectType === 'addition_adu'     ? 15 : 25;

  // 4. Zoning Risk (0–15)
  const zoning =
    input.zoningRisk === 'none'                  ? 0  :
    input.zoningRisk === 'setback_height'        ? 8  : 15;

  // 5. Permit Complexity (0–15)
  const permit =
    input.permitComplexity === 'simple_single_trade'      ? 0  :
    input.permitComplexity === 'multi_trade'              ? 8  : 15;

  const total = structural + sqft + projectType + zoning + permit;

  // Routing rules — check in order
  let route: DesignRoute;
  let skipAiConcept = false;
  let routingReason: string;

  const budget = input.budgetEstimated ?? 0;

  if (total >= 71) {
    route = 'ARCHITECT_REQUIRED';
    skipAiConcept = true;
    routingReason = `DCS ${total} >= 71 — high complexity project requires architect (AI concept skipped)`;
  } else if (total >= 41 || budget >= 65000) {
    route = 'ARCHITECT_REQUIRED';
    skipAiConcept = false;
    routingReason = total >= 41
      ? `DCS ${total} >= 41 — moderate-high complexity, architect required for permit-ready drawings`
      : `Budget $${(budget / 100).toLocaleString()} >= $65,000 — architect required for permit-ready drawings`;
  } else {
    route = 'AI_ONLY';
    skipAiConcept = false;
    routingReason = `DCS ${total} <= 40 and budget < $65,000 — project qualifies for AI-assisted design`;
  }

  return {
    total,
    components: { structural, sqft, projectType, zoning, permit },
    route,
    skipAiConcept,
    routingReason,
  };
}

/**
 * Derive DCS inputs from project data (Prisma Project record + user-provided details).
 * Call this from DesignBot when design.concept.initiated fires.
 */
export function projectToDCSInput(project: {
  budgetEstimated?: number | null;
  sqft?: number | null;
  type?: string | null;
  structuralChanges?: string | null;
  zoningRisk?: string | null;
  permitComplexity?: string | null;
}): DCSInput {
  const sqft = project.sqft ?? 1500;
  const budget = project.budgetEstimated ?? 0;

  // Map project type to DCS category
  const rawType = (project.type ?? 'remodel').toLowerCase();
  const projectType: DCSInput['projectType'] =
    rawType.includes('new_construction') || rawType.includes('multifamily') ||
    rawType.includes('commercial') || rawType.includes('mixed_use') ? 'new_construction' :
    rawType.includes('addition') || rawType.includes('adu') ? 'addition_adu' : 'remodel';

  return {
    structuralChanges: (project.structuralChanges as DCSInput['structuralChanges']) ?? 'non_load_bearing',
    sqft,
    projectType,
    zoningRisk:        (project.zoningRisk as DCSInput['zoningRisk']) ?? 'none',
    permitComplexity:  (project.permitComplexity as DCSInput['permitComplexity']) ?? 'multi_trade',
    budgetEstimated:   budget,
  };
}
