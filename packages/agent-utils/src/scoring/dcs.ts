/**
 * @kealee/agent-utils/scoring/dcs
 *
 * Design Complexity Score (DCS) — determines whether a project follows
 * the AI_ONLY, HYBRID, or ARCHITECT_REQUIRED design route.
 *
 * Score range: 0–100
 * Routing rules:
 *   DCS 0–40 AND budget < $65,000    → AI_ONLY
 *   DCS 41–70 OR budget >= $65,000   → HYBRID (design concept as reference)
 *   DCS 71+                           → ARCHITECT_REQUIRED (skip design concept)
 *
 * Source: extracted from bots/keabot-design/src/scoring.ts
 * Pure function — no I/O, no LLM, no database.
 */

export type DesignRoute = 'AI_ONLY' | 'HYBRID' | 'ARCHITECT_REQUIRED';

export interface DCSInput {
  structuralChanges: 'none' | 'non_load_bearing' | 'load_bearing' | 'span_or_roof';
  sqft: number;
  projectType:
    | 'remodel'
    | 'addition_adu'
    | 'new_construction'
    | 'multifamily'
    | 'commercial'
    | 'major_addition';
  zoningRisk: 'none' | 'setback_height' | 'lot_coverage_overlay';
  permitComplexity: 'simple_single_trade' | 'multi_trade' | 'structural_multi_trade';
  budgetEstimated?: number;
}

export interface DCSResult {
  total: number;
  components: {
    structural: number;
    sqft: number;
    projectType: number;
    zoning: number;
    permit: number;
  };
  route: DesignRoute;
  skipAiConcept: boolean;
  routingReason: string;
}

export function scoreDCS(input: DCSInput): DCSResult {
  const structural =
    input.structuralChanges === 'none'             ? 0  :
    input.structuralChanges === 'non_load_bearing' ? 8  :
    input.structuralChanges === 'load_bearing'     ? 16 : 25;

  const sqft =
    input.sqft < 1000  ? 5  :
    input.sqft <= 2500 ? 12 : 20;

  const projectType =
    input.projectType === 'remodel'      ? 5  :
    input.projectType === 'addition_adu' ? 15 : 25;

  const zoning =
    input.zoningRisk === 'none'           ? 0  :
    input.zoningRisk === 'setback_height' ? 8  : 15;

  const permit =
    input.permitComplexity === 'simple_single_trade' ? 0  :
    input.permitComplexity === 'multi_trade'         ? 8  : 15;

  const total = structural + sqft + projectType + zoning + permit;
  const budget = input.budgetEstimated ?? 0;

  let route: DesignRoute;
  let skipAiConcept = false;
  let routingReason: string;

  if (total >= 71) {
    route = 'ARCHITECT_REQUIRED';
    skipAiConcept = true;
    routingReason = `DCS ${total} >= 71 — high complexity project requires architect (design concept skipped)`;
  } else if (total >= 41 || budget >= 65000) {
    route = 'HYBRID';
    routingReason = total >= 41
      ? `DCS ${total} 41–70 — moderate complexity, AI reference sketch + architect sign-off required`
      : `Budget $${(budget / 1000).toLocaleString()}K >= $65K — hybrid AI + architect review required`;
  } else {
    route = 'AI_ONLY';
    routingReason = `DCS ${total} <= 40 and budget < $65,000 — project qualifies for assisted by AI tools design`;
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
 * Derive DCSInput from a raw project record (Prisma Project or any compatible shape).
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

  const rawType = (project.type ?? 'remodel').toLowerCase();
  const projectType: DCSInput['projectType'] =
    rawType.includes('new_construction') || rawType.includes('multifamily') ||
    rawType.includes('commercial') || rawType.includes('mixed_use') ? 'new_construction' :
    rawType.includes('addition') || rawType.includes('adu') ? 'addition_adu' : 'remodel';

  return {
    structuralChanges: (project.structuralChanges as DCSInput['structuralChanges']) ?? 'non_load_bearing',
    sqft,
    projectType,
    zoningRisk:       (project.zoningRisk as DCSInput['zoningRisk']) ?? 'none',
    permitComplexity: (project.permitComplexity as DCSInput['permitComplexity']) ?? 'multi_trade',
    budgetEstimated:  budget,
  };
}
