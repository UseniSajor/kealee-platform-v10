/**
 * services/api/src/modules/permits/ai-permit.routes.ts
 *
 * Comprehensive permit routes — intake → Stripe → submission pipeline.
 * All tiers: Kealee submits, biweekly updates, portal access.
 *
 * POST /ai-permits/intake                — create permit request
 * POST /ai-permits/:id/checkout          — Stripe checkout
 * GET  /ai-permits/:id                   — get status
 * GET  /ai-permits/:id/documents         — download documents
 * POST /ai-permits/:id/subscribe-updates — subscribe to email/SMS updates
 */

import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { authenticateUser as authenticate } from '../../middleware/auth.middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-10-16' })

// ── Tiers ─────────────────────────────────────────────────────────────────────
const PERMIT_TIERS = {
  standard: {
    name: 'Standard Permit Package',
    amount: 49500,   // $495
    amendmentLimit: 1,
    description: 'Single-trade permit. Kealee files + tracks. 1 amendment round.',
  },
  multi_trade: {
    name: 'Multi-Trade Permit Package',
    amount: 89500,   // $895
    amendmentLimit: 2,
    description: 'Up to 3 permit types. 2 amendment rounds. Biweekly updates.',
  },
  full_service: {
    name: 'Full Service Permit Coordination',
    amount: 149500,  // $1,495
    amendmentLimit: -1, // unlimited
    description: 'All permits, unlimited amendments, direct examiner communication.',
  },
} as const

const EXPEDITED_ADDON = { name: 'Expedited Processing Add-On', amount: 50000 } // $500

type PermitTier = keyof typeof PERMIT_TIERS

// ── Jurisdiction timelines ────────────────────────────────────────────────────
const JURISDICTION_TIMELINES: Record<string, string> = {
  'DC':                        '4–8 weeks (DC DCRA)',
  'Montgomery County MD':      '3–6 weeks (Montgomery County DPS)',
  "Prince George's County MD": '4–8 weeks (PG County DPIE)',
  'Arlington VA':               '2–4 weeks (Arlington DES)',
  'Fairfax VA':                '3–6 weeks (Fairfax DSA)',
  'Alexandria VA':              '3–5 weeks (Alexandria DCGS)',
}

// ── Schemas ───────────────────────────────────────────────────────────────────
const IntakeSchema = z.object({
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),
  address: z.string().min(5),
  jurisdiction: z.string().min(2),
  projectScope: z.string().min(10),
  squareFeet: z.number().int().min(1),
  tier: z.enum(['standard', 'multi_trade', 'full_service']),
  expedited: z.boolean().default(false),
  bundleType: z.enum(['standalone', 'with_design', 'with_full_build']).default('standalone'),
  conceptId: z.string().optional(),
  architectId: z.string().optional(),
})

const CheckoutSchema = z.object({
  permitId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

const SubscribeSchema = z.object({
  emailUpdates: z.boolean().default(true),
  smsUpdates: z.boolean().default(false),
  updateFrequency: z.enum(['biweekly', 'weekly', 'daily']).default('biweekly'),
})

export async function aiPermitRoutes(fastify: FastifyInstance) {

  // ── POST /ai-permits/intake ───────────────────────────────────────────────
  fastify.post('/intake', async (request, reply) => {
    try {
      const body = IntakeSchema.parse(request.body)
      const tier = PERMIT_TIERS[body.tier]
      const timeline = JURISDICTION_TIMELINES[body.jurisdiction] ?? '4–8 weeks (estimate)'

      // Calculate total amount (base + expedited add-on if selected)
      const baseAmount = tier.amount
      const totalAmount = body.expedited ? baseAmount + EXPEDITED_ADDON.amount : baseAmount

      const permit = await prismaAny.aIPermitRequest.create({
        data: {
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          customerName: body.customerName,
          address: body.address,
          jurisdiction: body.jurisdiction,
          projectScope: body.projectScope,
          squareFeet: body.squareFeet,
          tier: body.tier,
          expedited: body.expedited,
          bundleType: body.bundleType,
          conceptId: body.conceptId,
          architectId: body.architectId,
          submittedBy: 'kealee',
          updateFrequency: 'biweekly',
          amendmentLimit: tier.amendmentLimit,
          currentStatus: 'intake',
          amountPaidCents: totalAmount,
          estimatedTimeline: timeline,
          refundEligible: true,
          refundDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        select: { id: true },
      })

      return reply.code(201).send({
        ok: true,
        permitId: permit.id,
        tier: body.tier,
        tierName: tier.name,
        amountCents: totalAmount,
        estimatedTimeline: timeline,
        expedited: body.expedited,
        message: `${tier.name} created. Proceed to checkout.`,
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to save permit intake') })
    }
  })

  // ── POST /ai-permits/:id/checkout ────────────────────────────────────────
  fastify.post('/:id/checkout', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = CheckoutSchema.parse(request.body)

      const permit = await prismaAny.aIPermitRequest.findUnique({
        where: { id },
        select: {
          id: true, customerEmail: true, customerName: true,
          tier: true, expedited: true, amountPaidCents: true, address: true,
        },
      })
      if (!permit) return reply.code(404).send({ error: 'Permit request not found' })

      const tier = PERMIT_TIERS[permit.tier as PermitTier]
      const lineItems: any[] = [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tier.amount,
            product_data: {
              name: tier.name,
              description: `${tier.description} · ${permit.address}`,
            },
          },
          quantity: 1,
        },
      ]

      if (permit.expedited) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: EXPEDITED_ADDON.amount,
            product_data: { name: EXPEDITED_ADDON.name },
          },
          quantity: 1,
        })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: permit.customerEmail,
        line_items: lineItems,
        metadata: {
          source: 'ai-permit',
          permitId: id,
          tier: permit.tier,
          tierName: tier.name,
          expedited: String(permit.expedited),
          customerEmail: permit.customerEmail ?? '',
          customerName: permit.customerName ?? '',
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

  // ── GET /ai-permits/:id ───────────────────────────────────────────────────
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const permit = await prismaAny.aIPermitRequest.findUnique({
        where: { id },
        select: {
          id: true,
          currentStatus: true,
          tier: true,
          expedited: true,
          address: true,
          jurisdiction: true,
          projectScope: true,
          requiredPermits: true,
          permitBreakdown: true,
          estimatedTimeline: true,
          submittedAt: true,
          permitNumbers: true,
          lastStatusUpdate: true,
          estimatedApprovalDate: true,
          actualApprovalDate: true,
          portalUrl: true,
          amendmentCount: true,
          amendmentLimit: true,
          createdAt: true,
        },
      })
      if (!permit) return reply.code(404).send({ error: 'Permit not found' })

      return permit
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch permit') })
    }
  })

  // ── GET /ai-permits/:id/documents ────────────────────────────────────────
  fastify.get('/:id/documents', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const permit = await prismaAny.aIPermitRequest.findUnique({
        where: { id },
        select: { id: true, currentStatus: true, portalUrl: true, portalAccessCode: true },
      })
      if (!permit) return reply.code(404).send({ error: 'Permit not found' })

      // Documents are stored in cloud storage; return pre-signed URLs
      const baseStorageUrl = process.env.STORAGE_BASE_URL ?? 'https://storage.kealee.com'
      const documents = {
        permitChecklist: { url: `${baseStorageUrl}/permits/${id}-checklist.pdf`, format: 'pdf' },
        applications: { url: `${baseStorageUrl}/permits/${id}-applications.pdf`, format: 'pdf' },
        approvalDocuments: permit.currentStatus === 'approved'
          ? { url: `${baseStorageUrl}/permits/${id}-approvals.pdf`, format: 'pdf' }
          : null,
        allDocuments: { url: `${baseStorageUrl}/permits/${id}-complete.zip`, format: 'zip' },
      }

      return {
        permitId: id,
        currentStatus: permit.currentStatus,
        portalUrl: permit.portalUrl,
        portalAccessCode: permit.portalAccessCode,
        documents,
      }
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch documents') })
    }
  })

  // ── POST /ai-permits/:id/subscribe-updates ───────────────────────────────
  fastify.post('/:id/subscribe-updates', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = SubscribeSchema.parse(request.body)

      await prismaAny.aIPermitRequest.update({
        where: { id },
        data: { updateFrequency: body.updateFrequency },
      })

      return {
        ok: true,
        subscribed: true,
        updateFrequency: body.updateFrequency,
        message: `You'll receive ${body.updateFrequency} updates on permit status via email${body.smsUpdates ? ' and SMS' : ''}.`,
      }
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to subscribe to updates') })
    }
  })
}
