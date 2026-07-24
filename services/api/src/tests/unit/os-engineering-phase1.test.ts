import { describe, expect, it } from 'vitest';
import {
  calculateBoundaryClosure, calculateBuildableEnvelope, calculateCutFill, calculateDrivewaySlope,
  calculateImperviousIncrease, calculateLimitOfDisturbance, calculateLotCoverage, calculateRunoff,
  calculateSedimentControlQuantities, classifyEngineeringDocument, createDrawingManifest,
  createEngineeringWorkflow, createExistingGroundSurface, createParcelPolygon, identifySteepSlopes,
  parseCsvSurveyPoints, parseDms, placeBuildingFootprint, quadrantBearingToAzimuth,
  runInfillEligibilityCheck, sizeStormwaterBmp, transitionEngineeringStage, validateBoundaryClosure,
  validateGeometryTopology,
} from '@kealee/os-engineering';

const source = { sourceId: 'fixture-survey', sourceType: 'BOUNDARY_SURVEY',
  retrievedAt: '2026-07-23T00:00:00.000Z', page: 1 };
const course = (id: string, bearing: string, distance: number) => ({
  id, bearing, distance, unit: 'FT' as const, source, confidence: 1,
  verificationStatus: 'VERIFIED' as const,
});

describe('os-engineering Phase 1 deterministic tools', () => {
  it('parses DMS and quadrant bearings without changing uncertain source text', () => {
    expect(parseDms(`45°30'00"`)).toBe(45.5);
    expect(quadrantBearingToAzimuth(`S 45°30'00" E`)).toBe(134.5);
    expect(() => parseDms(`12°99'00"`)).toThrow();
  });

  it('reconstructs and validates a closing rectangular boundary', () => {
    const boundary = createParcelPolygon([
      course('1', 'N90E', 100), course('2', 'S0E', 50),
      course('3', 'S90W', 100), course('4', 'N0E', 50),
    ]);
    expect(boundary.closure.closureError).toBeLessThan(1e-8);
    expect(validateBoundaryClosure(boundary.points, { maximumError: 0.05, minimumRelativePrecision: 10000 }).accepted).toBe(true);
  });

  it('blocks a non-closing or self-intersecting boundary', () => {
    const closure = calculateBoundaryClosure([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 9, y: 1 }]);
    expect(closure.closureError).toBeGreaterThan(1);
    expect(validateGeometryTopology([{ x: 0, y: 0 }, { x: 10, y: 10 },
      { x: 0, y: 10 }, { x: 10, y: 0 }]).valid).toBe(false);
  });

  it('creates an envelope, places a footprint, and computes coverage and LOD', () => {
    const parcel = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 80 }, { x: 0, y: 80 }];
    const envelope = calculateBuildableEnvelope(parcel, [], 10);
    const building = placeBuildingFootprint(envelope.geometry, 40, 30);
    expect(building.fits).toBe(true);
    expect(calculateLotCoverage(parcel, [building.geometry]).percent).toBe(15);
    expect(calculateLimitOfDisturbance([building.geometry], 5).area).toBe(2000);
  });

  it('parses survey points and performs preliminary terrain checks', () => {
    const points = parseCsvSurveyPoints('id,x,y,z\nP1,0,0,100\nP2,10,0,102\nP3,10,10,105');
    expect(createExistingGroundSurface(points).triangles).toHaveLength(1);
    expect(identifySteepSlopes(points, 15)).toHaveLength(2);
    expect(calculateCutFill(points, points.map(point => ({ ...point, z: point.z + 1 })), 100).fillCubicYards)
      .toBeCloseTo(300 / 27);
    expect(calculateDrivewaySlope({ x: 0, y: 0, z: 100 }, { x: 100, y: 0, z: 112 }, 10).passes).toBe(false);
  });

  it('produces auditable runoff, BMP, impervious and sediment-control results', () => {
    const runoff = calculateRunoff({ areaSqFt: 43560, runoffCoefficient: 0.5,
      rainfallIntensityInPerHour: 2, rainfallSource: source, ruleVersion: 'PG-2026-1' });
    expect(runoff.result).toBe(1);
    expect(runoff.formula).toContain('Q');
    expect(calculateImperviousIncrease(1000, 1800).increaseSqFt).toBe(800);
    expect(sizeStormwaterBmp('RAIN_GARDEN', 500, { pondingDepthFt: 1, availableAreaSqFt: 400 }).fits).toBe(false);
    expect(calculateSedimentControlQuantities({ lodPerimeterFt: 300, inletCount: 1.2,
      entranceLengthFt: 50, treeProtectionFt: 100 }).inletProtectionEach).toBe(2);
  });

  it('validates intake and creates a conditional drawing manifest', () => {
    expect(classifyEngineeringDocument('survey.pdf', 'application/pdf', 100).antivirusStatus).toBe('SCAN_REQUIRED');
    expect(() => classifyEngineeringDocument('survey.exe', 'application/octet-stream', 100)).toThrow();
    const manifest = createDrawingManifest({ projectName: 'Fixture', revision: 1, hasStormwater: true,
      hasUtilities: true, hasTrees: false, hasDemolition: false, hasRetainingWall: false });
    expect(manifest.sheets.some(sheet => sheet.title.includes('Stormwater'))).toBe(true);
    expect(manifest.requiredNotes).toContain('NOT A BOUNDARY SURVEY');
  });

  it('keeps the detailed workflow idempotent and ordered', () => {
    const workflow = createEngineeringWorkflow('fixture');
    const processing = transitionEngineeringStage(workflow, 'PROJECT_INTAKE', 'PROCESSING', 'job-1');
    const complete = transitionEngineeringStage(processing, 'PROJECT_INTAKE', 'COMPLETE', 'job-2');
    expect(complete.stages[1].status).toBe('READY');
    expect(transitionEngineeringStage(complete, 'PROJECT_INTAKE', 'COMPLETE', 'job-2')).toEqual(complete);
  });

  it('returns preliminary eligibility with an explicit County-approval disclaimer', () => {
    const result = runInfillEligibilityCheck({ lotCount: 1, frontsExistingBuiltStreet: true,
      zoningResolved: true, useAllowed: true, municipalityResolved: true, publicWaterSewer: true,
      wellSepticFeasible: false, buildableEnvelopeAreaSqFt: 2500, drivewayFeasible: true,
      environmentalScreenPositive: false, existingTcp: false, priorApprovalConflict: false });
    expect(result.outcome).toBe('LIKELY_ELIGIBLE');
    expect(result.disclaimer).toContain('not County approval');
  });
});
