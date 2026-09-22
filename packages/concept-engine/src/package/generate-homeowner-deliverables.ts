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
    address?:         string;
  };
  floorPlan: {
    floorplanId:   string;
    totalAreaFt2:  number;
    roomCount:     number;
    totalWidthFt?: number;
    totalDepthFt?: number;
    rooms: Array<{
      label:   string;
      widthFt: number;
      depthFt: number;
      areaFt2: number;
      type?:   string;
    }>;
    layoutNotes:   string[];
    layoutIssues?: string[];
    svgUrl?:       string;
  };
  narrative: {
    projectSummary:    string;
    designIntent:      string;
    materialDirection: string;
    styleNarrative:    string;
    lifestyleAlignment:string;
    nextSteps:         string;
    rooms:             Record<string, string>;
    spaceBySpace?:     Record<string, string>;
  };
  scope: {
    totalEstimatedMin: number;
    totalEstimatedMax: number;
    budgetFitNote:     string;
    topRequiredTrades: string[];
    exclusions:        string[];
    lineItems?:        Array<{ trade?: string; description?: string; estimatedLow?: string; estimatedHigh?: string }>;
    estimatedTotal?:   string;
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
  permitPath?: {
    requiresPermit:          boolean;
    likelyPermits:           string[];
    estimatedTimeline:       string;
    estimatedCost?:          string;
    permits?:                string[];
    tradeLicenses?:          string[];
    structuralReviewRequired?: boolean;
    designReviewRequired?:   boolean;
    notes:                   string[];
    disclaimer:              string;
  };
  visuals: {
    midjourneyPrompts:       string[];
    stableDiffusionPrompts:  string[];
    descriptions:            string[];
    roomFocus:               string[];
    styleKeywords:           string[];
    materialKeywords?:       string[];
    paletteSuggestion?:      string;
    lightingDirection?:      string;
    cameraGuidance?:         string;
    consistencyNotes?:       string[];
  };
  nextSteps: {
    recommendedService:  string;
    architectUpsell:     string;
    actionItems:         string[];
  };

  // ── The purchaser-facing package (docs/system/concept-package-deliverables.md) ──
  // Optional so packages generated before 2026-09-22 still render; the PDF
  // follows the purchaser order whenever these are present.

  /** 2. What exists today — the customer's photographs and their own account of the existing conditions. */
  existingConditions?: {
    summary:     string;
    mustStay:    string[];
    problems:    string[];
    photos: Array<{ url: string; label: string; area?: string; viewpoint?: string; kind: 'photo' | 'video' | 'document' }>;
  };
  /** 3. Three (or more) concept directions — clear alternatives; one is flagged recommended. */
  conceptDirections?: Array<{
    id:            string;
    name:          string;
    description:   string;
    styleMatch:    number;
    estimatedCost: number;
    materials:     string[];
    keyFeatures:   string[];
    recommended:   boolean;
  }>;
  /** 4. Why the recommended direction is recommended, in the customer's terms. */
  recommendation?: { conceptName: string; rationale: string[]; costRange: [number, number]; nextStep: string };
  /** 7. Before/after — an after view rendered from the customer's photograph with the camera locked to it. */
  beforeAfterPairs?: Array<{ beforeUrl: string; afterUrl: string; label: string; area?: string; viewpoint?: string }>;
  /** 8. Materials palette — labeled selections. */
  materialsPalette?: Array<{ item: string; selection: string; note?: string }>;
  /** 9. Site and zoning snapshot — every factual claim names its source and confidence. */
  siteZoning?: {
    claims: Array<{ claim: string; value: string; source: string; confidence: 'verified' | 'high' | 'medium' | 'low'; status: 'existing' | 'proposed' | 'requires-verification' }>;
    disclaimer: string;
  };
  /** Status of the package as a whole — printed as stamps. */
  packageStatus?: {
    professionallyReviewed: { by: string; state: string; at: string } | null;
    approvedByCustomer:     { at: string } | null;
    generation:             number;
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
    `with a Kealee platform design professional is the recommended next step. ` +
    `This includes design refinement, structural coordination, permit drawings (permits included), and contractor procurement support.`;

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
      totalWidthFt: floorplan.totalWidthFt,
      totalDepthFt: floorplan.totalDepthFt,
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
      spaceBySpace:      narrative.spaceBySpace,
    },
    scope: {
      totalEstimatedMin: scope.totalEstimatedMin,
      totalEstimatedMax: scope.totalEstimatedMax,
      budgetFitNote:     scope.budgetFitNote,
      topRequiredTrades: topRequired,
      exclusions:        scope.exclusions,
      lineItems:         scope.scopeItems.map(i => ({
        trade:         i.trade,
        description:   i.description,
        estimatedLow:  `$${i.estimatedCostRange[0].toLocaleString()}`,
        estimatedHigh: `$${i.estimatedCostRange[1].toLocaleString()}`,
      })),
      estimatedTotal: `$${scope.totalEstimatedMin.toLocaleString()} – $${scope.totalEstimatedMax.toLocaleString()}`,
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
    permitPath: {
      requiresPermit:          permit.requiresPermit,
      likelyPermits:           permit.likelyPermits,
      estimatedTimeline:       permit.estimatedPermitTimeline,
      estimatedCost:           `$${permit.estimatedPermitCostRange[0].toLocaleString()} – $${permit.estimatedPermitCostRange[1].toLocaleString()}`,
      permits:                 permit.likelyPermits,
      tradeLicenses:           permit.likelyTradePermits,
      structuralReviewRequired:input.projectPath === 'addition_expansion' || input.projectPath === 'whole_home_remodel',
      designReviewRequired:    permit.designReviewRequired,
      notes:                   permit.keyConsiderations,
      disclaimer:              permit.disclaimerNote,
    },
    visuals: {
      midjourneyPrompts:      visuals.midjourneyPrompts,
      stableDiffusionPrompts: visuals.stableDiffusionPrompts,
      descriptions:           visuals.descriptions,
      roomFocus:              visuals.roomFocus,
      styleKeywords:          visuals.styleKeywords,
      materialKeywords:       visuals.materialKeywords,
      paletteSuggestion:      visuals.paletteSuggestion,
      lightingDirection:      visuals.lightingDirection,
      cameraGuidance:         visuals.cameraGuidance,
      consistencyNotes:       visuals.consistencyNotes,
    },
    nextSteps: {
      recommendedService,
      architectUpsell,
      actionItems: [
        'Review your concept floor plan and confirm room list with your design professional.',
        'Prioritize scope items based on budget and lifestyle needs.',
        'Confirm HOA and permit requirements with your local jurisdiction.',
        'Schedule a Design Development kick-off with a Kealee platform design professional.',
      ],
    },
  };
}
