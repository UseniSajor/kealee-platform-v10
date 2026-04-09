/**
 * graphs/land-feasibility.ts
 *
 * Land Feasibility Subgraph
 *
 * Handles the full lifecycle for LAND_FEASIBILITY_BASIC and LAND_FEASIBILITY_PRO.
 *
 * Flow:
 * collect_parcel → lookup_zoning → compute_buildability → estimate_cost
 *   → generate_report → set_land_ready → recommend_next_step
 */

import { StateGraph, END } from "@langchain/langgraph";
import { KealeeStateAnnotation } from "../state/kealee-state";
import type { KealeeState } from "../state/kealee-state";
import { lookupZoningTool } from "../tools/zoning";
import { lookupParcelTool } from "../tools/parcel";
import { estimateBuildCostTool } from "../tools/estimate-build-cost";
import { sendEmailNotificationTool } from "../tools/notifications";
import { recommendNextProduct, RULE_CONCEPT_NOT_PERMIT_READY } from "../rules/business-rules";
import { saveLandAnalysis } from "../memory/long-term";
import { emitEvent, buildEvent } from "../events/contracts";

// ─── Node: collect parcel data ────────────────────────────────────────────────

async function collectParcel(state: KealeeState): Promise<Partial<KealeeState>> {
  if (!state.address) {
    return {
      blockers: [...state.blockers, "Address or parcel ID required for land feasibility analysis."],
    };
  }
  const parcel = await lookupParcelTool.invoke({ address: state.address });
  return {
    landAnalysis: {
      ...state.landAnalysis,
      address: state.address,
      parcelId: (parcel as { parcelId?: string }).parcelId ?? undefined,
    },
    toolResults: [
      { tool: "lookup_parcel", success: true, data: parcel, calledAt: new Date().toISOString() },
    ],
  };
}

// ─── Node: lookup zoning ──────────────────────────────────────────────────────

async function lookupZoning(state: KealeeState): Promise<Partial<KealeeState>> {
  const result = await lookupZoningTool.invoke({
    address: state.address,
    parcelId: state.landAnalysis?.parcelId,
  });
  const r = result as {
    zoning?: string;
    overlays?: string[];
    setbacks?: Record<string, number | null>;
    allowedUses?: string[];
    jurisdiction?: string;
  };
  return {
    landAnalysis: {
      ...state.landAnalysis,
      zoning: r.zoning ?? undefined,
      overlays: (r.overlays ?? []).filter((x): x is string => x !== null),
      setbacks: r.setbacks ? {
        front: r.setbacks.front ?? undefined,
        rear: r.setbacks.rear ?? undefined,
        left: r.setbacks.left ?? undefined,
        right: r.setbacks.right ?? undefined,
      } : undefined,
      allowedUses: r.allowedUses ?? [],
      jurisdiction: r.jurisdiction ?? state.jurisdiction,
    },
    jurisdiction: r.jurisdiction ?? state.jurisdiction,
    toolResults: [
      { tool: "lookup_zoning", success: true, data: result, calledAt: new Date().toISOString() },
    ],
  };
}

// ─── Node: compute buildability ───────────────────────────────────────────────

async function computeBuildability(state: KealeeState): Promise<Partial<KealeeState>> {
  // Derive buildable area from lot size and setbacks
  // This is a simplified calculation — a real implementation would use GIS data
  const lotSizeSqFt = 5000; // placeholder — would come from parcel data
  const setbacks = state.landAnalysis?.setbacks;
  const frontBack = ((setbacks?.front ?? 20) + (setbacks?.rear ?? 20)) * 50; // rough lot width
  const leftRight = ((setbacks?.left ?? 5) + (setbacks?.right ?? 5)) * 100;  // rough lot depth
  const buildableAreaSqFt = Math.max(0, lotSizeSqFt - frontBack - leftRight);

  const zoning = state.landAnalysis?.zoning ?? "";
  const allowedUses = state.landAnalysis?.allowedUses ?? [];

  // Determine max units based on zoning
  let maxUnits = 1;
  if (zoning.includes("R2") || zoning.includes("R-2")) maxUnits = 2;
  else if (zoning.includes("R3") || zoning.includes("R-3")) maxUnits = 4;
  else if (zoning.includes("MF") || zoning.includes("multi")) maxUnits = 8;

  // Risk flags
  const riskFlags: string[] = [];
  if (!zoning) riskFlags.push("Zoning data unavailable — manual verification required.");
  if (buildableAreaSqFt < 800) riskFlags.push("Buildable area is very limited.");
  if ((state.landAnalysis?.overlays ?? []).length > 0) {
    riskFlags.push(`Active overlays detected: ${state.landAnalysis?.overlays?.join(", ")}`);
  }

  // Feasibility score (0-100)
  let feasibilityScore = 70;
  if (buildableAreaSqFt < 1000) feasibilityScore -= 20;
  if (riskFlags.length > 1) feasibilityScore -= 10;
  if (maxUnits > 1) feasibilityScore += 10;
  feasibilityScore = Math.min(100, Math.max(0, feasibilityScore));

  return {
    landAnalysis: {
      ...state.landAnalysis,
      buildableAreaSqFt,
      maxUnits,
      feasibilityScore,
      riskFlags,
    },
  };
}

// ─── Node: estimate build cost ────────────────────────────────────────────────

async function estimateCost(state: KealeeState): Promise<Partial<KealeeState>> {
  const area = state.landAnalysis?.buildableAreaSqFt ?? 1500;
  const projectType = state.projectType ?? "new_construction";
  const stateCode = state.jurisdiction?.split(",").pop()?.trim().substring(0, 2) ?? "DEFAULT";

  const result = await estimateBuildCostTool.invoke({
    projectType,
    areaSqFt: area,
    quality: "mid",
    stateCode,
  });
  const r = result as { estimatedLow?: number; estimatedHigh?: number; disclaimer?: string };

  return {
    landAnalysis: {
      ...state.landAnalysis,
      estimatedBuildCostLow: r.estimatedLow,
      estimatedBuildCostHigh: r.estimatedHigh,
      timelineEstimate: "8–24 months depending on scope and permit timeline",
    },
    toolResults: [
      { tool: "estimate_build_cost", success: true, data: result, calledAt: new Date().toISOString() },
    ],
  };
}

// ─── Node: generate report + set land_ready ───────────────────────────────────

async function generateReport(state: KealeeState): Promise<Partial<KealeeState>> {
  const analysis = state.landAnalysis ?? {};
  const nextProduct = recommendNextProduct({
    ...state,
    readiness: { ...state.readiness, landReady: true },
  });

  // Persist to long-term memory
  if (state.address) {
    saveLandAnalysis(state.address, analysis as Record<string, unknown>);
  }

  await emitEvent(
    buildEvent("orchestrator.deliverable.generated", state.threadId, {
      type: "land_feasibility_report",
      productSku: state.currentProductSku ?? "LAND_FEASIBILITY_BASIC",
      summary: `Land analysis complete for ${state.address}. Feasibility: ${analysis.feasibilityScore}/100.`,
    }, { projectId: state.projectId })
  );

  const completedAnalysis = {
    ...analysis,
    recommendedNextStep: nextProduct?.sku,
    completedAt: new Date().toISOString(),
    disclaimer: RULE_CONCEPT_NOT_PERMIT_READY,
  };

  return {
    landAnalysis: completedAnalysis,
    readiness: { ...state.readiness, landReady: true },
    phase: "readiness_review" as const,
    finalOutput: {
      type: "land_feasibility_report",
      analysis: completedAnalysis,
      recommendedNextProduct: nextProduct,
    },
  };
}

// ─── Node: recommend next step ────────────────────────────────────────────────

async function recommendNextStep(state: KealeeState): Promise<Partial<KealeeState>> {
  const recommended = recommendNextProduct(state);
  return {
    recommendedNextProduct: recommended,
    phase: "product_selection" as const,
  };
}

// ─── Build graph ──────────────────────────────────────────────────────────────

function landReadyRouter(state: KealeeState): "recommend_next_step" | typeof END {
  if (state.blockers.length > 0) return END;
  return "recommend_next_step";
}

export function buildLandFeasibilityGraph() {
  const graph = new StateGraph(KealeeStateAnnotation)
    .addNode("collect_parcel",        collectParcel)
    .addNode("lookup_zoning",         lookupZoning)
    .addNode("compute_buildability",  computeBuildability)
    .addNode("estimate_cost",         estimateCost)
    .addNode("generate_report",       generateReport)
    .addNode("recommend_next_step",   recommendNextStep)
    .addEdge("__start__",            "collect_parcel")
    .addEdge("collect_parcel",        "lookup_zoning")
    .addEdge("lookup_zoning",         "compute_buildability")
    .addEdge("compute_buildability",  "estimate_cost")
    .addEdge("estimate_cost",         "generate_report")
    .addConditionalEdges("generate_report", landReadyRouter, {
      recommend_next_step: "recommend_next_step",
      [END]: END,
    })
    .addEdge("recommend_next_step",   END);

  return graph.compile();
}

export const landFeasibilityGraph = buildLandFeasibilityGraph();
