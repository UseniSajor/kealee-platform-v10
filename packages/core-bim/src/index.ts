/**
 * @kealee/core-bim — BIM Processing & 3D Visualization
 *
 * Provides IFC file parsing, glTF conversion, element extraction,
 * clash detection, model storage, and a React Three Fiber viewer
 * for the Kealee construction development platform.
 *
 * Server-side services (parser, converter, storage, extractor, detector)
 * are framework-agnostic. Viewer components (viewer/) require React 18+
 * and a browser with WebGL support.
 */

// ---------------------------------------------------------------------------
// Service classes (framework-agnostic, server-safe)
// ---------------------------------------------------------------------------

export { IFCParser } from './ifc-parser';
export { ModelStorageService } from './model-storage';
export { GLTFConverter } from './gltf-converter';
export { ElementExtractor } from './element-extractor';
export { ClashDetector } from './clash-detector';

// ---------------------------------------------------------------------------
// Viewer components (React Three Fiber, browser-only)
// ---------------------------------------------------------------------------

export {
  BIMViewer,
  ModelLoader,
  ViewerControls,
  ElementPicker,
  LayerManager,
  AnnotationOverlay,
} from './viewer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  // Core data types
  BIMModelData,
  BIMElementData,
  ClashResult,
  ViewerState,
  Annotation,

  // Geometry types
  Vector3,
  BoundingBox,
  BIMMaterial,

  // Enum/literal types
  BIMFormat,
  BIMElementType,
  BuildingSystem,
  ViewerLayer,
  ColorScheme,
  ClashSeverity,
  ClashType,
  ElementStatus,
  StorageBackend,

  // Service config types
  ModelMetadata,
  StorageConfig,
  ParsedModel,
  ConversionOptions,
  ClashDetectionOptions,

  // Viewer component props
  BIMViewerProps,
  ModelLoaderProps,
  ViewerControlsProps,
  ElementPickerProps,
  LayerManagerProps,
  AnnotationOverlayProps,
} from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export {
  DEFAULT_VISIBLE_LAYERS,
  DEFAULT_COLOR_SCHEME,
  ELEMENT_SYSTEM_MAP,
  COLOR_PALETTE,
} from './types';

// ---------------------------------------------------------------------------
// Zod schemas (runtime validation)
// ---------------------------------------------------------------------------

export {
  Vector3Schema,
  BoundingBoxSchema,
  ModelMetadataSchema,
  ClashDetectionOptionsSchema,
} from './types';

// ---------------------------------------------------------------------------
// Element extractor helper types
// ---------------------------------------------------------------------------

export type {
  ExtractionSummary,
  SystemGroup,
  StoreyGroup,
} from './element-extractor';
