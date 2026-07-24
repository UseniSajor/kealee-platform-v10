export type EngineeringUnit = 'FT' | 'M' | 'SQ_FT' | 'SQ_M' | 'CU_FT' | 'CU_YD' | 'CU_M'
  | 'PERCENT' | 'CFS' | 'IN' | 'GAL' | 'NONE';
export type ValueClassification = 'INFORMATIONAL' | 'EXTRACTED' | 'CUSTOMER_PROVIDED'
  | 'OFFICIAL_GIS' | 'SURVEYED' | 'VERIFIED' | 'ENGINEER_APPROVED' | 'SEALED';
export type VerificationStatus = 'UNVERIFIED' | 'NEEDS_VERIFICATION' | 'VERIFIED' | 'REJECTED';
export interface SourceRef {
  sourceId: string;
  sourceType: string;
  sourceUrl?: string;
  page?: number;
  location?: { x: number; y: number; width: number; height: number };
  retrievedAt: string;
  effectiveDate?: string;
  crs?: string;
}
export interface EngineeringValue<T> {
  id: string;
  value: T;
  unit: EngineeringUnit;
  classification: ValueClassification;
  source: SourceRef;
  extractionMethod: string;
  rawText?: string;
  confidence: number;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  toolVersion: string;
  supersedesId?: string;
}
export interface Point2 { x: number; y: number }
export interface Point3 extends Point2 { z: number; sourcePointId?: string }
export interface LineCourse {
  id: string;
  bearing: string;
  distance: number;
  unit: 'FT' | 'M';
  source: SourceRef;
  confidence: number;
  verificationStatus: VerificationStatus;
}

const EPSILON = 1e-8;
const PHASE1_VERSION = 'os-engineering-phase1-1.0.0';

export function parseDms(value: string): number {
  const normalized = value.trim().replace(/[º°]/g, '°').replace(/[′']/g, "'").replace(/[″"]/g, '"');
  const match = normalized.match(/^([+-]?\d+(?:\.\d+)?)\s*°?\s*(?:(\d+(?:\.\d+)?)\s*'?)?\s*(?:(\d+(?:\.\d+)?)\s*"?)?$/);
  if (!match) throw new Error(`Invalid DMS angle: ${value}`);
  const degrees = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  if (minutes >= 60 || seconds >= 60) throw new Error(`Invalid DMS angle: ${value}`);
  return Math.sign(degrees || 1) * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
}

export function quadrantBearingToAzimuth(value: string): number {
  const compact = value.toUpperCase().replace(/\s+/g, '');
  const match = compact.match(/^([NS])(.+)([EW])$/);
  if (!match) {
    const azimuth = parseDms(compact);
    if (azimuth < 0 || azimuth >= 360) throw new Error(`Bearing outside 0–360 degrees: ${value}`);
    return azimuth;
  }
  const angle = parseDms(match[2]);
  if (angle < 0 || angle > 90) throw new Error(`Quadrant bearing exceeds 90 degrees: ${value}`);
  if (match[1] === 'N' && match[3] === 'E') return angle;
  if (match[1] === 'S' && match[3] === 'E') return 180 - angle;
  if (match[1] === 'S' && match[3] === 'W') return 180 + angle;
  return 360 - angle;
}

export function createParcelPolygon(courses: LineCourse[], origin: Point2 = { x: 0, y: 0 }) {
  if (courses.length < 3) throw new Error('At least three boundary courses are required');
  const unit = courses[0].unit;
  if (courses.some(course => course.unit !== unit)) throw new Error('Boundary courses use mixed units');
  const points: Point2[] = [{ ...origin }];
  for (const course of courses) {
    if (!(course.distance > 0)) throw new Error(`Course ${course.id} has an invalid distance`);
    const radians = quadrantBearingToAzimuth(course.bearing) * Math.PI / 180;
    const prior = points[points.length - 1];
    points.push({ x: prior.x + course.distance * Math.sin(radians), y: prior.y + course.distance * Math.cos(radians) });
  }
  const closure = calculateBoundaryClosure(points);
  return { points, unit, closure, toolVersion: PHASE1_VERSION,
    requiresVerification: courses.some(course => course.verificationStatus !== 'VERIFIED') };
}

export function calculateBoundaryClosure(points: Point2[]) {
  if (points.length < 2) throw new Error('Boundary points are required');
  const start = points[0];
  const end = points[points.length - 1];
  const errorX = end.x - start.x;
  const errorY = end.y - start.y;
  const closureError = Math.hypot(errorX, errorY);
  let perimeter = 0;
  for (let i = 1; i < points.length; i += 1) perimeter += Math.hypot(
    points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return { errorX, errorY, closureError, perimeter,
    relativePrecision: closureError <= EPSILON ? Number.POSITIVE_INFINITY : perimeter / closureError,
    toolVersion: PHASE1_VERSION };
}

function orientation(a: Point2, b: Point2, c: Point2) {
  return Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}
function segmentsIntersect(a: Point2, b: Point2, c: Point2, d: Point2) {
  return orientation(a, b, c) !== orientation(a, b, d) && orientation(c, d, a) !== orientation(c, d, b);
}
export function validateGeometryTopology(points: Point2[]) {
  const errors: string[] = [];
  const normalized = points.length > 1 && Math.hypot(points[0].x - points.at(-1)!.x,
    points[0].y - points.at(-1)!.y) <= EPSILON ? points.slice(0, -1) : points;
  if (normalized.length < 3) errors.push('Polygon requires at least three distinct vertices');
  const duplicateKeys = new Set<string>();
  normalized.forEach((point, index) => {
    const key = `${point.x.toFixed(8)},${point.y.toFixed(8)}`;
    if (duplicateKeys.has(key)) errors.push(`Duplicate vertex at index ${index}`);
    duplicateKeys.add(key);
  });
  for (let i = 0; i < normalized.length; i += 1) {
    const a = normalized[i]; const b = normalized[(i + 1) % normalized.length];
    for (let j = i + 2; j < normalized.length; j += 1) {
      if (i === 0 && j === normalized.length - 1) continue;
      const c = normalized[j]; const d = normalized[(j + 1) % normalized.length];
      if (segmentsIntersect(a, b, c, d)) errors.push(`Boundary segments ${i + 1} and ${j + 1} intersect`);
    }
  }
  return { valid: errors.length === 0, errors, toolVersion: PHASE1_VERSION };
}

export function validateBoundaryClosure(points: Point2[], tolerance: { maximumError: number; minimumRelativePrecision: number }) {
  const closure = calculateBoundaryClosure(points);
  const topology = validateGeometryTopology(points);
  const issues = [...topology.errors];
  if (closure.closureError > tolerance.maximumError) issues.push('Boundary closure exceeds configured error tolerance');
  if (closure.relativePrecision < tolerance.minimumRelativePrecision) issues.push('Boundary relative precision is below configured tolerance');
  return { accepted: issues.length === 0, closure, topology, issues, professionalReviewRequired: true };
}

export function polygonArea(points: Point2[]): number {
  if (points.length < 3) return 0;
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0)) / 2;
}
function centroid(points: Point2[]): Point2 {
  return { x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
}
export function offsetSetbackLines(parcel: Point2[], setback: number) {
  if (setback < 0) throw new Error('Setback cannot be negative');
  const center = centroid(parcel);
  const envelope = parcel.map(point => {
    const distance = Math.hypot(point.x - center.x, point.y - center.y);
    if (distance <= setback) throw new Error('Setback collapses the parcel envelope');
    const ratio = (distance - setback) / distance;
    return { x: center.x + (point.x - center.x) * ratio, y: center.y + (point.y - center.y) * ratio };
  });
  return { geometry: envelope, unit: 'FT' as const, warnings: [
    'Conceptual uniform offset; frontage-specific setbacks and concave corners require exact rule geometry review.',
  ], calculationVersion: PHASE1_VERSION };
}
export function calculateBuildableEnvelope(parcel: Point2[], exclusions: Point2[][], setback: number) {
  const topology = validateGeometryTopology(parcel);
  if (!topology.valid) throw new Error(`Invalid parcel topology: ${topology.errors.join('; ')}`);
  const offset = offsetSetbackLines(parcel, setback);
  const grossArea = polygonArea(offset.geometry);
  const excludedArea = exclusions.reduce((sum, exclusion) => sum + polygonArea(exclusion), 0);
  return { geometry: offset.geometry, grossArea, netArea: Math.max(0, grossArea - excludedArea),
    unit: 'SQ_FT' as const, inputReferences: ['parcel', 'setback-rule', ...exclusions.map((_, i) => `exclusion-${i + 1}`)],
    warnings: offset.warnings, confidence: exclusions.length ? 0.75 : 0.85, calculationVersion: PHASE1_VERSION };
}
export function placeBuildingFootprint(envelope: Point2[], width: number, depth: number, rotationDegrees = 0) {
  if (width <= 0 || depth <= 0) throw new Error('Footprint dimensions must be positive');
  const center = centroid(envelope);
  const radians = rotationDegrees * Math.PI / 180;
  const corners = [[-width / 2, -depth / 2], [width / 2, -depth / 2],
    [width / 2, depth / 2], [-width / 2, depth / 2]].map(([x, y]) => ({
    x: center.x + x * Math.cos(radians) - y * Math.sin(radians),
    y: center.y + x * Math.sin(radians) + y * Math.cos(radians),
  }));
  const bounds = (points: Point2[]) => ({ minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)) });
  const e = bounds(envelope); const f = bounds(corners);
  const fits = f.minX >= e.minX && f.maxX <= e.maxX && f.minY >= e.minY && f.maxY <= e.maxY;
  return { geometry: corners, fits, area: width * depth, unit: 'SQ_FT' as const,
    warnings: fits ? [] : ['Candidate footprint exceeds the conceptual buildable envelope.'],
    confidence: 0.8, calculationVersion: PHASE1_VERSION };
}
export function calculateLotCoverage(parcel: Point2[], covered: Point2[][]) {
  const parcelArea = polygonArea(parcel);
  if (!parcelArea) throw new Error('Parcel area must be positive');
  const coveredArea = covered.reduce((sum, item) => sum + polygonArea(item), 0);
  return { parcelArea, coveredArea, percent: coveredArea / parcelArea * 100, unit: 'PERCENT' as const,
    calculationVersion: PHASE1_VERSION };
}
export const calculateImperviousArea = calculateLotCoverage;
export function calculateLimitOfDisturbance(disturbedFeatures: Point2[][], buffer = 5) {
  if (!disturbedFeatures.length) throw new Error('At least one disturbed feature is required');
  const points = disturbedFeatures.flat();
  const minX = Math.min(...points.map(p => p.x)) - buffer; const maxX = Math.max(...points.map(p => p.x)) + buffer;
  const minY = Math.min(...points.map(p => p.y)) - buffer; const maxY = Math.max(...points.map(p => p.y)) + buffer;
  const geometry = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
  return { geometry, area: polygonArea(geometry), unit: 'SQ_FT' as const,
    warnings: ['Candidate LOD must be refined around access, utilities, stockpile, BMP and protected resources.'],
    confidence: 0.75, calculationVersion: PHASE1_VERSION };
}

export function createExistingGroundSurface(points: Point3[]) {
  if (points.length < 3) throw new Error('At least three verified elevation points are required');
  if (points.some(point => !Number.isFinite(point.z))) throw new Error('Surface contains an invalid elevation');
  const triangles = points.slice(1, -1).map((point, index) => [points[0], point, points[index + 2]]);
  return { points, triangles, elevationRange: {
    minimum: Math.min(...points.map(point => point.z)), maximum: Math.max(...points.map(point => point.z)),
  }, sourcePointIds: points.map(point => point.sourcePointId).filter(Boolean), preliminary: false,
  calculationVersion: PHASE1_VERSION };
}
export function calculateSlope(a: Point3, b: Point3) {
  const run = Math.hypot(b.x - a.x, b.y - a.y);
  if (run <= EPSILON) throw new Error('Slope run must be greater than zero');
  return { rise: b.z - a.z, run, percent: (b.z - a.z) / run * 100, unit: 'PERCENT' as const,
    calculationVersion: PHASE1_VERSION };
}
export function identifySteepSlopes(points: Point3[], thresholdPercent: number) {
  return points.slice(1).map((point, index) => ({ from: points[index], to: point,
    ...calculateSlope(points[index], point) })).filter(segment => Math.abs(segment.percent) >= thresholdPercent);
}
export function calculateCutFill(existing: Point3[], proposed: Point3[], cellAreaSqFt: number) {
  if (existing.length !== proposed.length || !existing.length) throw new Error('Matched existing/proposed samples are required');
  let cutCuFt = 0; let fillCuFt = 0;
  existing.forEach((point, index) => {
    const delta = proposed[index].z - point.z;
    if (delta >= 0) fillCuFt += delta * cellAreaSqFt; else cutCuFt += Math.abs(delta) * cellAreaSqFt;
  });
  return { cutCubicYards: cutCuFt / 27, fillCubicYards: fillCuFt / 27,
    netCubicYards: (fillCuFt - cutCuFt) / 27, unit: 'CU_YD' as const, preliminary: true,
    assumptions: ['Uniform sample-cell method', `Cell area ${cellAreaSqFt} square feet`],
    calculationVersion: PHASE1_VERSION };
}
export function calculateDrivewaySlope(start: Point3, end: Point3, maximumPercent: number) {
  const slope = calculateSlope(start, end);
  return { ...slope, passes: Math.abs(slope.percent) <= maximumPercent,
    warnings: Math.abs(slope.percent) <= maximumPercent ? [] : ['Driveway slope exceeds the configured screening maximum.'] };
}

export interface RunoffInput {
  areaSqFt: number; runoffCoefficient: number; rainfallIntensityInPerHour: number;
  rainfallSource: SourceRef; ruleVersion: string;
}
export function calculateRunoff(input: RunoffInput) {
  if (input.areaSqFt <= 0 || input.runoffCoefficient < 0 || input.runoffCoefficient > 1
    || input.rainfallIntensityInPerHour <= 0) throw new Error('Invalid Rational Method input');
  const areaAcres = input.areaSqFt / 43560;
  const peakCfs = input.runoffCoefficient * input.rainfallIntensityInPerHour * areaAcres;
  return { formula: 'Q = C × i × A', inputs: input, intermediateResults: { areaAcres },
    result: peakCfs, unit: 'CFS' as const, assumptions: ['Preliminary Rational Method screening'],
    professionalReviewStatus: 'REQUIRED', calculationVersion: PHASE1_VERSION };
}
export function calculateImperviousIncrease(existingSqFt: number, proposedSqFt: number) {
  return { existingSqFt, proposedSqFt, increaseSqFt: proposedSqFt - existingSqFt,
    percentIncrease: existingSqFt ? (proposedSqFt - existingSqFt) / existingSqFt * 100 : null,
    calculationVersion: PHASE1_VERSION };
}
export function sizeStormwaterBmp(type: 'MICRO_BIORETENTION' | 'DRY_WELL' | 'RAIN_GARDEN' | 'CISTERN' | 'PERMEABLE_PAVEMENT',
  treatmentVolumeCuFt: number, parameters: { pondingDepthFt?: number; storageVoidRatio?: number; availableAreaSqFt?: number }) {
  if (treatmentVolumeCuFt <= 0) throw new Error('Treatment volume must be positive');
  const effectiveDepth = type === 'CISTERN' ? 1 : (parameters.pondingDepthFt ?? 1) * (parameters.storageVoidRatio ?? 1);
  if (effectiveDepth <= 0) throw new Error('BMP effective storage depth must be positive');
  const requiredAreaSqFt = treatmentVolumeCuFt / effectiveDepth;
  const fits = parameters.availableAreaSqFt === undefined ? null : requiredAreaSqFt <= parameters.availableAreaSqFt;
  return { type, treatmentVolumeCuFt, requiredAreaSqFt, fits, unit: 'SQ_FT' as const,
    warnings: [
      'Preliminary sizing requires infiltration testing, soil confirmation, overflow and underdrain/outfall review.',
      ...(fits === false ? ['Candidate BMP does not fit in the available screening area.'] : []),
    ], professionalReviewRequired: true, calculationVersion: PHASE1_VERSION };
}

export function generateConstructionSequence() {
  return ['Preconstruction meeting and limits verification', 'Install stabilized construction entrance',
    'Install perimeter controls and tree protection', 'Clear only within approved LOD',
    'Rough grade and install utilities/drainage', 'Construct building and permanent stormwater facilities',
    'Apply temporary stabilization to inactive areas', 'Complete final grading and permanent stabilization',
    'Remove temporary controls only after authorization and stabilization'];
}
export function calculateSedimentControlQuantities(input: { lodPerimeterFt: number; inletCount: number;
  entranceLengthFt: number; treeProtectionFt: number }) {
  return { siltFenceFt: Math.max(0, input.lodPerimeterFt), inletProtectionEach: Math.max(0, Math.ceil(input.inletCount)),
    stabilizedEntranceFt: Math.max(0, input.entranceLengthFt), treeProtectionFenceFt: Math.max(0, input.treeProtectionFt),
    constructionSequence: generateConstructionSequence(), preliminary: true, calculationVersion: PHASE1_VERSION };
}

export const ENGINEERING_WORKFLOW_STAGES = [
  'PROJECT_INTAKE', 'PROPERTY_JURISDICTION_RESOLUTION', 'SOURCE_DOCUMENT_COLLECTION', 'SURVEY_EXTRACTION',
  'SURVEY_VERIFICATION_GATE', 'BASE_GEOMETRY_CREATION', 'INFILL_FEASIBILITY', 'TERRAIN_GRADING_ANALYSIS',
  'STORMWATER_SCREENING', 'EROSION_SEDIMENT_CONTROL', 'COMPLIANCE_AUDIT', 'DRAWING_REPORT_GENERATION',
  'PROFESSIONAL_REVIEW', 'REVISION_REDLINE', 'APPROVED_PROFESSIONAL_HANDOFF', 'PERMIT_PACKAGE_HANDOFF',
] as const;
export type EngineeringWorkflowStageCode = typeof ENGINEERING_WORKFLOW_STAGES[number];
export type EngineeringStageStatus = 'NOT_STARTED' | 'WAITING_FOR_INPUT' | 'READY' | 'PROCESSING'
  | 'NEEDS_VERIFICATION' | 'NEEDS_PROFESSIONAL_REVIEW' | 'BLOCKED' | 'FAILED' | 'COMPLETE' | 'SUPERSEDED';
export interface EngineeringStageResult {
  stage: EngineeringWorkflowStageCode; status: EngineeringStageStatus; inputs: string[]; outputs: string[];
  sources: SourceRef[]; confidence: number; blockingIssues: string[]; assignedPartyId?: string;
  startedAt?: string; completedAt?: string; calculationVersion: string; auditHistory: string[]; idempotencyKey?: string;
}
export function createEngineeringWorkflow(id: string) {
  return { id, version: 0, stages: ENGINEERING_WORKFLOW_STAGES.map((stage, index): EngineeringStageResult => ({
    stage, status: index === 0 ? 'READY' : 'NOT_STARTED', inputs: [], outputs: [], sources: [],
    confidence: 0, blockingIssues: [], calculationVersion: PHASE1_VERSION, auditHistory: [],
  })) };
}
export function transitionEngineeringStage(workflow: ReturnType<typeof createEngineeringWorkflow>,
  stage: EngineeringWorkflowStageCode, status: EngineeringStageStatus, idempotencyKey: string, details: Partial<EngineeringStageResult> = {}) {
  const index = workflow.stages.findIndex(item => item.stage === stage);
  if (index < 0) throw new Error('Unknown engineering stage');
  const current = workflow.stages[index];
  if (current.idempotencyKey === idempotencyKey) return workflow;
  if (status === 'PROCESSING' && index > 0 && workflow.stages[index - 1].status !== 'COMPLETE') {
    throw new Error('Prior engineering stage is incomplete');
  }
  const now = new Date().toISOString();
  const stages = workflow.stages.map(item => ({ ...item, auditHistory: [...item.auditHistory] }));
  stages[index] = { ...current, ...details, status, idempotencyKey,
    startedAt: status === 'PROCESSING' ? current.startedAt ?? now : current.startedAt,
    completedAt: status === 'COMPLETE' ? now : undefined,
    auditHistory: [...current.auditHistory, `${now}:${status}:${idempotencyKey}`] };
  if (status === 'COMPLETE' && stages[index + 1]?.status === 'NOT_STARTED') stages[index + 1].status = 'READY';
  return { ...workflow, stages, version: workflow.version + 1 };
}

export type EngineeringDocumentType = 'BOUNDARY_SURVEY' | 'TOPOGRAPHIC_SURVEY' | 'RECORDED_PLAT'
  | 'LANDXML' | 'POINT_FILE' | 'CAD' | 'GIS_DATA' | 'AERIAL_OR_PHOTO' | 'UNKNOWN';
const INTAKE_TYPES: Record<string, { type: EngineeringDocumentType; mime: string[] }> = {
  pdf: { type: 'BOUNDARY_SURVEY', mime: ['application/pdf'] },
  dxf: { type: 'CAD', mime: ['application/dxf', 'application/x-dxf', 'text/plain'] },
  dwg: { type: 'CAD', mime: ['application/acad', 'application/x-acad', 'application/octet-stream'] },
  xml: { type: 'LANDXML', mime: ['application/xml', 'text/xml'] },
  landxml: { type: 'LANDXML', mime: ['application/xml', 'text/xml'] },
  csv: { type: 'POINT_FILE', mime: ['text/csv', 'application/vnd.ms-excel'] },
  geojson: { type: 'GIS_DATA', mime: ['application/geo+json', 'application/json'] },
  zip: { type: 'GIS_DATA', mime: ['application/zip', 'application/x-zip-compressed'] },
  tif: { type: 'GIS_DATA', mime: ['image/tiff'] }, tiff: { type: 'GIS_DATA', mime: ['image/tiff'] },
  jpg: { type: 'AERIAL_OR_PHOTO', mime: ['image/jpeg'] }, jpeg: { type: 'AERIAL_OR_PHOTO', mime: ['image/jpeg'] },
  png: { type: 'AERIAL_OR_PHOTO', mime: ['image/png'] },
};
export function classifyEngineeringDocument(filename: string, mimeType: string, sizeBytes: number, maximumBytes = 100 * 1024 * 1024) {
  const extension = filename.toLowerCase().split('.').pop() ?? '';
  const supported = INTAKE_TYPES[extension];
  if (!supported) throw new Error(`Unsupported engineering file extension: .${extension || '(none)'}`);
  if (!supported.mime.includes(mimeType.toLowerCase())) throw new Error(`File content type ${mimeType} does not match .${extension}`);
  if (sizeBytes <= 0 || sizeBytes > maximumBytes) throw new Error(`Engineering file must be between 1 byte and ${maximumBytes} bytes`);
  return { documentType: supported.type, extension, mimeType, sizeBytes, antivirusStatus: 'SCAN_REQUIRED' as const,
    duplicateDetection: 'SHA256_REQUIRED' as const, toolVersion: PHASE1_VERSION };
}
export function parseCsvSurveyPoints(csv: string) {
  const rows = csv.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) throw new Error('CSV point file has no data rows');
  const headers = rows[0].split(',').map(value => value.trim().toLowerCase());
  const indices = { id: headers.indexOf('id'), x: headers.indexOf('x'), y: headers.indexOf('y'), z: headers.indexOf('z') };
  if (indices.x < 0 || indices.y < 0 || indices.z < 0) throw new Error('CSV requires x, y and z columns');
  return rows.slice(1).map((row, index): Point3 => {
    const values = row.split(',').map(value => value.trim());
    const point = { x: Number(values[indices.x]), y: Number(values[indices.y]), z: Number(values[indices.z]),
      sourcePointId: indices.id >= 0 ? values[indices.id] : `row-${index + 2}` };
    if (![point.x, point.y, point.z].every(Number.isFinite)) throw new Error(`Invalid coordinate at CSV row ${index + 2}`);
    return point;
  });
}

export function createDrawingManifest(input: { projectName: string; revision: number; hasStormwater: boolean;
  hasUtilities: boolean; hasTrees: boolean; hasDemolition: boolean; hasRetainingWall: boolean }) {
  const sheets = [
    ['C-001', 'Cover / Index'], ['C-100', 'Existing Conditions'], ['C-200', 'Proposed Site Plan'],
    ['C-300', 'Preliminary Grading'], ['C-400', 'Erosion and Sediment Control'],
    ['C-500', 'Notes and Details'], ['CALC', 'Civil Calculation Report'], ['REV', 'Revision Log'],
  ];
  if (input.hasDemolition) sheets.splice(2, 0, ['C-110', 'Demolition Plan']);
  if (input.hasStormwater) sheets.push(['C-350', 'Stormwater / Drainage Areas']);
  if (input.hasUtilities) sheets.push(['C-250', 'Utility Plan']);
  if (input.hasTrees) sheets.push(['L-100', 'Tree / Woodland Plan']);
  if (input.hasRetainingWall) sheets.push(['C-510', 'Retaining Wall Indicator']);
  return { projectName: input.projectName, revision: input.revision,
    sheets: sheets.map(([number, title]) => ({ number, title, status: 'PRELIMINARY_UNSEALED' })),
    requiredNotes: ['PRELIMINARY — NOT FOR CONSTRUCTION', 'NOT A BOUNDARY SURVEY',
      'PROFESSIONAL REVIEW REQUIRED', 'GIS INFORMATION IS NOT SURVEYED GEOMETRY'],
    calculationVersion: PHASE1_VERSION };
}

export function runInfillEligibilityCheck(input: { lotCount?: number; frontsExistingBuiltStreet?: boolean;
  zoningResolved: boolean; useAllowed?: boolean; municipalityResolved: boolean; publicWaterSewer?: boolean;
  wellSepticFeasible?: boolean; buildableEnvelopeAreaSqFt?: number; drivewayFeasible?: boolean;
  environmentalScreenPositive: boolean; existingTcp?: boolean; priorApprovalConflict?: boolean }) {
  const missing = Object.entries(input).filter(([, value]) => value === undefined).map(([key]) => key);
  if (missing.length) return { outcome: 'INSUFFICIENT_INFORMATION' as const, missing,
    disclaimer: 'Preliminary eligibility is not County approval.', calculationVersion: PHASE1_VERSION };
  const disqualifiers = [
    input.lotCount! < 1 || input.lotCount! > 6 ? 'Project is outside the one-to-six-lot Phase 1 scope' : '',
    !input.frontsExistingBuiltStreet ? 'No existing built-street frontage established' : '',
    !input.zoningResolved || input.useAllowed === false ? 'Zoning/use has not been established as eligible' : '',
    !input.buildableEnvelopeAreaSqFt ? 'No usable buildable envelope' : '',
    input.drivewayFeasible === false ? 'Driveway access is not feasible' : '',
    input.priorApprovalConflict ? 'Prior approval conflict requires a different review path' : '',
  ].filter(Boolean);
  if (disqualifiers.length) return { outcome: 'NOT_ELIGIBLE' as const, issues: disqualifiers,
    disclaimer: 'Preliminary eligibility is not County approval.', calculationVersion: PHASE1_VERSION };
  const confirmations = [
    input.environmentalScreenPositive ? 'Environmental constraints require professional/agency confirmation' : '',
    input.existingTcp ? 'Existing TCP restrictions require confirmation' : '',
    !input.publicWaterSewer && !input.wellSepticFeasible ? 'Utility/service feasibility requires confirmation' : '',
  ].filter(Boolean);
  return { outcome: confirmations.length ? 'PROFESSIONAL_OR_AGENCY_CONFIRMATION_REQUIRED' as const : 'LIKELY_ELIGIBLE' as const,
    issues: confirmations, disclaimer: 'Preliminary eligibility is not County approval.', calculationVersion: PHASE1_VERSION };
}
