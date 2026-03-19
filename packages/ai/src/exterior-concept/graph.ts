import { Annotation, StateGraph } from "@langchain/langgraph";
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

const GraphState = Annotation.Root<ExteriorConceptState>({
  intakeId: Annotation<string | undefined>(),
  userMessageHistory: Annotation<Array<{ role: "user" | "assistant"; content: string }>>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  intakeData: Annotation<ExteriorConceptState["intakeData"]>({
    reducer: (_x, y) => y,
    default: () => ({}),
  }),
  missingFields: Annotation<string[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  siteContext: Annotation<ExteriorConceptState["siteContext"] | undefined>(),
  visionAnalysis: Annotation<ExteriorConceptState["visionAnalysis"] | undefined>(),
  projectComplexity: Annotation<ExteriorConceptState["projectComplexity"] | undefined>(),
  humanReviewRequired: Annotation<boolean>({
    reducer: (_x, y) => y,
    default: () => false,
  }),
  designBrief: Annotation<ExteriorConceptState["designBrief"] | undefined>(),
  exteriorConceptImages: Annotation<string[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  landscapeConceptImages: Annotation<string[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  permitPathSummary: Annotation<ExteriorConceptState["permitPathSummary"] | undefined>(),
  packageDraftId: Annotation<string | undefined>(),
  status: Annotation<ExteriorConceptState["status"]>({
    reducer: (_x, y) => y,
    default: () => "NEW",
  }),
  humanDecision: Annotation<ExteriorConceptState["humanDecision"] | undefined>(),
  errors: Annotation<string[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
});

export async function collectIntake(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const missingFields = detectMissingFields(state.intakeData);
  return {
    missingFields,
    status: missingFields.length ? "COLLECTING_INFO" : "ANALYZING_SITE",
  };
}

export async function createOrUpdateIntake(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  if (!state.intakeId) {
    const created = await createIntakeRecord.invoke({
      clientName: state.intakeData.clientName!,
      contactEmail: state.intakeData.contactEmail!,
      contactPhone: state.intakeData.contactPhone,
      projectAddress: state.intakeData.projectAddress!,
      projectType: state.intakeData.projectType!,
    });
    return { intakeId: created.intakeId };
  }

  await updateIntakeRecord.invoke({
    intakeId: state.intakeId,
    fields: state.intakeData,
  });
  return {};
}

export async function fetchPropertyContextNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const ctx = await fetchPropertyContext.invoke({
    projectAddress: state.intakeData.projectAddress!,
  });
  return {
    siteContext: ctx,
    intakeData: { ...state.intakeData, jurisdiction: ctx.jurisdiction },
    status: "ANALYZING_SITE",
  };
}

export async function analyzePhotosNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const result = await analyzeUploadedPhotos.invoke({
    intakeId: state.intakeId!,
    photoUrls: state.intakeData.uploadedPhotos!,
  });
  return { visionAnalysis: result };
}

export async function classifyComplexityNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const result = await classifyProjectComplexity.invoke({
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
  await routeToCommandCenterReview.invoke({
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
  const brief = await generateDesignBrief.invoke({
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
  const result = await generateExteriorConceptImages.invoke({
    intakeId: state.intakeId!,
    designBriefId: state.designBrief!.id,
    variations: 3,
    imageStyle: "photoreal",
    preserveStructure: true,
  });
  return { exteriorConceptImages: result.images, status: "GENERATING_VISUALS" };
}

export async function generateLandscapeVisualsNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const result = await generateLandscapeConceptImages.invoke({
    intakeId: state.intakeId!,
    designBriefId: state.designBrief!.id,
    zones: ["front-yard", "foundation"],
    variations: 2,
  });
  return { landscapeConceptImages: result.images };
}

export async function generatePermitPathNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  const permitPath = await generatePermitPathSummary.invoke({
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
  const draft = await buildClientConceptPackageDraft.invoke({
    intakeId: state.intakeId!,
    designBriefId: state.designBrief!.id,
    exteriorImages: state.exteriorConceptImages ?? [],
    landscapeImages: state.landscapeConceptImages ?? [],
    permitPathSummary: state.permitPathSummary ?? {},
  });
  return { packageDraftId: draft.packageDraftId, status: "READY_FOR_PM_REVIEW" };
}

export async function routeFinalReviewNode(state: ExteriorConceptState): Promise<Partial<ExteriorConceptState>> {
  await routeToCommandCenterReview.invoke({
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

export function compileGraph() {
  const graph = new StateGraph(GraphState)
    .addNode("collectIntake", collectIntake)
    .addNode("createOrUpdateIntake", createOrUpdateIntake)
    .addNode("fetchPropertyContext", fetchPropertyContextNode)
    .addNode("analyzePhotos", analyzePhotosNode)
    .addNode("classifyComplexity", classifyComplexityNode)
    .addNode("routeReviewEarly", routeReviewEarlyNode)
    .addNode("awaitHumanInput", awaitHumanInputNode)
    .addNode("generateDesignBrief", generateDesignBriefNode)
    .addNode("generateExteriorVisuals", generateExteriorVisualsNode)
    .addNode("generateLandscapeVisuals", generateLandscapeVisualsNode)
    .addNode("generatePermitPath", generatePermitPathNode)
    .addNode("buildPackageDraft", buildPackageDraftNode)
    .addNode("routeFinalReview", routeFinalReviewNode)
    .addNode("awaitFinalDecision", awaitFinalDecisionNode)
    .addNode("approved", approvedNode)
    .addNode("failed", failedNode)
    .addEdge("__start__", "collectIntake")
    .addConditionalEdges("collectIntake", (state) => {
      if (state.missingFields.length > 0) return "__end__";
      return "createOrUpdateIntake";
    })
    .addEdge("createOrUpdateIntake", "fetchPropertyContext")
    .addEdge("fetchPropertyContext", "analyzePhotos")
    .addEdge("analyzePhotos", "classifyComplexity")
    .addConditionalEdges("classifyComplexity", (state) => {
      return state.humanReviewRequired ? "routeReviewEarly" : "generateDesignBrief";
    })
    .addEdge("routeReviewEarly", "awaitHumanInput")
    .addConditionalEdges("awaitHumanInput", (state) => {
      if (state.status === "GENERATING_BRIEF") return "generateDesignBrief";
      return "__end__";
    })
    .addEdge("generateDesignBrief", "generateExteriorVisuals")
    .addEdge("generateExteriorVisuals", "generateLandscapeVisuals")
    .addEdge("generateLandscapeVisuals", "generatePermitPath")
    .addEdge("generatePermitPath", "buildPackageDraft")
    .addEdge("buildPackageDraft", "routeFinalReview")
    .addEdge("routeFinalReview", "awaitFinalDecision")
    .addConditionalEdges("awaitFinalDecision", (state) => {
      if (state.status === "APPROVED_FOR_DELIVERY") return "approved";
      if (state.humanDecision?.action === "regenerate_exterior") return "generateExteriorVisuals";
      if (state.humanDecision?.action === "regenerate_landscape") return "generateLandscapeVisuals";
      return "__end__";
    })
    .addEdge("approved", "__end__");

  return graph.compile();
}

export async function runExteriorConceptGraph(input: Partial<ExteriorConceptState>) {
  const app = compileGraph();
  return app.invoke(createInitialState(input));
}
