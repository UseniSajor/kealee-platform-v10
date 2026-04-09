/**
 * kealee-state.ts
 *
 * Canonical LangGraph state schema for the Kealee orchestration layer.
 *
 * Design principles:
 * - All business-critical fields are strongly typed
 * - Readiness flags are derived from completed steps, not user claims
 * - LandAnalysis captures parcel/zoning/cost intel from the land feasibility flow
 * - Messages are the only append-only field (LangGraph convention)
 * - All other fields are last-write-wins reducers
 */

import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

// ─── Product SKUs ─────────────────────────────────────────────────────────────

export type ProductSKU =
  | "LAND_FEASIBILITY_BASIC"
  | "LAND_FEASIBILITY_PRO"
  | "DESIGN_CONCEPT_VALIDATION"
  | "DESIGN_ADVANCED"
  | "DESIGN_FULL"
  | "ESTIMATE_DETAILED"
  | "ESTIMATE_CERTIFIED"
  | "PERMIT_SIMPLE"
  | "PERMIT_PACKAGE"
  | "PERMIT_COORDINATION"
  | "PERMIT_EXPEDITING"
  | "PM_ADVISORY"
  | "PM_OVERSIGHT"
  | "ARCHITECT_VIP"
  | "CONTRACTOR_GROWTH_STARTER"
  | "CONTRACTOR_GROWTH_PRO";

// ─── User roles ───────────────────────────────────────────────────────────────

export type KealeeRole =
  | "homeowner"
  | "land_owner"
  | "developer"
  | "contractor"
  | "architect"
  | "ops"
  | "admin"
  | "unknown";

// ─── Platform phases ──────────────────────────────────────────────────────────

export type KealeePhase =
  | "discovery"           // anonymous / initial intake
  | "intake"              // collecting project data
  | "product_selection"   // recommending/selecting next product
  | "checkout"            // payment in progress
  | "delivery"            // post-purchase product delivery active
  | "readiness_review"    // evaluating readiness for next step
  | "contractor_match"    // matching contractor
  | "construction"        // active build phase
  | "closeout"            // project closeout
  | "support";            // support context

// ─── User intent classifications ─────────────────────────────────────────────

export type KealeeIntent =
  | "start_project"
  | "land_analysis"
  | "get_concept"
  | "get_estimate"
  | "get_permit"
  | "find_contractor"
  | "manage_construction"
  | "support_request"
  | "contractor_growth"
  | "developer_pipeline"
  | "browse"
  | "unknown";

// ─── Payment status ───────────────────────────────────────────────────────────

export type PaymentStatus =
  | "none"
  | "pending"
  | "completed"
  | "failed"
  | "refunded";

// ─── Land analysis sub-object ─────────────────────────────────────────────────

export interface LandAnalysis {
  parcelId?: string;
  address?: string;
  zoning?: string;
  jurisdiction?: string;
  overlays?: string[];
  setbacks?: {
    front?: number;
    rear?: number;
    left?: number;
    right?: number;
  };
  buildableAreaSqFt?: number;
  maxUnits?: number;
  allowedUses?: string[];
  feasibilityScore?: number;       // 0–100
  estimatedBuildCostLow?: number;
  estimatedBuildCostHigh?: number;
  timelineEstimate?: string;
  riskFlags?: string[];
  recommendedNextStep?: ProductSKU;
  reportUrl?: string;
  completedAt?: string;
}

// ─── Readiness flags ──────────────────────────────────────────────────────────

export interface ReadinessFlags {
  landReady: boolean;           // land analysis completed
  conceptReady: boolean;        // design concept delivered
  estimateReady: boolean;       // cost estimate delivered
  permitReady: boolean;         // permit case opened / on track
  contractorReady: boolean;     // project is ready for contractor match
  constructionReady: boolean;   // contract signed, escrow funded
  payoutReady: boolean;         // milestone evidence accepted
}

// ─── Recommendation ───────────────────────────────────────────────────────────

export interface ProductRecommendation {
  sku: ProductSKU;
  displayName: string;
  reason: string;
  priceLabel: string;
  expectedOutcome: string;
  nextStepAfterPurchase: string;
}

// ─── Tool result envelope ─────────────────────────────────────────────────────

export interface ToolResult {
  tool: string;
  success: boolean;
  data?: unknown;
  error?: string;
  calledAt: string;
}

// ─── KealeeState annotation ───────────────────────────────────────────────────

export const KealeeStateAnnotation = Annotation.Root({
  // ── Thread / identity
  threadId:   Annotation<string>({ reducer: (_, b) => b }),
  userId:     Annotation<string | undefined>({ reducer: (_, b) => b }),
  orgId:      Annotation<string | undefined>({ reducer: (_, b) => b }),
  sessionId:  Annotation<string | undefined>({ reducer: (_, b) => b }),

  // ── Role + phase + intent
  role:    Annotation<KealeeRole>({ reducer: (_, b) => b, default: () => "unknown" }),
  phase:   Annotation<KealeePhase>({ reducer: (_, b) => b, default: () => "discovery" }),
  intent:  Annotation<KealeeIntent>({ reducer: (_, b) => b, default: () => "unknown" }),

  // ── Messages (append-only per LangGraph convention)
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // ── Project context
  projectId:      Annotation<string | undefined>({ reducer: (_, b) => b }),
  engagementId:   Annotation<string | undefined>({ reducer: (_, b) => b }),
  address:        Annotation<string | undefined>({ reducer: (_, b) => b }),
  jurisdiction:   Annotation<string | undefined>({ reducer: (_, b) => b }),
  projectType:    Annotation<string | undefined>({ reducer: (_, b) => b }),
  scopeSummary:   Annotation<string | undefined>({ reducer: (_, b) => b }),
  budgetMin:      Annotation<number | undefined>({ reducer: (_, b) => b }),
  budgetMax:      Annotation<number | undefined>({ reducer: (_, b) => b }),
  stylePreferences: Annotation<string[]>({ reducer: (_, b) => b, default: () => [] }),
  uploadedAssets: Annotation<string[]>({ reducer: (_, b) => b, default: () => [] }),

  // ── Scoring
  complexityScore: Annotation<number | undefined>({ reducer: (_, b) => b }),
  dcsScore:        Annotation<number | undefined>({ reducer: (_, b) => b }),

  // ── Flags
  permitRequired:     Annotation<boolean | undefined>({ reducer: (_, b) => b }),
  architectRequired:  Annotation<boolean | undefined>({ reducer: (_, b) => b }),
  financeReady:       Annotation<boolean | undefined>({ reducer: (_, b) => b }),

  // ── Readiness
  readiness: Annotation<ReadinessFlags>({
    reducer: (a, b) => ({ ...a, ...b }),
    default: () => ({
      landReady: false,
      conceptReady: false,
      estimateReady: false,
      permitReady: false,
      contractorReady: false,
      constructionReady: false,
      payoutReady: false,
    }),
  }),

  // ── Land analysis
  landAnalysis: Annotation<LandAnalysis | undefined>({ reducer: (_, b) => b }),

  // ── Product state
  currentProductSku:      Annotation<ProductSKU | undefined>({ reducer: (_, b) => b }),
  purchasedProducts:      Annotation<ProductSKU[]>({ reducer: (_, b) => b, default: () => [] }),
  recommendedNextProduct: Annotation<ProductRecommendation | undefined>({ reducer: (_, b) => b }),
  upsellCandidates:       Annotation<ProductRecommendation[]>({ reducer: (_, b) => b, default: () => [] }),

  // ── Blockers and risks
  blockers: Annotation<string[]>({ reducer: (_, b) => b, default: () => [] }),
  risks:    Annotation<string[]>({ reducer: (_, b) => b, default: () => [] }),

  // ── CRM / payment
  crmLeadId:        Annotation<string | undefined>({ reducer: (_, b) => b }),
  paymentStatus:    Annotation<PaymentStatus>({ reducer: (_, b) => b, default: () => "none" }),
  checkoutUrl:      Annotation<string | undefined>({ reducer: (_, b) => b }),
  assignmentStatus: Annotation<string | undefined>({ reducer: (_, b) => b }),
  slaDeadline:      Annotation<string | undefined>({ reducer: (_, b) => b }),

  // ── Tool results
  toolResults:  Annotation<ToolResult[]>({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  finalOutput:  Annotation<Record<string, unknown> | undefined>({ reducer: (_, b) => b }),

  // ── Routing metadata (for supervisor decisions)
  activeSubgraph: Annotation<string | undefined>({ reducer: (_, b) => b }),
  routeReason:    Annotation<string | undefined>({ reducer: (_, b) => b }),
});

export type KealeeState = typeof KealeeStateAnnotation.State;
export type KealeeStateUpdate = typeof KealeeStateAnnotation.Update;
