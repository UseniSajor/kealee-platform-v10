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
  // Subdivision
  SubdivisionLotType,
  SubdivisionLot,
  SubdivisionStreet,
  SubdivisionPhase,
  SubdivisionLayout,
  SubdivisionInfrastructureCost,
  SubdivisionFinancials,
  SubdivisionAnalysisInput,
  SubdivisionAnalysisResult,
  // Single-lot
  SingleLotBuildingType,
  SingleLotUnit,
  SingleLotAnalysis,
  SingleLotAnalysisInput,
  SingleLotAnalysisResult,
} from './types';

export { optimizeUnitMix, UNIT_SPECS }       from './unit-mix-optimizer';
export { generateMultiFloorLayout }           from './floor-plate-layout';
export { generateFeasibilityAnalysis }        from './generate-feasibility-analysis';
export { generateSubdivisionLayout }          from './subdivision-layout';
export { generateSubdivisionAnalysis }        from './generate-subdivision-analysis';
export { generateSingleLotAnalysis }          from './generate-single-lot-analysis';
