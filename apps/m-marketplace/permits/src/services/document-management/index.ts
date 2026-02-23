/**
 * Document Management Services
 * Main export for all document management services
 */

export {fileTypeRecognitionService} from './file-type-recognition';
export {pdfOptimizationService} from './pdf-optimizer';
export {ocrService} from './ocr-service';
export {documentIndexingService} from './document-indexer';
export {documentVersioningService} from './document-versioning';
export {documentStorageService} from './document-storage';

export type {
  FileTypeInfo,
  FileValidationResult,
} from './file-type-recognition';

export type {
  PDFOptimizationOptions,
  PDFOptimizationResult,
} from './pdf-optimizer';

export type {
  OCRResult,
  OCROptions,
} from './ocr-service';

export type {
  DocumentMetadata,
  IndexedDocument,
} from './document-indexer';

export type {
  DocumentVersion,
  VersionComparison,
} from './document-versioning';

export type {
  DocumentAccessControl,
  StoredDocument,
} from './document-storage';
