/**
 * services/api/src/modules/permits/permit-intake.routes.ts
 *
 * Public permit intake + Stripe checkout — no auth required.
 *
 * POST /permits/intake            — save lead, return intakeId
 * POST /permits/intake-checkout   — create Stripe checkout session
 * GET  /permits/intake/:id        — get intake status (polling)
 */

import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-10-16' })

// ── Permit tiers ──────────────────────────────────────────────────────────────
const PERMIT_TIERS = {
  simple: {
    name: 'Permit Research + Checklist',
    envKey: 'STRIPE_PRICE_PERMIT_SIMPLE',
    description: 'Jurisdiction requirements, document checklist, fee schedule',
  },
  package: {
    name: 'Full Permit Package',
    envKey: 'STRIPE_PRICE_PERMIT_PACKAGE',
    description: 'Complete permit-ready submission package reviewed for first-cycle approval',
  },
  coordination: {
    name: 'Permit Coordination Service',
    envKey: 'STRIPE_PRICE_PERMIT_COORDINATION',
    description: 'We manage the full submission, follow-ups, and corrections on your behalf',
  },
  expediting: {
    name: 'Expedited Permit Filing',
    envKey: 'STRIPE_PRICE_PERMIT_EXPEDITING',
    description: 'Priority queue, direct examiner contact, and status tracking',
  },
} as const

type PermitTier = keyof typeof PERMIT_TIERS

// ── Schemas ───────────────────────────────────────────────────────────────────
const IntakeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  address: z.string().min(5),
  projectType: z.enum(['residential', 'addition', 'new-construction', 'commercial']),
  hasPlans: z.enum(['yes', 'no']),
  projectDescription: z.string().optional(),
  squareFootage: z.string().optional(),
  countySlug: z.string().optional(),
})

const CheckoutSchema = z.object({
  intakeId: z.string(),
  tier: z.enum(['simple', 'package', 'coordination', 'expediting']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export async function permitIntakeRoutes(fastify: FastifyInstance) {

  // ── POST /permits/intake ──────────────────────────────────────────────────
  fastify.post('/intake', async (request, reply) => {
    try {
      const body = IntakeSchema.parse(request.body)

      const lead = await prismaAny.permitServiceLead.create({
        data: {
          fullName: body.name,
          company: '',
          email: body.email,
          phone: null,
          role: 'homeowner_or_contractor',
          contractorType: body.projectType,
          licenseNumber: null,
          yearsInBusiness: 'unknown',
          jurisdictions: body.countySlug ? [body.countySlug] : [],
          permitsPerMonth: '1',
          servicesNeeded: ['permit_filing'],
          urgency: 'standard',
          message: body.projectDescription ?? '',
          status: 'NEW',
          priority: 'MEDIUM',
          source: 'WEB_PERMIT_INTAKE',
          consent: true,
          metadata: {
            projectType: body.projectType,
            hasPlans: body.hasPlans,
            squareFootage: body.squareFootage ?? null,
            address: body.address,
            countySlug: body.countySlug ?? null,
          },
        },
        select: { id: true },
      })

      return reply.code(201).send({ ok: true, intakeId: lead.id })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to save permit intake') })
    }
  })

  // ── POST /permits/intake-checkout ─────────────────────────────────────────
  fastify.post('/intake-checkout', async (request, reply) => {
    try {
      const body = CheckoutSchema.parse(request.body)
      const tier = PERMIT_TIERS[body.tier as PermitTier]
      const priceId = process.env[tier.envKey]

      if (!priceId) {
        fastify.log.error(`Stripe price not configured: ${tier.envKey}`)
        return reply.code(500).send({ error: `Permit pricing not configured for tier: ${body.tier}` })
      }

      const intake = await prismaAny.permitServiceLead.findUnique({
        where: { id: body.intakeId },
        select: { id: true, email: true, fullName: true, metadata: true },
      })
      if (!intake) return reply.code(404).send({ error: 'Intake not found' })

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: intake.email,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          source: 'permit-package',
          tier: body.tier,
          tierName: tier.name,
          intakeId: body.intakeId,
          customerEmail: intake.email ?? '',
          customerName: intake.fullName ?? '',
        },
        success_url: body.successUrl,
        cancel_url: body.cancelUrl,
      })

      return { ok: true, sessionId: session.id, url: session.url }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to create checkout session') })
    }
  })

  // ── GET /permits/intake/:id ───────────────────────────────────────────────
  fastify.get('/intake/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const lead = await prismaAny.permitServiceLead.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          fullName: true,
          email: true,
          createdAt: true,
          metadata: true,
        },
      })
      if (!lead) return reply.code(404).send({ error: 'Not found' })
      return lead
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch intake') })
    }
  })
}
