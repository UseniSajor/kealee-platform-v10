/**
 * services/api/src/modules/agents/agents.routes.ts
 *
 * RAG-powered construction agent endpoints.
 * Each agent is a decision engine — NOT a chatbot.
 * Every response MUST include next_step + cta to drive conversion.
 *
 * Live DB context (Parcel, ZoningProfile, FeasibilityStudy, DigitalTwin) is
 * fetched INSIDE each agent via live-db.ts — routes just forward projectId + address.
 *
 * POST /api/v1/agents/land/execute
 * POST /api/v1/agents/design/execute
 * POST /api/v1/agents/estimate/execute
 * POST /api/v1/agents/permit/execute
 * POST /api/v1/agents/contractor/execute
 * GET  /api/v1/agents/status
 */

import type { FastifyInstance } from "fastify";
import { executeLandAgent }       from "../../lib/orchestrator/agents/land-agent";
import { executeDesignAgent }     from "../../lib/orchestrator/agents/design-agent";
import { executeEstimateAgent }   from "../../lib/orchestrator/agents/estimate-agent";
import { executePermitAgent }     from "../../lib/orchestrator/agents/permit-agent";
import { executeContractorAgent } from "../../lib/orchestrator/agents/contractor-agent";
import { getRAGStatus }           from "../../lib/orchestrator/retrieval/rag-retriever";

export async function agentsRoutes(fastify: FastifyInstance) {
  // ── Health check ──────────────────────────────────────────────────────────
  fastify.get("/status", async (_req, reply) => {
    const rag = getRAGStatus();
    return reply.send({
      agents: ["land", "design", "estimate", "permit", "contractor"],
      rag: { loaded: rag.loaded, recordCount: rag.recordCount },
      ready: rag.loaded,
    });
  });

  // ── Land agent ────────────────────────────────────────────────────────────
  // POST /api/v1/agents/land/execute
  // Body: { jurisdiction, projectType?, address?, acreage?, sqft?, projectId? }
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
        acreage:      body.acreage      ? Number(body.acreage) : undefined,
        sqft:         body.sqft         ? Number(body.sqft)    : undefined,
        projectId:    body.projectId,
      });
      fastify.log.info({ agent: 'land', confidence: result.confidence, cta: result.cta }, 'agent executed');
      return reply.send({
        success: true,
        ...result,
        nextStep: result.next_step,
        recommendations: result.risks?.slice(0, 3) ?? [],
      });
    } catch (err: any) {
      fastify.log.error({ agent: 'land', err: err.message }, 'agent error');
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

  // ── Estimate agent ────────────────────────────────────────────────────────
  // POST /api/v1/agents/estimate/execute
  // Body: { projectType, jurisdiction?, sqft?, address?, projectId? }
  fastify.post("/estimate/execute", async (request, reply) => {
    try {
      const body = request.body as any;
      if (!body?.projectType) {
        return reply.code(400).send({ error: "projectType is required" });
      }
      const result = await executeEstimateAgent({
        projectType:  String(body.projectType),
        jurisdiction: body.jurisdiction,
        sqft:         body.sqft ? Number(body.sqft) : undefined,
        address:      body.address,
        projectId:    body.projectId,
      });
      fastify.log.info({ agent: 'estimate', confidence: result.confidence, cta: result.cta }, 'agent executed');
      return reply.send({
        success: true,
        ...result,
        nextStep: result.next_step,
        recommendations: result.risks?.slice(0, 3) ?? [],
      });
    } catch (err: any) {
      fastify.log.error({ agent: 'estimate', err: err.message }, 'agent error');
      return reply.send({
        success: false,
        summary: "Unable to generate cost estimate — using standard reference data.",
        risks: ["Manual review recommended"],
        recommendations: ["Request a detailed cost estimate", "Provide project scope documents"],
        confidence: "low" as const,
        next_step: "Our team will review your project and follow up within 24 hours.",
        cta: "Order Cost Estimate",
        conversion_product: "PERMIT_PACKAGE",
      });
    }
  });

  // ── Design agent ──────────────────────────────────────────────────────────
  // POST /api/v1/agents/design/execute
  // Body: { projectType, jurisdiction?, sqft?, address?, projectId? }
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
        address:      body.address,
        projectId:    body.projectId,
      });
      fastify.log.info({ agent: 'design', confidence: result.confidence, cta: result.cta }, 'agent executed');
      return reply.send({
        success: true,
        ...result,
        nextStep: result.next_step,
        recommendations: result.risks?.slice(0, 3) ?? [],
      });
    } catch (err: any) {
      fastify.log.error({ agent: 'design', err: err.message }, 'agent error');
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
  // Body: { jurisdiction, projectType?, sqft?, address?, projectId? }
  fastify.post("/permit/execute", async (request, reply) => {
    try {
      const body = request.body as any;
      if (!body?.jurisdiction) {
        return reply.code(400).send({ error: "jurisdiction is required" });
      }
      const result = await executePermitAgent({
        jurisdiction: String(body.jurisdiction),
        projectType:  body.projectType ?? "single-family",
        sqft:         body.sqft        ? Number(body.sqft) : undefined,
        address:      body.address,
        projectId:    body.projectId,
      });
      fastify.log.info({ agent: 'permit', confidence: result.confidence, cta: result.cta }, 'agent executed');
      return reply.send({
        success: true,
        ...result,
        nextStep: result.next_step,
        recommendations: result.risks?.slice(0, 3) ?? [],
      });
    } catch (err: any) {
      fastify.log.error({ agent: 'permit', err: err.message }, 'agent error');
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
  // Body: { projectType, jurisdiction?, sqft?, address?, projectId? }
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
        address:      body.address,
        projectId:    body.projectId,
      });
      fastify.log.info({ agent: 'contractor', confidence: result.confidence, cta: result.cta }, 'agent executed');
      return reply.send({
        success: true,
        ...result,
        nextStep: result.next_step,
        recommendations: result.risks?.slice(0, 3) ?? [],
      });
    } catch (err: any) {
      fastify.log.error({ agent: 'contractor', err: err.message }, 'agent error');
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
