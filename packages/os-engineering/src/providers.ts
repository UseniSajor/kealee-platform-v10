import type { CivilSitePlanInput, CivilSitePlanOutput } from '@kealee/concept-engine';
import type { EngineeringDocumentType, Point3, SourceRef } from './phase1';

export type CadProviderCapability = 'DXF' | 'PDF' | 'GEOJSON' | 'DWG' | 'CIVIL_3D_SURFACE'
  | 'GRADING' | 'PIPE_NETWORK' | 'PROFILE' | 'QUANTITY_EXTRACTION';

export interface CadProvider {
  readonly name: string;
  capabilities(): Promise<CadProviderCapability[]>;
  generate(input: CivilSitePlanInput, idempotencyKey: string): Promise<CivilSitePlanOutput>;
}
export interface OcrToken {
  rawText: string; confidence: number; page: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}
export interface OcrProvider {
  readonly name: string;
  extract(input: { bytes: Uint8Array; mimeType: string; source: SourceRef },
    options: { signal?: AbortSignal; timeoutMs: number }): Promise<{ tokens: OcrToken[]; warnings: string[] }>;
}
export interface GeospatialProvider {
  readonly name: string;
  transform(points: Point3[], sourceCrs: string, targetCrs: string,
    options?: { signal?: AbortSignal }): Promise<Point3[]>;
}
export interface ElevationProvider {
  readonly name: string;
  sample(points: Array<{ x: number; y: number }>, crs: string,
    options?: { signal?: AbortSignal }): Promise<{ points: Point3[]; source: SourceRef; verticalAccuracy?: number }>;
}
export interface CadExportProvider extends CadProvider {}
export interface EngineeringReportProvider {
  readonly name: string;
  generate(input: { projectId: string; drawingPackageId: string; sections: unknown[] },
    idempotencyKey: string): Promise<{ pdf: Uint8Array; manifest: Record<string, unknown>; warnings: string[] }>;
}
export interface EngineeringDocumentParser {
  readonly name: string;
  supports(type: EngineeringDocumentType): boolean;
  parse(input: { bytes: Uint8Array; filename: string; source: SourceRef },
    options?: { signal?: AbortSignal }): Promise<{ elements: unknown[]; warnings: string[] }>;
}

export class LocalOcrProviderUnavailable implements OcrProvider {
  readonly name = 'local-ocr-unconfigured';
  async extract(): Promise<{ tokens: OcrToken[]; warnings: string[] }> {
    throw new Error('LOCAL_OCR_UNAVAILABLE: configure the isolated PaddleOCR worker; OCR results may not be fabricated');
  }
}

export interface AutodeskCadProviderConfig {
  clientId: string;
  clientSecret: string;
  activityId: string;
  region?: 'US' | 'EMEA' | 'AUS' | 'CAN' | 'DEU' | 'IND' | 'JPN' | 'GBR';
}

export class AutodeskCadProviderUnavailable implements CadProvider {
  readonly name = 'autodesk';
  async capabilities(): Promise<CadProviderCapability[]> { return []; }
  async generate(): Promise<CivilSitePlanOutput> {
    throw new Error('AUTODESK_CAD_PROVIDER_UNAVAILABLE: configure and validate an APS Automation activity before use');
  }
}
