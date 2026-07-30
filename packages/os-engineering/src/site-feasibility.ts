import {
  calculateBuildableEnvelope,
  calculateLotCoverage,
  placeBuildingFootprint,
  polygonArea,
  validateGeometryTopology,
  type Point2,
} from './phase1';

export const PRELIMINARY_FEASIBILITY_DISCLAIMER =
  'Preliminary feasibility / not for construction / subject to licensed professional review.';

export const SITE_FEASIBILITY_SOLVER_VERSION = 'kealee-site-fit-1.0.0';

export type SiteFitTypology =
  | 'SINGLE_FAMILY'
  | 'TOWNHOME'
  | 'GARDEN_MULTIFAMILY'
  | 'WRAP_PODIUM_MULTIFAMILY'
  | 'SURFACE_PARKING'
  | 'SMALL_MIXED_USE'
  | 'ADU'
  | 'ADDITION'
  | 'POOL'
  | 'NEW_HOME';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface SiteFitRuleSet {
  version: string;
  uniformSetback: number;
  setbacks?: {
    front: number;
    rear: number;
    leftSide: number;
    rightSide: number;
  };
  frontageDirection?: 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';
  maxLotCoveragePercent?: number;
  maxFar?: number;
  maxHeightFeet?: number;
  parkingSpacesPerUnit?: number;
  sourceReferences: string[];
  humanVerified: boolean;
}

export interface SiteFitProgram {
  typology: SiteFitTypology;
  targetUnits: number;
  averageUnitSqFt: number;
  stories: number;
  parkingSpacesPerUnit?: number;
}

export interface SiteFitObjectiveWeights {
  units: number;
  siteEfficiency: number;
  openSpace: number;
  parkingCompliance: number;
}

export interface SolveSiteFitInput {
  boundary: GeoJsonPolygon;
  exclusions?: GeoJsonPolygon[];
  crs: string;
  linearUnit: 'FT';
  sourceDatasetIds: string[];
  ruleSet: SiteFitRuleSet;
  program: SiteFitProgram;
  objectiveWeights?: Partial<SiteFitObjectiveWeights>;
  randomSeed: number;
  /**
   * Exact topology result produced by the PostGIS worker. Production scenario
   * jobs require this value; the pure solver keeps its local fallback for unit
   * tests and offline design tooling only.
   */
  precomputedEnvelope?: {
    geometry: GeoJsonPolygon;
    areaSqFt: number;
    engine: 'POSTGIS';
    engineVersion: string;
  };
}

export interface SiteFitOption {
  ordinal: number;
  name: string;
  geometry: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: Record<string, unknown>;
      geometry: GeoJsonPolygon;
    }>;
  };
  metrics: {
    parcelAreaSqFt: number;
    buildableAreaSqFt: number;
    footprintAreaSqFt: number;
    grossFloorAreaSqFt: number;
    netRentableAreaSqFt: number;
    siteCoveragePercent: number;
    far: number;
    unitCount: number;
    parkingSpaces: number;
    openSpaceSqFt: number;
  };
  score: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
  validationReport: {
    solverVersion: string;
    ruleSetVersion: string;
    sourceDatasetIds: string[];
    ruleResults: Array<{ rule: string; passed: boolean; actual: number; limit?: number; sourceReferences: string[] }>;
    professionalReviewRequired: true;
  };
}

export interface SolveSiteFitResult {
  solverVersion: string;
  ruleSetVersion: string;
  randomSeed: number;
  crs: string;
  linearUnit: 'FT';
  options: SiteFitOption[];
  warnings: string[];
  disclaimer: string;
}

function ringPoints(polygon: GeoJsonPolygon): Point2[] {
  if (polygon.type !== 'Polygon' || polygon.coordinates.length !== 1) {
    throw new Error('The initial site-fit solver requires one GeoJSON Polygon exterior ring without holes');
  }
  const ring = polygon.coordinates[0];
  if (ring.length < 4) throw new Error('Boundary polygon requires at least three vertices and closure');
  const points = ring.map(([x, y]) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Boundary contains a non-finite coordinate');
    return { x, y };
  });
  const first = points[0];
  const last = points.at(-1)!;
  if (first.x !== last.x || first.y !== last.y) throw new Error('GeoJSON boundary ring must be closed');
  return points.slice(0, -1);
}

function polygonGeometry(points: Point2[]): GeoJsonPolygon {
  const closed = [...points, points[0]];
  return { type: 'Polygon', coordinates: [closed.map(point => [point.x, point.y])] };
}

function bounds(points: Point2[]) {
  return {
    width: Math.max(...points.map(point => point.x)) - Math.min(...points.map(point => point.x)),
    depth: Math.max(...points.map(point => point.y)) - Math.min(...points.map(point => point.y)),
  };
}

function normalizedWeights(input?: Partial<SiteFitObjectiveWeights>): SiteFitObjectiveWeights {
  const values = {
    units: Math.max(0, input?.units ?? 0.35),
    siteEfficiency: Math.max(0, input?.siteEfficiency ?? 0.3),
    openSpace: Math.max(0, input?.openSpace ?? 0.2),
    parkingCompliance: Math.max(0, input?.parkingCompliance ?? 0.15),
  };
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  if (!total) throw new Error('At least one objective weight must be positive');
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value / total])) as unknown as SiteFitObjectiveWeights;
}

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function seededVariant(seed: number, ordinal: number): number {
  let value = (seed ^ Math.imul(ordinal + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) / 0xffffffff;
}

export function solveSiteFit(input: SolveSiteFitInput): SolveSiteFitResult {
  if (!Number.isInteger(input.randomSeed)) throw new Error('randomSeed must be an integer');
  if (input.linearUnit !== 'FT') throw new Error('The initial solver requires projected coordinates in feet');
  if (!input.crs.trim()) throw new Error('CRS is required');
  if (!input.sourceDatasetIds.length) throw new Error('At least one source dataset is required');
  if (!input.ruleSet.version || !input.ruleSet.sourceReferences.length) {
    throw new Error('A versioned rule set with source references is required');
  }
  if (input.program.targetUnits < 1 || input.program.averageUnitSqFt <= 0 || input.program.stories < 1) {
    throw new Error('Program units, average unit area, and stories must be positive');
  }

  const boundary = ringPoints(input.boundary);
  const topology = validateGeometryTopology(boundary);
  if (!topology.valid) throw new Error(`Invalid boundary geometry: ${topology.errors.join('; ')}`);
  const exclusions = (input.exclusions ?? []).map(ringPoints);
  if (exclusions.length && !input.precomputedEnvelope) {
    throw new Error('Exclusion polygons require the topology-safe PostGIS/Shapely worker and are not supported by the initial solver');
  }
  const envelope = input.precomputedEnvelope
    ? {
        geometry: ringPoints(input.precomputedEnvelope.geometry),
        grossArea: input.precomputedEnvelope.areaSqFt,
        excludedArea: 0,
        netArea: input.precomputedEnvelope.areaSqFt,
        warnings: [`Buildable envelope calculated by PostGIS ${input.precomputedEnvelope.engineVersion}.`],
      }
    : calculateBuildableEnvelope(boundary, exclusions, input.ruleSet.uniformSetback);
  if (envelope.netArea <= 0) throw new Error('Constraints leave no positive buildable area');

  const parcelArea = polygonArea(boundary);
  const envelopeBounds = bounds(envelope.geometry);
  const weights = normalizedWeights(input.objectiveWeights);
  const parkingRatio = input.program.parkingSpacesPerUnit ?? input.ruleSet.parkingSpacesPerUnit ?? 0;
  const options: SiteFitOption[] = [0, 1].map(ordinal => {
    const random = seededVariant(input.randomSeed, ordinal);
    const utilization = ordinal === 0 ? 0.52 + random * 0.04 : 0.68 + random * 0.04;
    const aspect = ordinal === 0 ? 1.25 : 1.65;
    const targetFootprint = Math.min(
      envelope.netArea * utilization,
      input.ruleSet.maxLotCoveragePercent
        ? parcelArea * input.ruleSet.maxLotCoveragePercent / 100
        : envelope.netArea * utilization,
    );
    const width = Math.min(Math.sqrt(targetFootprint * aspect), envelopeBounds.width * 0.9);
    const depth = Math.min(targetFootprint / width, envelopeBounds.depth * 0.9);
    const rotation = ordinal === 0 ? 0 : 90;
    const footprint = placeBuildingFootprint(envelope.geometry, width, depth, rotation);
    const coverage = calculateLotCoverage(boundary, [footprint.geometry]);
    const grossFloorArea = footprint.area * input.program.stories;
    const far = grossFloorArea / parcelArea;
    const physicalUnits = Math.max(1, Math.floor(grossFloorArea / input.program.averageUnitSqFt));
    const units = Math.min(input.program.targetUnits, physicalUnits);
    const parkingSpaces = Math.ceil(units * parkingRatio);
    const maxCoverage = input.ruleSet.maxLotCoveragePercent;
    const maxFar = input.ruleSet.maxFar;
    const errors: string[] = [];
    if (!footprint.fits) errors.push('Footprint exceeds the conceptual buildable envelope');
    if (maxCoverage !== undefined && coverage.percent > maxCoverage) errors.push('Maximum lot coverage exceeded');
    if (maxFar !== undefined && far > maxFar) errors.push('Maximum FAR exceeded');
    const parkingCompliant = parkingSpaces >= Math.ceil(units * parkingRatio);
    const openSpace = Math.max(0, parcelArea - footprint.area);
    const unitScore = units / input.program.targetUnits;
    const efficiencyScore = footprint.area / envelope.netArea;
    const openSpaceScore = openSpace / parcelArea;
    const score = 100 * (
      weights.units * unitScore +
      weights.siteEfficiency * efficiencyScore +
      weights.openSpace * openSpaceScore +
      weights.parkingCompliance * (parkingCompliant ? 1 : 0)
    );
    const ruleResults = [
      { rule: 'footprint_within_buildable_envelope', passed: footprint.fits, actual: footprint.fits ? 1 : 0,
        limit: 1, sourceReferences: input.ruleSet.sourceReferences },
      { rule: 'maximum_lot_coverage', passed: maxCoverage === undefined || coverage.percent <= maxCoverage,
        actual: round(coverage.percent), limit: maxCoverage, sourceReferences: input.ruleSet.sourceReferences },
      { rule: 'maximum_far', passed: maxFar === undefined || far <= maxFar,
        actual: round(far, 3), limit: maxFar, sourceReferences: input.ruleSet.sourceReferences },
      { rule: 'parking_ratio', passed: parkingCompliant, actual: parkingSpaces,
        limit: Math.ceil(units * parkingRatio), sourceReferences: input.ruleSet.sourceReferences },
    ];
    const warnings = [
      ...envelope.warnings,
      ...footprint.warnings,
      ...(input.ruleSet.humanVerified ? [] : ['Zoning rule set has not been human verified.']),
      PRELIMINARY_FEASIBILITY_DISCLAIMER,
    ];
    return {
      ordinal,
      name: ordinal === 0 ? 'Open-space priority' : 'Yield priority',
      geometry: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { layer: 'BOUNDARY', sourceDatasetIds: input.sourceDatasetIds },
            geometry: polygonGeometry(boundary) },
          { type: 'Feature', properties: { layer: 'BUILDABLE_ENVELOPE', ruleSetVersion: input.ruleSet.version },
            geometry: polygonGeometry(envelope.geometry) },
          { type: 'Feature', properties: { layer: 'PROPOSED_BUILDING', optionOrdinal: ordinal },
            geometry: polygonGeometry(footprint.geometry) },
        ],
      },
      metrics: {
        parcelAreaSqFt: round(parcelArea),
        buildableAreaSqFt: round(envelope.netArea),
        footprintAreaSqFt: round(footprint.area),
        grossFloorAreaSqFt: round(grossFloorArea),
        netRentableAreaSqFt: round(grossFloorArea * 0.82),
        siteCoveragePercent: round(coverage.percent),
        far: round(far, 3),
        unitCount: units,
        parkingSpaces,
        openSpaceSqFt: round(openSpace),
      },
      score: round(score),
      valid: errors.length === 0,
      errors,
      warnings,
      validationReport: {
        solverVersion: SITE_FEASIBILITY_SOLVER_VERSION,
        ruleSetVersion: input.ruleSet.version,
        sourceDatasetIds: input.sourceDatasetIds,
        ruleResults,
        professionalReviewRequired: true,
      },
    };
  });

  return {
    solverVersion: SITE_FEASIBILITY_SOLVER_VERSION,
    ruleSetVersion: input.ruleSet.version,
    randomSeed: input.randomSeed,
    crs: input.crs,
    linearUnit: input.linearUnit,
    options,
    warnings: [...new Set(options.flatMap(option => option.warnings))],
    disclaimer: PRELIMINARY_FEASIBILITY_DISCLAIMER,
  };
}
