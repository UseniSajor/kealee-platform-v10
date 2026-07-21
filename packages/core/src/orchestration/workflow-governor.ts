/**
 * WorkflowGovernor
 *
 * PM phase gate enforcement for the KeaCore project lifecycle.
 * Each phase transition requires a set of checklist items to be completed.
 * The governor evaluates completions, identifies blockers, and returns
 * a PhaseGateResult indicating whether the transition is allowed.
 *
 * Phase sequence:
 *   discovery → feasibility → design → permitting → procurement → construction → closeout
 */

import type {
  ApprovalGateType,
  DecisionOutcome,
  OrchestrationContext,
  PhaseGateChecklistItem,
  PhaseGateResult,
  PmPhaseGateResult,
  PmProjectPhase,
  ProjectPhase,
  WorkflowOrchestrationContext,
  WorkflowOrchestrationResult,
} from "./types";
import { decideOrchestration } from "./decision-engine";

// ─── Phase gate definitions ───────────────────────────────────────────────────

interface GateDefinition {
  required: string[]; // must be present in completedItems to allow transition
  optional: string[]; // surfaced as warnings if missing, never blockers
  requiresApproval: string[]; // roles that must approve (displayed in result)
}

const PHASE_GATES: Record<string, GateDefinition> = {
  "discovery→feasibility": {
    required: ["project_created", "address_set", "scope_summary_provided"],
    optional: ["style_preferences_set", "budget_range_set"],
    requiresApproval: [],
  },
  "feasibility→design": {
    required: [
      "feasibility_analysis_complete",
      "risk_flags_acknowledged",
      "budget_range_set",
      "client_confirmed",
    ],
    optional: ["competitor_analysis_complete", "pro_forma_generated"],
    requiresApproval: ["Platform Operator"],
  },
  "design→permitting": {
    required: [
      "concept_approved_by_client",
      "structural_review_complete",
      "budget_confirmed",
      "architect_assigned",
    ],
    optional: ["hoa_pre_approval", "utility_checks_complete"],
    requiresApproval: ["Platform Operator", "Assigned Architect"],
  },
  "permitting→procurement": {
    required: [
      "permit_application_submitted",
      "permits_issued",
      "bid_package_ready",
    ],
    optional: ["hoa_approved", "neighbor_notifications_sent"],
    requiresApproval: ["Platform Operator"],
  },
  "procurement→construction": {
    required: [
      "gc_contracted",
      "payment_terms_set",
      "insurance_verified",
      "construction_schedule_approved",
      "mobilization_deposit_paid",
    ],
    optional: ["subcontractors_assigned", "material_orders_placed"],
    requiresApproval: ["Platform Operator", "Finance Operator"],
  },
  "construction→closeout": {
    required: [
      "substantial_completion_declared",
      "final_inspections_passed",
      "punch_list_complete",
      "final_payment_released",
    ],
    optional: ["warranty_documents_issued", "client_walkthrough_complete"],
    requiresApproval: ["Platform Operator"],
  },
};

// ─── Valid phase transitions ──────────────────────────────────────────────────

const PHASE_ORDER: ProjectPhase[] = [
  "discovery",
  "feasibility",
  "design",
  "permitting",
  "procurement",
  "construction",
  "closeout",
];

function isValidTransition(from: ProjectPhase, to: ProjectPhase): boolean {
  const fromIdx = PHASE_ORDER.indexOf(from);
  const toIdx = PHASE_ORDER.indexOf(to);
  // Only allow forward movement of exactly one step
  return toIdx === fromIdx + 1;
}

// ─── PM-specific phase gate definitions ──────────────────────────────────────

/**
 * Kealee PM project phase gate definitions.
 * Phase sequence: PRE_DESIGN → ARCHITECT → PERMIT → PRE_CONSTRUCTION → CONSTRUCTION → CLOSEOUT
 */
const PM_PHASE_GATES: Record<string, GateDefinition> = {
  "PRE_DESIGN→ARCHITECT": {
    required: [
      "pre_design_package_complete",
      "client_brief_confirmed",
      "budget_range_set",
    ],
    optional: ["concept_images_approved", "style_preferences_confirmed"],
    requiresApproval: ["Platform Operator"],
  },
  "ARCHITECT→PERMIT": {
    required: [
      "architect_drawings_complete",
      "structural_calcs_provided",
      "client_approved_drawings",
      "scope_confirmed",
    ],
    optional: ["energy_compliance_checked", "hoa_pre_approval"],
    requiresApproval: ["Platform Operator", "Assigned Architect"],
  },
  "PERMIT→PRE_CONSTRUCTION": {
    required: [
      "permits_approved",
      "permit_numbers_recorded",
      "bid_package_distributed",
    ],
    optional: ["subcontractor_list_confirmed", "lead_gc_assigned"],
    requiresApproval: ["Platform Operator"],
  },
  "PRE_CONSTRUCTION→CONSTRUCTION": {
    required: [
      "gc_contracted",
      "mobilization_deposit_paid",
      "insurance_coi_verified",
      "construction_schedule_approved",
      "site_access_confirmed",
    ],
    optional: ["material_procurement_started", "subcontractors_confirmed"],
    requiresApproval: ["Platform Operator", "Finance Operator"],
  },
  "CONSTRUCTION→CLOSEOUT": {
    required: [
      "substantial_completion_declared",
      "final_inspections_passed",
      "punch_list_signed_off",
      "final_payment_released",
    ],
    optional: ["warranty_docs_issued", "closeout_photos_uploaded"],
    requiresApproval: ["Platform Operator"],
  },
};

const PM_PHASE_ORDER: PmProjectPhase[] = [
  "PRE_DESIGN",
  "ARCHITECT",
  "PERMIT",
  "PRE_CONSTRUCTION",
  "CONSTRUCTION",
  "CLOSEOUT",
];

function isValidPmTransition(from: PmProjectPhase, to: PmProjectPhase): boolean {
  const fromIdx = PM_PHASE_ORDER.indexOf(from);
  const toIdx = PM_PHASE_ORDER.indexOf(to);
  return toIdx === fromIdx + 1;
}

// ─── Governor ─────────────────────────────────────────────────────────────────

export class WorkflowGovernor {
  /**
   * Evaluate whether a phase transition is allowed.
   *
   * @param context       The orchestration context for the current session
   * @param fromPhase     The current project phase
   * @param toPhase       The requested next phase
   * @param completedItems Checklist item keys that have been completed
   */
  evaluatePhaseTransition(
    context: OrchestrationContext,
    fromPhase: ProjectPhase,
    toPhase: ProjectPhase,
    completedItems: string[],
  ): PhaseGateResult {
    const now = new Date().toISOString();
    const completedSet = new Set(completedItems);

    // ── Validate transition direction ──────────────────────────────────────
    if (!isValidTransition(fromPhase, toPhase)) {
      return {
        allowed: false,
        fromPhase,
        toPhase,
        blockers: [
          `Invalid phase transition: '${fromPhase}' → '${toPhase}'. ` +
          `Phases must progress sequentially (${PHASE_ORDER.join(" → ")}).`,
        ],
        warnings: [],
        requiredApprovals: [],
        checklist: [],
        decidedAt: now,
      };
    }

    const gateKey = `${fromPhase}→${toPhase}`;
    const gate = PHASE_GATES[gateKey];

    if (!gate) {
      // No gate defined — allow freely (shouldn't happen with valid transitions)
      return {
        allowed: true,
        fromPhase,
        toPhase,
        blockers: [],
        warnings: [`No gate definition found for ${gateKey} — proceeding without checks.`],
        requiredApprovals: [],
        checklist: [],
        decidedAt: now,
      };
    }

    // ── Build checklist ────────────────────────────────────────────────────
    const checklist: PhaseGateChecklistItem[] = [
      ...gate.required.map((item) => ({
        item,
        completed: completedSet.has(item),
        blocker: true,
      })),
      ...gate.optional.map((item) => ({
        item,
        completed: completedSet.has(item),
        blocker: false,
      })),
    ];

    const blockers = gate.required
      .filter((item) => !completedSet.has(item))
      .map((item) => `Required item not complete: '${item}'`);

    const warnings = gate.optional
      .filter((item) => !completedSet.has(item))
      .map((item) => `Optional item not complete: '${item}'`);

    // ── Context-level warnings ─────────────────────────────────────────────
    if (context.requiresStructuralWork && toPhase === "permitting") {
      if (!completedSet.has("structural_review_complete")) {
        blockers.push("Structural work requires a structural review before permitting.");
      }
    }

    if (context.hoaReviewRequired && toPhase === "construction") {
      if (!completedSet.has("hoa_approved")) {
        warnings.push("HOA review was flagged as required but 'hoa_approved' is not marked complete.");
      }
    }

    // ── Financial gate for procurement → construction ──────────────────────
    if (fromPhase === "procurement" && toPhase === "construction") {
      const budgetMax = context.budgetMax ?? 0;
      if (budgetMax > 500_000 && !completedSet.has("insurance_verified")) {
        blockers.push("Projects over $500k require verified contractor insurance before construction.");
      }
    }

    return {
      allowed: blockers.length === 0,
      fromPhase,
      toPhase,
      blockers,
      warnings,
      requiredApprovals: gate.requiresApproval,
      checklist,
      decidedAt: now,
    };
  }

  /**
   * Returns all required checklist items for a given phase gate.
   * Useful for building progress UIs.
   */
  getGateChecklist(fromPhase: ProjectPhase, toPhase: ProjectPhase): GateDefinition | null {
    if (!isValidTransition(fromPhase, toPhase)) return null;
    return PHASE_GATES[`${fromPhase}→${toPhase}`] ?? null;
  }

  /**
   * Returns an ordered list of all project phases.
   */
  getPhaseOrder(): ProjectPhase[] {
    return [...PHASE_ORDER];
  }

  // ── PM Phase Governance ───────────────────────────────────────────────────

  /**
   * Evaluate whether a Kealee PM project phase transition is allowed.
   * Governs the platform's project lifecycle:
   *   PRE_DESIGN → ARCHITECT → PERMIT → PRE_CONSTRUCTION → CONSTRUCTION → CLOSEOUT
   *
   * @param context       The orchestration context for the current session
   * @param fromPhase     The current PM project phase
   * @param toPhase       The requested next PM phase
   * @param completedItems Checklist item keys that have been completed
   */
  evaluatePmPhaseTransition(
    context: OrchestrationContext,
    fromPhase: PmProjectPhase,
    toPhase: PmProjectPhase,
    completedItems: string[],
  ): PmPhaseGateResult {
    const now = new Date().toISOString();
    const completedSet = new Set(completedItems);

    if (!isValidPmTransition(fromPhase, toPhase)) {
      return {
        allowed: false,
        fromPhase,
        toPhase,
        blockers: [
          `Invalid PM phase transition: '${fromPhase}' → '${toPhase}'. ` +
          `Phases must progress sequentially (${PM_PHASE_ORDER.join(" → ")}).`,
        ],
        warnings: [],
        requiredApprovals: [],
        checklist: [],
        decidedAt: now,
      };
    }

    const gateKey = `${fromPhase}→${toPhase}`;
    const gate = PM_PHASE_GATES[gateKey];

    if (!gate) {
      return {
        allowed: true,
        fromPhase,
        toPhase,
        blockers: [],
        warnings: [`No PM gate definition found for ${gateKey} — proceeding without checks.`],
        requiredApprovals: [],
        checklist: [],
        decidedAt: now,
      };
    }

    const checklist: PhaseGateChecklistItem[] = [
      ...gate.required.map((item) => ({
        item,
        completed: completedSet.has(item),
        blocker: true,
      })),
      ...gate.optional.map((item) => ({
        item,
        completed: completedSet.has(item),
        blocker: false,
      })),
    ];

    const blockers = gate.required
      .filter((item) => !completedSet.has(item))
      .map((item) => `Required item not complete: '${item}'`);

    const warnings = gate.optional
      .filter((item) => !completedSet.has(item))
      .map((item) => `Optional item not complete: '${item}'`);

    // ── Context-level rules ────────────────────────────────────────────────
    // Structural work must be reviewed before the ARCHITECT phase
    if (fromPhase === "PRE_DESIGN" && toPhase === "ARCHITECT") {
      if (context.requiresStructuralWork && !completedSet.has("structural_review_complete")) {
        blockers.push("Structural work flagged: 'structural_review_complete' required before ARCHITECT phase.");
      }
    }

    // Cannot move to PRE_CONSTRUCTION without approved permits
    if (fromPhase === "PERMIT" && toPhase === "PRE_CONSTRUCTION") {
      if (!completedSet.has("permits_approved")) {
        // Already in blockers via required items — add explanatory message if not present
        const alreadyFlagged = blockers.some((b) => b.includes("permits_approved"));
        if (!alreadyFlagged) {
          blockers.push("Permit approval is required before advancing to PRE_CONSTRUCTION.");
        }
      }
    }

    // High-budget projects require verified COI before construction
    if (fromPhase === "PRE_CONSTRUCTION" && toPhase === "CONSTRUCTION") {
      const budgetMax = context.budgetMax ?? 0;
      if (budgetMax > 500_000 && !completedSet.has("insurance_coi_verified")) {
        const alreadyFlagged = blockers.some((b) => b.includes("insurance_coi_verified"));
        if (!alreadyFlagged) {
          blockers.push("Projects over $500k require verified contractor COI before construction.");
        }
      }
    }

    // HOA review warning for construction phase
    if (toPhase === "CONSTRUCTION" && context.hoaReviewRequired) {
      if (!completedSet.has("hoa_approved")) {
        warnings.push("HOA review was flagged as required but 'hoa_approved' is not marked complete.");
      }
    }

    return {
      allowed: blockers.length === 0,
      fromPhase,
      toPhase,
      blockers,
      warnings,
      requiredApprovals: gate.requiresApproval,
      checklist,
      decidedAt: now,
    };
  }

  /**
   * Returns all required checklist items for a given PM phase gate.
   */
  getPmGateChecklist(fromPhase: PmProjectPhase, toPhase: PmProjectPhase): GateDefinition | null {
    if (!isValidPmTransition(fromPhase, toPhase)) return null;
    return PM_PHASE_GATES[`${fromPhase}→${toPhase}`] ?? null;
  }

  /**
   * Returns the ordered list of Kealee PM project phases.
   */
  getPmPhaseOrder(): PmProjectPhase[] {
    return [...PM_PHASE_ORDER];
  }
}

/** Singleton instance */
export const workflowGovernor = new WorkflowGovernor();

// ─── Platform-facing workflow control functions ───────────────────────────────

/**
 * Evaluate a workflow context and return what should happen next.
 * This is the main governance entry point for bot/queue dispatch decisions.
 *
 * Wraps decideOrchestration() and adds dispatch intent to the result.
 */
export function evaluateAndAdvance(ctx: WorkflowOrchestrationContext): WorkflowOrchestrationResult & {
  shouldDispatch: boolean;
  shouldPause: boolean;
  shouldEscalate: boolean;
} {
  const result = decideOrchestration(ctx);
  return {
    ...result,
    shouldDispatch: result.decision === "AUTO_EXECUTE",
    shouldPause: result.decision === "REQUIRE_APPROVAL",
    shouldEscalate: result.decision === "ESCALATE",
  };
}

/**
 * Determine whether a workflow step should dispatch the next bot/queue job.
 * Returns the next action string if dispatch is appropriate, null otherwise.
 */
export function maybeDispatchNextStep(
  ctx: WorkflowOrchestrationContext,
  result: WorkflowOrchestrationResult,
): { dispatch: boolean; nextAction: string | null; reason: string } {
  if (result.decision === "AUTO_EXECUTE") {
    return {
      dispatch: true,
      nextAction: result.nextAction ?? null,
      reason: `AUTO_EXECUTE approved for ${ctx.workflowType} (confidence: ${(result.confidenceScore * 100).toFixed(0)}%, risk: ${(result.riskScore * 100).toFixed(0)}%)`,
    };
  }
  return {
    dispatch: false,
    nextAction: null,
    reason: `${result.decision} — workflow paused for ${ctx.workflowType}. Reason codes: ${result.reasonCodes.join(", ")}`,
  };
}

/**
 * Create an approval gate record if the decision requires one.
 * Returns gate metadata if a gate should be created, null otherwise.
 *
 * Callers are responsible for persisting the gate to the DB and surfacing
 * it to the command-center UI.
 */
export function createApprovalGateIfNeeded(
  ctx: WorkflowOrchestrationContext,
  result: WorkflowOrchestrationResult,
): {
  shouldCreate: boolean;
  gateType: ApprovalGateType | null;
  gatePayload: Record<string, unknown>;
} {
  if (result.decision !== "REQUIRE_APPROVAL" || !result.requiredApprovalGate) {
    return { shouldCreate: false, gateType: null, gatePayload: {} };
  }
  return {
    shouldCreate: true,
    gateType: result.requiredApprovalGate,
    gatePayload: {
      projectId: ctx.projectId,
      workflowType: ctx.workflowType,
      confidenceScore: result.confidenceScore,
      riskScore: result.riskScore,
      reasonCodes: result.reasonCodes,
      decision: result.decision,
      status: "PENDING",
    },
  };
}

/**
 * Create an escalation record if the decision requires escalation.
 * Returns escalation metadata if escalation should be triggered, null otherwise.
 */
export function createEscalationIfNeeded(
  ctx: WorkflowOrchestrationContext,
  result: WorkflowOrchestrationResult,
): {
  shouldEscalate: boolean;
  escalationPayload: Record<string, unknown>;
} {
  if (result.decision !== "ESCALATE") {
    return { shouldEscalate: false, escalationPayload: {} };
  }
  return {
    shouldEscalate: true,
    escalationPayload: {
      projectId: ctx.projectId,
      workflowType: ctx.workflowType,
      confidenceScore: result.confidenceScore,
      riskScore: result.riskScore,
      reasonCodes: result.reasonCodes,
      escalatedAt: new Date().toISOString(),
      recommendedReviewer: "Platform Operator",
    },
  };
}
