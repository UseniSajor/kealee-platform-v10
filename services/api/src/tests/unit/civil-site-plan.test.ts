import { describe, expect, it } from 'vitest';
import { generateCivilSitePlan } from '@kealee/concept-engine';

const boundary = {
  id: 'boundary', layer: 'BOUNDARY' as const,
  vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 80 }, { x: 0, y: 80 }],
  closed: true, authority: 'SURVEYED' as const, sourceId: 'survey-1',
  sourceRetrievedAt: '2026-07-22T18:00:00.000Z', confidence: 1,
};

describe('civil site-plan generation', () => {
  it('generates concept DXF, GeoJSON, quantities, and a regulated-use warning', () => {
    const result = generateCivilSitePlan({ id: 'workflow-1', name: 'Test site', units: 'FEET', crs: 'EPSG:2248',
      geometry: [boundary], revision: 1, surveyVerified: false, requestedClassification: 'CONCEPT' });
    expect(result.dxf).toContain('KEALEE_CRS=EPSG:2248');
    expect(Buffer.from(result.pdfBase64, 'base64').subarray(0, 8).toString()).toBe('%PDF-1.4');
    expect(result.geoJson).toMatchObject({ type: 'FeatureCollection' });
    expect(result.quantities.boundary_area_feet).toBe(8000);
    expect(result.warnings[0]).toContain('NOT A BOUNDARY SURVEY');
  });

  it('rejects permit-ready output without survey verification and professional approval', () => {
    expect(() => generateCivilSitePlan({ id: 'workflow-1', name: 'Test site', units: 'FEET', crs: 'EPSG:2248',
      geometry: [boundary], revision: 1, surveyVerified: false, requestedClassification: 'PERMIT_READY' }))
      .toThrow('verified survey geometry');
  });

  it('rejects unverified geometry from permit-ready output', () => {
    expect(() => generateCivilSitePlan({ id: 'workflow-1', name: 'Test site', units: 'FEET', crs: 'EPSG:2248',
      geometry: [{ ...boundary, authority: 'GIS_SCREENED' }], revision: 1, surveyVerified: true,
      professionalApprovalId: 'approval-1', requestedClassification: 'PERMIT_READY' }))
      .toThrow('unverified geometry');
  });

  it('allows verified and professionally approved permit-ready output', () => {
    const result = generateCivilSitePlan({ id: 'workflow-1', name: 'Test site', units: 'FEET', crs: 'EPSG:2248',
      geometry: [boundary], revision: 2, surveyVerified: true, professionalApprovalId: 'approval-1',
      requestedClassification: 'PERMIT_READY' });
    expect(result.warnings).toEqual([]);
    expect(result.metadata).toMatchObject({ classification: 'PERMIT_READY', professionalApprovalId: 'approval-1' });
  });
});
