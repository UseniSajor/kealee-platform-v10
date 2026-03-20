import { createInitialState, detectMissingFields } from "./state";
import type { ExteriorConceptState } from "./types";
import {
  analyzeUploadedPhotos,
  buildClientConceptPackageDraft,
  classifyProjectComplexity,
  createIntakeRecord,
  fetchPropertyContext,
  generateDesignBrief,
  generateExteriorConceptImages,
  generateLandscapeConceptImages,
  generatePermitPathSummary,
  routeToCommandCenterReview,
  updateIntakeRecord,
} from "./tools";

// @langchain/core 1.x tool.invoke() returns a complex union type that TypeScript
// cannot resolve. This helper casts cleanly.
function inv<T>(t: { invoke: (i: unknown) => unknown }, input: unknown): Promise<T> {
  return (t.invoke as (i: unknown) => Promise<T>)(input);
}

export async function collectIntake(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const missingFields = detectMissingFields(state.intakeData);
  return {
    missingFields,
    status: missingFields.length ? "COLLECTING_INFO" : "ANALYZING_SITE",
  };
}

export async function createOrUpdateIntake(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  if (!state.intakeId) {
    const created = await inv<{ intakeId: string }>(createIntakeRecord, {
      clientName: state.intakeData.clientName!,
      contactEmail: state.intakeData.contactEmail!,
      contactPhone: state.intakeData.contactPhone,
      projectAddress: state.intakeData.projectAddress!,
      projectType: state.intakeData.projectType!,
    });
    return { intakeId: created.intakeId };
  }

  await inv<unknown>(updateIntakeRecord, {
    intakeId: state.intakeId,
    fields: state.intakeData,
  });
  return {};
}

export async function fetchPropertyContextNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const ctx = await inv<ExteriorConceptState["siteContext"] & { jurisdiction: string }>(fetchPropertyContext, {
    projectAddress: state.intakeData.projectAddress!,
  });
  return {
    siteContext: ctx,
    intakeData: { ...state.intakeData, jurisdiction: ctx.jurisdiction },
    status: "ANALYZING_SITE",
  };
}

export async function analyzePhotosNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const result = await inv<NonNullable<ExteriorConceptState["visionAnalysis"]>>(analyzeUploadedPhotos, {
    intakeId: state.intakeId!,
    photoUrls: state.intakeData.uploadedPhotos ?? [],
  });
  return { visionAnalysis: result };
}

export async function classifyComplexityNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const result = await inv<{ projectComplexity: NonNullable<ExteriorConceptState["projectComplexity"]>; humanReviewRequired: boolean }>(classifyProjectComplexity, {
    projectType: state.intakeData.projectType!,
    propertyUse: state.intakeData.propertyUse ?? "residential",
    goals: state.intakeData.goals ?? [],
    visionAnalysis: { confidence: state.visionAnalysis?.confidence ?? 0.5 },
    knownConstraints: state.intakeData.knownConstraints ?? [],
  });
  return {
    projectComplexity: result.projectComplexity,
    humanReviewRequired: result.humanReviewRequired,
  };
}

export async function routeReviewEarlyNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  await inv<unknown>(routeToCommandCenterReview, {
    intakeId: state.intakeId!,
    reviewReason: "EARLY_COMPLEXITY_REVIEW",
    priority: "HIGH",
  });
  return { status: "READY_FOR_PM_REVIEW" };
}

export async function awaitHumanInputNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  if (state.humanDecision?.action === "approve") return { status: "GENERATING_BRIEF" };
  if (state.humanDecision?.action === "request_info") return { status: "WAITING_FOR_CLIENT" };
  return { status: "ESCALATED_MANUAL" };
}

export async function generateDesignBriefNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const brief = await inv<NonNullable<ExteriorConceptState["designBrief"]>>(generateDesignBrief, {
    intakeId: state.intakeId!,
    projectSummary: `${state.intakeData.projectType} at ${state.intakeData.projectAddress}. Goals: ${(state.intakeData.goals ?? []).join(", ")}`,
    stylePreferences: state.intakeData.stylePreferences ?? [],
    desiredMaterials: state.intakeData.desiredMaterials ?? [],
    preferredColorPalette: state.intakeData.preferredColorPalette ?? [],
    visionAnalysis: state.visionAnalysis ?? {},
    siteContext: state.siteContext ?? {},
    budgetRange: state.intakeData.budgetRange!,
  });
  return { designBrief: brief, status: "GENERATING_BRIEF" };
}

export async function generateExteriorVisualsNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const result = await inv<{ images: string[] }>(generateExteriorConceptImages, {
    intakeId: state.intakeId!,
    designBriefId: state.designBrief!.id,
    variations: 3,
    imageStyle: "photoreal",
    preserveStructure: true,
  });
  return { exteriorConceptImages: result.images, status: "GENERATING_VISUALS" };
}

export async function generateLandscapeVisualsNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const result = await inv<{ images: string[] }>(generateLandscapeConceptImages, {
    intakeId: state.intakeId!,
    designBriefId: state.designBrief!.id,
    zones: ["front-yard", "foundation"],
    variations: 2,
  });
  return { landscapeConceptImages: result.images };
}

export async function generatePermitPathNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const permitPath = await inv<NonNullable<ExteriorConceptState["permitPathSummary"]>>(generatePermitPathSummary, {
    projectAddress: state.intakeData.projectAddress!,
    jurisdiction: state.intakeData.jurisdiction,
    projectType: state.intakeData.projectType!,
    propertyUse: state.intakeData.propertyUse ?? "residential",
    projectComplexity: state.projectComplexity ?? "low",
    knownConstraints: state.intakeData.knownConstraints ?? [],
  });
  return { permitPathSummary: permitPath };
}

export async function buildPackageDraftNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const draft = await inv<{ packageDraftId: string }>(buildClientConceptPackageDraft, {
    intakeId: state.intakeId!,
    designBriefId: state.designBrief!.id,
    exteriorImages: state.exteriorConceptImages ?? [],
    landscapeImages: state.landscapeConceptImages ?? [],
    permitPathSummary: state.permitPathSummary ?? {},
  });
  return { packageDraftId: draft.packageDraftId, status: "READY_FOR_PM_REVIEW" };
}

export async function routeFinalReviewNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  await inv<unknown>(routeToCommandCenterReview, {
    intakeId: state.intakeId!,
    reviewReason: "FINAL_QA_REVIEW",
    priority: "NORMAL",
  });
  return { status: "READY_FOR_PM_REVIEW" };
}

export async function awaitFinalDecisionNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  switch (state.humanDecision?.action) {
    case "approve": return { status: "APPROVED_FOR_DELIVERY" };
    case "request_info": return { status: "WAITING_FOR_CLIENT" };
    case "regenerate_exterior": return { status: "GENERATING_VISUALS" };
    case "regenerate_landscape": return { status: "GENERATING_VISUALS" };
    case "manual": return { status: "ESCALATED_MANUAL" };
    default: return { status: "NEEDS_REVISION" };
  }
}

export async function approvedNode(): Promise<Partial<ExteriorConceptState>> {
  return { status: "APPROVED_FOR_DELIVERY" };
}

export async function failedNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  return { status: "FAILED", errors: [...(state.errors ?? []), "Workflow failed"] };
}

function merge(state: ExteriorConceptState, patch: Partial<ExteriorConceptState>): ExteriorConceptState {
  return { ...state, ...patch };
}

export async function runExteriorConceptGraph(
  input: Partial<ExteriorConceptState>,
): Promise<ExteriorConceptState> {
  let state = createInitialState(input);

  // Step 1: validate intake
  state = merge(state, await collectIntake(state));
  if (state.missingFields.length > 0) return state;

  // Step 2: persist intake record
  state = merge(state, await createOrUpdateIntake(state));

  // Step 3: fetch property context
  state = merge(state, await fetchPropertyContextNode(state));

  // Step 4: analyze photos (no-op if none uploaded)
  state = merge(state, await analyzePhotosNode(state));

  // Step 5: classify complexity
  state = merge(state, await classifyComplexityNode(state));

  // Step 6: early human review path for complex projects
  if (state.humanReviewRequired) {
    state = merge(state, await routeReviewEarlyNode(state));
    // Human decision is resolved externally; if not yet provided, stop here
    if (!state.humanDecision || state.humanDecision.action !== "approve") {
      return state;
    }
  }

  // Step 7: generate design brief
  state = merge(state, await generateDesignBriefNode(state));

  // Step 8: generate visuals (exterior + landscape in parallel)
  const [exteriorPatch, landscapePatch] = await Promise.all([
    generateExteriorVisualsNode(state),
    generateLandscapeVisualsNode(state),
  ]);
  state = merge(merge(state, exteriorPatch), landscapePatch);

  // Step 9: permit path
  state = merge(state, await generatePermitPathNode(state));

  // Step 10: build draft package
  state = merge(state, await buildPackageDraftNode(state));

  // Step 11: route for final review
  state = merge(state, await routeFinalReviewNode(state));

  // Step 12: await final decision (resolved externally on re-invoke)
  state = merge(state, await awaitFinalDecisionNode(state));

  if (state.status === "APPROVED_FOR_DELIVERY") {
    state = merge(state, await approvedNode());
  }

  return state;
}
