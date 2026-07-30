export type EngineeringJobType =
  | 'SURVEY_OCR'
  | 'PARSE_ENGINEERING_DOCUMENT'
  | 'INGEST_SITE_DATA'
  | 'PROCESS_SURVEY'
  | 'TRANSFORM_COORDINATES'
  | 'GENERATE_SURFACE'
  | 'GENERATE_CONTOURS'
  | 'CALCULATE_CUT_FILL'
  | 'ANALYZE_DRAINAGE'
  | 'EVALUATE_ZONING'
  | 'SOLVE_SCENARIO'
  | 'VALIDATE_SCENARIO'
  | 'GENERATE_GEOJSON'
  | 'GENERATE_GEOPACKAGE'
  | 'GENERATE_DXF'
  | 'GENERATE_IFC'
  | 'GENERATE_VECTOR_PDF'
  | 'GENERATE_REPORT'
  | 'RUN_COMPLIANCE_AUDIT';

export interface EngineeringJobData {
  type: EngineeringJobType;
  organizationId: string;
  projectId: string;
  engineeringProjectId: string;
  workflowId: string;
  scenarioId?: string;
  stageCode: string;
  idempotencyKey: string;
  actorId: string;
  documentId?: string;
  sourceUrl?: string;
  sourceContentHash?: string;
  options: Record<string, unknown>;
  requestedAt: string;
}

export interface EngineeringJobResult {
  jobType: EngineeringJobType;
  status: 'COMPLETE' | 'NEEDS_VERIFICATION';
  outputRefs: string[];
  warnings: string[];
  metrics: { processingMs: number; automaticPercent: number };
  result: Record<string, unknown>;
  toolVersion: string;
}
