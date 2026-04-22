/**
 * @kealee/storage
 *
 * File upload, storage, and processing pipeline.
 * Connects user uploads → Supabase Storage → Command Center processing.
 */

// Storage operations
export {
  uploadFile,
  uploadSitePhoto,
  uploadReceipt,
  uploadDocument,
  uploadConceptDeliverable,
  uploadEstimationDeliverable,
  uploadPermitDeliverable,
  getSignedUrl,
  deleteFile,
  getProjectPhotos,
} from './storage'

export type {
  UploadFileOptions,
  UploadResult,
  SitePhotoUploadOptions,
  SitePhotoResult,
  ReceiptUploadOptions,
  DocumentUploadOptions,
  UploadDocumentResult,
  ConceptDeliverableOptions,
  ConceptDeliverableResult,
  EstimationDeliverableOptions,
  EstimationDeliverableResult,
  PermitDeliverableOptions,
  PermitDeliverableResult,
  ProjectPhoto,
  OnEvent,
} from './storage'

// Image processing
export {
  optimizeImage,
  createThumbnail,
  getImageBase64,
  extractExifData,
  getImageDimensions,
} from './image-processing'

export type { OptimizeOptions, ExifData } from './image-processing'

// OCR processing
export {
  processReceipt,
  processPermitDocument,
} from './ocr'

export type {
  ReceiptOcrResult,
  PermitOcrResult,
  AnalyzeImageFn,
} from './ocr'
