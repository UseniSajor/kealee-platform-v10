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
  dxf: string; pdfBase64: string; geoJson: Record<string, unknown>; quantities: Record<string, number>;
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
function pdfText(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '-').replace(/([\\()])/g, '\\$1');
}
function buildVectorPdf(input: CivilSitePlanInput, quantities: Record<string, number>, warnings: string[]): string {
  const allPoints = input.geometry.flatMap(item => item.vertices);
  const minX = Math.min(...allPoints.map(point => point.x));
  const maxX = Math.max(...allPoints.map(point => point.x));
  const minY = Math.min(...allPoints.map(point => point.y));
  const maxY = Math.max(...allPoints.map(point => point.y));
  const scale = Math.min(390 / Math.max(maxX - minX, 1), 500 / Math.max(maxY - minY, 1));
  const mapPoint = (point: Point) => ({ x: 45 + (point.x - minX) * scale, y: 170 + (point.y - minY) * scale });
  const commands: string[] = ['0.5 w', '0 G'];
  for (const item of input.geometry) {
    const points = item.vertices.map(mapPoint);
    if (!points.length) continue;
    commands.push(`${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} m`);
    for (const point of points.slice(1)) commands.push(`${point.x.toFixed(2)} ${point.y.toFixed(2)} l`);
    if (item.closed) commands.push('h');
    commands.push('S');
    commands.push(`BT /F1 6 Tf ${points[0].x.toFixed(2)} ${(points[0].y + 4).toFixed(2)} Td (${pdfText(item.layer)}) Tj ET`);
  }
  commands.push('1 w 475 680 m 475 730 l S', '470 718 m 475 730 l 480 718 l S',
    'BT /F1 9 Tf 471 735 Td (N) Tj ET');
  commands.push('0.5 w 35 145 542 610 re S', '35 35 542 100 re S',
    `BT /F1 14 Tf 45 112 Td (${pdfText(input.name)}) Tj ET`,
    `BT /F1 8 Tf 45 95 Td (Revision ${input.revision}  |  ${input.requestedClassification}  |  ${input.units}) Tj ET`,
    `BT /F1 8 Tf 45 82 Td (CRS: ${pdfText(input.crs)}) Tj ET`,
    `BT /F1 7 Tf 45 68 Td (Geometry is plotted to page extents; use DXF/GeoJSON for coordinate-accurate data.) Tj ET`);
  let y = 640;
  commands.push('BT /F1 10 Tf 445 655 Td (LAYERS / SOURCES) Tj ET');
  for (const item of input.geometry.slice(0, 13)) {
    const line = `${item.layer}: ${item.authority} (${Math.round(item.confidence * 100)}%)`;
    commands.push(`BT /F1 6 Tf 445 ${y} Td (${pdfText(line)}) Tj ET`,
      `BT /F1 5 Tf 445 ${y - 8} Td (${pdfText(item.sourceId).slice(0, 52)}) Tj ET`);
    y -= 22;
  }
  y = 325;
  commands.push('BT /F1 10 Tf 445 340 Td (QUANTITIES) Tj ET');
  for (const [key, value] of Object.entries(quantities).slice(0, 12)) {
    commands.push(`BT /F1 6 Tf 445 ${y} Td (${pdfText(key)}: ${value.toFixed(2)}) Tj ET`);
    y -= 11;
  }
  const warning = warnings[0] ?? 'PROFESSIONAL APPROVAL REQUIRED FOR RELEASE';
  commands.push(`BT /F1 8 Tf 45 50 Td (${pdfText(warning).slice(0, 105)}) Tj ET`);
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, 'ascii')); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'ascii').toString('base64');
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
  const pdfBase64 = buildVectorPdf(input, quantities, warnings);
  return { dxf, pdfBase64, geoJson, quantities, warnings, metadata: {
    id: input.id, revision: input.revision, units: input.units, crs: input.crs,
    classification: input.requestedClassification, surveyVerified: input.surveyVerified,
    professionalApprovalId: input.professionalApprovalId,
  } };
}
