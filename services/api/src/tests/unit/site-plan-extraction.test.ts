import { describe, expect, it } from 'vitest';
import { normalizeExtractedGeometry } from '../../modules/site-plans/site-plan.service';

describe('site-plan document extraction normalization', () => {
  const retrievedAt = '2026-07-23T12:00:00.000Z';

  it('forces extracted authority, source provenance, and bounded confidence', () => {
    const result = normalizeExtractedGeometry([{ id: 'lot', layer: 'BOUNDARY', closed: true,
      authority: 'PROFESSIONALLY_CERTIFIED', confidence: 0.99,
      vertices: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 40 }] }], 'document-1', retrievedAt);
    expect(result[0]).toMatchObject({ authority: 'EXTRACTED', sourceId: 'document-1',
      sourceRetrievedAt: retrievedAt, confidence: 0.85 });
  });

  it('drops unsupported layers and invalid closed geometry', () => {
    const result = normalizeExtractedGeometry([
      { layer: 'BUILDABLE_ENVELOPE', closed: true, vertices: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }] },
      { layer: 'BOUNDARY', closed: true, vertices: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    ], 'document-1', retrievedAt);
    expect(result).toEqual([]);
  });

  it('keeps valid open setback linework', () => {
    const result = normalizeExtractedGeometry([{ layer: 'SETBACKS', closed: false, confidence: 0.7,
      vertices: [{ x: 0, y: 10 }, { x: 100, y: 10 }] }], 'document-1', retrievedAt);
    expect(result).toHaveLength(1);
    expect(result[0].vertices).toHaveLength(2);
  });
});
