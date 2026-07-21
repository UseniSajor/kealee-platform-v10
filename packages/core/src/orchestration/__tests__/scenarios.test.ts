/**
 * KeaCore Orchestration Engine — Scenario Tests
 *
 * Tests the full decision pipeline with representative platform scenarios.
 * Run with: npx tsx --test or jest after adding jest config.
 */

import { decideOrchestration } from "../decision-engine";
import { computeConfidenceScore, explainConfidence } from "../confidence-engine";
import { computeRiskScore, explainRisk } from "../risk-engine";
import { canAutoExecute, determineApprovalGate } from "../authority-engine";
import { evaluateAndAdvance, createApprovalGateIfNeeded, createEscalationIfNeeded } from "../workflow-governor";
import { aiActionLog } from "../action-log";
import type { WorkflowOrchestrationContext } from "../types";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<WorkflowOrchestrationContext>): WorkflowOrchestrationContext {
  return {
    projectId: "proj_test_001",
    workflowType: "PRE_DESIGN",
    ...overrides,
  };
}

// ─── Scenario 1: Small residential kitchen remodel ────────────────────────────

describe("Scenario 1: Small residential kitchen remodel", () => {
  const ctx = makeCtx({
    projectType: "residential_single_family",
    workflowType: "PRE_DESIGN",
    captureQualityScore: 0.85,
    dcsScore: 0.82,
    complexityScore: 0.30,
    confidenceSignals: { intent: 0.90, scope: 0.88 },
    riskSignals: { financial: 0.15 },
    systemsImpacted: ["electrical"],
    permitComplexity: "LOW",
    budgetEstimate: 45_000,
    requiresArchitect: false,
    userInputsComplete: true,
  });

  test("confidence score should be high (>=0.80)", () => {
    const score = computeConfidenceScore(ctx);
    expect(score).toBeGreaterThanOrEqual(0.80);
  });

  test("risk score should be low (<0.30)", () => {
    const score = computeRiskScore(ctx);
    expect(score).toBeLessThan(0.30);
  });

  test("can auto-execute should be true", () => {
    const conf = computeConfidenceScore(ctx);
    const risk = computeRiskScore(ctx);
    expect(canAutoExecute(ctx, conf, risk)).toBe(true);
  });

  test("decision should be AUTO_EXECUTE", () => {
    const result = decideOrchestration(ctx);
    expect(result.decision).toBe("AUTO_EXECUTE");
  });

  test("no approval gate required", () => {
    const result = decideOrchestration(ctx);
    expect(result.requiredApprovalGate).toBeUndefined();
  });

  test("reason codes include AUTO_EXECUTE_APPROVED", () => {
    const result = decideOrchestration(ctx);
    expect(result.reasonCodes).toContain("AUTO_EXECUTE_APPROVED");
  });
});

// ─── Scenario 2: Structural addition project ─────────────────────────────────

describe("Scenario 2: Residential addition with structural changes", () => {
  const ctx = makeCtx({
    projectType: "residential_single_family",
    workflowType: "PRE_DESIGN",
    captureQualityScore: 0.65,
    dcsScore: 0.62,
    complexityScore: 0.65,
    confidenceSignals: { intent: 0.75, scope: 0.68 },
    systemsImpacted: ["structural", "hvac", "electrical"],
    permitComplexity: "MEDIUM",
    budgetEstimate: 220_000,
    requiresArchitect: true,
    userInputsComplete: true,
  });

  test("risk score should be medium-high (>=0.35)", () => {
    const score = computeRiskScore(ctx);
    expect(score).toBeGreaterThanOrEqual(0.35);
  });

  test("can auto-execute should be false (architect required)", () => {
    const conf = computeConfidenceScore(ctx);
    const risk = computeRiskScore(ctx);
    expect(canAutoExecute(ctx, conf, risk)).toBe(false);
  });

  test("decision should be REQUIRE_APPROVAL or ESCALATE", () => {
    const result = decideOrchestration(ctx);
    expect(["REQUIRE_APPROVAL", "ESCALATE"]).toContain(result.decision);
  });

  test("reason codes include ARCHITECT_REQUIRED", () => {
    const result = decideOrchestration(ctx);
    expect(result.reasonCodes).toContain("ARCHITECT_REQUIRED");
  });

  test("reason codes include STRUCTURAL_REVIEW_REQUIRED", () => {
    const result = decideOrchestration(ctx);
    expect(result.reasonCodes).toContain("STRUCTURAL_REVIEW_REQUIRED");
  });
});

// ─── Scenario 3: Mixed-use / commercial project ───────────────────────────────

describe("Scenario 3: Mixed-use project high complexity", () => {
  const ctx = makeCtx({
    projectType: "mixed_use",
    workflowType: "PERMIT_PREP",
    captureQualityScore: 0.55,
    dcsScore: 0.55,
    complexityScore: 0.85,
    systemsImpacted: ["structural", "hvac", "plumbing", "electrical", "fire_suppression"],
    permitComplexity: "HIGH",
    budgetEstimate: 2_500_000,
    requiresArchitect: true,
    userInputsComplete: false,
  });

  test("risk score should be high (>=0.60)", () => {
    const score = computeRiskScore(ctx);
    expect(score).toBeGreaterThanOrEqual(0.60);
  });

  test("PERMIT_PREP can never auto-execute", () => {
    const conf = computeConfidenceScore(ctx);
    const risk = computeRiskScore(ctx);
    expect(canAutoExecute(ctx, conf, risk)).toBe(false);
  });

  test("decision should be REQUIRE_APPROVAL or ESCALATE", () => {
    const result = decideOrchestration(ctx);
    expect(["REQUIRE_APPROVAL", "ESCALATE"]).toContain(result.decision);
  });

  test("required approval gate should be PERMIT_SUBMISSION", () => {
    const result = decideOrchestration(ctx);
    // PERMIT_PREP always gets PERMIT_SUBMISSION gate
    if (result.decision === "REQUIRE_APPROVAL") {
      expect(result.requiredApprovalGate).toBe("PERMIT_SUBMISSION");
    }
  });

  test("reason codes include HIGH_PERMIT_COMPLEXITY", () => {
    const result = decideOrchestration(ctx);
    expect(result.reasonCodes).toContain("HIGH_PERMIT_COMPLEXITY");
  });

  test("reason codes include HIGH_BUDGET", () => {
    const result = decideOrchestration(ctx);
    expect(result.reasonCodes).toContain("HIGH_BUDGET");
  });
});

// ─── Scenario 4: Payment recommendation over threshold ───────────────────────

describe("Scenario 4: Payment recommendation over threshold", () => {
  const ctx = makeCtx({
    projectType: "residential_single_family",
    workflowType: "PAYMENT_RECOMMENDATION",
    captureQualityScore: 0.88,
    dcsScore: 0.85,
    budgetEstimate: 75_000, // above 50k admin threshold
    userInputsComplete: true,
  });

  test("payment over threshold cannot auto-execute", () => {
    const conf = computeConfidenceScore(ctx);
    const risk = computeRiskScore(ctx);
    expect(canAutoExecute(ctx, conf, risk)).toBe(false);
  });

  test("approval gate should be PAYMENT_RELEASE", () => {
    const result = decideOrchestration(ctx);
    const gate = determineApprovalGate(ctx, result.decision, result.riskScore);
    expect(gate).toBe("PAYMENT_RELEASE");
  });

  test("decision should require approval", () => {
    const result = decideOrchestration(ctx);
    expect(["REQUIRE_APPROVAL", "ESCALATE"]).toContain(result.decision);
  });

  test("reason codes include PAYMENT_AUTHORITY_REQUIRED", () => {
    const result = decideOrchestration(ctx);
    expect(result.reasonCodes).toContain("PAYMENT_AUTHORITY_REQUIRED");
  });
});

// ─── Scenario 5: Permit package ready but not submittable ────────────────────

describe("Scenario 5: Permit package auto-prepare but cannot auto-submit", () => {
  const ctx = makeCtx({
    projectType: "residential_single_family",
    workflowType: "PERMIT_PREP",
    captureQualityScore: 0.90,
    dcsScore: 0.92,
    complexityScore: 0.20,
    permitComplexity: "LOW",
    budgetEstimate: 60_000,
    requiresArchitect: false,
    userInputsComplete: true,
  });

  test("PERMIT_PREP cannot auto-execute regardless of confidence", () => {
    const conf = computeConfidenceScore(ctx);
    const risk = computeRiskScore(ctx);
    expect(canAutoExecute(ctx, conf, risk)).toBe(false);
  });

  test("decision should be REQUIRE_APPROVAL (not ESCALATE)", () => {
    const result = decideOrchestration(ctx);
    // Even with good data, PERMIT_PREP requires approval for submission
    expect(result.decision).toBe("REQUIRE_APPROVAL");
  });

  test("required approval gate is PERMIT_SUBMISSION", () => {
    const result = decideOrchestration(ctx);
    expect(result.requiredApprovalGate).toBe("PERMIT_SUBMISSION");
  });
});

// ─── Scenario 6: Change order ─────────────────────────────────────────────────

describe("Scenario 6: Change order never auto-approves", () => {
  const ctx = makeCtx({
    projectType: "residential_single_family",
    workflowType: "CHANGE_ORDER",
    captureQualityScore: 0.95,
    dcsScore: 0.95,
    budgetEstimate: 5_000,
    userInputsComplete: true,
  });

  test("CHANGE_ORDER can never auto-execute", () => {
    expect(canAutoExecute(ctx, 0.99, 0.01)).toBe(false);
  });

  test("approval gate is always CHANGE_ORDER_APPROVAL", () => {
    const gate = determineApprovalGate(ctx, "REQUIRE_APPROVAL", 0.10);
    expect(gate).toBe("CHANGE_ORDER_APPROVAL");
  });

  test("reason codes include CHANGE_ORDER_GATE", () => {
    const result = decideOrchestration(ctx);
    expect(result.reasonCodes).toContain("CHANGE_ORDER_GATE");
  });
});

// ─── Workflow governor integration ────────────────────────────────────────────

describe("WorkflowGovernor: evaluateAndAdvance", () => {
  test("low-risk capture analysis should dispatch", () => {
    const ctx = makeCtx({
      workflowType: "CAPTURE_ANALYSIS",
      captureQualityScore: 0.88,
      dcsScore: 0.85,
      complexityScore: 0.20,
      userInputsComplete: true,
    });
    const result = evaluateAndAdvance(ctx);
    expect(result.shouldDispatch).toBe(true);
    expect(result.shouldPause).toBe(false);
    expect(result.shouldEscalate).toBe(false);
  });

  test("createApprovalGateIfNeeded creates gate for REQUIRE_APPROVAL", () => {
    const ctx = makeCtx({
      workflowType: "CHANGE_ORDER",
      budgetEstimate: 25_000,
    });
    const result = decideOrchestration(ctx);
    const gate = createApprovalGateIfNeeded(ctx, result);
    expect(gate.shouldCreate).toBe(true);
    expect(gate.gateType).toBe("CHANGE_ORDER_APPROVAL");
    expect(gate.gatePayload.status).toBe("PENDING");
  });

  test("createEscalationIfNeeded creates escalation for ESCALATE", () => {
    const ctx = makeCtx({
      workflowType: "PRE_DESIGN",
      captureQualityScore: 0.10,
      dcsScore: 0.10,
      complexityScore: 0.95,
      systemsImpacted: ["structural", "foundation"],
      budgetEstimate: 3_000_000,
      requiresArchitect: true,
      userInputsComplete: false,
    });
    const result = decideOrchestration(ctx);
    if (result.decision === "ESCALATE") {
      const escalation = createEscalationIfNeeded(ctx, result);
      expect(escalation.shouldEscalate).toBe(true);
      expect(escalation.escalationPayload.projectId).toBe(ctx.projectId);
    }
  });
});

// ─── AI action log ─────────────────────────────────────────────────────────────

describe("AiActionLog", () => {
  test("records decisions from decideOrchestration", () => {
    const ctx = makeCtx({
      projectId: "proj_log_test",
      workflowType: "ESTIMATE",
      captureQualityScore: 0.80,
      dcsScore: 0.75,
      budgetEstimate: 30_000,
    });

    decideOrchestration(ctx);

    const entries = aiActionLog.getBySession("proj_log_test", 5);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].sessionId).toBe("proj_log_test");
    expect(entries[0].outcome).toBeDefined();
  });

  test("getStats returns aggregate data", () => {
    const stats = aiActionLog.getStats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("byOutcome");
    expect(stats).toHaveProperty("autoExecuteRate");
  });
});

// ─── Confidence and risk explanations ────────────────────────────────────────

describe("explainConfidence and explainRisk", () => {
  test("explain confidence returns factors array", () => {
    const ctx = makeCtx({ captureQualityScore: 0.40, dcsScore: 0.35 });
    const { score, factors } = explainConfidence(ctx);
    expect(score).toBeLessThan(0.70);
    expect(factors.length).toBeGreaterThan(0);
    expect(factors.some(f => f.includes("capture"))).toBe(true);
  });

  test("explain risk returns factors array", () => {
    const ctx = makeCtx({
      systemsImpacted: ["structural"],
      permitComplexity: "HIGH",
      budgetEstimate: 800_000,
    });
    const { score, factors } = explainRisk(ctx);
    expect(score).toBeGreaterThan(0.30);
    expect(factors.some(f => f.toLowerCase().includes("structural") || f.toLowerCase().includes("permit"))).toBe(true);
  });
});
