/**
 * business-rules.ts
 *
 * Hard-coded platform rules for the Kealee orchestration layer.
 *
 * These rules are the single canonical source of truth for:
 * - product eligibility
 * - readiness gating
 * - architect/permit escalation
 * - next-step recommendation
 * - upsell qualification
 *
 * Rules are pure functions — no side effects, no DB calls.
 * They are called by supervisor routing and subgraph nodes.
 */

import type {
  KealeeState,
  ProductSKU,
  ProductRecommendation,
  ReadinessFlags,
  KealeeRole,
} from "../state/kealee-state";

// ─── Rule 1: AI concept is NEVER permit-ready stamped construction docs ───────

export const RULE_CONCEPT_NOT_PERMIT_READY =
  "AI concept packages (DESIGN_CONCEPT_VALIDATION, DESIGN_ADVANCED, DESIGN_FULL) " +
  "are NOT permit-ready stamped construction documents. " +
  "They are design intent visualizations only. " +
  "Permit services require a separate engagement.";

export function isConceptProduct(sku: ProductSKU): boolean {
  return sku === "DESIGN_CONCEPT_VALIDATION" || sku === "DESIGN_ADVANCED" || sku === "DESIGN_FULL";
}

export function isPermitProduct(sku: ProductSKU): boolean {
  return (
    sku === "PERMIT_SIMPLE" ||
    sku === "PERMIT_PACKAGE" ||
    sku === "PERMIT_COORDINATION" ||
    sku === "PERMIT_EXPEDITING"
  );
}

export function isLandProduct(sku: ProductSKU): boolean {
  return sku === "LAND_FEASIBILITY_BASIC" || sku === "LAND_FEASIBILITY_PRO";
}

// ─── Rule 2: Architect-required projects must route to professional ────────────

export function requiresArchitectHandoff(state: KealeeState): boolean {
  if (state.architectRequired === true) return true;
  // Auto-detect based on complexity
  if (state.complexityScore !== undefined && state.complexityScore >= 80) return true;
  if (state.dcsScore !== undefined && state.dcsScore >= 75) return true;
  // Structural or multifamily implies architect required
  if (
    state.projectType &&
    (state.projectType.includes("structural") ||
      state.projectType.includes("multifamily") ||
      state.projectType.includes("adu") ||
      state.projectType.includes("new_construction"))
  ) {
    return true;
  }
  return false;
}

// ─── Rule 3: Contractor matching is blocked until contractorReady ─────────────

export function isContractorMatchAllowed(readiness: ReadinessFlags): boolean {
  return readiness.contractorReady;
}

export function deriveContractorReadiness(state: KealeeState): boolean {
  // Must have an active project
  if (!state.projectId) return false;
  // Must have a concept OR a scope summary
  if (!state.readiness.conceptReady && !state.scopeSummary) return false;
  // Must have an estimate OR budget set
  if (!state.readiness.estimateReady && !state.budgetMin && !state.budgetMax) return false;
  // Permit must be in progress or not required
  if (state.permitRequired && !state.readiness.permitReady) return false;
  return true;
}

// ─── Rule 4: Permit products represent actual permit EXECUTION ────────────────

export const RULE_PERMIT_EXECUTION =
  "Permit products (PERMIT_PACKAGE, PERMIT_COORDINATION, etc.) represent actual " +
  "permit execution workflows — jurisdiction research, form prep, submission, and tracking. " +
  "They are not vague research-only deliverables.";

// ─── Rule 5: Land analysis should upsell to concept when landReady ────────────

export function shouldUpsellLandToConceptIfReady(state: KealeeState): boolean {
  return (
    state.readiness.landReady === true &&
    state.readiness.conceptReady === false &&
    state.purchasedProducts.some(isLandProduct)
  );
}

// ─── Rule 6: Estimate requires concept-ready OR enough direct scope data ──────

export function isEstimateProductEligible(state: KealeeState): boolean {
  if (state.readiness.conceptReady) return true;
  if (
    state.scopeSummary &&
    state.projectType &&
    (state.budgetMin !== undefined || state.budgetMax !== undefined)
  ) {
    return true;
  }
  return false;
}

// ─── Rule 7: PM/escrow products surface only when execution readiness qualifies

export function isPMProductEligible(state: KealeeState): boolean {
  return (
    state.readiness.contractorReady &&
    state.readiness.permitReady &&
    state.readiness.estimateReady
  );
}

// ─── Rule 8: Support must redirect users into structured workflows ─────────────

export function supportNeedsWorkflowRedirect(state: KealeeState): boolean {
  if (!state.projectId && !state.userId) return true;
  if (state.phase === "discovery" && state.blockers.length > 0) return true;
  return false;
}

// ─── Rule 9: Homepage/intake must not expose every product simultaneously ─────

export const MAX_PRODUCTS_SHOWN_IN_FUNNEL = 1; // recommended + up to 2 upsells
export const MAX_UPSELLS_SHOWN_IN_FUNNEL = 2;

// ─── Product catalog metadata ─────────────────────────────────────────────────

export const PRODUCT_CATALOG: Record<
  ProductSKU,
  { displayName: string; priceLabel: string; targetRoles: KealeeRole[]; category: string }
> = {
  LAND_FEASIBILITY_BASIC: {
    displayName: "Land Buildability & Cost Analysis",
    priceLabel: "From $195",
    targetRoles: ["homeowner", "land_owner", "developer"],
    category: "land",
  },
  LAND_FEASIBILITY_PRO: {
    displayName: "Land Feasibility Pro",
    priceLabel: "From $495",
    targetRoles: ["land_owner", "developer"],
    category: "land",
  },
  DESIGN_CONCEPT_VALIDATION: {
    displayName: "AI Concept Design — Starter",
    priceLabel: "$599",
    targetRoles: ["homeowner", "land_owner", "developer"],
    category: "design",
  },
  DESIGN_ADVANCED: {
    displayName: "AI Concept Design — Professional",
    priceLabel: "$1,299",
    targetRoles: ["homeowner", "developer"],
    category: "design",
  },
  DESIGN_FULL: {
    displayName: "AI Concept Design — Enterprise",
    priceLabel: "Custom",
    targetRoles: ["developer"],
    category: "design",
  },
  ESTIMATE_DETAILED: {
    displayName: "Detailed Cost Estimate",
    priceLabel: "From $395",
    targetRoles: ["homeowner", "land_owner", "developer"],
    category: "estimate",
  },
  ESTIMATE_CERTIFIED: {
    displayName: "Certified Cost Estimate",
    priceLabel: "From $795",
    targetRoles: ["developer"],
    category: "estimate",
  },
  PERMIT_SIMPLE: {
    displayName: "Standard Permit",
    priceLabel: "$495",
    targetRoles: ["homeowner"],
    category: "permit",
  },
  PERMIT_PACKAGE: {
    displayName: "Multi-Trade Permit Package",
    priceLabel: "$895",
    targetRoles: ["homeowner", "developer"],
    category: "permit",
  },
  PERMIT_COORDINATION: {
    displayName: "Full Service Permit",
    priceLabel: "$1,495",
    targetRoles: ["developer"],
    category: "permit",
  },
  PERMIT_EXPEDITING: {
    displayName: "Expedited Permit Add-On",
    priceLabel: "+$495",
    targetRoles: ["homeowner", "developer"],
    category: "permit",
  },
  PM_ADVISORY: {
    displayName: "PM Advisory",
    priceLabel: "From $595/mo",
    targetRoles: ["homeowner"],
    category: "pm",
  },
  PM_OVERSIGHT: {
    displayName: "PM Oversight",
    priceLabel: "Custom",
    targetRoles: ["developer"],
    category: "pm",
  },
  ARCHITECT_VIP: {
    displayName: "Architect VIP Service",
    priceLabel: "Custom",
    targetRoles: ["homeowner", "developer"],
    category: "architect",
  },
  CONTRACTOR_GROWTH_STARTER: {
    displayName: "Contractor Growth — Starter",
    priceLabel: "From $195/mo",
    targetRoles: ["contractor"],
    category: "contractor",
  },
  CONTRACTOR_GROWTH_PRO: {
    displayName: "Contractor Growth — Pro",
    priceLabel: "From $495/mo",
    targetRoles: ["contractor"],
    category: "contractor",
  },
};

// ─── Next-product recommendation engine ──────────────────────────────────────

export function recommendNextProduct(state: KealeeState): ProductRecommendation | undefined {
  const { role, intent, readiness, purchasedProducts, landAnalysis } = state;

  const bought = new Set(purchasedProducts);

  // ── Land owner / unknown with land intent: start with land feasibility
  if (
    (role === "land_owner" || intent === "land_analysis") &&
    !bought.has("LAND_FEASIBILITY_BASIC") &&
    !bought.has("LAND_FEASIBILITY_PRO")
  ) {
    return {
      sku: "LAND_FEASIBILITY_BASIC",
      displayName: PRODUCT_CATALOG.LAND_FEASIBILITY_BASIC.displayName,
      reason: "Before designing or building, you need to know what your land can support.",
      priceLabel: PRODUCT_CATALOG.LAND_FEASIBILITY_BASIC.priceLabel,
      expectedOutcome:
        "Zoning review, buildability assessment, rough cost band, and recommended next step.",
      nextStepAfterPurchase:
        "Once complete, you'll receive a concept recommendation based on your parcel's potential.",
    };
  }

  // ── Land is ready → recommend concept
  if (
    readiness.landReady &&
    !readiness.conceptReady &&
    !bought.has("DESIGN_CONCEPT_VALIDATION") &&
    !bought.has("DESIGN_ADVANCED")
  ) {
    const isComplex = (state.complexityScore ?? 0) >= 60 || role === "developer";
    const sku: ProductSKU = isComplex ? "DESIGN_ADVANCED" : "DESIGN_CONCEPT_VALIDATION";
    return {
      sku,
      displayName: PRODUCT_CATALOG[sku].displayName,
      reason: "Your land analysis is complete. The next step is to generate a design concept.",
      priceLabel: PRODUCT_CATALOG[sku].priceLabel,
      expectedOutcome:
        "AI-generated renderings, floor plan options, and a design brief for your project.",
      nextStepAfterPurchase:
        "After concept delivery, you'll be ready for estimating and permit preparation.",
    };
  }

  // ── No land check but homeowner starting project → concept
  if (
    (role === "homeowner" || intent === "start_project" || intent === "get_concept") &&
    !readiness.landReady &&
    !readiness.conceptReady &&
    !bought.has("DESIGN_CONCEPT_VALIDATION")
  ) {
    return {
      sku: "DESIGN_CONCEPT_VALIDATION",
      displayName: PRODUCT_CATALOG.DESIGN_CONCEPT_VALIDATION.displayName,
      reason: "Start with a visual concept to confirm your design direction before spending more.",
      priceLabel: PRODUCT_CATALOG.DESIGN_CONCEPT_VALIDATION.priceLabel,
      expectedOutcome:
        "AI renderings, style options, and a project brief that defines your scope.",
      nextStepAfterPurchase:
        "After your concept, we'll recommend an estimate and permit path.",
    };
  }

  // ── Concept ready, no estimate → estimate
  if (
    readiness.conceptReady &&
    !readiness.estimateReady &&
    !bought.has("ESTIMATE_DETAILED") &&
    !bought.has("ESTIMATE_CERTIFIED")
  ) {
    return {
      sku: "ESTIMATE_DETAILED",
      displayName: PRODUCT_CATALOG.ESTIMATE_DETAILED.displayName,
      reason: "Your concept is ready. Get a detailed cost estimate before permitting.",
      priceLabel: PRODUCT_CATALOG.ESTIMATE_DETAILED.priceLabel,
      expectedOutcome:
        "Detailed cost breakdown by trade, material, and labor with regional adjustment.",
      nextStepAfterPurchase:
        "With an estimate in hand, we can recommend the right permit package.",
    };
  }

  // ── Estimate ready, no permit → permit
  if (
    readiness.estimateReady &&
    !readiness.permitReady &&
    state.permitRequired !== false &&
    !bought.has("PERMIT_SIMPLE") &&
    !bought.has("PERMIT_PACKAGE") &&
    !bought.has("PERMIT_COORDINATION")
  ) {
    const isMultiTrade = (state.complexityScore ?? 0) >= 50;
    const sku: ProductSKU = isMultiTrade ? "PERMIT_PACKAGE" : "PERMIT_SIMPLE";
    return {
      sku,
      displayName: PRODUCT_CATALOG[sku].displayName,
      reason:
        "Your project requires a permit. We handle research, prep, submission, and tracking.",
      priceLabel: PRODUCT_CATALOG[sku].priceLabel,
      expectedOutcome:
        "Active permit case opened with your jurisdiction. Status tracked to approval.",
      nextStepAfterPurchase:
        "Once permitted, your project will be ready for contractor matching.",
    };
  }

  // ── Contractor ready → PM advisory
  if (
    readiness.contractorReady &&
    !bought.has("PM_ADVISORY") &&
    !bought.has("PM_OVERSIGHT") &&
    (role === "homeowner" || role === "developer")
  ) {
    const sku: ProductSKU = role === "developer" ? "PM_OVERSIGHT" : "PM_ADVISORY";
    return {
      sku,
      displayName: PRODUCT_CATALOG[sku].displayName,
      reason:
        "Your project is fully ready for construction. Protect your investment with PM oversight.",
      priceLabel: PRODUCT_CATALOG[sku].priceLabel,
      expectedOutcome: "Active project monitoring, milestone sign-off, and payment protection.",
      nextStepAfterPurchase: "Your contractor will be matched and construction can begin.",
    };
  }

  return undefined;
}

// ─── Upsell candidates ────────────────────────────────────────────────────────

export function deriveUpsellCandidates(state: KealeeState): ProductRecommendation[] {
  const candidates: ProductRecommendation[] = [];
  const bought = new Set(state.purchasedProducts);
  const next = recommendNextProduct(state);
  const nextSku = next?.sku;

  // If on BASIC land → offer PRO upsell
  if (
    nextSku === "LAND_FEASIBILITY_BASIC" &&
    !bought.has("LAND_FEASIBILITY_PRO")
  ) {
    candidates.push({
      sku: "LAND_FEASIBILITY_PRO",
      displayName: PRODUCT_CATALOG.LAND_FEASIBILITY_PRO.displayName,
      reason: "More depth: build envelope analysis, stronger cost band, concept-readiness package.",
      priceLabel: PRODUCT_CATALOG.LAND_FEASIBILITY_PRO.priceLabel,
      expectedOutcome: "Pro-level feasibility report with scenario analysis.",
      nextStepAfterPurchase: "Design concept immediately recommended.",
    });
  }

  // If on SIMPLE permit → offer PACKAGE
  if (nextSku === "PERMIT_SIMPLE" && !bought.has("PERMIT_PACKAGE")) {
    candidates.push({
      sku: "PERMIT_PACKAGE",
      displayName: PRODUCT_CATALOG.PERMIT_PACKAGE.displayName,
      reason: "Multi-trade projects benefit from the coordinated permit package.",
      priceLabel: PRODUCT_CATALOG.PERMIT_PACKAGE.priceLabel,
      expectedOutcome: "All trades covered in a single submission.",
      nextStepAfterPurchase: "Faster overall permit timeline.",
    });
  }

  // If on DESIGN_CONCEPT_VALIDATION → offer ADVANCED
  if (nextSku === "DESIGN_CONCEPT_VALIDATION" && !bought.has("DESIGN_ADVANCED")) {
    candidates.push({
      sku: "DESIGN_ADVANCED",
      displayName: PRODUCT_CATALOG.DESIGN_ADVANCED.displayName,
      reason: "More options, deeper detail, and construction document readiness preparation.",
      priceLabel: PRODUCT_CATALOG.DESIGN_ADVANCED.priceLabel,
      expectedOutcome: "Professional-grade concept package with 3 design iterations.",
      nextStepAfterPurchase: "Architect VIP pathway available.",
    });
  }

  return candidates.slice(0, MAX_UPSELLS_SHOWN_IN_FUNNEL);
}

// ─── Blocker detection ────────────────────────────────────────────────────────

export function detectBlockers(state: KealeeState): string[] {
  const blockers: string[] = [];

  if (!state.address && state.phase !== "discovery") {
    blockers.push("Project address is required before proceeding.");
  }
  if (!state.projectType && state.phase !== "discovery") {
    blockers.push("Project type has not been specified.");
  }
  if (state.architectRequired && !state.readiness.conceptReady) {
    blockers.push(
      "This project requires architect review. Proceed through the concept design step first."
    );
  }
  if (
    state.phase === "contractor_match" &&
    !isContractorMatchAllowed(state.readiness)
  ) {
    blockers.push(
      "Contractor matching is not yet available. Complete concept, estimate, and permit first."
    );
  }

  return blockers;
}
