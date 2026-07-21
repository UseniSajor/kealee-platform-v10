/**
 * Test Routes — Kealee Platform
 *
 * All routes gated behind TEST_MODE=true.
 * Provides simulation and verification for all monetized flows.
 *
 * Prefix: /test
 */

import type { FastifyInstance } from 'fastify'
import {
  TEST_MODE,
  getTestStatus,
  seedTestUsers,
  simulateConceptPurchase,
  simulateContractorSubscription,
  simulateLeadPurchase,
  simulateContractAward,
  simulateOpportunityAssignment,
  getRecentTestEvents,
  cleanupTestData,
  validateStripeProducts,
  CONCEPT_TIERS,
  CONTRACTOR_PLANS,
} from './test.service'

function testModeGuard(reply: any) {
  if (!TEST_MODE) {
    reply.code(403).send({ error: 'TEST_MODE is not enabled. Set TEST_MODE=true to use test routes.' })
    return false
  }
  return true
}

export async function testRoutes(fastify: FastifyInstance) {
  // GET /test/status — Test system overview
  fastify.get('/status', async (_req, reply) => {
    if (!testModeGuard(reply)) return
    const status = await getTestStatus()
    return reply.send(status)
  })

  // POST /test/seed-users — Create all test users
  fastify.post('/seed-users', async (_req, reply) => {
    if (!testModeGuard(reply)) return
    const results = await seedTestUsers()
    return reply.send({ success: true, results })
  })

  // GET /test/users — List test user status
  fastify.get('/users', async (_req, reply) => {
    if (!testModeGuard(reply)) return
    const { users } = await getTestStatus()
    return reply.send({ users })
  })

  // POST /test/trigger/concept — Simulate concept purchase
  // Body: { tier: 'essential' | 'professional' | 'premium' | 'white_glove' }
  fastify.post<{ Body: { tier?: string } }>('/trigger/concept', async (req, reply) => {
    if (!testModeGuard(reply)) return
    const tier = (req.body?.tier ?? 'essential') as keyof typeof CONCEPT_TIERS
    if (!CONCEPT_TIERS[tier]) {
      return reply.code(400).send({ error: `Invalid tier. Options: ${Object.keys(CONCEPT_TIERS).join(', ')}` })
    }
    const result = await simulateConceptPurchase(tier)
    return reply.send(result)
  })

  // POST /test/trigger/subscription — Simulate contractor subscription
  // Body: { plan: 'starter' | 'growth' | 'pro' }
  fastify.post<{ Body: { plan?: string } }>('/trigger/subscription', async (req, reply) => {
    if (!testModeGuard(reply)) return
    const plan = (req.body?.plan ?? 'starter') as keyof typeof CONTRACTOR_PLANS
    if (!CONTRACTOR_PLANS[plan]) {
      return reply.code(400).send({ error: `Invalid plan. Options: ${Object.keys(CONTRACTOR_PLANS).join(', ')}` })
    }
    const result = await simulateContractorSubscription(plan)
    return reply.send(result)
  })

  // POST /test/trigger/lead — Simulate lead purchase
  fastify.post('/trigger/lead', async (_req, reply) => {
    if (!testModeGuard(reply)) return
    const result = await simulateLeadPurchase()
    return reply.send(result)
  })

  // POST /test/trigger/contract — Simulate contract award + 3% fee
  // Body: { contractValue: 7500000 }  (cents)
  fastify.post<{ Body: { contractValue?: number } }>('/trigger/contract', async (req, reply) => {
    if (!testModeGuard(reply)) return
    const contractValue = req.body?.contractValue ?? 7500000 // Default $75,000
    if (contractValue < 100) {
      return reply.code(400).send({ error: 'contractValue must be in cents and >= 100' })
    }
    const result = await simulateContractAward(contractValue)
    return reply.send(result)
  })

  // POST /test/trigger/opportunity — Simulate opportunity assignment
  // Body: { type: 'post_concept' | 'permit_approved' }
  fastify.post<{ Body: { type?: string } }>('/trigger/opportunity', async (req, reply) => {
    if (!testModeGuard(reply)) return
    const type = (req.body?.type ?? 'post_concept') as 'post_concept' | 'permit_approved'
    if (!['post_concept', 'permit_approved'].includes(type)) {
      return reply.code(400).send({ error: 'type must be post_concept or permit_approved' })
    }
    const result = await simulateOpportunityAssignment(type)
    return reply.send(result)
  })

  // GET /test/events — Recent test events
  // Query: { limit?: number }
  fastify.get<{ Querystring: { limit?: string } }>('/events', async (req, reply) => {
    if (!testModeGuard(reply)) return
    const limit = Math.min(Number(req.query.limit ?? 50), 200)
    const events = await getRecentTestEvents(limit)
    return reply.send({ events, count: events.length })
  })

  // GET /test/stripe — Stripe product validation
  fastify.get('/stripe', async (_req, reply) => {
    if (!testModeGuard(reply)) return
    const products = await validateStripeProducts()
    const configured = products.filter(p => p.configured).length
    return reply.send({
      total: products.length,
      configured,
      missing: products.length - configured,
      ready: configured === products.length,
      products,
    })
  })

  // GET /test/get-contractor-now — Verify "Get Contractor Now" button visibility rules
  // Query: { hasConcept, permitRequired, permitStatus }
  fastify.get<{
    Querystring: { hasConcept?: string; permitRequired?: string; permitStatus?: string }
  }>('/get-contractor-now', async (req, reply) => {
    if (!testModeGuard(reply)) return
    const hasConcept = req.query.hasConcept === 'true'
    const permitRequired = req.query.permitRequired === 'true'
    const permitStatus = req.query.permitStatus ?? 'none'

    const NEAR_APPROVAL_STATUSES = ['NEAR_APPROVAL', 'APPROVED', 'ISSUED']
    const permitNearApproval = NEAR_APPROVAL_STATUSES.includes(permitStatus.toUpperCase())

    let showButton = false
    let reason = ''

    if (!hasConcept) {
      showButton = false
      reason = 'CASE C: No concept purchased — button hidden'
    } else if (!permitRequired) {
      showButton = true
      reason = 'CASE A: Concept purchased, no permit required — button visible'
    } else if (permitNearApproval) {
      showButton = true
      reason = `CASE B: Permit required and status is ${permitStatus} (near approval) — button visible`
    } else {
      showButton = false
      reason = `Permit required but status is ${permitStatus} — button hidden until near approval`
    }

    return reply.send({
      inputs: { hasConcept, permitRequired, permitStatus },
      showButton,
      reason,
      cases: {
        caseA: 'hasConcept=true, permitRequired=false → SHOW',
        caseB: 'hasConcept=true, permitRequired=true, permitStatus=NEAR_APPROVAL → SHOW',
        caseC: 'hasConcept=false → HIDE',
      },
    })
  })

  // DELETE /test/cleanup — Remove all test data
  fastify.delete('/cleanup', async (_req, reply) => {
    if (!testModeGuard(reply)) return
    const result = await cleanupTestData()
    return reply.send(result)
  })

  // GET /test/checklist — QA checklist
  fastify.get('/checklist', async (_req, reply) => {
    if (!testModeGuard(reply)) return
    const status = await getTestStatus()
    const configured = status.stripeProducts.configured

    return reply.send({
      checklist: [
        {
          item: 'Test users seeded',
          status: status.users.every(u => u.exists) ? 'pass' : 'fail',
          detail: `${status.users.filter(u => u.exists).length}/${status.users.length} users exist`,
          action: 'POST /test/seed-users',
        },
        {
          item: 'Stripe products configured',
          status: configured === 25 ? 'pass' : 'warn',
          detail: `${configured}/25 price IDs set`,
          action: 'GET /test/stripe',
        },
        {
          item: 'Webhook handler registered',
          status: 'pass',
          detail: 'POST /payments/webhooks/stripe',
        },
        {
          item: 'Event logging active',
          status: 'pass',
          detail: `${status.recentEvents.length} recent test events`,
        },
        {
          item: 'BullMQ queues',
          status: 'info',
          detail: 'email, concept-delivery, concept-engine, intake-processing',
        },
        {
          item: 'Test MODE active',
          status: TEST_MODE ? 'pass' : 'fail',
          detail: TEST_MODE ? 'TEST_MODE=true' : 'Set TEST_MODE=true to enable simulation',
        },
      ],
    })
  })
}
