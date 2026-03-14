/**
 * onboarding.routes.ts
 *
 * Contractor onboarding funnel API.
 * Public:  GET  /marketplace/onboarding/mine
 * Auth:    POST /marketplace/onboarding/advance
 * Admin:   GET  /marketplace/onboarding/admin/list
 *          GET  /marketplace/onboarding/admin/stats
 *          POST /marketplace/onboarding/admin/:userId/approve
 *          POST /marketplace/onboarding/admin/:userId/reject
 *          POST /marketplace/cohorts           (create cohort)
 *          GET  /marketplace/cohorts           (list cohorts)
 */

import { FastifyInstance } from 'fastify'
import { z }               from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { requireAdmin }     from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { onboardingService, OBStage, STAGE_ORDER } from './onboarding.service'
import { prismaAny } from '../../utils/prisma-helper'

// ── Schemas ───────────────────────────────────────────────────────────────────

const advanceBodySchema = z.object({
  stage:    z.enum(STAGE_ORDER as [OBStage, ...OBStage[]]),
  formData: z.record(z.unknown()).optional(),
})

const listQuerySchema = z.object({
  stage:    z.string().optional(),
  region:   z.string().optional(),
  cohortId: z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(200).default(50),
  cursor:   z.string().optional(),
})

const rejectBodySchema = z.object({
  reason: z.string().min(10).max(500),
})

const createCohortBodySchema = z.object({
  name:       z.string().min(2).max(100),
  regionSlug: z.string().min(2).max(50),
  targetSize: z.coerce.number().int().min(1).max(500).default(25),
  inviteCode: z.string().optional(),
  notes:      z.string().optional(),
})

// ── Routes ────────────────────────────────────────────────────────────────────

export async function onboardingRoutes(fastify: FastifyInstance) {

  // ── Contractor: get own onboarding state ──────────────────────────────────

  fastify.get('/onboarding/mine', {
    preHandler: [authenticateUser],
  }, async (req, reply) => {
    const userId = (req as any).user.id
    const ob = await onboardingService.getByUser(userId)
    if (!ob) return reply.status(404).send({ error: 'No onboarding record found' })
    return reply.send({ onboarding: ob })
  })

  // ── Contractor: advance funnel stage ────────────────────────────────────

  fastify.post('/onboarding/advance', {
    preHandler: [authenticateUser, validateBody(advanceBodySchema)],
  }, async (req, reply) => {
    const userId  = (req as any).user.id
    const { stage, formData } = req.body as z.infer<typeof advanceBodySchema>

    // Ensure record exists (first call after registration)
    const user = await prismaAny.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    await onboardingService.getOrCreate(userId, user.email)
    const updated = await onboardingService.advanceStage(userId, stage, formData)
    return reply.send({ onboarding: updated })
  })

  // ── Admin: paginated list ─────────────────────────────────────────────────

  fastify.get('/onboarding/admin/list', {
    preHandler: [requireAdmin, validateQuery(listQuerySchema)],
  }, async (req, reply) => {
    const q = req.query as z.infer<typeof listQuerySchema>
    const items = await onboardingService.list({
      stage:    q.stage as OBStage | undefined,
      region:   q.region,
      cohortId: q.cohortId,
      limit:    q.limit,
      cursor:   q.cursor,
    })
    return reply.send({ items, count: items.length })
  })

  // ── Admin: funnel stats ───────────────────────────────────────────────────

  fastify.get('/onboarding/admin/stats', {
    preHandler: [requireAdmin],
  }, async (_req, reply) => {
    const [stats, avgDays] = await Promise.all([
      onboardingService.funnelStats(),
      onboardingService.avgTimeToApproval(),
    ])
    return reply.send({ ...stats, avgDaysToApproval: avgDays })
  })

  // ── Admin: approve ────────────────────────────────────────────────────────

  fastify.post('/onboarding/admin/:userId/approve', {
    preHandler: [requireAdmin, validateParams(z.object({ userId: z.string() }))],
  }, async (req, reply) => {
    const { userId } = req.params as { userId: string }
    const updated = await onboardingService.approve(userId)
    return reply.send({ onboarding: updated })
  })

  // ── Admin: reject ─────────────────────────────────────────────────────────

  fastify.post('/onboarding/admin/:userId/reject', {
    preHandler: [requireAdmin, validateBody(rejectBodySchema), validateParams(z.object({ userId: z.string() }))],
  }, async (req, reply) => {
    const { userId } = req.params as { userId: string }
    const { reason } = req.body as z.infer<typeof rejectBodySchema>
    const updated = await onboardingService.reject(userId, reason)
    return reply.send({ onboarding: updated })
  })

  // ── Admin: cohorts ────────────────────────────────────────────────────────

  fastify.get('/cohorts', {
    preHandler: [requireAdmin],
  }, async (_req, reply) => {
    const cohorts = await prismaAny.launchCohort.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { onboardings: true } } },
    })
    return reply.send({ cohorts })
  })

  fastify.post('/cohorts', {
    preHandler: [requireAdmin, validateBody(createCohortBodySchema)],
  }, async (req, reply) => {
    const body = req.body as z.infer<typeof createCohortBodySchema>
    const cohort = await prismaAny.launchCohort.create({ data: body })
    return reply.status(201).send({ cohort })
  })
}
