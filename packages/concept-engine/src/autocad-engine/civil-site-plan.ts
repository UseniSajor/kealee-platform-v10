import type { Point } from './types';

export const CIVIL_SITE_LAYERS = [
  'BOUNDARY', 'EASEMENTS', 'RIGHT-OF-WAY', 'EXISTING-CONTOURS', 'PROPOSED-CONTOURS',
  'EXISTING-STRUCTURES', 'PROPOSED-STRUCTURES', 'SETBACKS', 'UTILITIES', 'STORM-DRAIN',
  'SWM-BMP', 'EROSION-CONTROL', 'LIMIT-OF-DISTURBANCE', 'TREE-SAVE', 'WOODLAND-CLEARING',
  'FLOODPLAIN', 'STREAM-BUFFER', 'WETLAND', 'ANNOTATIONS',
] as const;
export type CivilSiteLayer = typeof CIVIL_SITE_LAYERS[number];
export type GeometryAuthority = 'ESTIMATED' | 'EXTRACTED' | 'GIS_SCREENED' | 'OFFICIAL'
  | 'SURVEYED' | 'VERIFIED' | 'PROFESSIONALLY_CERTIFIED';
export interface CivilPolyline {
  id: string; layer: CivilSiteLayer; vertices: Point[]; closed: boolean;
  authority: GeometryAuthority; sourceId: string; sourceRetrievedAt: string; confidence: number;
}
export interface CivilSitePlanInput {
  id: string; name: string; units: 'FEET' | 'METERS'; crs: string;
  geometry: CivilPolyline[]; revision: number; surveyVerified: boolean;
  professionalApprovalId?: string; requestedClassification: 'CONCEPT' | 'PERMIT_READY';
}
export interface CivilSitePlanOutput {
  dxf: string; geoJson: Record<string, unknown>; quantities: Record<string, number>;
  metadata: Record<string, unknown>; warnings: string[];
}
function polygonArea(vertices: Point[]): number {
  if (vertices.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < vertices.length; i += 1) {
    const next = vertices[(i + 1) % vertices.length];
    area += vertices[i].x * next.y - next.x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}
function dxfPolyline(polyline: CivilPolyline): string[] {
  const values = ['0', 'LWPOLYLINE', '8', polyline.layer, '90', String(polyline.vertices.length),
    '70', polyline.closed ? '1' : '0'];
  for (const point of polyline.vertices) values.push('10', point.x.toFixed(4), '20', point.y.toFixed(4));
  return values;
}
export function generateCivilSitePlan(input: CivilSitePlanInput): CivilSitePlanOutput {
  if (!input.crs.trim()) throw new Error('Coordinate reference system is required');
  if (!input.geometry.length) throw new Error('Site-plan geometry is required');
  for (const item of input.geometry) {
    if (!item.sourceId || !item.sourceRetrievedAt) throw new Error(`Geometry ${item.id} lacks provenance`);
    if (item.confidence < 0 || item.confidence > 1) throw new Error(`Geometry ${item.id} confidence is invalid`);
  }
  if (input.requestedClassification === 'PERMIT_READY') {
    if (!input.surveyVerified) throw new Error('Permit-ready output requires verified survey geometry');
    if (!input.professionalApprovalId) throw new Error('Permit-ready output requires professional approval');
    if (input.geometry.some((item) => ['ESTIMATED', 'EXTRACTED', 'GIS_SCREENED'].includes(item.authority))) {
      throw new Error('Permit-ready output contains unverified geometry');
    }
  }
  const warnings = input.requestedClassification === 'CONCEPT'
    ? ['CONCEPT ONLY — NOT A BOUNDARY SURVEY OR PERMIT-READY PLAN'] : [];
  const unitCode = input.units === 'FEET' ? '2' : '6';
  const dxf = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1015', '9', '$INSUNITS', '70', unitCode,
    '999', `KEALEE_CRS=${input.crs}`, '999', `KEALEE_REVISION=${input.revision}`,
    ...warnings.flatMap((warning) => ['999', warning]), '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES',
    ...input.geometry.flatMap(dxfPolyline), '0', 'ENDSEC', '0', 'EOF'].join('\r\n');
  const geoJson = {
    type: 'FeatureCollection', name: input.name, crs: { type: 'name', properties: { name: input.crs } },
    features: input.geometry.map((item) => ({
      type: 'Feature', id: item.id,
      geometry: { type: item.closed ? 'Polygon' : 'LineString',
        coordinates: item.closed ? [[...item.vertices.map((p) => [p.x, p.y]), [item.vertices[0].x, item.vertices[0].y]]]
          : item.vertices.map((p) => [p.x, p.y]) },
      properties: { layer: item.layer, authority: item.authority, sourceId: item.sourceId,
        sourceRetrievedAt: item.sourceRetrievedAt, confidence: item.confidence },
    })),
  };
  const quantities: Record<string, number> = {};
  for (const item of input.geometry.filter((geometry) => geometry.closed)) {
    const key = `${item.layer.toLowerCase().replace(/-/g, '_')}_area_${input.units.toLowerCase()}`;
    quantities[key] = (quantities[key] ?? 0) + polygonArea(item.vertices);
  }
  return { dxf, geoJson, quantities, warnings, metadata: {
    id: input.id, revision: input.revision, units: input.units, crs: input.crs,
    classification: input.requestedClassification, surveyVerified: input.surveyVerified,
    professionalApprovalId: input.professionalApprovalId,
  } };
}
