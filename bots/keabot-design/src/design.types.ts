/**
 * bots/keabot-design/src/design.types.ts
 *
 * DesignBot output types.
 */

// ─── Project context ──────────────────────────────────────────────────────────

export interface ProjectDesignContext {
  projectId:      string;
  projectName?:   string;
  projectType:    'residential' | 'multifamily' | 'commercial' | 'mixed_use' | 'adu';
  lotSqft?:       number;
  buildingSqft?:  number;
  stories?:       number;
  bedrooms?:      number;
  bathrooms?:     number;
  budget?:        number;
  location?:      string;
  zoning?:        string;
  style?:         string;
  programNotes?:  string;   // free-form: "open kitchen, 2-car garage, home office"
}

// ─── Design outputs ───────────────────────────────────────────────────────────

export interface ConceptLayout {
  summary:           string;
  zoningSummary:     string;
  programElements:   string[];      // rooms/spaces identified
  circulationNotes:  string;
  keyDesignMoves:    string[];
  constraints:       string[];
}

export interface FloorPlanSketch {
  description:       string;        // text description of the floor plan
  rooms: Array<{
    name:   string;
    sqft:   number;
    level:  number;
    notes?: string;
  }>;
  totalSqft:         number;
  efficiency:        number;         // net/gross ratio (0-1)
  textLayout:        string;        // ASCII-art style text representation
}

export interface SitePlacement {
  description:       string;
  setbacks:          string;
  buildingFootprint: string;
  parkingNotes:      string;
  accessNotes:       string;
  orientationNotes:  string;
  lotCoverageEst:    number;        // 0-1
}

export interface RoughElevation {
  facade:           'front' | 'rear' | 'left' | 'right';
  description:      string;
  heightFt:         number;
  keyFeatures:      string[];
  materialPalette:  string[];
}

export interface DesignPackage {
  projectId:        string;
  generatedAt:      string;
  tier:             'free' | 'architect_review' | 'full_design';
  conceptLayout:    ConceptLayout;
  floorPlanSketch:  FloorPlanSketch;
  sitePlacement:    SitePlacement;
  elevations:       RoughElevation[];
  designSummary:    string;
  estimateBotInput: EstimateBotInput;
  permitBotInput:   PermitBotInput;
}

// ─── Downstream bot inputs ────────────────────────────────────────────────────

export interface EstimateBotInput {
  buildingSqft:       number;
  stories:            number;
  projectType:        string;
  qualityLevel:       'economy' | 'standard' | 'premium' | 'luxury';
  programElements:    string[];
  materialPalette:    string[];
  location:           string;
  designComplexity:   'simple' | 'moderate' | 'complex';
}

export interface PermitBotInput {
  projectType:        string;
  buildingSqft:       number;
  stories:            number;
  location:           string;
  zoning:             string;
  hasAdu:             boolean;
  hasStructuralChanges: boolean;
  hasMepWork:         boolean;
  programElements:    string[];
}
