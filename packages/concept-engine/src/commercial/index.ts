/**
 * Commercial Concept Engine — Public API
 * For developer and investor users.
 */

export type {
  UnitType,
  UnitTypeSpec,
  UnitMixItem,
  UnitMixProgram,
  FloorPlateUnit,
  FloorPlateLayout,
  MultiFloorLayout,
  DevelopmentType,
  DevelopmentProgram,
  CostEstimate,
  IncomeProjection,
  InvestorPackage,
  FeasibilityInput,
  FeasibilityResult,
  AlternativeScenario,
  CommercialConceptInput,
} from './types';

export { optimizeUnitMix, UNIT_SPECS } from './unit-mix-optimizer';
export { generateMultiFloorLayout }    from './floor-plate-layout';
export { generateFeasibilityAnalysis } from './generate-feasibility-analysis';
