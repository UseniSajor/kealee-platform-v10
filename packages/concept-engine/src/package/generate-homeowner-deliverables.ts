/**
 * Assemble all concept engine outputs into the homeowner-facing deliverables package.
 * This becomes the `package_json` field in concept_packages table.
 */

import type { ConceptIntakeInput, FloorPlanJson } from '../floorplan/types';
import type { ConceptNarrative } from './generate-concept-narrative';
import type { ScopeDirection } from './generate-scope-direction';
import type { PermitPathNotes } from './generate-permit-path-notes';
import type { VisualPromptBundle } from '../visuals/build-visual-prompt-bundle';

export interface HomeownerDeliverables {
  version:     string;
  generatedAt: string;
  client: {
    name:        string;
    email:       string;
    phone?:      string;
    address:     string;
    propertyUse: string;
  };
  project: {
    path:             string;
    budgetRange:      string;
    stylePreferences: string[];
    goals:            string[];
    knownConstraints: string[];
    timeline?:        string;
  };
  floorPlan: {
    floorplanId:   string;
    totalAreaFt2:  number;
    roomCount:     number;
    rooms: Array<{
      label:   string;
      widthFt: number;
      depthFt: number;
      areaFt2: number;
    }>;
    layoutNotes: string[];
    svgUrl?:     string;
  };
  narrative: {
    projectSummary:    string;
    designIntent:      string;
    materialDirection: string;
    styleNarrative:    string;
    lifestyleAlignment:string;
    nextSteps:         string;
    rooms:             Record<string, string>;
  };
  scope: {
    totalEstimatedMin: number;
    totalEstimatedMax: number;
    budgetFitNote:     string;
    topRequiredTrades: string[];
    exclusions:        string[];
  };
  permit: {
    requiresPermit:          boolean;
    likelyPermits:           string[];
    likelyTradePermits:      string[];
    hoaReviewRequired:       boolean;
    estimatedTimeline:       string;
    estimatedCostRange:      [number, number];
    keyConsiderations:       string[];
    disclaimer:              string;
  };
  visuals: {
    midjourneyPrompts:       string[];
    stableDiffusionPrompts:  string[];
    descriptions:            string[];
    roomFocus:               string[];
    styleKeywords:           string[];
  };
  nextSteps: {
    recommendedService:  string;
    architectUpsell:     string;
    actionItems:         string[];
  };
}

export function assembleHomeownerDeliverables(opts: {
  input:       ConceptIntakeInput;
  floorplan:   FloorPlanJson;
  narrative:   ConceptNarrative;
  scope:       ScopeDirection;
  permit:      PermitPathNotes;
  visuals:     VisualPromptBundle;
  svgUrl?:     string;
}): HomeownerDeliverables {
  const { input, floorplan, narrative, scope, permit, visuals, svgUrl } = opts;

  const topRequired = scope.scopeItems
    .filter(i => i.priority === 'required')
    .slice(0, 5)
    .map(i => `${i.trade}: ${i.description}`);

  const recommendedService = input.projectPath === 'addition_expansion'
    ? 'Full Architectural Services — Schematic Design through Permit'
    : input.projectPath === 'whole_home_remodel'
    ? 'Design Development + Construction Documents'
    : 'Design Development Package';

  const architectUpsell =
    `To move from this concept to construction-ready drawings, a ${recommendedService} engagement ` +
    `with a Kealee platform architect is the recommended next step. ` +
    `This includes design refinement, structural coordination, permit drawings, and contractor procurement support.`;

  return {
    version:     '1.0',
    generatedAt: new Date().toISOString(),
    client: {
      name:        input.clientName,
      email:       input.contactEmail,
      phone:       input.contactPhone,
      address:     input.projectAddress,
      propertyUse: input.propertyUse ?? 'Primary Residence',
    },
    project: {
      path:             input.projectPath,
      budgetRange:      input.budgetRange,
      stylePreferences: input.stylePreferences,
      goals:            input.goals ?? [],
      knownConstraints: input.knownConstraints ?? [],
      timeline:         input.timelineGoal,
    },
    floorPlan: {
      floorplanId:  floorplan.id,
      totalAreaFt2: floorplan.totalAreaFt2,
      roomCount:    floorplan.rooms.length,
      rooms:        floorplan.rooms.map(r => ({
        label:   r.label,
        widthFt: r.widthFt,
        depthFt: r.depthFt,
        areaFt2: r.areaFt2,
      })),
      layoutNotes: floorplan.layoutIssues,
      svgUrl,
    },
    narrative: {
      projectSummary:    narrative.projectSummary,
      designIntent:      narrative.designIntent,
      materialDirection: narrative.materialDirection,
      styleNarrative:    narrative.styleNarrative,
      lifestyleAlignment:narrative.lifestyleAlignment,
      nextSteps:         narrative.nextSteps,
      rooms:             narrative.spaceBySpace,
    },
    scope: {
      totalEstimatedMin: scope.totalEstimatedMin,
      totalEstimatedMax: scope.totalEstimatedMax,
      budgetFitNote:     scope.budgetFitNote,
      topRequiredTrades: topRequired,
      exclusions:        scope.exclusions,
    },
    permit: {
      requiresPermit:     permit.requiresPermit,
      likelyPermits:      permit.likelyPermits,
      likelyTradePermits: permit.likelyTradePermits,
      hoaReviewRequired:  permit.hoaReviewRequired,
      estimatedTimeline:  permit.estimatedPermitTimeline,
      estimatedCostRange: permit.estimatedPermitCostRange,
      keyConsiderations:  permit.keyConsiderations,
      disclaimer:         permit.disclaimerNote,
    },
    visuals: {
      midjourneyPrompts:      visuals.midjourneyPrompts,
      stableDiffusionPrompts: visuals.stableDiffusionPrompts,
      descriptions:           visuals.descriptions,
      roomFocus:              visuals.roomFocus,
      styleKeywords:          visuals.styleKeywords,
    },
    nextSteps: {
      recommendedService,
      architectUpsell,
      actionItems: [
        'Review your concept floor plan and confirm room list with your architect.',
        'Prioritize scope items based on budget and lifestyle needs.',
        'Confirm HOA and permit requirements with your local jurisdiction.',
        'Schedule a Design Development kick-off with a Kealee platform architect.',
      ],
    },
  };
}
