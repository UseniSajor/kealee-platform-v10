/**
 * v30 admin / analytics / white-label API stubs (P2)
 */
import type { FastifyInstance } from 'fastify'
import { prisma } from '@kealee/database'
import {
  V30_BOT_REGISTRY,
  V30_PARALLEL_BOT_TYPES,
  DEFAULT_V30_PRICING_FORMULA,
  isV30Enabled,
} from '@kealee/kealee-agent-stack'

export async function v30AdminRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/bots', async (_request, reply) => {
    const configs = await prisma.v30BotConfiguration.findMany().catch(() => [])
    const registry = Object.values(V30_BOT_REGISTRY).map(b => ({
      botType: b.type,
      displayName: b.displayName,
      defaultModel: b.defaultModel,
      timeoutSeconds: b.timeoutSeconds,
      parallel: V30_PARALLEL_BOT_TYPES.includes(b.type),
      dbOverride: configs.find(c => c.botType === b.type) ?? null,
    }))
    return reply.send({ bots: registry })
  })

  fastify.get('/admin/pricing', async (_request, reply) => {
    const row = await prisma.v30PricingFormula.findFirst({ orderBy: { updatedAt: 'desc' } }).catch(() => null)
    return reply.send({
      active: row ?? { formula: DEFAULT_V30_PRICING_FORMULA, source: 'kealee-agent-stack/pricing.ts' },
    })
  })

  fastify.get('/admin/metrics', async (_request, reply) => {
    const [executions, packages] = await Promise.all([
      prisma.v30BotExecution.groupBy({
        by: ['botType', 'status'],
        _count: true,
      }).catch(() => []),
      prisma.v30CustomPackage.count({ where: { status: 'PAID' } }).catch(() => 0),
    ])
    return reply.send({
      enabled: isV30Enabled(),
      paidPackages: packages,
      executionsByBot: executions,
    })
  })

  fastify.get('/analytics/summary', async (_request, reply) => {
    const total = await prisma.v30BotExecution.count().catch(() => 0)
    const complete = await prisma.v30BotExecution.count({ where: { status: 'COMPLETE' } }).catch(() => 0)
    return reply.send({
      totalExecutions: total,
      completeExecutions: complete,
      conversionRate: total ? complete / total : 0,
    })
  })

  fastify.get('/white-label/partners', async (_request, reply) => {
    const partners = await prisma.v30WhiteLabelConfig.findMany({ take: 50 }).catch(() => [])
    return reply.send({ partners })
  })

  fastify.post('/white-label/partners', async (request, reply) => {
    const body = request.body as { partnerId?: string; companyName?: string; companyEmail?: string }
    if (!body.partnerId || !body.companyName) {
      return reply.code(400).send({ error: 'partnerId and companyName required' })
    }
    try {
      const created = await prisma.v30WhiteLabelConfig.create({
        data: {
          partnerId: body.partnerId,
          companyName: body.companyName,
          companyEmail: body.companyEmail ?? `partner+${body.partnerId}@kealee.com`,
          primaryColor: '#7C3AED',
        },
      })
      return reply.code(201).send(created)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Create failed'
      return reply.code(503).send({ error: message })
    }
  })
}
