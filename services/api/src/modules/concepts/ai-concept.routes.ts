/**
 * services/api/src/modules/concepts/ai-concept.routes.ts
 *
 * Comprehensive AI Concept routes — intake wizard → Stripe → design pipeline.
 *
 * POST /ai-concept/intake               — create AIConceptIntake from 9-screen form
 * POST /ai-concept/:id/checkout         — create Stripe checkout session
 * GET  /ai-concept/:id                  — get project status
 * POST /ai-concept/:id/request-revision — request 1 free revision or pay $250
 * GET  /ai-concept/:id/deliverables     — download links for all files
 */

import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { authenticateUser as authenticate } from '../../middleware/auth.middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-10-16' })

// ── Pricing ───────────────────────────────────────────────────────────────────
const CONCEPT_TIERS = {
  starter:      { name: 'AI Concept Design — Starter',      amount: 59900,  revisionLimit: 1 },
  professional: { name: 'AI Concept Design — Professional', amount: 129900, revisionLimit: 2 },
  // enterprise = CFQ — no checkout session created
} as const

type ConceptTier = keyof typeof CONCEPT_TIERS

// ── Schemas ───────────────────────────────────────────────────────────────────
const IntakeSchema = z.object({
  // Contact
  email: z.string().email(),
  phone: z.string().optional(),
  name: z.string().optional(),

  // Project
  projectType: z.enum(['kitchen', 'bathroom', 'addition', 'basement', 'whole_home', 'living_room']),
  squareFeet: z.number().int().min(50).max(10000),
  jurisdiction: z.enum([
    'DC', 'Montgomery County MD', "Prince George's County MD",
    'Arlington VA', 'Fairfax VA', 'Alexandria VA',
  ]),

  // Design inputs
  currentPains: z.array(z.string()).min(1),
  stylePreferences: z.array(z.string()).min(1).max(2),
  budget: z.number().int().min(1000),
  priorities: z.array(z.string()).min(1),
  constraints: z.array(z.string()).default([]),
  timeline: z.enum(['ASAP', '3-6 months', '6-12 months', 'Just exploring']),

  // Bundle
  bundleType: z.enum(['design_only', 'design_permits', 'full_build']).default('design_only'),
})

const CheckoutSchema = z.object({
  intakeId: z.string(),
  tier: z.enum(['starter', 'professional']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

const RevisionSchema = z.object({
  revisionNotes: z.string().min(10),
  paymentToken: z.string().optional(), // For additional revisions beyond limit
})

// ── Helper: determine tier from sqft ─────────────────────────────────────────
function recommendTier(sqft: number): string {
  if (sqft <= 800) return 'starter'
  if (sqft <= 3000) return 'professional'
  return 'enterprise'
}

// ── Helper: generate portal access code ──────────────────────────────────────
function generateAccessCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export async function aiConceptRoutes(fastify: FastifyInstance) {

  // ── POST /ai-concept/intake ───────────────────────────────────────────────
  fastify.post('/intake', async (request, reply) => {
    try {
      const body = IntakeSchema.parse(request.body)
      const recommendedTier = recommendTier(body.squareFeet)

      // Detect if zoning analysis will be required
      const zoningRequired = ['addition'].includes(body.projectType)

      const intake = await prismaAny.aIConceptIntake.create({
        data: {
          email: body.email,
          phone: body.phone,
          name: body.name,
          projectType: body.projectType,
          squareFeet: body.squareFeet,
          jurisdiction: body.jurisdiction,
          currentPains: body.currentPains,
          stylePreferences: body.stylePreferences,
          budget: body.budget,
          priorities: body.priorities,
          constraints: body.constraints,
          timeline: body.timeline,
          bundleType: body.bundleType,
          status: 'intake',
        },
      })

      return reply.code(201).send({
        ok: true,
        intakeId: intake.id,
        recommendedTier,
        zoningRequired,
        tierAvailable: recommendedTier !== 'enterprise',
        enterpriseRequired: recommendedTier === 'enterprise',
        message: recommendedTier === 'enterprise'
          ? 'Your project is 3,000+ sqft. Please contact us for a custom quote.'
          : `Recommended tier: ${recommendedTier}. Proceed to checkout.`,
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to save intake') })
    }
  })

  // ── POST /ai-concept/:id/checkout ────────────────────────────────────────
  fastify.post('/:id/checkout', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = CheckoutSchema.parse(request.body)
      const tier = CONCEPT_TIERS[body.tier as ConceptTier]
      if (!tier) return reply.code(400).send({ error: 'Invalid tier. Use starter or professional.' })

      const intake = await prismaAny.aIConceptIntake.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, squareFeet: true, jurisdiction: true, projectType: true },
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
              product_data: {
                name: tier.name,
                description: `${intake.projectType} concept · ${intake.squareFeet} sqft · ${intake.jurisdiction}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          source: 'ai-concept',
          tier: body.tier,
          tierName: tier.name,
          intakeId: id,
          customerEmail: intake.email,
          customerName: intake.name ?? '',
          squareFeet: String(intake.squareFeet),
          jurisdiction: intake.jurisdiction,
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

  // ── GET /ai-concept/:id ───────────────────────────────────────────────────
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request as any).user?.id

      const project = await prismaAny.aIConceptProject.findFirst({
        where: { id, customerEmail: { not: undefined } },
        select: {
          id: true,
          tier: true,
          projectType: true,
          squareFeet: true,
          location: true,
          jurisdiction: true,
          status: true,
          zoningRequired: true,
          createdAt: true,
          generatedAt: true,
          deliveredAt: true,
          expiresAt: true,
          portalUrl: true,
          pdfFileUrl: true,
          renderingUrls: true,
          revisionCount: true,
          revisionLimit: true,
          bundleType: true,
        },
      })
      if (!project) return reply.code(404).send({ error: 'Project not found' })

      return project
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch project') })
    }
  })

  // ── POST /ai-concept/:id/request-revision ────────────────────────────────
  fastify.post('/:id/request-revision', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = RevisionSchema.parse(request.body)

      const project = await prismaAny.aIConceptProject.findUnique({
        where: { id },
        select: { id: true, revisionCount: true, revisionLimit: true, status: true },
      })
      if (!project) return reply.code(404).send({ error: 'Project not found' })
      if (project.status !== 'delivered') {
        return reply.code(409).send({ error: 'Revisions can only be requested after delivery' })
      }

      const isAdditional = project.revisionCount >= project.revisionLimit
      if (isAdditional && !body.paymentToken) {
        return reply.code(402).send({
          error: 'Additional revision requires payment',
          additionalRevisionCost: 25000, // $250 in cents
          message: `You've used all ${project.revisionLimit} included revision(s). Additional revisions cost $250.`,
        })
      }

      const updated = await prismaAny.aIConceptProject.update({
        where: { id },
        data: {
          status: 'revision_requested',
          revisionCount: project.revisionCount + 1,
          revisionNotes: body.revisionNotes,
        },
      })

      const deliveryDays = project.revisionCount >= 1 ? 5 : 3
      const estimatedDate = new Date()
      estimatedDate.setDate(estimatedDate.getDate() + deliveryDays)

      return {
        ok: true,
        revisionNumber: updated.revisionCount,
        revisionsRemaining: Math.max(0, project.revisionLimit - updated.revisionCount),
        estimatedCompletionDate: estimatedDate.toISOString(),
        message: `Revision ${updated.revisionCount} requested. Estimated delivery: ${estimatedDate.toLocaleDateString()}.`,
      }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to request revision') })
    }
  })

  // ── GET /ai-concept/:id/deliverables ─────────────────────────────────────
  fastify.get('/:id/deliverables', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const project = await prismaAny.aIConceptProject.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          pdfFileUrl: true,
          renderingUrls: true,
          floorPlanUrl: true,
          portalAccessCode: true,
          portalExpiresAt: true,
          tier: true,
        },
      })
      if (!project) return reply.code(404).send({ error: 'Project not found' })
      if (!['delivered', 'curated'].includes(project.status)) {
        return reply.code(409).send({ error: 'Deliverables not yet ready', status: project.status })
      }

      const files: Record<string, any> = {
        renderings: (project.renderingUrls ?? []).map((url: string, i: number) => ({
          name: `Concept ${i + 1}`,
          url,
        })),
        pdf: project.pdfFileUrl ? { url: project.pdfFileUrl } : null,
        floorPlan: project.floorPlanUrl ? { url: project.floorPlanUrl } : null,
      }

      return {
        projectId: id,
        status: project.status,
        portalAccessCode: project.portalAccessCode,
        portalExpiresAt: project.portalExpiresAt,
        files,
      }
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch deliverables') })
    }
  })

  // ── GET /ai-concept/intake/:intakeId — poll status after payment ──────────
  fastify.get('/intake/:intakeId/status', async (request, reply) => {
    try {
      const { intakeId } = request.params as { intakeId: string }
      const intake = await prismaAny.aIConceptIntake.findUnique({
        where: { id: intakeId },
        select: { id: true, status: true, projectId: true, email: true },
      })
      if (!intake) return reply.code(404).send({ error: 'Intake not found' })

      return {
        intakeId: intake.id,
        status: intake.status,
        projectId: intake.projectId,
        paid: !!intake.projectId,
      }
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch intake status') })
    }
  })
}
