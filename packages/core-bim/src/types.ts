/**
 * @kealee/core-bim — Type Definitions
 *
 * Core type definitions for BIM model processing, element extraction,
 * clash detection, and 3D viewer state management.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums & Literals
// ---------------------------------------------------------------------------

/** Supported BIM file formats */
export type BIMFormat = 'IFC' | 'IFC2x3' | 'IFC4' | 'IFC4x3' | 'GLTF' | 'GLB';

/** Element types extracted from IFC models */
export type BIMElementType =
  | 'WALL'
  | 'SLAB'
  | 'COLUMN'
  | 'BEAM'
  | 'DOOR'
  | 'WINDOW'
  | 'STAIR'
  | 'ROOF'
  | 'RAILING'
  | 'FOOTING'
  | 'PILE'
  | 'PLATE'
  | 'CURTAIN_WALL'
  | 'COVERING'
  | 'MEMBER'
  | 'PIPE'
  | 'DUCT'
  | 'CABLE_TRAY'
  | 'FITTING'
  | 'FLOW_TERMINAL'
  | 'DISTRIBUTION_ELEMENT'
  | 'FURNISHING'
  | 'SPACE'
  | 'BUILDING_STOREY'
  | 'SITE'
  | 'OTHER';

/** Building system classification for element grouping */
export type BuildingSystem =
  | 'STRUCTURAL'
  | 'ARCHITECTURAL'
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'FIRE_PROTECTION'
  | 'SITE_WORK'
  | 'OTHER';

/** Viewer visualization layers mapped to Kealee OS modules */
export type ViewerLayer =
  | 'DESIGN'
  | 'PERMIT'
  | 'CONSTRUCTION'
  | 'FINANCIAL'
  | 'OPERATIONS'
  | 'LAND';

/** Color scheme options for model rendering */
export type ColorScheme =
  | 'DEFAULT'
  | 'BY_STATUS'
  | 'BY_TRADE'
  | 'BY_COST'
  | 'BY_SCHEDULE'
  | 'BY_HEALTH';

/** Clash severity levels */
export type ClashSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';

/** Clash detection types */
export type ClashType = 'HARD' | 'SOFT' | 'CLEARANCE';

/** Element lifecycle status */
export type ElementStatus =
  | 'EXISTING'
  | 'NEW'
  | 'DEMOLISHED'
  | 'TEMPORARY'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNDER_REVIEW';

/** Storage backend options */
export type StorageBackend = 'S3' | 'R2' | 'LOCAL';

// ---------------------------------------------------------------------------
// Geometry Types
// ---------------------------------------------------------------------------

/** 3D coordinate */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** Axis-aligned bounding box */
export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

/** Material definition for rendering */
export interface BIMMaterial {
  name: string;
  color?: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
}

// ---------------------------------------------------------------------------
// Core Data Types
// ---------------------------------------------------------------------------

/** Represents a parsed and stored BIM model */
export interface BIMModelData {
  /** Unique model identifier */
  id: string;
  /** Human-readable model name */
  name: string;
  /** Source file format */
  format: BIMFormat;
  /** URL to the original uploaded file */
  fileUrl: string;
  /** URL to the web-optimized glTF/GLB conversion */
  convertedUrl?: string;
  /** Total number of extracted elements */
  elementCount: number;
  /** File size in bytes */
  fileSizeBytes?: number;
  /** Model upload timestamp */
  uploadedAt?: Date;
  /** Associated project ID */
  projectId?: string;
}

/** Represents a single BIM element extracted from a model */
export interface BIMElementData {
  /** Internal element identifier */
  id: string;
  /** IFC GlobalId (22-character base64) */
  ifcGlobalId: string;
  /** Classified element type */
  elementType: BIMElementType;
  /** Human-readable element name */
  name: string;
  /** IFC property sets as key-value pairs */
  properties: Record<string, unknown>;
  /** Element bounding box in model space */
  boundingBox: BoundingBox;
  /** Materials assigned to this element */
  materials: BIMMaterial[];
  /** Current lifecycle status */
  status: ElementStatus;
  /** Building system classification */
  system?: BuildingSystem;
  /** Parent model ID */
  modelId?: string;
  /** Building storey / level assignment */
  storey?: string;
}

/** Result of a clash detection check between two elements */
export interface ClashResult {
  /** First clashing element */
  elementA: BIMElementData;
  /** Second clashing element */
  elementB: BIMElementData;
  /** Type of clash detected */
  clashType: ClashType;
  /** Severity assessment */
  severity: ClashSeverity;
  /** 3D location of the clash point */
  location: Vector3;
  /** Overlap distance (for hard clashes) or proximity distance (for soft/clearance) in meters */
  distance?: number;
  /** Human-readable description */
  description?: string;
}

/** Viewer camera and display state */
export interface ViewerState {
  /** Camera position in world space */
  cameraPosition: Vector3;
  /** Camera look-at target */
  cameraTarget: Vector3;
  /** Currently visible layers */
  visibleLayers: ViewerLayer[];
  /** Active element type filters */
  elementFilters: BIMElementType[];
  /** Active color scheme */
  colorScheme: ColorScheme;
  /** Currently selected element IDs */
  selectedElements: string[];
  /** Camera field of view in degrees */
  fov?: number;
}

/** 3D annotation placed on a model */
export interface Annotation {
  /** Unique annotation identifier */
  id: string;
  /** 3D position in model space */
  position: Vector3;
  /** Annotation title */
  title: string;
  /** Annotation description / body */
  content: string;
  /** ID of the associated element (if any) */
  elementId?: string;
  /** Author user ID */
  authorId?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Visual priority level */
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ---------------------------------------------------------------------------
// Service Types
// ---------------------------------------------------------------------------

/** Metadata provided when uploading a model */
export interface ModelMetadata {
  /** Model display name */
  name: string;
  /** Source file format */
  format: BIMFormat;
  /** Associated project ID */
  projectId?: string;
  /** Uploader user ID */
  uploadedBy?: string;
  /** Additional metadata key-value pairs */
  tags?: Record<string, string>;
}

/** Configuration for the model storage service */
export interface StorageConfig {
  /** Storage backend to use */
  backend: StorageBackend;
  /** S3/R2 bucket name */
  bucket?: string;
  /** S3/R2 region */
  region?: string;
  /** S3/R2 endpoint URL (for R2 or custom S3-compatible) */
  endpoint?: string;
  /** Access key ID */
  accessKeyId?: string;
  /** Secret access key */
  secretAccessKey?: string;
  /** Local storage directory (for LOCAL backend) */
  localPath?: string;
  /** Signed URL expiration in seconds (default: 3600) */
  signedUrlExpiry?: number;
}

/** Parsed IFC model handle returned by IFCParser */
export interface ParsedModel {
  /** Internal model ID assigned by web-ifc */
  modelId: number;
  /** IFC schema version detected */
  schema: string;
  /** Raw header information */
  header: Record<string, unknown>;
  /** Number of geometry items */
  geometryCount: number;
}

/** Options for glTF conversion */
export interface ConversionOptions {
  /** Target format */
  outputFormat?: 'GLTF' | 'GLB';
  /** Enable Draco mesh compression */
  dracoCompression?: boolean;
  /** Texture max dimension (pixels) */
  maxTextureSize?: number;
  /** Simplification ratio (0.0 - 1.0, lower = more simplified) */
  simplifyRatio?: number;
}

/** Options for clash detection */
export interface ClashDetectionOptions {
  /** Tolerance distance for soft clashes (meters) */
  softClashTolerance?: number;
  /** Required clearance distance (meters) */
  clearanceDistance?: number;
  /** Only check clashes between different building systems */
  crossSystemOnly?: boolean;
  /** Element types to include (empty = all) */
  includeTypes?: BIMElementType[];
  /** Element types to exclude */
  excludeTypes?: BIMElementType[];
}

// ---------------------------------------------------------------------------
// Viewer Component Props
// ---------------------------------------------------------------------------

/** Props for the main BIMViewer component */
export interface BIMViewerProps {
  /** URL to the glTF/GLB model file */
  modelUrl: string;
  /** Callback when an element is selected */
  onElementSelect?: (element: BIMElementData | null) => void;
  /** Visible layers */
  layers?: ViewerLayer[];
  /** Active color scheme */
  colorScheme?: ColorScheme;
  /** Initial viewer state */
  initialState?: Partial<ViewerState>;
  /** Annotations to display */
  annotations?: Annotation[];
  /** Callback when an annotation is clicked */
  onAnnotationClick?: (annotation: Annotation) => void;
  /** Viewer container width (CSS value) */
  width?: string | number;
  /** Viewer container height (CSS value) */
  height?: string | number;
  /** Background color */
  backgroundColor?: string;
  /** Enable ambient occlusion */
  ambientOcclusion?: boolean;
  /** Enable shadows */
  shadows?: boolean;
}

/** Props for the ModelLoader component */
export interface ModelLoaderProps {
  /** URL to the model file */
  url: string;
  /** Callback when loading completes */
  onLoad?: () => void;
  /** Callback on loading error */
  onError?: (error: Error) => void;
  /** Loading progress callback (0.0 - 1.0) */
  onProgress?: (progress: number) => void;
  /** Color scheme to apply */
  colorScheme?: ColorScheme;
}

/** Props for ViewerControls component */
export interface ViewerControlsProps {
  /** Current viewer state */
  viewerState: ViewerState;
  /** Callback when viewer state changes */
  onStateChange: (state: Partial<ViewerState>) => void;
  /** Available color schemes */
  availableSchemes?: ColorScheme[];
}

/** Props for ElementPicker component */
export interface ElementPickerProps {
  /** Callback when an element is picked */
  onPick: (element: BIMElementData | null) => void;
  /** Currently selected element */
  selectedElement?: BIMElementData | null;
  /** Enable/disable picking */
  enabled?: boolean;
}

/** Props for LayerManager component */
export interface LayerManagerProps {
  /** Currently visible layers */
  visibleLayers: ViewerLayer[];
  /** Callback when layers change */
  onLayersChange: (layers: ViewerLayer[]) => void;
}

/** Props for AnnotationOverlay component */
export interface AnnotationOverlayProps {
  /** Annotations to render */
  annotations: Annotation[];
  /** Callback when an annotation is clicked */
  onAnnotationClick?: (annotation: Annotation) => void;
  /** Whether annotations are visible */
  visible?: boolean;
}

// ---------------------------------------------------------------------------
// Zod Schemas (for runtime validation)
// ---------------------------------------------------------------------------

export const Vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const BoundingBoxSchema = z.object({
  min: Vector3Schema,
  max: Vector3Schema,
});

export const ModelMetadataSchema = z.object({
  name: z.string().min(1).max(255),
  format: z.enum(['IFC', 'IFC2x3', 'IFC4', 'IFC4x3', 'GLTF', 'GLB']),
  projectId: z.string().optional(),
  uploadedBy: z.string().optional(),
  tags: z.record(z.string()).optional(),
});

export const ClashDetectionOptionsSchema = z.object({
  softClashTolerance: z.number().min(0).max(10).optional(),
  clearanceDistance: z.number().min(0).max(50).optional(),
  crossSystemOnly: z.boolean().optional(),
  includeTypes: z.array(z.string()).optional(),
  excludeTypes: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default viewer layer visibility */
export const DEFAULT_VISIBLE_LAYERS: ViewerLayer[] = [
  'DESIGN',
  'CONSTRUCTION',
];

/** Default color scheme */
export const DEFAULT_COLOR_SCHEME: ColorScheme = 'DEFAULT';

/** Mapping of element types to building systems */
export const ELEMENT_SYSTEM_MAP: Record<BIMElementType, BuildingSystem> = {
  WALL: 'ARCHITECTURAL',
  SLAB: 'STRUCTURAL',
  COLUMN: 'STRUCTURAL',
  BEAM: 'STRUCTURAL',
  DOOR: 'ARCHITECTURAL',
  WINDOW: 'ARCHITECTURAL',
  STAIR: 'ARCHITECTURAL',
  ROOF: 'ARCHITECTURAL',
  RAILING: 'ARCHITECTURAL',
  FOOTING: 'STRUCTURAL',
  PILE: 'STRUCTURAL',
  PLATE: 'STRUCTURAL',
  CURTAIN_WALL: 'ARCHITECTURAL',
  COVERING: 'ARCHITECTURAL',
  MEMBER: 'STRUCTURAL',
  PIPE: 'PLUMBING',
  DUCT: 'MECHANICAL',
  CABLE_TRAY: 'ELECTRICAL',
  FITTING: 'MECHANICAL',
  FLOW_TERMINAL: 'MECHANICAL',
  DISTRIBUTION_ELEMENT: 'MECHANICAL',
  FURNISHING: 'ARCHITECTURAL',
  SPACE: 'ARCHITECTURAL',
  BUILDING_STOREY: 'ARCHITECTURAL',
  SITE: 'SITE_WORK',
  OTHER: 'OTHER',
};

/** Color palette for color schemes */
export const COLOR_PALETTE: Record<ColorScheme, Record<string, string>> = {
  DEFAULT: {
    primary: '#cccccc',
    secondary: '#999999',
    highlight: '#4488ff',
    selected: '#ff8844',
  },
  BY_STATUS: {
    EXISTING: '#888888',
    NEW: '#44cc44',
    DEMOLISHED: '#cc4444',
    TEMPORARY: '#cccc44',
    APPROVED: '#4488ff',
    REJECTED: '#ff4444',
    UNDER_REVIEW: '#ffaa44',
  },
  BY_TRADE: {
    STRUCTURAL: '#cc6644',
    ARCHITECTURAL: '#4488cc',
    MECHANICAL: '#44cc88',
    ELECTRICAL: '#cccc44',
    PLUMBING: '#8844cc',
    FIRE_PROTECTION: '#cc4444',
    SITE_WORK: '#88cc44',
    OTHER: '#888888',
  },
  BY_COST: {
    LOW: '#44cc44',
    MEDIUM: '#cccc44',
    HIGH: '#cc8844',
    VERY_HIGH: '#cc4444',
  },
  BY_SCHEDULE: {
    ON_TIME: '#44cc44',
    AT_RISK: '#cccc44',
    DELAYED: '#cc8844',
    CRITICAL: '#cc4444',
  },
  BY_HEALTH: {
    GOOD: '#44cc44',
    FAIR: '#cccc44',
    POOR: '#cc8844',
    CRITICAL: '#cc4444',
  },
};
