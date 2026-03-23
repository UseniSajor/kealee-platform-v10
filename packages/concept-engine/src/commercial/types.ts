/**
 * Commercial Concept Engine — Types
 * For developer and investor users on portal-developer and portal-owner (investor mode).
 */

// ── Unit mix ──────────────────────────────────────────────────────────────────

export type UnitType = 'studio' | 'one_br' | 'two_br' | 'three_br' | 'penthouse' | 'retail' | 'office_suite';

export interface UnitTypeSpec {
  type: UnitType;
  label: string;
  targetAreaFt2: number;      // net livable area per unit
  minAreaFt2: number;
  marketRentPerMonth: number; // $/month baseline
  parkingRatio: number;       // spaces per unit
}

export interface UnitMixItem {
  type: UnitType;
  label: string;
  count: number;
  targetAreaFt2: number;
  totalAreaFt2: number;
  allocatedPct: number;       // % of GFA
  monthlyRent: number;        // per unit
  annualRentTotal: number;    // all units of this type
}

export interface UnitMixProgram {
  units: UnitMixItem[];
  totalUnits: number;
  totalGfaSqFt: number;
  totalResidentialSqFt: number;
  amenityAreaSqFt: number;
  circulationSqFt: number;
  retailSqFt: number;
  parkingSpaces: number;
  grossPotentialRent: number;   // $/year all units
  effectiveGrossIncome: number; // after vacancy
  vacancyRatePct: number;
  programFitRating: 'tight' | 'comfortable' | 'generous';
  unitMixEfficiency: number;    // net rentable / GFA %
  notes: string[];
}

// ── Floor plate ───────────────────────────────────────────────────────────────

export interface FloorPlateUnit {
  unitId: string;
  type: UnitType;
  label: string;
  floor: number;
  x: number;               // position on floor plate (ft from NW corner)
  y: number;
  widthFt: number;
  depthFt: number;
  areaFt2: number;
  hasExteriorExposure: boolean;
  bearing: string;         // N/S/E/W facing
}

export interface FloorPlateLayout {
  floor: number;
  units: FloorPlateUnit[];
  commonAreaSqFt: number;
  circulationSqFt: number;
  totalFloorSqFt: number;
  efficiency: number;      // net / gross ratio
  svgString: string;
}

export interface MultiFloorLayout {
  floors: FloorPlateLayout[];
  totalFloors: number;
  totalGfaSqFt: number;
  totalNetSqFt: number;
  overallEfficiency: number;
  svgStrings: string[];    // one per floor
}

// ── Development program ───────────────────────────────────────────────────────

export type DevelopmentType =
  | 'mid_rise_apartment'
  | 'low_rise_apartment'
  | 'townhome'
  | 'mixed_use_residential'
  | 'commercial_office'
  | 'adu_portfolio'
  | 'single_family_subdivision';

export interface DevelopmentProgram {
  projectId: string;
  projectAddress: string;
  developmentType: DevelopmentType;
  // Land
  lotSizeSqFt: number;
  zoningCode: string;
  maxFarAllowed: number;   // floor area ratio
  maxHeightFt: number;
  setbacksFt: { front: number; rear: number; side: number };
  // Building
  proposedFloors: number;
  proposedGfaSqFt: number;
  achievedFar: number;
  // Program
  unitMix: UnitMixProgram;
  floorLayouts: MultiFloorLayout;
  // Parking
  parkingRequired: number;
  parkingProvided: number;
  parkingType: 'surface' | 'podium' | 'structured' | 'none';
  // Amenities
  amenities: string[];
  amenitySqFt: number;
  // Timeline
  estimatedPermitMonths: number;
  estimatedConstructionMonths: number;
  estimatedTotalMonths: number;
  generatedAt: string;
  notes: string[];
}

// ── Financial / investor package ──────────────────────────────────────────────

export interface CostEstimate {
  landCost: number;
  hardCostPerSqFt: number;
  totalHardCost: number;
  softCostPct: number;        // % of hard cost
  totalSoftCost: number;
  contingencyPct: number;
  contingencyAmount: number;
  totalDevelopmentCost: number;
  costPerUnit: number;
  costPerSqFt: number;
}

export interface IncomeProjection {
  grossPotentialRent: number;   // $/year
  vacancyLossRate: number;      // decimal
  effectiveGrossIncome: number;
  operatingExpenseRatio: number;
  netOperatingIncome: number;
  capRate: number;              // NOI / TDC
  stabilizedValue: number;      // NOI / market_cap_rate
  equityMultiple: number;
  irr: number;                  // estimated IRR %
  cashOnCashReturn: number;     // year 1
  breakEvenOccupancy: number;  // % occupancy needed to cover debt service
}

export interface InvestorPackage {
  projectId: string;
  projectAddress: string;
  executiveSummary: string;
  developmentProgram: DevelopmentProgram;
  unitMix: UnitMixProgram;
  costEstimate: CostEstimate;
  incomeProjection: IncomeProjection;
  marketContext: string;
  riskFactors: string[];
  investmentHighlights: string[];
  nextSteps: string[];
  disclaimer: string;
  generatedAt: string;
}

// ── Feasibility analysis ──────────────────────────────────────────────────────

export interface FeasibilityInput {
  projectId: string;
  projectAddress: string;
  lotSizeSqFt: number;
  askingPrice: number;           // land cost
  zoningCode?: string;
  jurisdiction?: string;
  targetDevelopmentType?: DevelopmentType;
  budgetRange?: string;
  targetRoiPct?: number;
  preferredUnitMix?: Partial<Record<UnitType, number>>;  // target count per type
}

export interface FeasibilityResult {
  feasible: boolean;
  feasibilityScore: number;      // 0–100
  recommendedDevelopmentType: DevelopmentType;
  developmentProgram: DevelopmentProgram;
  investorPackage: InvestorPackage;
  keyRisks: string[];
  keyOpportunities: string[];
  alternativeScenarios: AlternativeScenario[];
  generatedAt: string;
}

export interface AlternativeScenario {
  label: string;
  developmentType: DevelopmentType;
  totalUnits: number;
  totalGfaSqFt: number;
  estimatedNoi: number;
  estimatedIrr: number;
  feasibilityScore: number;
  pros: string[];
  cons: string[];
}

// ── Commercial intake ─────────────────────────────────────────────────────────

export interface CommercialConceptInput {
  intakeId: string;
  projectPath: 'multi_unit_residential' | 'mixed_use' | 'commercial_office' | 'development_feasibility';
  userRole: 'developer' | 'investor';
  // Site
  projectAddress: string;
  lotSizeSqFt?: number;
  jurisdiction?: string;
  zoningCode?: string;
  // Development program
  targetDevelopmentType?: DevelopmentType;
  totalGfaSqFt?: number;
  proposedFloors?: number;
  // Unit mix targets
  targetTotalUnits?: number;
  unitMixProgram?: Partial<Record<UnitType, number>>;
  // Financial
  landCost?: number;
  targetRoiPct?: number;
  equityAvailable?: number;
  // Contact
  clientName: string;
  contactEmail: string;
  contactPhone?: string;
  // Preferences
  amenityPreferences?: string[];
  parkingType?: 'surface' | 'podium' | 'structured' | 'none';
  sustainabilityTargets?: string[];
  // Context
  knownConstraints?: string[];
  notes?: string;
}
