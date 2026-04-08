/**
 * services/api/src/modules/architect/architect-vip-intake.routes.ts
 *
 * Architect VIP service intake + Stripe checkout
 *
 * POST /architect-vip/intake         — save lead, return intakeId
 * POST /architect-vip/checkout       — create Stripe checkout session
 * GET  /architect-vip/orders         — list user's orders (auth required)
 * GET  /architect-vip/orders/:id     — get single order (auth required)
 */

import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { authenticateUser as authenticate } from '../../middleware/auth.middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-10-16' })

// ── Architect VIP tiers ───────────────────────────────────────────────────────
const ARCHITECT_VIP_TIERS = {
  standard: {
    name: 'Architect VIP — Standard',
    amount: 309900, // $3,099
    turnaround: '7–10 business days',
    description: 'Full permit-ready drawing set with licensed architect + Kealee coordination',
  },
  expedited: {
    name: 'Architect VIP — Expedited',
    amount: 379900, // $3,799
    turnaround: '3–5 business days',
    description: 'Priority architect assignment, expedited drawing set + same-day start',
  },
} as const

type ArchitectVIPTier = keyof typeof ARCHITECT_VIP_TIERS

// ── Schemas ───────────────────────────────────────────────────────────────────
const IntakeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().min(5),
  projectType: z.enum(['renovation', 'addition', 'new-construction', 'adu', 'commercial']),
  projectDescription: z.string().optional(),
  squareFootage: z.string().optional(),
  hasExistingPlans: z.enum(['yes', 'no', 'partial']).default('no'),
  countySlug: z.string().optional(),
  budget: z.string().optional(),
  urgency: z.enum(['standard', 'expedited']).default('standard'),
})

const CheckoutSchema = z.object({
  intakeId: z.string(),
  tier: z.enum(['standard', 'expedited']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export async function architectVIPIntakeRoutes(fastify: FastifyInstance) {

  // ── POST /architect-vip/intake ────────────────────────────────────────────
  fastify.post('/intake', async (request, reply) => {
    try {
      const body = IntakeSchema.parse(request.body)

      const messageParts = [
        `address=${body.address}`,
        `projectType=${body.projectType}`,
        `urgency=${body.urgency}`,
        body.squareFootage ? `sqft=${body.squareFootage}` : null,
        body.countySlug ? `county=${body.countySlug}` : null,
        body.hasExistingPlans !== 'no' ? `existingPlans=${body.hasExistingPlans}` : null,
        body.budget ? `budget=${body.budget}` : null,
        body.projectDescription ? `desc=${body.projectDescription.slice(0, 200)}` : null,
      ].filter(Boolean).join(' | ')

      const lead = await prismaAny.permitServiceLead.create({
        data: {
          fullName: body.name,
          company: '',
          email: body.email,
          phone: body.phone ?? null,
          role: 'homeowner_or_contractor',
          contractorType: body.projectType,
          licenseNumber: null,
          yearsInBusiness: 'unknown',
          jurisdictions: body.countySlug ? [body.countySlug] : [],
          permitsPerMonth: '1',
          servicesNeeded: ['architect_vip'],
          urgency: body.urgency === 'expedited' ? 'urgent' : 'standard',
          message: messageParts,
          status: 'NEW',
          priority: body.urgency === 'expedited' ? 'HIGH' : 'MEDIUM',
          source: 'WEB_ARCHITECT_VIP_INTAKE',
          consent: true,
        },
        select: { id: true },
      })

      return reply.code(201).send({ ok: true, intakeId: lead.id })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to save architect VIP intake') })
    }
  })

  // ── POST /architect-vip/checkout ──────────────────────────────────────────
  fastify.post('/checkout', async (request, reply) => {
    try {
      const body = CheckoutSchema.parse(request.body)
      const tier = ARCHITECT_VIP_TIERS[body.tier as ArchitectVIPTier]

      const intake = await prismaAny.permitServiceLead.findUnique({
        where: { id: body.intakeId },
        select: { id: true, email: true, fullName: true, message: true },
      })
      if (!intake) return reply.code(404).send({ error: 'Intake not found' })

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: intake.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: tier.amount,
              product_data: { name: tier.name, description: tier.description },
            },
            quantity: 1,
          },
        ],
        metadata: {
          source: 'architect-vip',
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

  // ── GET /architect-vip/orders ─────────────────────────────────────────────
  fastify.get('/orders', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = (request as any).user?.id
      const orders = await prismaAny.architectVIPOrder.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      return orders
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch orders') })
    }
  })

  // ── GET /architect-vip/orders/:id ─────────────────────────────────────────
  fastify.get('/orders/:id', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = (request as any).user?.id
      const { id } = request.params as { id: string }
      const order = await prismaAny.architectVIPOrder.findFirst({ where: { id, userId } })
      if (!order) return reply.code(404).send({ error: 'Order not found' })
      return order
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch order') })
    }
  })
}
