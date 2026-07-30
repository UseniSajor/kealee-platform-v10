import { describe, expect, it, vi } from 'vitest';
import type { SolveSiteFitInput, SiteFitOption } from '@kealee/os-engineering';
import { buildPostgisEnvelope, validateOptionsWithPostgis } from '../postgis-site-fit';

const input: SolveSiteFitInput = {
  boundary: {
    type: 'Polygon',
    coordinates: [[[0, 0], [100, 0], [100, 80], [0, 80], [0, 0]]],
  },
  exclusions: [{
    type: 'Polygon',
    coordinates: [[[40, 40], [50, 40], [50, 50], [40, 50], [40, 40]]],
  }],
  crs: 'EPSG:2248',
  linearUnit: 'FT',
  sourceDatasetIds: ['survey-v1'],
  ruleSet: {
    version: 'rules-v1',
    uniformSetback: 10,
    sourceReferences: ['https://example.gov/zoning'],
    humanVerified: true,
  },
  program: {
    typology: 'SINGLE_FAMILY',
    targetUnits: 1,
    averageUnitSqFt: 1_800,
    stories: 2,
  },
  randomSeed: 42,
};

describe('PostGIS site-fit adapter', () => {
  it('converts feet to metres and returns the database topology result', async () => {
    const query = vi.fn().mockResolvedValue([{
      envelope_geojson: JSON.stringify(input.boundary),
      area_sq_ft: '7200.25',
      postgis_version: '3.5.2',
    }]);
    const result = await buildPostgisEnvelope({ $queryRawUnsafe: query }, input);

    expect(result.engine).toBe('POSTGIS');
    expect(result.areaSqFt).toBe(7200.25);
    expect(query.mock.calls[0].slice(1)).toEqual([
      JSON.stringify(input.boundary),
      2248,
      3.048,
      JSON.stringify(input.exclusions),
      0,
      0,
      0,
      0,
    ]);
  });

  it('fails an option that is not covered by the exact envelope', async () => {
    const query = vi.fn().mockResolvedValue([{ covered: false, valid: true }]);
    const option = {
      ordinal: 0,
      name: 'Option',
      geometry: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { layer: 'PROPOSED_BUILDING' },
          geometry: input.boundary,
        }],
      },
      metrics: {},
      score: 1,
      valid: true,
      errors: [],
      warnings: [],
      validationReport: {
        solverVersion: 'test',
        ruleSetVersion: 'rules-v1',
        sourceDatasetIds: ['survey-v1'],
        ruleResults: [{
          rule: 'footprint_within_buildable_envelope',
          passed: true,
          actual: 1,
          limit: 1,
          sourceReferences: ['https://example.gov/zoning'],
        }],
        professionalReviewRequired: true,
      },
    } as unknown as SiteFitOption;
    const options = await validateOptionsWithPostgis(
      { $queryRawUnsafe: query },
      { ...input, precomputedEnvelope: {
        geometry: input.boundary,
        areaSqFt: 7200,
        engine: 'POSTGIS',
        engineVersion: '3.5.2',
      } },
      [option],
    );

    expect(options[0].valid).toBe(false);
    expect(options[0].errors[0]).toContain('PostGIS validation');
    expect(options[0].validationReport.ruleResults[0].passed).toBe(false);
  });
});
