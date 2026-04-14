/**
 * services/api/src/modules/rag/rag.routes.ts
 *
 * POST /api/v1/rag/trigger           — manually trigger DB ingestion (admin)
 * GET  /api/v1/rag/status            — DB ingestion queue status
 * GET  /api/v1/rag/dataset/status    — file-based dataset health
 * POST /api/v1/rag/query             — query the file-based RAG retrieval layer
 * GET  /api/v1/rag/data/:jurisdiction — all records for a jurisdiction
 */

import type { FastifyInstance } from "fastify";
import { triggerImmediateIngestion } from "./rag-nightly-job.js";
import { buildAllIngestPayloads }    from "./document-processor.js";
import {
  buildRAGContext,
  retrievePermitContext,
  retrieveZoningContext,
  retrieveCostContext,
  retrieveWorkflowContext,
  getRAGStatus,
} from "../../lib/orchestrator/retrieval/rag-retriever";

export async function ragRoutes(fastify: FastifyInstance) {
  // ── DB ingestion trigger (unchanged) ─────────────────────────────────────
  fastify.post("/trigger", async (request, reply) => {
    const body = request.body as any;
    const reason = body?.reason ?? "manual-api-trigger";
    const jobId = await triggerImmediateIngestion(reason);
    if (!jobId) {
      return reply.status(503).send({
        error: "RAG queue unavailable — REDIS_URL not configured",
      });
    }
    return reply.send({ jobId, reason, queued: true });
  });

  // ── DB ingestion queue status (unchanged) ─────────────────────────────────
  fastify.get("/status", async (_request, reply) => {
    const payloads = await buildAllIngestPayloads();
    return reply.send({
      documentsReady: payloads.length,
      breakdown: {
        permits:       payloads.filter(p => p.sourceType === "PERMIT_APPLICATION").length,
        intakes:       payloads.filter(p => p.sourceType === "PROJECT_DESCRIPTION").length,
        jurisdictions: payloads.filter(p => p.sourceType === "JURISDICTION_GUIDE").length,
        serviceCatalog:payloads.filter(p => p.sourceType === "SERVICE_CATALOG").length,
      },
      redisConfigured: !!process.env.REDIS_URL,
    });
  });

  // ── File-based dataset health ─────────────────────────────────────────────
  fastify.get("/dataset/status", async (_request, reply) => {
    const s = getRAGStatus();
    return reply.send({
      loaded:      s.loaded,
      records:     s.recordCount,
      source:      "data/rag/full/dmv_full_dataset.jsonl",
    });
  });

  // ── Query file-based RAG ──────────────────────────────────────────────────
  // POST /api/v1/rag/query
  // Body: { jurisdiction?, projectType?, stage?, type? }
  fastify.post("/query", async (request, reply) => {
    const s = getRAGStatus();
    if (!s.loaded) {
      return reply.status(503).send({
        status: "RAG_MISSING",
        message: "RAG dataset not loaded. Check startup logs for [RAG] entries.",
      });
    }

    const body = request.body as any;
    const { jurisdiction = "", projectType = "", stage = "", type } = body;

    if (type === "permit") {
      const results = retrievePermitContext(jurisdiction, projectType);
      return reply.send({ type: "permit", count: results.length, results });
    }
    if (type === "zoning") {
      const results = retrieveZoningContext(jurisdiction);
      return reply.send({ type: "zoning", count: results.length, results });
    }
    if (type === "cost") {
      const results = retrieveCostContext(projectType, jurisdiction);
      return reply.send({ type: "cost", count: results.length, results });
    }
    if (type === "workflow") {
      const results = retrieveWorkflowContext(stage, projectType);
      return reply.send({ type: "workflow", count: results.length, results });
    }

    // Aggregated
    const context = buildRAGContext({ jurisdiction, projectType, stage });
    if (!context) {
      return reply.status(404).send({
        status: "NO_CONTEXT",
        message: `No records for jurisdiction="${jurisdiction}" projectType="${projectType}"`,
      });
    }
    return reply.send({
      jurisdiction, projectType, stage,
      counts: {
        permits:   context.permits.length,
        zoning:    context.zoning.length,
        costs:     context.costs.length,
        workflows: context.workflows.length,
      },
      context,
    });
  });

  // ── All records for a jurisdiction ────────────────────────────────────────
  // GET /api/v1/rag/data/:jurisdiction
  fastify.get("/data/:jurisdiction", async (request, reply) => {
    const s = getRAGStatus();
    if (!s.loaded) {
      return reply.status(503).send({ status: "RAG_MISSING" });
    }
    const { jurisdiction } = request.params as { jurisdiction: string };
    const permits = retrievePermitContext(jurisdiction, "");
    const zoning  = retrieveZoningContext(jurisdiction);
    return reply.send({
      jurisdiction,
      counts: { permits: permits.length, zoning: zoning.length },
      permits,
      zoning,
    });
  });
}
