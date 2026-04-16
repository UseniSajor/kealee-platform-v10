/**
 * services/api/src/modules/agents/agents.routes.ts
 *
 * RAG-powered construction agent endpoints.
 * Each agent is a decision engine — NOT a chatbot.
 * Every response MUST include next_step + cta to drive conversion.
 *
 * POST /api/v1/agents/land/execute
 * POST /api/v1/agents/design/execute
 * POST /api/v1/agents/permit/execute
 * POST /api/v1/agents/contractor/execute
 * GET  /api/v1/agents/status
 */

import type { FastifyInstance } from "fastify";
import { executeLandAgent }       from "../../lib/orchestrator/agents/land-agent";
import { executeDesignAgent }     from "../../lib/orchestrator/agents/design-agent";
import { executePermitAgent }     from "../../lib/orchestrator/agents/permit-agent";
import { executeContractorAgent } from "../../lib/orchestrator/agents/contractor-agent";
import { getRAGStatus }           from "../../lib/orchestrator/retrieval/rag-retriever";

export async function agentsRoutes(fastify: FastifyInstance) {
  // ── Health check ──────────────────────────────────────────────────────────
  fastify.get("/status", async (_req, reply) => {
    const rag = getRAGStatus();
    return reply.send({
      agents: ["land", "design", "permit", "contractor"],
      rag: { loaded: rag.loaded, recordCount: rag.recordCount },
      ready: rag.loaded,
    });
  });

  // ── Land agent ────────────────────────────────────────────────────────────
  // POST /api/v1/agents/land/execute
  // Body: { jurisdiction, projectType?, address?, acreage? }
  fastify.post("/land/execute", async (request, reply) => {
    const body = request.body as any;
    if (!body?.jurisdiction) {
      return reply.code(400).send({ error: "jurisdiction is required" });
    }
    const result = await executeLandAgent({
      jurisdiction: String(body.jurisdiction),
      projectType:  body.projectType  ?? "single-family",
      address:      body.address,
      acreage:      body.acreage,
    });
    return reply.send(result);
  });

  // ── Design agent ──────────────────────────────────────────────────────────
  // POST /api/v1/agents/design/execute
  // Body: { projectType, jurisdiction?, sqft? }
  fastify.post("/design/execute", async (request, reply) => {
    const body = request.body as any;
    if (!body?.projectType) {
      return reply.code(400).send({ error: "projectType is required" });
    }
    const result = await executeDesignAgent({
      projectType:  String(body.projectType),
      jurisdiction: body.jurisdiction,
      sqft:         body.sqft ? Number(body.sqft) : undefined,
    });
    return reply.send(result);
  });

  // ── Permit agent ──────────────────────────────────────────────────────────
  // POST /api/v1/agents/permit/execute
  // Body: { jurisdiction, projectType? }
  fastify.post("/permit/execute", async (request, reply) => {
    const body = request.body as any;
    if (!body?.jurisdiction) {
      return reply.code(400).send({ error: "jurisdiction is required" });
    }
    const result = await executePermitAgent({
      jurisdiction: String(body.jurisdiction),
      projectType:  body.projectType ?? "single-family",
    });
    return reply.send(result);
  });

  // ── Contractor agent ──────────────────────────────────────────────────────
  // POST /api/v1/agents/contractor/execute
  // Body: { projectType, jurisdiction?, sqft? }
  fastify.post("/contractor/execute", async (request, reply) => {
    const body = request.body as any;
    if (!body?.projectType) {
      return reply.code(400).send({ error: "projectType is required" });
    }
    const result = await executeContractorAgent({
      projectType:  String(body.projectType),
      jurisdiction: body.jurisdiction,
      sqft:         body.sqft ? Number(body.sqft) : undefined,
    });
    return reply.send(result);
  });
}
