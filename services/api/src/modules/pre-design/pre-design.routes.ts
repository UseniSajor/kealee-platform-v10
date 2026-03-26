/**
 * AI Pre-Design API Routes
 *
 * GET  /pre-design/session/:id     — poll session status
 * POST /pre-design/session         — create session (dev/internal)
 * POST /pre-design/session/:id/complete — mark completed (worker callback)
 * POST /pre-design/session/:id/route   — run execution router
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { routeExecution } from '@kealee/concept-engine'
import { buildExportPackage } from '@kealee/concept-engine'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const CreateSessionBody = z.object({
  projectType:     z.enum(['EXTERIOR_FACADE', 'INTERIOR_ADDITION', 'LANDSCAPE_OUTDOOR']),
  tier:            z.enum(['STARTER', 'VISUALIZATION', 'PRE_DESIGN']),
  intakeId:        z.string().optional(),
  projectId:       z.string().optional(),
  stripeSessionId: z.string().optional(),
  pricePaidCents:  z.number().optional(),
  captureMode:     z.enum(['PHOTOS', 'SMARTSCAN', 'PRO_SCAN']).optional(),
})

const CompleteSessionBody = z.object({
  confidenceScore:     z.number().min(0).max(1).optional(),
  complexityScore:     z.number().min(0).max(1).optional(),
  conceptSummary:      z.record(z.any()).optional(),
  styleProfile:        z.record(z.any()).optional(),
  budgetRange:         z.record(z.any()).optional(),
  feasibilitySummary:  z.record(z.any()).optional(),
  zoningSummary:       z.record(z.any()).optional(),
  buildabilitySummary: z.record(z.any()).optional(),
  scopeOfWork:         z.record(z.any()).optional(),
  systemsImpact:       z.record(z.any()).optional(),
  estimateFramework:   z.record(z.any()).optional(),
  outputImages:        z.array(z.object({
    url:     z.string(),
    label:   z.string().optional(),
    caption: z.string().optional(),
  })).optional(),
  outputPdfUrl:      z.string().optional(),
  outputJsonUrl:     z.string().optional(),
  outputDxfUrl:      z.string().optional(),
  outputSketchupUrl: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export async function preDesignRoutes(fastify: FastifyInstance) {

  // GET /pre-design/session/:id — poll status
  fastify.get('/session/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const rows = await prismaAny.$queryRaw`
        SELECT
          id, project_id, intake_id, project_type, tier, status,
          capture_mode, confidence_score, complexity_score,
          requires_architect, architect_routed, execution_route,
          concept_summary, style_profile, budget_range,
          feasibility_summary, zoning_summary, buildability_summary,
          scope_of_work, systems_impact, estimate_framework,
          output_images, output_pdf_url, output_json_url,
          output_dxf_url, output_sketchup_url,
          stripe_session_id, price_paid_cents,
          export_package_version, created_at, updated_at
        FROM "ProjectConceptPreDesign"
        WHERE id = ${id}
        LIMIT 1
      ` as Array<Record<string, any>>

      if (!rows.length) {
        // Try by stripe_session_id (for post-checkout polling)
        const byStripe = await prismaAny.$queryRaw`
          SELECT id, status, tier, project_type, execution_route,
            confidence_score, requires_architect,
            output_pdf_url, concept_summary, output_images
          FROM "ProjectConceptPreDesign"
          WHERE stripe_session_id = ${id}
          LIMIT 1
        ` as Array<Record<string, any>>

        if (!byStripe.length) {
          return reply.status(404).send({ error: 'Session not found' })
        }
        return reply.send(byStripe[0])
      }

      return reply.send(rows[0])
    } catch (err: any) {
      fastify.log.error(err, 'pre-design GET /session/:id')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // POST /pre-design/session — create (called by worker/webhook after payment)
  fastify.post('/session', async (request, reply) => {
    const body = CreateSessionBody.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: body.error.errors })
    }

    const { projectType, tier, intakeId, projectId, stripeSessionId, pricePaidCents, captureMode } = body.data

    try {
      const rows = await prismaAny.$queryRaw`
        INSERT INTO "ProjectConceptPreDesign"
          (project_type, tier, status, intake_id, project_id,
           stripe_session_id, price_paid_cents, capture_mode,
           created_at, updated_at)
        VALUES
          (${projectType}::"PreDesignProjectType",
           ${tier}::"PreDesignTier",
           'PENDING_PAYMENT'::"PreDesignStatus",
           ${intakeId ?? null},
           ${projectId ?? null},
           ${stripeSessionId ?? null},
           ${pricePaidCents ?? null},
           ${captureMode ? `${captureMode}::"PreDesignCaptureMode"` : null},
           NOW(), NOW())
        RETURNING id, status, tier, project_type
      ` as Array<Record<string, any>>

      return reply.status(201).send(rows[0])
    } catch (err: any) {
      fastify.log.error(err, 'pre-design POST /session')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // POST /pre-design/session/:id/complete — mark complete + store outputs
  fastify.post('/session/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = CompleteSessionBody.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.errors })
    }

    const d = body.data

    try {
      await prismaAny.$executeRaw`
        UPDATE "ProjectConceptPreDesign" SET
          status               = 'COMPLETED'::"PreDesignStatus",
          confidence_score     = ${d.confidenceScore ?? null},
          complexity_score     = ${d.complexityScore ?? null},
          concept_summary      = ${d.conceptSummary ? JSON.stringify(d.conceptSummary) : null}::jsonb,
          style_profile        = ${d.styleProfile ? JSON.stringify(d.styleProfile) : null}::jsonb,
          budget_range         = ${d.budgetRange ? JSON.stringify(d.budgetRange) : null}::jsonb,
          feasibility_summary  = ${d.feasibilitySummary ? JSON.stringify(d.feasibilitySummary) : null}::jsonb,
          zoning_summary       = ${d.zoningSummary ? JSON.stringify(d.zoningSummary) : null}::jsonb,
          buildability_summary = ${d.buildabilitySummary ? JSON.stringify(d.buildabilitySummary) : null}::jsonb,
          scope_of_work        = ${d.scopeOfWork ? JSON.stringify(d.scopeOfWork) : null}::jsonb,
          systems_impact       = ${d.systemsImpact ? JSON.stringify(d.systemsImpact) : null}::jsonb,
          estimate_framework   = ${d.estimateFramework ? JSON.stringify(d.estimateFramework) : null}::jsonb,
          output_images        = ${d.outputImages ? JSON.stringify(d.outputImages) : null}::jsonb,
          output_pdf_url       = ${d.outputPdfUrl ?? null},
          output_json_url      = ${d.outputJsonUrl ?? null},
          output_dxf_url       = ${d.outputDxfUrl ?? null},
          output_sketchup_url  = ${d.outputSketchupUrl ?? null},
          updated_at           = NOW()
        WHERE id = ${id}
      `

      return reply.send({ success: true, id, status: 'COMPLETED' })
    } catch (err: any) {
      fastify.log.error(err, 'pre-design POST /session/:id/complete')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // POST /pre-design/session/:id/route — run execution router
  fastify.post('/session/:id/route', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const rows = await prismaAny.$queryRaw`
        SELECT project_type, tier, confidence_score, complexity_score, buildability_summary
        FROM "ProjectConceptPreDesign"
        WHERE id = ${id} LIMIT 1
      ` as Array<Record<string, any>>

      if (!rows.length) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      const row = rows[0]
      const buildability = row.buildability_summary as any

      const result = routeExecution({
        projectType: row.project_type,
        tier: row.tier,
        confidenceScore: row.confidence_score ?? undefined,
        complexityScore: row.complexity_score ?? undefined,
        buildabilityFlags: buildability?.flags ?? [],
        structuralChange: buildability?.structuralChange ?? false,
        permitRequired: buildability?.permitRequired ?? false,
      })

      // Persist routing result
      await prismaAny.$executeRaw`
        UPDATE "ProjectConceptPreDesign" SET
          execution_route    = ${result.executionRoute}::"ExecutionRoute",
          requires_architect = ${result.requiresArchitect},
          architect_routed   = ${result.architectRouted},
          status             = CASE WHEN ${result.requiresArchitect} THEN 'ARCHITECT_ROUTED'::"PreDesignStatus" ELSE status END,
          updated_at         = NOW()
        WHERE id = ${id}
      `

      // If architect required, create ArchitectEngagement record
      if (result.requiresArchitect || result.architectRouted) {
        const existing = await prismaAny.$queryRaw`
          SELECT id FROM "ArchitectEngagement" WHERE pre_design_id = ${id} LIMIT 1
        ` as Array<{ id: string }>

        if (!existing.length) {
          const summary = { routingNotes: result.routingNotes, executionRoute: result.executionRoute }
          await prismaAny.$executeRaw`
            INSERT INTO "ArchitectEngagement"
              (pre_design_id, status, intake_summary, created_at, updated_at)
            VALUES
              (${id}, 'NEW'::"ArchitectEngagementStatus",
               ${JSON.stringify(summary)}::jsonb,
               NOW(), NOW())
          `
        }
      }

      return reply.send({ ...result, sessionId: id })
    } catch (err: any) {
      fastify.log.error(err, 'pre-design POST /session/:id/route')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // POST /pre-design/session/:id/export — build export package manifest
  fastify.post('/session/:id/export', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const rows = await prismaAny.$queryRaw`
        SELECT * FROM "ProjectConceptPreDesign" WHERE id = ${id} LIMIT 1
      ` as Array<Record<string, any>>

      if (!rows.length) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      const r = rows[0]
      const pkg = buildExportPackage({
        preDesignId: id,
        projectType: r.project_type,
        tier: r.tier,
        executionRoute: r.execution_route ?? 'AI_ONLY',
        confidenceScore: r.confidence_score ?? undefined,
        complexityScore: r.complexity_score ?? undefined,
        conceptSummary: r.concept_summary,
        styleProfile: r.style_profile,
        budgetRange: r.budget_range,
        feasibilitySummary: r.feasibility_summary,
        zoningSummary: r.zoning_summary,
        buildabilitySummary: r.buildability_summary,
        scopeOfWork: r.scope_of_work,
        systemsImpact: r.systems_impact,
        estimateFramework: r.estimate_framework,
        outputImages: r.output_images ?? [],
      })

      return reply.send(pkg)
    } catch (err: any) {
      fastify.log.error(err, 'pre-design POST /session/:id/export')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })
}
