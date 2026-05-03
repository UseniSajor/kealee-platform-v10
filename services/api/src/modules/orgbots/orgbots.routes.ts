/**
 * OrgBots API Routes
 *
 * POST /api/v1/orgbots/execute — run OrgBot pipeline for a project event
 * GET  /api/v1/orgbots/status  — health check
 * POST /api/v1/orgbots/cost-model — compute cost model for a project
 * GET  /api/v1/orgbots/market  — current market snapshot
 *
 * Used by:
 *   - Command Center (internal automation)
 *   - KeaBot orchestrator (after KeaBot runs complete)
 *   - Stripe webhook (after payment, trigger CFO + CRO)
 */

import type { FastifyInstance } from "fastify";
import { orgBotOrchestrator, type OrgBotEventType } from "../../../../services/orgbots/src/orgbot-orchestrator.js";
import { computeCostModel, computeRiskScore } from "../../../../services/cost-model/src/cost-model.service.js";
import { getMarketSnapshot } from "../../../../services/external-data/src/external-data.service.js";
import type { ProjectType, ComplexityLevel } from "../../../../services/cost-model/src/cost-model.service.js";

export async function orgBotsRoutes(fastify: FastifyInstance) {

  // ── Health ────────────────────────────────────────────────────────────────
  fastify.get("/status", async (_req, reply) => {
    return reply.send({
      orgbots: ["kea-cfo", "kea-coo", "kea-ceo", "kea-cro"],
      status: "ready",
      version: "1.0.0",
    });
  });

  // ── Execute OrgBot pipeline ───────────────────────────────────────────────
  // POST /api/v1/orgbots/execute
  // Body: { projectId, eventType, context, triggeredBy?, urgency?, sessionId? }
  fastify.post<{
    Body: {
      projectId: string;
      eventType: OrgBotEventType;
      context: Record<string, unknown>;
      triggeredBy?: string;
      urgency?: "routine" | "urgent" | "critical";
      sessionId?: string;
    };
  }>("/execute", {
    schema: {
      body: {
        type: "object",
        required: ["projectId", "eventType", "context"],
        properties: {
          projectId:   { type: "string" },
          eventType:   { type: "string" },
          context:     { type: "object" },
          triggeredBy: { type: "string" },
          urgency:     { type: "string", enum: ["routine", "urgent", "critical"] },
          sessionId:   { type: "string" },
        },
      },
    },
  }, async (request, reply) => {
    const { projectId, eventType, context, triggeredBy, urgency, sessionId } = request.body;

    const result = await orgBotOrchestrator.run({
      projectId,
      eventType,
      context,
      triggeredBy: triggeredBy ?? "api",
      urgency: urgency ?? "routine",
      sessionId,
    });

    return reply.send(result);
  });

  // ── Cost Model ────────────────────────────────────────────────────────────
  // POST /api/v1/orgbots/cost-model
  fastify.post<{
    Body: {
      projectType: ProjectType;
      projectSF: number;
      complexity?: ComplexityLevel;
      contingencyPct?: number;
    };
  }>("/cost-model", {
    schema: {
      body: {
        type: "object",
        required: ["projectType", "projectSF"],
        properties: {
          projectType:    { type: "string" },
          projectSF:      { type: "number", minimum: 100 },
          complexity:     { type: "string", enum: ["low", "medium", "high"] },
          contingencyPct: { type: "number", minimum: 0, maximum: 0.5 },
        },
      },
    },
  }, async (request, reply) => {
    const { projectType, projectSF, complexity, contingencyPct } = request.body;
    const model = computeCostModel(projectType, projectSF, complexity, contingencyPct);
    return reply.send(model);
  });

  // ── Risk Score ────────────────────────────────────────────────────────────
  // POST /api/v1/orgbots/risk-score
  fastify.post<{
    Body: {
      costVariancePct: number;
      permitStatus: "obtained" | "pending" | "not_started";
      contractorStatus: "contracted" | "selected" | "searching";
      marketCondition?: "stable" | "volatile" | "distressed";
      complexity?: ComplexityLevel;
    };
  }>("/risk-score", async (request, reply) => {
    const { costVariancePct, permitStatus, contractorStatus, marketCondition, complexity } = request.body;
    const result = computeRiskScore({
      costVariancePct,
      permitStatus,
      contractorStatus,
      marketCondition: marketCondition ?? "stable",
      complexity: complexity ?? "medium",
    });
    return reply.send(result);
  });

  // ── Market Snapshot ────────────────────────────────────────────────────────
  // GET /api/v1/orgbots/market
  fastify.get("/market", async (_req, reply) => {
    const snapshot = await getMarketSnapshot();
    return reply.send(snapshot);
  });
}
