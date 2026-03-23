/**
 * API contract: generate floor plan variants from intake + capture data.
 * Returns 3 layout alternatives (A/B/C) + recommended variant.
 * Called by POST /api/concept/generate-floorplan
 */

import type { ConceptIntakeInput, FloorPlanJson, FloorPlanVariant, ProjectPath } from '../floorplan/types';
import { buildRoomGraph }         from '../floorplan/build-room-graph';
import { buildLayoutVariants }    from '../floorplan/build-layout-json';
import { renderSvgFloorplan }     from '../floorplan/render-svg-floorplan';

// All valid project paths (residential + commercial)
const VALID_PATHS: ProjectPath[] = [
  'kitchen_remodel', 'bathroom_remodel', 'interior_renovation',
  'whole_home_remodel', 'addition_expansion', 'exterior_concept',
  'capture_site_concept',
  'multi_unit_residential', 'mixed_use', 'commercial_office',
  'development_feasibility',
  'townhome_subdivision', 'single_family_subdivision', 'single_lot_development',
];

export interface GenerateFloorplanInput {
  intakeId:          string;
  projectPath:       string;
  projectId?:        string;
  twinId?:           string;
  captureSessionId?: string;
  // Intake form fields
  clientName:        string;
  contactEmail:      string;
  contactPhone?:     string;
  projectAddress:    string;
  budgetRange:       string;
  stylePreferences:  string[];
  goals?:            string[];
  knownConstraints?: string[];
  desiredMaterials?: string[];
  uploadedPhotos?:   string[];
  propertyUse?:      string;
  jurisdiction?:     string;
  timelineGoal?:     string;
  // Commercial / developer fields
  totalUnits?:       number;
  totalGfaSqFt?:     number;
  targetRoi?:        number;
  unitMixProgram?:   Record<string, number>; // { studio: 20, oneBr: 40, ... }
  // Enrichment from capture layer (optional)
  captureZones?:     string[];
  captureAssets?:    Array<{
    zone:           string;
    aiLabel?:       string;
    aiDescription?: string;
    aiTags?:        string[];
    systemCategory?:string;
  }>;
  voiceNoteTranscriptions?: string[];
  spatialNodes?: Array<{
    nodeType:    string;
    label:       string;
    properties?: Record<string, unknown>;
  }>;
}

export interface GenerateFloorplanResult {
  /** Primary (recommended) variant */
  floorplanId:   string;
  floorplanJson: FloorPlanJson;
  svgString:     string;
  totalAreaFt2:  number;
  roomCount:     number;
  layoutIssues:  string[];
  /** Score of recommended variant */
  score: {
    overallScore:       number;
    adjacencyScore:     number;
    naturalLightScore:  number;
    circulationScore:   number;
    spaceEfficiency:    number;
    codeCompliant:      boolean;
  };
  /** All 3 variants for comparison UI */
  variants:    FloorPlanVariant[];
  recommended: 'A' | 'B' | 'C';
}

export function generateFloorplan(input: GenerateFloorplanInput): GenerateFloorplanResult {
  const projectPath: ProjectPath = VALID_PATHS.includes(input.projectPath as ProjectPath)
    ? (input.projectPath as ProjectPath)
    : 'interior_renovation';

  const conceptInput: ConceptIntakeInput = {
    intakeId:        input.intakeId,
    projectPath,
    projectId:       input.projectId,
    twinId:          input.twinId,
    captureSessionId:input.captureSessionId,
    clientName:      input.clientName,
    contactEmail:    input.contactEmail,
    contactPhone:    input.contactPhone,
    projectAddress:  input.projectAddress,
    budgetRange:     input.budgetRange,
    stylePreferences:input.stylePreferences,
    goals:           input.goals,
    knownConstraints:input.knownConstraints,
    desiredMaterials:input.desiredMaterials,
    uploadedPhotos:  input.uploadedPhotos,
    propertyUse:     input.propertyUse,
    jurisdiction:    input.jurisdiction,
    timelineGoal:    input.timelineGoal,
    captureZones:    input.captureZones,
    captureAssets:   input.captureAssets,
    voiceNoteTranscriptions: input.voiceNoteTranscriptions,
    spatialNodes:    input.spatialNodes,
  };

  const graph = buildRoomGraph(conceptInput);
  const { variants, recommended } = buildLayoutVariants(graph, conceptInput);

  const rec = recommended;

  return {
    floorplanId:   rec.floorplanJson.id,
    floorplanJson: rec.floorplanJson,
    svgString:     rec.svgString,
    totalAreaFt2:  rec.floorplanJson.totalAreaFt2,
    roomCount:     rec.floorplanJson.rooms.length,
    layoutIssues:  rec.floorplanJson.layoutIssues,
    score: {
      overallScore:      rec.score.overallScore,
      adjacencyScore:    rec.score.adjacencyScore,
      naturalLightScore: rec.score.naturalLightScore,
      circulationScore:  rec.score.circulationScore,
      spaceEfficiency:   rec.score.spaceEfficiency,
      codeCompliant:     rec.score.codeCompliant,
    },
    variants,
    recommended: rec.variantId,
  };
}
