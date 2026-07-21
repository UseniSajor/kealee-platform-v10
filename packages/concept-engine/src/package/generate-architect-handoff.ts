/**
 * Generate the architect handoff payload.
 * This is the structured bundle passed to a platform architect for review, refinement, and upsell.
 * Stored as `architect_handoff_json` in concept_packages table.
 */

import type { ConceptIntakeInput, FloorPlanJson } from '../floorplan/types';
import type { ConceptNarrative } from './generate-concept-narrative';
import type { ScopeDirection } from './generate-scope-direction';
import type { PermitPathNotes } from './generate-permit-path-notes';
import type { VisualPromptBundle } from '../visuals/build-visual-prompt-bundle';

export type RevisionStatus = 'initial' | 'revision_1' | 'revision_2' | 'approved';

export type RecommendedService =
  | 'design_development'
  | 'schematic_design'
  | 'permit_expediting'
  | 'full_architecture';

export interface ArchitectHandoff {
  version:         string;
  generatedAt:     string;
  revisionStatus:  RevisionStatus;

  // Identification
  intakeId:          string;
  projectId?:        string;
  twinId?:           string;
  captureSessionId?: string;
  conceptPackageId?: string;

  // Client
  client: {
    name:        string;
    email:       string;
    phone?:      string;
    address:     string;
    propertyUse: string;
    jurisdiction?: string;
  };

  // Project
  project: {
    path:             string;
    budgetRange:      string;
    stylePreferences: string[];
    goals:            string[];
    knownConstraints: string[];
    timeline?:        string;
    uploadedPhotos:   string[];
  };

  // Floor plan
  floorplan:  FloorPlanJson;
  svgUrl?:    string;

  // Concept outputs
  narrative:      ConceptNarrative;
  scopeDirection: ScopeDirection;
  permitPath:     PermitPathNotes;
  visualPrompts:  VisualPromptBundle;

  // Architect analysis fields
  flaggedUncertainties: string[];
  layoutIssues:         string[];
  reviewNotes?:         string;

  // Routing
  recommendedService: RecommendedService;
  upsellNotes:        string;

  // Architect review lifecycle (set by platform, not generator)
  assignedArchitect?: string;
  reviewStatus:       'pending' | 'in_review' | 'changes_requested' | 'approved';
  architectSignoff?:  string; // ISO date string
}

export function generateArchitectHandoff(opts: {
  input:            ConceptIntakeInput;
  floorplan:        FloorPlanJson;
  narrative:        ConceptNarrative;
  scope:            ScopeDirection;
  permit:           PermitPathNotes;
  visuals:          VisualPromptBundle;
  svgUrl?:          string;
  conceptPackageId?:string;
}): ArchitectHandoff {
  const { input, floorplan, narrative, scope, permit, visuals, svgUrl, conceptPackageId } = opts;

  // Auto-detect uncertainties for architect attention
  const flaggedUncertainties: string[] = [];

  if (!input.uploadedPhotos?.length) {
    flaggedUncertainties.push('No property photos provided — site conditions unknown. Request photo capture before design development.');
  }
  if (!input.captureSessionId) {
    flaggedUncertainties.push('No mobile capture session linked — room conditions unverified. Consider requesting capture before finalizing scope.');
  }
  if (input.projectPath === 'addition_expansion') {
    flaggedUncertainties.push('Addition requires zoning setback verification, lot coverage analysis, and structural engineering before schematic design can begin.');
  }
  if (permit.historicReviewPossible) {
    flaggedUncertainties.push('Potential historic district overlay — confirm with local preservation office before exterior changes.');
  }
  if (permit.hoaReviewRequired) {
    flaggedUncertainties.push('HOA approval required — obtain current HOA guidelines before design development.');
  }
  if ((input.knownConstraints ?? []).length > 0) {
    flaggedUncertainties.push(`Known constraints flagged by client: ${input.knownConstraints!.join('; ')}`);
  }
  if (floorplan.layoutIssues.length > 0) {
    flaggedUncertainties.push(`Floor plan layout notes require architect review: ${floorplan.layoutIssues.join('; ')}`);
  }
  if (scope.totalEstimatedMin > 150000) {
    flaggedUncertainties.push('Large-scope project — recommend full architectural services rather than design development alone.');
  }

  const recommendedService = inferRecommendedService(input.projectPath, scope);

  const upsellNotes = buildUpsellNotes(recommendedService, input.projectPath);

  return {
    version:        '1.0',
    generatedAt:    new Date().toISOString(),
    revisionStatus: 'initial',
    reviewStatus:   'pending',

    intakeId:          input.intakeId,
    projectId:         input.projectId,
    twinId:            input.twinId,
    captureSessionId:  input.captureSessionId,
    conceptPackageId,

    client: {
      name:         input.clientName,
      email:        input.contactEmail,
      phone:        input.contactPhone,
      address:      input.projectAddress,
      propertyUse:  input.propertyUse ?? 'Primary Residence',
      jurisdiction: input.jurisdiction,
    },

    project: {
      path:             input.projectPath,
      budgetRange:      input.budgetRange,
      stylePreferences: input.stylePreferences,
      goals:            input.goals ?? [],
      knownConstraints: input.knownConstraints ?? [],
      timeline:         input.timelineGoal,
      uploadedPhotos:   input.uploadedPhotos ?? [],
    },

    floorplan,
    svgUrl,
    narrative,
    scopeDirection: scope,
    permitPath:     permit,
    visualPrompts:  visuals,

    flaggedUncertainties,
    layoutIssues:         floorplan.layoutIssues,

    recommendedService,
    upsellNotes,
  };
}

function inferRecommendedService(
  path: string,
  scope: ScopeDirection,
): RecommendedService {
  if (path === 'addition_expansion') return 'full_architecture';
  if (path === 'whole_home_remodel') return 'schematic_design';
  if (scope.totalEstimatedMin > 100000) return 'schematic_design';
  if (path === 'exterior_concept' && scope.totalEstimatedMin < 30000) return 'permit_expediting';
  return 'design_development';
}

function buildUpsellNotes(service: RecommendedService, path: string): string {
  const pathLabel = path.replace(/_/g, ' ');
  switch (service) {
    case 'full_architecture':
      return `This ${pathLabel} is a complex project requiring full architectural services: site analysis, ` +
        `schematic design, design development, construction documents, permit coordination, ` +
        `and construction administration. Recommend full-service engagement.`;
    case 'schematic_design':
      return `This ${pathLabel} warrants a Schematic Design engagement: initial layout studies, ` +
        `design development refinement, and construction documents for permit and bidding.`;
    case 'permit_expediting':
      return `For this scope, a Permit Expediting service may be sufficient — preparing permit drawings ` +
        `and coordinating submissions without a full design development phase.`;
    case 'design_development':
    default:
      return `A Design Development Package is the recommended next step for this ${pathLabel}: ` +
        `refining this concept into dimensioned drawings, material specifications, and permit-ready documents ` +
        `with one revision round included.`;
  }
}
