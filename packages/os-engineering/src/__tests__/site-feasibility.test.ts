import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRELIMINARY_FEASIBILITY_DISCLAIMER,
  solveSiteFit,
  type SolveSiteFitInput,
} from '../site-feasibility';

const input: SolveSiteFitInput = {
  boundary: {
    type: 'Polygon',
    coordinates: [[[0, 0], [160, 0], [160, 120], [0, 120], [0, 0]]],
  },
  crs: 'EPSG:2248',
  linearUnit: 'FT',
  sourceDatasetIds: ['survey-fixture-v1'],
  ruleSet: {
    version: 'fixture-rules-2026-01',
    uniformSetback: 10,
    maxLotCoveragePercent: 55,
    maxFar: 1.8,
    parkingSpacesPerUnit: 1,
    sourceReferences: ['fixture-zoning-section-1'],
    humanVerified: true,
  },
  program: {
    typology: 'TOWNHOME',
    targetUnits: 12,
    averageUnitSqFt: 1_200,
    stories: 2,
  },
  randomSeed: 20260730,
};

test('produces two reproducible, provenance-linked site-fit options', () => {
  const first = solveSiteFit(input);
  const second = solveSiteFit(input);

  assert.deepEqual(first, second);
  assert.equal(first.options.length, 2);
  assert.equal(first.solverVersion, 'kealee-site-fit-1.0.0');
  assert.equal(first.disclaimer, PRELIMINARY_FEASIBILITY_DISCLAIMER);
  for (const option of first.options) {
    assert.equal(option.validationReport.professionalReviewRequired, true);
    assert.deepEqual(option.validationReport.sourceDatasetIds, ['survey-fixture-v1']);
    assert.equal(option.geometry.features.length, 3);
    assert.ok(option.metrics.parcelAreaSqFt > option.metrics.footprintAreaSqFt);
    assert.ok(option.warnings.includes(PRELIMINARY_FEASIBILITY_DISCLAIMER));
  }
});

test('rejects missing CRS and open GeoJSON rings', () => {
  assert.throws(() => solveSiteFit({ ...input, crs: '' }), /CRS is required/);
  assert.throws(() => solveSiteFit({
    ...input,
    boundary: { type: 'Polygon', coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100]]] },
  }), /must be closed/);
});

test('reports deterministic zoning failures rather than overriding them', () => {
  const result = solveSiteFit({
    ...input,
    ruleSet: { ...input.ruleSet, maxFar: 0.1 },
  });

  assert.ok(result.options.every(option => !option.valid));
  assert.ok(result.options.every(option => option.errors.includes('Maximum FAR exceeded')));
  assert.ok(result.options.every(option =>
    option.validationReport.ruleResults.some(rule => rule.rule === 'maximum_far' && !rule.passed)));
});

test('fails closed when a topology capability is not implemented', () => {
  assert.throws(() => solveSiteFit({
    ...input,
    exclusions: [{
      type: 'Polygon',
      coordinates: [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]],
    }],
  }), /PostGIS\/Shapely worker/);
});
