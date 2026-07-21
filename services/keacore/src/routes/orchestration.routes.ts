/**
 * KeaCore orchestration routes
 *
 * POST /keacore/orchestrate/decide    — evaluate a workflow context, return decision
 * POST /keacore/orchestrate/advance   — evaluate + return dispatch intent
 * POST /keacore/orchestrate/phase-gate — evaluate a project phase transition
 * POST /keacore/orchestrate/pm-phase-gate — Kealee PM phase gate
 * GET  /keacore/orchestrate/log       — recent AI action log entries (in-memory + DB)
 * GET  /keacore/orchestrate/stats     — action log aggregate stats
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@kealee/database";

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

const PmPhaseGateSchema = z.object({
  projectId: z.string(),
  fromPhase: z.enum(["PRE_DESIGN", "ARCHITECT", "PERMIT", "PRE_CONSTRUCTION", "CONSTRUCTION", "CLOSEOUT"]),
  toPhase: z.enum(["PRE_DESIGN", "ARCHITECT", "PERMIT", "PRE_CONSTRUCTION", "CONSTRUCTION", "CLOSEOUT"]),
  completedItems: z.array(z.string()).default([]),
  requiresStructuralWork: z.boolean().optional(),
  hoaReviewRequired: z.boolean().optional(),
  budgetMax: z.number().optional(),
});

// ─── DB helpers (fire-and-forget — never block the response path) ─────────────

function persistActionLog(data: {
  projectId: string;
  sessionId?: string;
  workflowType: string;
  actionType: string;
  inputPayload?: unknown;
  outputPayload?: unknown;
  confidenceScore?: number;
  riskScore?: number;
  decision?: string;
  reasonCodes?: unknown;
  approvalGateId?: string;
}): void {
  prisma.orchestrationActionLog
    .create({
      data: {
        projectId: data.projectId,
        sessionId: data.sessionId,
        workflowType: data.workflowType,
        actionType: data.actionType,
        inputPayload: data.inputPayload ?? undefined,
        outputPayload: data.outputPayload ?? undefined,
        confidenceScore: data.confidenceScore,
        riskScore: data.riskScore,
        decision: data.decision,
        reasonCodes: data.reasonCodes ?? undefined,
        approvalGateId: data.approvalGateId,
      },
    })
    .catch(() => { /* swallow — log is best-effort */ });
}

function persistGate(data: {
  projectId: string;
  sessionId?: string;
  gateType: string;
  workflowType: string;
  decisionPayload?: unknown;
  reasonCodes?: unknown;
  confidenceScore?: number;
  riskScore?: number;
}): Promise<string> {
  return prisma.orchestrationGate
    .create({
      data: {
        projectId: data.projectId,
        sessionId: data.sessionId,
        gateType: data.gateType,
        workflowType: data.workflowType,
        status: "PENDING",
        decisionPayload: data.decisionPayload ?? undefined,
        reasonCodes: data.reasonCodes ?? undefined,
        confidenceScore: data.confidenceScore,
        riskScore: data.riskScore,
      },
      select: { id: true },
    })
    .then((g) => g.id)
    .catch(() => ""); // return empty string on failure — caller handles
}

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

    // Persist to DB (fire-and-forget)
    persistActionLog({
      projectId: ctx.projectId,
      workflowType: ctx.workflowType,
      actionType: "DECIDE",
      inputPayload: ctx,
      outputPayload: result,
      confidenceScore: result.confidenceScore,
      riskScore: result.riskScore,
      decision: result.decision,
      reasonCodes: result.reasonCodes,
    });

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

    // Persist gate to DB first (we want its ID in the action log)
    let gateId: string | undefined;
    if (gate.shouldCreate && gate.gatePayload) {
      gateId = await persistGate({
        projectId: ctx.projectId,
        gateType: gate.gatePayload.gateType as string,
        workflowType: ctx.workflowType,
        decisionPayload: gate.gatePayload,
        reasonCodes: advance.reasonCodes,
        confidenceScore: advance.confidenceScore,
        riskScore: advance.riskScore,
      }) || undefined;
    }

    // Persist action log (fire-and-forget)
    persistActionLog({
      projectId: ctx.projectId,
      workflowType: ctx.workflowType,
      actionType: "ADVANCE",
      inputPayload: ctx,
      outputPayload: { advance, dispatch, gate: gate.gatePayload, escalation: escalation.escalationPayload },
      confidenceScore: advance.confidenceScore,
      riskScore: advance.riskScore,
      decision: advance.decision,
      reasonCodes: advance.reasonCodes,
      approvalGateId: gateId,
    });

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
      gate: gate.shouldCreate ? { ...gate.gatePayload, dbId: gateId } : null,
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

    // Persist (fire-and-forget)
    persistActionLog({
      projectId,
      workflowType: "PHASE_GATE",
      actionType: "PHASE_TRANSITION",
      inputPayload: { fromPhase, toPhase, completedItems },
      outputPayload: result,
      decision: result.allowed ? "AUTO_EXECUTE" : "BLOCK",
    });

    return reply.send({
      projectId,
      ...result,
      httpStatus: result.allowed ? 200 : 422,
    });
  });

  // ── GET /keacore/orchestrate/log ───────────────────────────────────────────
  // ?source=memory|db|both (default: both — memory first, DB fallback)
  fastify.get("/orchestrate/log", async (request, reply) => {
    const query = (request.query as Record<string, string>);
    const limit = Math.min(parseInt(query.limit ?? "50", 10), 200);
    const sessionId = query.sessionId;
    const source = query.source ?? "both";

    const { aiActionLog } = await import("@kealee/core");

    // In-memory
    const memEntries = source !== "db"
      ? (sessionId ? aiActionLog.getBySession(sessionId, limit) : aiActionLog.getRecent(limit))
      : [];

    // DB (when explicitly requested or memory is empty)
    let dbEntries: unknown[] = [];
    if (source === "db" || (source === "both" && memEntries.length === 0)) {
      dbEntries = await prisma.orchestrationActionLog
        .findMany({
          where: sessionId ? { sessionId } : undefined,
          orderBy: { createdAt: "desc" },
          take: limit,
        })
        .catch(() => []);
    }

    const entries = source === "db" ? dbEntries : memEntries.length > 0 ? memEntries : dbEntries;
    return reply.send({ entries, count: (entries as unknown[]).length, source: memEntries.length > 0 ? "memory" : "db" });
  });

  // ── GET /keacore/orchestrate/stats ─────────────────────────────────────────
  fastify.get("/orchestrate/stats", async (_request, reply) => {
    const { aiActionLog } = await import("@kealee/core");
    const stats = aiActionLog.getStats();
    return reply.send({ stats });
  });

  // ── POST /keacore/orchestrate/pm-phase-gate ────────────────────────────────
  // Evaluates Kealee PM project phase transitions:
  //   PRE_DESIGN → ARCHITECT → PERMIT → PRE_CONSTRUCTION → CONSTRUCTION → CLOSEOUT
  fastify.post("/orchestrate/pm-phase-gate", async (request, reply) => {
    const body = PmPhaseGateSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid request body", issues: body.error.issues });
    }

    const { workflowGovernor } = await import("@kealee/core");

    const {
      projectId,
      fromPhase,
      toPhase,
      completedItems,
      requiresStructuralWork,
      hoaReviewRequired,
      budgetMax,
    } = body.data;

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

    const result = workflowGovernor.evaluatePmPhaseTransition(ctx, fromPhase, toPhase, completedItems);

    // Persist (fire-and-forget)
    persistActionLog({
      projectId,
      workflowType: "PM_PHASE_GATE",
      actionType: "PM_PHASE_TRANSITION",
      inputPayload: { fromPhase, toPhase, completedItems },
      outputPayload: result,
      decision: result.allowed ? "AUTO_EXECUTE" : "BLOCK",
    });

    return reply.send({
      projectId,
      ...result,
      httpStatus: result.allowed ? 200 : 422,
    });
  });
}
