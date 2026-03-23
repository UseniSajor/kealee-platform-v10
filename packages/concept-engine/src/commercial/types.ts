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
  | 'single_family_subdivision'
  | 'single_lot_sfr'
  | 'single_lot_duplex'
  | 'single_lot_triplex';

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
  totalGfaSqFt?: number;         // override zoning-derived GFA
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

// ── Subdivision ───────────────────────────────────────────────────────────────

export type SubdivisionLotType = 'standard' | 'corner' | 'cul_de_sac' | 'flag' | 'common_area';

export interface SubdivisionLot {
  lotId: string;
  lotType: SubdivisionLotType;
  lotNumber: number;
  phase: number;
  x: number;
  y: number;
  widthFt: number;
  depthFt: number;
  totalSqFt: number;
  buildableFootprintSqFt: number;
  proposedHouseAreaFt2: number;
  streetFrontage: string;
  estimatedSalesPrice: number;
  isCornerLot: boolean;
}

export interface SubdivisionStreet {
  streetId: string;
  label: string;
  rowFt: number;
  pavedFt: number;
  x1: number; y1: number;
  x2: number; y2: number;
  lengthFt: number;
}

export interface SubdivisionPhase {
  phaseNumber: number;
  label: string;
  lots: string[];
  estimatedStartMonth: number;
  estimatedDurationMonths: number;
  phaseRevenue: number;
  phaseCost: number;
  phaseProfit: number;
}

export interface SubdivisionLayout {
  developmentType: 'townhome' | 'single_family_subdivision';
  totalSiteSqFt: number;
  totalLots: number;
  lots: SubdivisionLot[];
  streets: SubdivisionStreet[];
  phases: SubdivisionPhase[];
  grossLotAreaSqFt: number;
  streetRightOfWaySqFt: number;
  commonAreaSqFt: number;
  parkAreaSqFt: number;
  openSpaceRatio: number;
  lotCoverageRatio: number;
  densityLotsPerAcre: number;
  svgString: string;
}

export interface SubdivisionInfrastructureCost {
  siteWorkCost: number;
  streetCost: number;
  utilityCost: number;
  commonAreaCost: number;
  permitAndFeesCost: number;
  totalInfrastructureCost: number;
  costPerLot: number;
}

export interface SubdivisionFinancials {
  landCost: number;
  infrastructureCost: SubdivisionInfrastructureCost;
  hardConstructionCostPerUnit: number;
  totalHardConstructionCost: number;
  softCostPct: number;
  totalSoftCost: number;
  contingencyPct: number;
  contingencyAmount: number;
  totalDevelopmentCost: number;
  averageSalesPrice: number;
  totalRevenue: number;
  totalProfit: number;
  profitMarginPct: number;
  returnOnCost: number;
  irr: number;
  equityMultiple: number;
  absorptionRatePerMonth: number;
  estimatedSelloutMonths: number;
}

export interface SubdivisionAnalysisInput {
  projectId: string;
  projectAddress: string;
  developmentType: 'townhome' | 'single_family_subdivision';
  lotSizeSqFt: number;
  askingPrice: number;
  zoningCode?: string;
  targetLotCount?: number;
  targetLotWidthFt?: number;
  buildToSell?: boolean;
  targetSalesPrice?: number;
}

export interface SubdivisionAnalysisResult {
  feasible: boolean;
  feasibilityScore: number;
  layout: SubdivisionLayout;
  financials: SubdivisionFinancials;
  keyRisks: string[];
  keyOpportunities: string[];
  alternativeScenarios: AlternativeScenario[];
  generatedAt: string;
}

// ── Single-lot development ─────────────────────────────────────────────────────

export type SingleLotBuildingType = 'single_family' | 'duplex' | 'triplex';

export interface SingleLotUnit {
  unitNumber: number;
  buildingType: SingleLotBuildingType;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  monthlyRent: number;       // for hold scenario
  estimatedSalesPrice: number; // for sell scenario
}

export interface SingleLotAnalysisInput {
  projectId: string;
  projectAddress: string;
  lotSizeSqFt: number;
  askingPrice: number;
  zoningCode?: string;
  preferredBuildingType?: SingleLotBuildingType;
  intendToSell?: boolean;    // true = for-sale, false = hold/rent
  targetSalesPrice?: number;
  targetRentPerUnit?: number;
}

export interface SingleLotAnalysis {
  buildingType: SingleLotBuildingType;
  units: SingleLotUnit[];
  totalUnits: number;
  totalAreaSqFt: number;
  buildableFootprintSqFt: number;
  lotCoverage: number;         // %
  far: number;                 // achieved FAR
  // Costs
  landCost: number;
  hardCostTotal: number;
  softCostTotal: number;
  contingencyAmount: number;
  totalDevelopmentCost: number;
  costPerUnit: number;
  // For-sale scenario
  totalSalesRevenue: number;
  saleProfit: number;
  saleProfitMarginPct: number;
  saleIrr: number;
  // Hold/rent scenario
  grossPotentialRent: number;
  netOperatingIncome: number;
  capRate: number;
  stabilizedValue: number;
  cashOnCashReturn: number;
  // Overall
  feasibilityScore: number;
  recommendedStrategy: 'sell' | 'hold' | 'sell_one_hold_one';
}

export interface SingleLotAnalysisResult {
  feasible: boolean;
  feasibilityScore: number;
  recommendedBuildingType: SingleLotBuildingType;
  scenarios: SingleLotAnalysis[];           // one per building type option
  recommended: SingleLotAnalysis;
  keyRisks: string[];
  keyOpportunities: string[];
  generatedAt: string;
}

// ── Commercial intake ─────────────────────────────────────────────────────────

export interface CommercialConceptInput {
  intakeId: string;
  projectPath:
    | 'multi_unit_residential'
    | 'mixed_use'
    | 'commercial_office'
    | 'development_feasibility'
    | 'townhome_subdivision'
    | 'single_family_subdivision'
    | 'single_lot_development';
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
