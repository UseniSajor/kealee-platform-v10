/**
 * Concept Engine — Floor Plan Types
 * Supports all six project paths. Not a BIM replacement.
 */

// ── Residential project paths ────────────────────────────────────────────────
export type ResidentialProjectPath =
  | 'kitchen_remodel'
  | 'bathroom_remodel'
  | 'interior_renovation'
  | 'whole_home_remodel'
  | 'addition_expansion'
  | 'exterior_concept'
  | 'capture_site_concept';

// ── Commercial project paths (developer / investor) ───────────────────────────
export type CommercialProjectPath =
  | 'multi_unit_residential'
  | 'mixed_use'
  | 'commercial_office'
  | 'development_feasibility'
  | 'townhome_subdivision'
  | 'single_family_subdivision'
  | 'single_lot_development';

export type ProjectPath = ResidentialProjectPath | CommercialProjectPath;

export type RoomType =
  | 'kitchen'
  | 'dining'
  | 'living'
  | 'pantry'
  | 'primary_bedroom'
  | 'secondary_bedroom'
  | 'primary_bathroom'
  | 'secondary_bathroom'
  | 'powder_room'
  | 'laundry'
  | 'hallway'
  | 'garage'
  | 'mudroom'
  | 'office'
  | 'flex_room'
  | 'addition_room'
  | 'connecting_hall'
  | 'front_yard'
  | 'rear_yard'
  | 'side_yard'
  | 'driveway'
  | 'porch'
  | 'deck'
  | 'covered_patio'
  | 'utility';

export interface RoomDimensions {
  widthFt: number;
  depthFt: number;
  areaFt2: number;
}

export interface RoomNode {
  id: string;
  type: RoomType;
  label: string;
  dimensions: RoomDimensions;
  captureZone?: string;
  aiLabel?: string;
  aiDescription?: string;
  notes?: string;
  issues?: string[];
  // Set during layout phase
  x?: number;
  y?: number;
  placed?: boolean;
}

export interface RoomEdge {
  fromId: string;
  toId: string;
  adjacencyType: 'direct' | 'nearby' | 'through_hall';
  weight: number; // 1 = strong, 0 = optional
}

export interface RoomGraph {
  rooms: RoomNode[];
  edges: RoomEdge[];
  projectPath: ProjectPath;
}

export interface FloorPlanLayout {
  rooms: RoomNode[];
  totalWidthFt: number;
  totalDepthFt: number;
  scale: number; // pixels per foot
  layoutIssues: string[];
}

export interface FloorPlanRoom {
  id: string;
  type: RoomType;
  label: string;
  widthFt: number;
  depthFt: number;
  areaFt2: number;
  x: number;
  y: number;
  captureZone?: string;
  notes?: string;
  issues?: string[];
}

export interface FloorPlanJson {
  id: string;
  intakeId: string;
  projectPath: ProjectPath;
  version: number;
  rooms: FloorPlanRoom[];
  adjacencies: Array<{ from: string; to: string; type: string }>;
  totalAreaFt2: number;
  totalWidthFt: number;
  totalDepthFt: number;
  layoutIssues: string[];
  generatedAt: string;
}

// ── Layout scoring (output of optimizer) ────────────────────────────────────

export interface LayoutScore {
  overallScore: number;       // 0–100 composite
  adjacencyScore: number;     // % of adjacency requirements satisfied
  naturalLightScore: number;  // avg light score for habitable rooms
  circulationScore: number;   // 0–100 flow score
  spaceEfficiency: number;    // usable area / footprint %
  codeCompliant: boolean;
  codeViolations: string[];
}

export interface FloorPlanVariant {
  variantId: 'A' | 'B' | 'C';
  variantLabel: string;       // "Open Flow" | "Private & Defined" | "Efficient"
  floorplanJson: FloorPlanJson;
  svgString: string;
  score: LayoutScore;
  primaryDifferentiator: string;
}

// ── Intake input passed into the concept engine ─────────────────────────────

export interface CaptureAssetSummary {
  zone: string;
  aiLabel?: string;
  aiDescription?: string;
  aiTags?: string[];
  systemCategory?: string;
}

export interface SpatialNodeSummary {
  nodeType: string;
  label: string;
  properties?: Record<string, unknown>;
}

export interface ConceptIntakeInput {
  intakeId: string;
  projectPath: ProjectPath;
  projectId?: string;
  twinId?: string;
  captureSessionId?: string;
  // From intake form
  clientName: string;
  contactEmail: string;
  contactPhone?: string;
  projectAddress: string;
  budgetRange: string;
  stylePreferences: string[];
  goals?: string[];
  knownConstraints?: string[];
  desiredMaterials?: string[];
  preferredColorPalette?: string[];
  uploadedPhotos?: string[];
  propertyUse?: string;
  jurisdiction?: string;
  timelineGoal?: string;
  // From capture session (optional, enriches the floor plan)
  captureZones?: string[];
  captureAssets?: CaptureAssetSummary[];
  voiceNoteTranscriptions?: string[];
  // From property twin spatial nodes (optional)
  spatialNodes?: SpatialNodeSummary[];
}
