/**
 * launch-metrics.routes.ts
 *
 * Launch KPI and region management API.
 * Admin only (requireAdmin) for all write operations.
 *
 * GET  /marketplace/launch/dashboard         — full KPI dashboard
 * GET  /marketplace/launch/supply            — supply-side KPIs
 * GET  /marketplace/launch/demand            — demand-side KPIs
 * GET  /marketplace/launch/financial         — financial KPIs
 * GET  /marketplace/launch/quality           — quality KPIs
 * GET  /marketplace/launch/regions           — all regions + status
 * POST /marketplace/launch/regions           — create region (admin)
 * POST /marketplace/launch/regions/:id/launch — mark region as launched (admin)
 * GET  /marketplace/launch/config            — all launch config flags (admin)
 * PUT  /marketplace/launch/config/:key       — upsert a config flag (admin)
 */

import { FastifyInstance } from 'fastify'
import { z }               from 'zod'
import { requireAdmin }    from '../../middleware/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { launchMetricsService } from './launch-metrics.service'
import { prismaAny }            from '../../utils/prisma-helper'

// ── Schemas ───────────────────────────────────────────────────────────────────

const createRegionSchema = z.object({
  name:                  z.string().min(2).max(100),
  slug:                  z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  cities:                z.array(z.string()).min(1),
  states:                z.array(z.string().length(2)).min(1),
  zipCodes:              z.array(z.string()).optional().default([]),
  targetContractorCount: z.coerce.number().int().min(1).default(50),
  targetLeadsPerWeek:    z.coerce.number().int().min(1).default(20),
  costIndexMultiplier:   z.coerce.number().min(0.5).max(3.0).default(1.0),
  timezone:              z.string().default('America/New_York'),
  notes:                 z.string().optional(),
})

const upsertConfigSchema = z.object({
  value:       z.unknown(),
  description: z.string().optional(),
  category:    z.string().optional(),
})

// ── Routes ────────────────────────────────────────────────────────────────────

export async function launchMetricsRoutes(fastify: FastifyInstance) {

  // ── Full dashboard (admin) ─────────────────────────────────────────────────

  fastify.get('/dashboard', {
    preHandler: [requireAdmin],
  }, async (_req, reply) => {
    const data = await launchMetricsService.fullDashboard()
    return reply.send(data)
  })

  // ── Individual metric categories (admin) ───────────────────────────────────

  fastify.get('/supply', {
    preHandler: [requireAdmin],
  }, async (_req, reply) => {
    const metrics = await launchMetricsService.supplyMetrics()
    return reply.send({ metrics })
  })

  fastify.get('/demand', {
    preHandler: [requireAdmin],
  }, async (_req, reply) => {
    const metrics = await launchMetricsService.demandMetrics()
    return reply.send({ metrics })
  })

  fastify.get('/financial', {
    preHandler: [requireAdmin],
  }, async (_req, reply) => {
    const metrics = await launchMetricsService.financialMetrics()
    return reply.send({ metrics })
  })

  fastify.get('/quality', {
    preHandler: [requireAdmin],
  }, async (_req, reply) => {
    const metrics = await launchMetricsService.qualityMetrics()
    return reply.send({ metrics })
  })

  // ── Regions ────────────────────────────────────────────────────────────────

  fastify.get('/regions', {
    preHandler: [requireAdmin],
  }, async (_req, reply) => {
    const regions = await launchMetricsService.regionStatus()
    return reply.send({ regions })
  })

  fastify.post('/regions', {
    preHandler: [requireAdmin, validateBody(createRegionSchema)],
  }, async (req, reply) => {
    const body = req.body as z.infer<typeof createRegionSchema>
    const region = await prismaAny.serviceRegion.create({ data: body })
    return reply.status(201).send({ region })
  })

  fastify.post('/regions/:id/launch', {
    preHandler: [requireAdmin, validateParams(z.object({ id: z.string() }))],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const region = await prismaAny.serviceRegion.update({
      where: { id },
      data:  { isLaunched: true, launchedAt: new Date() },
    })
    return reply.send({ region })
  })

  fastify.post('/regions/:id/pause', {
    preHandler: [requireAdmin, validateParams(z.object({ id: z.string() }))],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const region = await prismaAny.serviceRegion.update({
      where: { id },
      data:  { isLaunched: false },
    })
    return reply.send({ region })
  })

  // ── Launch config flags (admin) ────────────────────────────────────────────

  fastify.get('/config', {
    preHandler: [requireAdmin],
  }, async (_req, reply) => {
    const config = await prismaAny.marketplaceLaunchConfig.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    })
    return reply.send({ config })
  })

  fastify.put('/config/:key', {
    preHandler: [
      requireAdmin,
      validateBody(upsertConfigSchema),
      validateParams(z.object({ key: z.string().min(1).max(100) })),
    ],
  }, async (req, reply) => {
    const { key }             = req.params as { key: string }
    const { value, description, category } = req.body as z.infer<typeof upsertConfigSchema>
    const updatedBy = ((req as any).user?.id) ?? 'system'

    const config = await prismaAny.marketplaceLaunchConfig.upsert({
      where:  { key },
      create: { key, value, description, category: category ?? 'general', updatedBy },
      update: { value, ...(description ? { description } : {}), updatedBy },
    })
    return reply.send({ config })
  })
}
