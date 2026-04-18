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
    try {
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
      console.log(`[agent:land] executed — confidence: ${result.confidence}, cta: ${result.cta}`);
      return reply.send({
        success: true,
        ...result,
        recommendations: result.risks?.slice(0, 3) ?? [],
      });
    } catch (err: any) {
      console.error(`[agent:land] error:`, err.message);
      return reply.send({
        success: false,
        summary: "Unable to analyze land availability — using standard guidance.",
        risks: ["Manual review recommended"],
        recommendations: ["Schedule a consultation with our team"],
        confidence: "low" as const,
        next_step: "Our team will review your project and follow up within 24 hours.",
        cta: "Submit for Review",
        conversion_product: "CONSULTATION",
      });
    }
  });

  // ── Design agent ──────────────────────────────────────────────────────────
  // POST /api/v1/agents/design/execute
  // Body: { projectType, jurisdiction?, sqft? }
  fastify.post("/design/execute", async (request, reply) => {
    try {
      const body = request.body as any;
      if (!body?.projectType) {
        return reply.code(400).send({ error: "projectType is required" });
      }
      const result = await executeDesignAgent({
        projectType:  String(body.projectType),
        jurisdiction: body.jurisdiction,
        sqft:         body.sqft ? Number(body.sqft) : undefined,
      });
      console.log(`[agent:design] executed — confidence: ${result.confidence}, cta: ${result.cta}`);
      return reply.send({
        success: true,
        ...result,
        recommendations: result.risks?.slice(0, 3) ?? [],
      });
    } catch (err: any) {
      console.error(`[agent:design] error:`, err.message);
      return reply.send({
        success: false,
        summary: "Unable to analyze design costs — using standard estimate.",
        risks: ["Manual review recommended"],
        recommendations: ["Request a custom cost estimate", "Prepare site photos"],
        confidence: "low" as const,
        next_step: "Our team will review your project and follow up within 24 hours.",
        cta: "Order Design Concept",
        conversion_product: "DESIGN_CONCEPT",
      });
    }
  });

  // ── Permit agent ──────────────────────────────────────────────────────────
  // POST /api/v1/agents/permit/execute
  // Body: { jurisdiction, projectType? }
  fastify.post("/permit/execute", async (request, reply) => {
    try {
      const body = request.body as any;
      if (!body?.jurisdiction) {
        return reply.code(400).send({ error: "jurisdiction is required" });
      }
      const result = await executePermitAgent({
        jurisdiction: String(body.jurisdiction),
        projectType:  body.projectType ?? "single-family",
      });
      console.log(`[agent:permit] executed — confidence: ${result.confidence}, cta: ${result.cta}`);
      return reply.send({
        success: true,
        ...result,
        recommendations: result.risks?.slice(0, 3) ?? [],
      });
    } catch (err: any) {
      console.error(`[agent:permit] error:`, err.message);
      return reply.send({
        success: false,
        summary: "Unable to analyze permit requirements — using standard package.",
        risks: ["Jurisdiction data unavailable"],
        recommendations: ["Verify local requirements", "Check with your city building department"],
        confidence: "low" as const,
        next_step: "Our team will review your project and follow up within 24 hours.",
        cta: "Order Permit Package",
        conversion_product: "PERMIT_PACKAGE",
      });
    }
  });

  // ── Contractor agent ──────────────────────────────────────────────────────
  // POST /api/v1/agents/contractor/execute
  // Body: { projectType, jurisdiction?, sqft? }
  fastify.post("/contractor/execute", async (request, reply) => {
    try {
      const body = request.body as any;
      if (!body?.projectType) {
        return reply.code(400).send({ error: "projectType is required" });
      }
      const result = await executeContractorAgent({
        projectType:  String(body.projectType),
        jurisdiction: body.jurisdiction,
        sqft:         body.sqft ? Number(body.sqft) : undefined,
      });
      console.log(`[agent:contractor] executed — confidence: ${result.confidence}, cta: ${result.cta}`);
      return reply.send({
        success: true,
        ...result,
        recommendations: result.risks?.slice(0, 3) ?? [],
      });
    } catch (err: any) {
      console.error(`[agent:contractor] error:`, err.message);
      return reply.send({
        success: false,
        summary: "Unable to match contractors — using standard matching criteria.",
        risks: ["Contractor database unavailable"],
        recommendations: ["Provide more project details", "Upload reference photos"],
        confidence: "low" as const,
        next_step: "Our team will review your project and follow up within 24 hours.",
        cta: "Match with Contractor",
        conversion_product: "CONTRACTOR_MATCH",
      });
    }
  });
}
