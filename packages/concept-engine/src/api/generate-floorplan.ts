/**
 * API contract: generate a floor plan from intake + capture data.
 * Called by the API route POST /api/concept/generate-floorplan
 */

import type { ConceptIntakeInput, FloorPlanJson } from '../floorplan/types';
import { buildRoomGraph }      from '../floorplan/build-room-graph';
import { buildLayoutJson }     from '../floorplan/build-layout-json';
import { renderSvgFloorplan }  from '../floorplan/render-svg-floorplan';

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
  // Enrichment from capture layer (optional)
  captureZones?:     string[];
  captureAssets?:    Array<{
    zone:          string;
    aiLabel?:      string;
    aiDescription?:string;
    aiTags?:       string[];
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
  floorplanId:  string;
  floorplanJson:FloorPlanJson;
  svgString:    string;
  totalAreaFt2: number;
  roomCount:    number;
  layoutIssues: string[];
}

export function generateFloorplan(input: GenerateFloorplanInput): GenerateFloorplanResult {
  // Validate and cast project path
  const validPaths = [
    'kitchen_remodel', 'bathroom_remodel', 'interior_renovation',
    'whole_home_remodel', 'addition_expansion', 'exterior_concept',
    'capture_site_concept',
  ] as const;

  const projectPath = validPaths.includes(input.projectPath as typeof validPaths[number])
    ? (input.projectPath as ConceptIntakeInput['projectPath'])
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

  const graph          = buildRoomGraph(conceptInput);
  const { layout, json } = buildLayoutJson(graph, conceptInput);
  const svgString      = renderSvgFloorplan(layout);

  return {
    floorplanId:  json.id,
    floorplanJson:json,
    svgString,
    totalAreaFt2: json.totalAreaFt2,
    roomCount:    json.rooms.length,
    layoutIssues: json.layoutIssues,
  };
}
