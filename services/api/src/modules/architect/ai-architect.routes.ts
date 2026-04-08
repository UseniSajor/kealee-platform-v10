/**
 * services/api/src/modules/architect/ai-architect.routes.ts
 *
 * Comprehensive Architect VIP routes — intake → Stripe → architect pipeline.
 * Verified pricing: $3,890 (starter) / $5,500 (medium) / $7,500 (large) / CFQ (enterprise)
 *
 * POST /ai-architect/intake              — create service request
 * POST /ai-architect/:id/checkout        — Stripe checkout
 * GET  /ai-architect/:id                 — project status
 * POST /ai-architect/:id/request-revision
 * GET  /ai-architect/:id/deliverables    — download all drawings
 */

import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { authenticateUser as authenticate } from '../../middleware/auth.middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-10-16' })

// ── Verified tiers ────────────────────────────────────────────────────────────
const ARCH_TIERS = {
  starter: {
    name: 'Architect VIP — Starter',
    amount: 389000,   // $3,890
    turnaround: '7–10 business days',
    sqftRange: '0–800 sqft',
    revisionLimit: 2,
    description: 'Single-space permit-ready drawing set. Licensed architect stamp.',
  },
  medium: {
    name: 'Architect VIP — Medium',
    amount: 550000,   // $5,500
    turnaround: '10–14 business days',
    sqftRange: '800–2,000 sqft',
    revisionLimit: 2,
    description: 'Multi-room or full-floor permit-ready drawings.',
  },
  large: {
    name: 'Architect VIP — Large',
    amount: 750000,   // $7,500
    turnaround: '14–21 business days',
    sqftRange: '2,000–3,500 sqft',
    revisionLimit: 3,
    description: 'Whole-home or addition permit-ready drawings.',
  },
  // enterprise: $9,500+ — Contact For Quote; no Stripe session
} as const

type ArchTier = keyof typeof ARCH_TIERS

const ADDITIONAL_REVISION_COST = 25000 // $250 in cents

// ── Schemas ───────────────────────────────────────────────────────────────────
const IntakeSchema = z.object({
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),
  serviceType: z.enum(['conversion', 'standalone']).default('standalone'),
  conceptId: z.string().optional(),
  projectType: z.string().min(2),
  projectDescription: z.string().optional(),
  location: z.string().min(5),
  jurisdiction: z.string().min(2),
  squareFeet: z.number().int().min(50),
  hasExistingPlans: z.enum(['yes', 'no', 'partial']).default('no'),
  budget: z.string().optional(),
})

const CheckoutSchema = z.object({
  architectId: z.string(),
  tier: z.enum(['starter', 'medium', 'large']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

const RevisionSchema = z.object({
  revisionNotes: z.string().min(10),
  paymentToken: z.string().optional(),
})

// ── Recommend tier from sqft ──────────────────────────────────────────────────
function recommendTier(sqft: number): string {
  if (sqft <= 800) return 'starter'
  if (sqft <= 2000) return 'medium'
  if (sqft <= 3500) return 'large'
  return 'enterprise'
}

export async function aiArchitectRoutes(fastify: FastifyInstance) {

  // ── POST /ai-architect/intake ─────────────────────────────────────────────
  fastify.post('/intake', async (request, reply) => {
    try {
      const body = IntakeSchema.parse(request.body)
      const recommendedTier = recommendTier(body.squareFeet)
      const isEnterprise = recommendedTier === 'enterprise'

      const arch = await prismaAny.aIArchitectVIPService.create({
        data: {
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          customerName: body.customerName,
          serviceType: body.serviceType,
          conceptId: body.conceptId ?? undefined,
          projectType: body.projectType,
          projectDescription: body.projectDescription ?? '',
          location: body.location,
          jurisdiction: body.jurisdiction,
          squareFeet: body.squareFeet,
          priceStarting: 389000,
          priceEnding: 950000,
          status: 'intake',
          revisionLimit: 2,
        },
        select: { id: true },
      })

      return reply.code(201).send({
        ok: true,
        architectId: arch.id,
        recommendedTier,
        enterpriseRequired: isEnterprise,
        priceRange: isEnterprise ? '$9,500+ (custom quote)' : `$${(ARCH_TIERS[recommendedTier as ArchTier]?.amount ?? 389000) / 100}`,
        turnaround: ARCH_TIERS[recommendedTier as ArchTier]?.turnaround ?? 'Custom timeline',
        message: isEnterprise
          ? 'Your project requires an enterprise quote. Our team will contact you within 1 business day.'
          : `Recommended: ${recommendedTier}. Proceed to checkout.`,
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to save architect intake') })
    }
  })

  // ── POST /ai-architect/:id/checkout ──────────────────────────────────────
  fastify.post('/:id/checkout', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = CheckoutSchema.parse(request.body)
      const tier = ARCH_TIERS[body.tier]
      if (!tier) return reply.code(400).send({ error: 'Invalid tier. Use starter, medium, or large.' })

      const arch = await prismaAny.aIArchitectVIPService.findUnique({
        where: { id },
        select: { id: true, customerEmail: true, customerName: true, projectType: true, squareFeet: true, jurisdiction: true },
      })
      if (!arch) return reply.code(404).send({ error: 'Architect service not found' })

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: arch.customerEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: tier.amount,
              product_data: {
                name: tier.name,
                description: `${tier.description} · ${arch.projectType} · ${arch.squareFeet} sqft · ${arch.jurisdiction}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          source: 'ai-architect',
          tier: body.tier,
          tierName: tier.name,
          architectId: id,
          customerEmail: arch.customerEmail ?? '',
          customerName: arch.customerName ?? '',
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

  // ── GET /ai-architect/:id ─────────────────────────────────────────────────
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const arch = await prismaAny.aIArchitectVIPService.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          serviceType: true,
          conceptId: true,
          projectType: true,
          squareFeet: true,
          jurisdiction: true,
          priceStarting: true,
          priceEnding: true,
          actualPriceCharged: true,
          architectStartedAt: true,
          deliveredAt: true,
          revisionCount: true,
          revisionLimit: true,
          consultationScheduled: true,
          consultationZoomUrl: true,
          portalUrl: true,
          createdAt: true,
        },
      })
      if (!arch) return reply.code(404).send({ error: 'Architect service not found' })

      return arch
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch architect service') })
    }
  })

  // ── POST /ai-architect/:id/request-revision ───────────────────────────────
  fastify.post('/:id/request-revision', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = RevisionSchema.parse(request.body)

      const arch = await prismaAny.aIArchitectVIPService.findUnique({
        where: { id },
        select: { revisionCount: true, revisionLimit: true, status: true, revisionNotes: true },
      })
      if (!arch) return reply.code(404).send({ error: 'Architect service not found' })
      if (!['review', 'ready', 'delivered'].includes(arch.status)) {
        return reply.code(409).send({ error: 'Revisions can only be requested when drawings are ready for review' })
      }

      const isAdditional = arch.revisionCount >= arch.revisionLimit
      if (isAdditional && !body.paymentToken) {
        return reply.code(402).send({
          error: 'Additional revision requires payment',
          additionalRevisionCost: ADDITIONAL_REVISION_COST,
          message: `You've used all ${arch.revisionLimit} included revisions. Additional revisions cost $250 each.`,
        })
      }

      const updatedNotes = [...(arch.revisionNotes ?? []), body.revisionNotes]
      const updated = await prismaAny.aIArchitectVIPService.update({
        where: { id },
        data: {
          status: 'revisions',
          revisionCount: arch.revisionCount + 1,
          revisionNotes: updatedNotes,
        },
      })

      const estimatedDate = new Date()
      estimatedDate.setDate(estimatedDate.getDate() + 5)

      return {
        ok: true,
        revisionNumber: updated.revisionCount,
        revisionsRemaining: Math.max(0, arch.revisionLimit - updated.revisionCount),
        estimatedCompletionDate: estimatedDate.toISOString(),
      }
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to request revision') })
    }
  })

  // ── GET /ai-architect/:id/deliverables ────────────────────────────────────
  fastify.get('/:id/deliverables', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const arch = await prismaAny.aIArchitectVIPService.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          deliveredAt: true,
          floorPlanUrl: true,
          elevationDrawings: true,
          detailDrawings: true,
          materialSpecSheet: true,
          codeComplianceDoc: true,
          fullArchitectPackage: true,
          consultationRecordingUrl: true,
          portalAccessCode: true,
          portalExpiresAt: true,
        },
      })
      if (!arch) return reply.code(404).send({ error: 'Architect service not found' })
      if (!['ready', 'delivered'].includes(arch.status)) {
        return reply.code(409).send({ error: 'Drawings not yet ready', status: arch.status })
      }

      return {
        architectId: id,
        status: arch.status,
        deliveredAt: arch.deliveredAt,
        portalAccessCode: arch.portalAccessCode,
        portalExpiresAt: arch.portalExpiresAt,
        files: {
          floorPlan: arch.floorPlanUrl ? { url: arch.floorPlanUrl, format: 'pdf' } : null,
          elevations: arch.elevationDrawings ? { url: arch.elevationDrawings, format: 'pdf' } : null,
          details: arch.detailDrawings ? { url: arch.detailDrawings, format: 'pdf' } : null,
          materialSpecs: arch.materialSpecSheet ? { url: arch.materialSpecSheet, format: 'pdf' } : null,
          codeCompliance: arch.codeComplianceDoc ? { url: arch.codeComplianceDoc, format: 'pdf' } : null,
          fullPackage: arch.fullArchitectPackage ? { url: arch.fullArchitectPackage, format: 'zip' } : null,
          consultationRecording: arch.consultationRecordingUrl
            ? { url: arch.consultationRecordingUrl, format: 'mp4' }
            : null,
        },
      }
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch deliverables') })
    }
  })
}
