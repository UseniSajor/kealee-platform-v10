/**
 * KeaCore orchestration routes
 *
 * POST /keacore/orchestrate/decide    — evaluate a workflow context, return decision
 * POST /keacore/orchestrate/advance   — evaluate + return dispatch intent
 * POST /keacore/orchestrate/phase-gate — evaluate a project phase transition
 * GET  /keacore/orchestrate/log       — recent AI action log entries
 * GET  /keacore/orchestrate/stats     — action log aggregate stats
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";

// ─── Input schemas ────────────────────────────────────────────────────────────

const WorkflowContextSchema = z.object({
  projectId: z.string(),
  projectType: z.string().optional(),
  phase: z.string().optional(),
  workflowType: z.enum([
    "CAPTURE_ANALYSIS",
    "PRE_DESIGN",
    "ESTIMATE",
    "PERMIT_PREP",
    "CONTRACTOR_MATCH",
    "PM_AUTOMATION",
    "PAYMENT_RECOMMENDATION",
    "CHANGE_ORDER",
  ]),
  captureQualityScore: z.number().min(0).max(1).optional(),
  dcsScore: z.number().min(0).max(1).optional(),
  complexityScore: z.number().min(0).max(1).optional(),
  confidenceSignals: z.record(z.number()).optional(),
  riskSignals: z.record(z.number()).optional(),
  systemsImpacted: z.array(z.string()).optional(),
  permitComplexity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  budgetEstimate: z.number().optional(),
  requiresArchitect: z.boolean().optional(),
  dataCompletenessScore: z.number().min(0).max(1).optional(),
  userInputsComplete: z.boolean().optional(),
});

const PhaseGateSchema = z.object({
  projectId: z.string(),
  fromPhase: z.enum(["discovery", "feasibility", "design", "permitting", "procurement", "construction", "closeout"]),
  toPhase: z.enum(["discovery", "feasibility", "design", "permitting", "procurement", "construction", "closeout"]),
  completedItems: z.array(z.string()).default([]),
  // Optional session context for context-aware evaluation
  requiresStructuralWork: z.boolean().optional(),
  hoaReviewRequired: z.boolean().optional(),
  budgetMax: z.number().optional(),
});

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function orchestrationRoutes(fastify: FastifyInstance): Promise<void> {

  // ── POST /keacore/orchestrate/decide ───────────────────────────────────────
  fastify.post("/orchestrate/decide", async (request, reply) => {
    const body = WorkflowContextSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid request body", issues: body.error.issues });
    }

    const { decideOrchestration, explainConfidence, explainRisk } = await import("@kealee/core");

    const ctx = body.data;
    const result = decideOrchestration(ctx);

    const confidenceExplanation = explainConfidence(ctx);
    const riskExplanation = explainRisk(ctx);

    return reply.send({
      projectId: ctx.projectId,
      workflowType: ctx.workflowType,
      decision: result.decision,
      confidenceScore: result.confidenceScore,
      riskScore: result.riskScore,
      reasonCodes: result.reasonCodes,
      requiredApprovalGate: result.requiredApprovalGate ?? null,
      nextAction: result.nextAction ?? null,
      explanation: {
        confidence: confidenceExplanation.factors,
        risk: riskExplanation.factors,
      },
    });
  });

  // ── POST /keacore/orchestrate/advance ──────────────────────────────────────
  fastify.post("/orchestrate/advance", async (request, reply) => {
    const body = WorkflowContextSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid request body", issues: body.error.issues });
    }

    const {
      evaluateAndAdvance,
      maybeDispatchNextStep,
      createApprovalGateIfNeeded,
      createEscalationIfNeeded,
    } = await import("@kealee/core");

    const ctx = body.data;
    const advance = evaluateAndAdvance(ctx);
    const dispatch = maybeDispatchNextStep(ctx, advance);
    const gate = createApprovalGateIfNeeded(ctx, advance);
    const escalation = createEscalationIfNeeded(ctx, advance);

    return reply.send({
      projectId: ctx.projectId,
      workflowType: ctx.workflowType,
      decision: advance.decision,
      confidenceScore: advance.confidenceScore,
      riskScore: advance.riskScore,
      reasonCodes: advance.reasonCodes,
      shouldDispatch: advance.shouldDispatch,
      shouldPause: advance.shouldPause,
      shouldEscalate: advance.shouldEscalate,
      dispatch,
      gate: gate.shouldCreate ? gate.gatePayload : null,
      escalation: escalation.shouldEscalate ? escalation.escalationPayload : null,
    });
  });

  // ── POST /keacore/orchestrate/phase-gate ───────────────────────────────────
  fastify.post("/orchestrate/phase-gate", async (request, reply) => {
    const body = PhaseGateSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid request body", issues: body.error.issues });
    }

    const { workflowGovernor } = await import("@kealee/core");
    const { OrchestrationContext } = await import("@kealee/core") as any;

    const {
      projectId,
      fromPhase,
      toPhase,
      completedItems,
      requiresStructuralWork,
      hoaReviewRequired,
      budgetMax,
    } = body.data;

    // Build minimal context for the governor
    const ctx = {
      sessionId: projectId,
      projectId,
      source: "api" as const,
      mode: "operator" as const,
      action: "phase_transition" as const,
      riskFlags: [],
      facts: {},
      requiresStructuralWork,
      hoaReviewRequired,
      budgetMax,
    };

    const result = workflowGovernor.evaluatePhaseTransition(ctx, fromPhase, toPhase, completedItems);

    return reply.send({
      projectId,
      ...result,
      // Convenience: HTTP status hint
      httpStatus: result.allowed ? 200 : 422,
    });
  });

  // ── GET /keacore/orchestrate/log ───────────────────────────────────────────
  fastify.get("/orchestrate/log", async (request, reply) => {
    const query = (request.query as Record<string, string>);
    const limit = Math.min(parseInt(query.limit ?? "50", 10), 200);
    const sessionId = query.sessionId;

    const { aiActionLog } = await import("@kealee/core");

    const entries = sessionId
      ? aiActionLog.getBySession(sessionId, limit)
      : aiActionLog.getRecent(limit);

    return reply.send({ entries, count: entries.length });
  });

  // ── GET /keacore/orchestrate/stats ─────────────────────────────────────────
  fastify.get("/orchestrate/stats", async (_request, reply) => {
    const { aiActionLog } = await import("@kealee/core");
    const stats = aiActionLog.getStats();
    return reply.send({ stats });
  });
}
