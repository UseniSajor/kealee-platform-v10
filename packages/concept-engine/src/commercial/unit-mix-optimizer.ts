/**
 * Unit Mix Optimizer
 *
 * Given a GFA target and development type, calculates the optimal
 * allocation of unit types (studio/1BR/2BR/3BR/retail/office).
 *
 * Optimizes for: market rent maximization, parking compliance,
 * zoning requirements, and developer ROI targets.
 */

import type { UnitType, UnitTypeSpec, UnitMixItem, UnitMixProgram } from './types';

// ── Unit type specifications ──────────────────────────────────────────────────

/** Market rent baselines — adjust per jurisdiction */
const UNIT_SPECS: Record<UnitType, UnitTypeSpec> = {
  studio: {
    type: 'studio',
    label: 'Studio',
    targetAreaFt2: 480,
    minAreaFt2: 350,
    marketRentPerMonth: 1800,
    parkingRatio: 0.5,
  },
  one_br: {
    type: 'one_br',
    label: '1 Bedroom',
    targetAreaFt2: 720,
    minAreaFt2: 550,
    marketRentPerMonth: 2400,
    parkingRatio: 1.0,
  },
  two_br: {
    type: 'two_br',
    label: '2 Bedroom',
    targetAreaFt2: 1050,
    minAreaFt2: 800,
    marketRentPerMonth: 3200,
    parkingRatio: 1.5,
  },
  three_br: {
    type: 'three_br',
    label: '3 Bedroom',
    targetAreaFt2: 1400,
    minAreaFt2: 1100,
    marketRentPerMonth: 4200,
    parkingRatio: 2.0,
  },
  penthouse: {
    type: 'penthouse',
    label: 'Penthouse',
    targetAreaFt2: 2200,
    minAreaFt2: 1800,
    marketRentPerMonth: 8000,
    parkingRatio: 2.0,
  },
  retail: {
    type: 'retail',
    label: 'Retail',
    targetAreaFt2: 1500,
    minAreaFt2: 500,
    marketRentPerMonth: 5000,  // per 1500 sqft unit
    parkingRatio: 3.0,         // per 1000 sqft
  },
  office_suite: {
    type: 'office_suite',
    label: 'Office Suite',
    targetAreaFt2: 2000,
    minAreaFt2: 800,
    marketRentPerMonth: 4500,
    parkingRatio: 3.5,         // per 1000 sqft
  },
};

// ── Default mix ratios by development type ────────────────────────────────────

type DevType = 'mid_rise_apartment' | 'low_rise_apartment' | 'mixed_use_residential' |
               'townhome' | 'commercial_office' | 'adu_portfolio' | 'single_family_subdivision';

const DEFAULT_MIX_RATIOS: Record<DevType, Partial<Record<UnitType, number>>> = {
  mid_rise_apartment: {
    studio: 0.20,
    one_br: 0.45,
    two_br: 0.30,
    three_br: 0.05,
  },
  low_rise_apartment: {
    studio: 0.10,
    one_br: 0.40,
    two_br: 0.40,
    three_br: 0.10,
  },
  mixed_use_residential: {
    studio: 0.15,
    one_br: 0.40,
    two_br: 0.30,
    three_br: 0.05,
    retail: 0.10,
  },
  townhome: {
    two_br: 0.30,
    three_br: 0.70,
  },
  commercial_office: {
    office_suite: 1.0,
  },
  adu_portfolio: {
    studio: 0.40,
    one_br: 0.60,
  },
  single_family_subdivision: {
    three_br: 1.0,
  },
};

// ── Optimizer ─────────────────────────────────────────────────────────────────

export interface UnitMixInput {
  totalGfaSqFt: number;
  developmentType: DevType;
  preferredMix?: Partial<Record<UnitType, number>>;  // override ratios (decimal pcts, must sum to 1)
  amenityPct?: number;           // % of GFA for amenities (default 5%)
  circulationPct?: number;       // % of GFA for circulation/common (default 20%)
  vacancyRatePct?: number;       // default 5%
  marketRentAdjustment?: number; // multiplier on base rents (default 1.0)
  includeParking?: boolean;      // whether to calculate parking (default true)
}

export function optimizeUnitMix(input: UnitMixInput): UnitMixProgram {
  const {
    totalGfaSqFt,
    developmentType,
    preferredMix,
    amenityPct = 0.05,
    circulationPct = 0.20,
    vacancyRatePct = 0.05,
    marketRentAdjustment = 1.0,
    includeParking = true,
  } = input;

  // Allocate space
  const amenityAreaSqFt     = Math.round(totalGfaSqFt * amenityPct);
  const circulationSqFt     = Math.round(totalGfaSqFt * circulationPct);
  const netRentableSqFt     = totalGfaSqFt - amenityAreaSqFt - circulationSqFt;
  const retailSqFt          = developmentType === 'mixed_use_residential'
    ? Math.round(netRentableSqFt * 0.12)
    : 0;
  const residentialSqFt     = netRentableSqFt - retailSqFt;

  // Determine mix ratios
  const ratios = preferredMix ?? DEFAULT_MIX_RATIOS[developmentType] ?? DEFAULT_MIX_RATIOS.low_rise_apartment;
  const totalRatio = Object.values(ratios).reduce((s, v) => s + (v ?? 0), 0);

  // Normalize ratios to sum to 1
  const normalizedRatios: Partial<Record<UnitType, number>> = {};
  for (const [type, ratio] of Object.entries(ratios)) {
    normalizedRatios[type as UnitType] = (ratio ?? 0) / totalRatio;
  }

  // Calculate unit counts per type
  const units: UnitMixItem[] = [];
  let totalUnits = 0;
  let parkingSpaces = 0;
  let grossPotentialRent = 0;

  const residentialTypes: UnitType[] = ['studio', 'one_br', 'two_br', 'three_br', 'penthouse'];
  const residentialRatios = Object.fromEntries(
    Object.entries(normalizedRatios).filter(([t]) => residentialTypes.includes(t as UnitType))
  );
  const residentialRatioSum = Object.values(residentialRatios).reduce((s, v) => s + (v ?? 0), 0);

  for (const [unitTypeStr, ratio] of Object.entries(normalizedRatios)) {
    const unitType = unitTypeStr as UnitType;
    const spec = UNIT_SPECS[unitType];
    if (!spec || !ratio) continue;

    let allocatedSqFt: number;
    if (unitType === 'retail') {
      allocatedSqFt = retailSqFt;
    } else if (unitType === 'office_suite') {
      allocatedSqFt = residentialSqFt; // all net area = office
    } else {
      allocatedSqFt = residentialRatioSum > 0
        ? Math.round(residentialSqFt * (ratio / residentialRatioSum))
        : 0;
    }

    const count = Math.max(0, Math.floor(allocatedSqFt / spec.targetAreaFt2));
    if (count === 0) continue;

    const totalArea = count * spec.targetAreaFt2;
    const monthlyRent = Math.round(spec.marketRentPerMonth * marketRentAdjustment);
    const annualRentTotal = count * monthlyRent * 12;

    totalUnits += count;
    parkingSpaces += Math.round(count * spec.parkingRatio);
    grossPotentialRent += annualRentTotal;

    units.push({
      type: unitType,
      label: spec.label,
      count,
      targetAreaFt2: spec.targetAreaFt2,
      totalAreaFt2: totalArea,
      allocatedPct: Math.round((allocatedSqFt / totalGfaSqFt) * 100),
      monthlyRent,
      annualRentTotal,
    });
  }

  const effectiveGrossIncome = Math.round(grossPotentialRent * (1 - vacancyRatePct));
  const unitMixEfficiency = Math.round((units.reduce((s, u) => s + u.totalAreaFt2, 0) / totalGfaSqFt) * 100);

  // Program fit rating
  const avgUnitSize = totalUnits > 0
    ? units.reduce((s, u) => s + u.totalAreaFt2, 0) / totalUnits
    : 0;
  let programFitRating: UnitMixProgram['programFitRating'] = 'comfortable';
  if (unitMixEfficiency < 60) programFitRating = 'tight';
  else if (unitMixEfficiency > 80) programFitRating = 'generous';

  const notes: string[] = [];
  if (unitMixEfficiency < 65) {
    notes.push('Low net-to-gross efficiency — consider reducing amenity/circulation allocation or increasing GFA.');
  }
  if (totalUnits < 10 && developmentType === 'mid_rise_apartment') {
    notes.push('Unit count is low for mid-rise — verify GFA assumptions or consider low-rise typology.');
  }

  return {
    units,
    totalUnits,
    totalGfaSqFt,
    totalResidentialSqFt: units
      .filter(u => !['retail', 'office_suite'].includes(u.type))
      .reduce((s, u) => s + u.totalAreaFt2, 0),
    amenityAreaSqFt,
    circulationSqFt,
    retailSqFt,
    parkingSpaces: includeParking ? parkingSpaces : 0,
    grossPotentialRent,
    effectiveGrossIncome,
    vacancyRatePct,
    programFitRating,
    unitMixEfficiency,
    notes,
  };
}

export { UNIT_SPECS, DEFAULT_MIX_RATIOS };
