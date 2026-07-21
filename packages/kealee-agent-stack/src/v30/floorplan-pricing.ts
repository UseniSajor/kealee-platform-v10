import type { V30IntakeFormAnswers } from './types'
import type { V30PricingFormulaConfig } from './pricing'

/** Floorplan deliverable scope — drives dynamic add-on pricing. */
export type V30FloorplanScope =
  | 'room'
  | 'kitchen'
  | 'bath'
  | 'addition'
  | 'whole_house'
  | 'garden_landscape'
  | 'exterior'

const DEFAULT_FLOORPLAN_SCOPE_COSTS: Record<V30FloorplanScope, number> = {
  room: 80,
  kitchen: 140,
  bath: 100,
  addition: 220,
  whole_house: 280,
  garden_landscape: 175,
  exterior: 130,
}

/** Whole-house plans scale with conditioned area (more rooms = more layout work). */
const WHOLE_HOUSE_SQFT_RATE = 0.08

export function inferFloorplanScope(
  answers: V30IntakeFormAnswers,
  projectPath?: string,
): V30FloorplanScope {
  const scope = `${answers.primaryScope} ${projectPath ?? ''}`.toLowerCase()
  if (scope.includes('garden') || scope.includes('landscape') || scope.includes('deck') || scope.includes('patio')) {
    return 'garden_landscape'
  }
  if (scope.includes('facade') || scope.includes('exterior') && !scope.includes('interior')) {
    return 'exterior'
  }
  if (scope.includes('whole') || scope.includes('whole_home') || scope.includes('whole-house')) {
    return 'whole_house'
  }
  if (scope.includes('addition') || scope.includes('adu')) return 'addition'
  if (scope.includes('kitchen')) return 'kitchen'
  if (scope.includes('bath') || scope.includes('bathroom') || scope.includes('powder')) return 'bath'
  if (scope.includes('basement')) return 'room'
  if (scope.includes('interior') && !scope.includes('kitchen') && !scope.includes('bath')) return 'room'
  if (scope.includes('new_construction') || scope.includes('new-construction')) return 'whole_house'
  if (answers.squareFeet > 2800) return 'whole_house'
  if (answers.squareFeet > 1200) return 'addition'
  return 'room'
}

export function resolveFloorplanScopeCosts(
  formula: V30PricingFormulaConfig,
): Record<V30FloorplanScope, number> {
  const fromFormula = formula.floorplanScopeCosts ?? {}
  const merged = { ...DEFAULT_FLOORPLAN_SCOPE_COSTS, ...fromFormula }
  for (const [k, v] of Object.entries(formula.featureCosts)) {
    if (k.startsWith('Floorplan_scope:')) {
      const scope = k.slice('Floorplan_scope:'.length) as V30FloorplanScope
      if (scope in merged) merged[scope as V30FloorplanScope] = v
    }
  }
  return merged
}

/** Dynamic floorplan add-on (Premium / Premium+ include this in package features). */
export function calculateFloorplanAddon(
  answers: V30IntakeFormAnswers,
  formula: V30PricingFormulaConfig,
  projectPath?: string,
): { scope: V30FloorplanScope; amount: number } {
  const scope = inferFloorplanScope(answers, projectPath)
  const costs = resolveFloorplanScopeCosts(formula)
  let amount = costs[scope] ?? formula.featureCosts.Floorplan ?? 100
  if (scope === 'whole_house') {
    amount = Math.round(amount + answers.squareFeet * WHOLE_HOUSE_SQFT_RATE)
  }
  return { scope, amount }
}
