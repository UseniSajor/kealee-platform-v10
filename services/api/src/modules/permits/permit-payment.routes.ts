/**
 * Permit Payment Routes
 * Handles all payment-related operations for permits
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { getStripe } from '../billing/stripe.client'
import { paymentService } from '../payments/payment.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const createCheckoutSessionSchema = z.object({
  permitId: z.string(),
  feeType: z.enum(['permit_fee', 'expedited', 'document_prep', 'platform_fee']),
  amount: z.number().positive(),
  description: z.string().optional(),
  expeditedTier: z.enum(['standard', 'premium']).optional(),
  documentPrepPackage: z.enum(['basic', 'standard', 'premium']).optional(),
  returnUrl: z.string().url().optional(),
})

const addExpeditedServiceSchema = z.object({
  permitId: z.string(),
  expeditedTier: z.enum(['standard', 'premium']),
})

const addDocumentPrepSchema = z.object({
  permitId: z.string(),
  package: z.enum(['basic', 'standard', 'premium']),
})

export async function permitPaymentRoutes(fastify: FastifyInstance) {
  // POST /permits/:id/payment/checkout - Create Stripe checkout session for permit fees
  fastify.post(
    '/:id/payment/checkout',
    {
      preHandler: [authenticateUser, validateBody(createCheckoutSessionSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const data = createCheckoutSessionSchema.parse(request.body)

        // Verify permit exists and belongs to user
        const permit = await prismaAny.permit.findFirst({
          where: {
            id: data.permitId,
            applicantId: user.id,
          },
          include: {
            jurisdiction: true,
          },
        })

        if (!permit) {
          return reply.code(404).send({
            error: 'Permit not found',
          })
        }

        const stripe = getStripe()
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'http://localhost:3000'

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: user.email,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: getFeeDescription(data.feeType, data.expeditedTier, data.documentPrepPackage),
                  description: data.description || `Payment for permit ${permit.permitNumber || permit.id}`,
                },
                unit_amount: Math.round(data.amount * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: data.returnUrl || `${appUrl}/permits/${data.permitId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: data.returnUrl || `${appUrl}/permits/${data.permitId}?canceled=true`,
          metadata: {
            permitId: data.permitId,
            feeType: data.feeType,
            userId: user.id,
            expeditedTier: data.expeditedTier || '',
            documentPrepPackage: data.documentPrepPackage || '',
          },
        })

        return reply.send({
          sessionId: session.id,
          url: session.url,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to create checkout session'),
        })
      }
    }
  )

  // POST /permits/:id/payment/expedited - Add expedited processing service
  fastify.post(
    '/:id/payment/expedited',
    {
      preHandler: [authenticateUser, validateBody(addExpeditedServiceSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const data = addExpeditedServiceSchema.parse(request.body)

        const permit = await prismaAny.permit.findFirst({
          where: {
            id: data.permitId,
            applicantId: user.id,
          },
        })

        if (!permit) {
          return reply.code(404).send({
            error: 'Permit not found',
          })
        }

        // Calculate expedited fee (15-25% of permit cost)
        const permitCost = Number(permit.valuation || permit.calculatedFee || 1000)
        const expeditedPercentage = data.expeditedTier === 'premium' ? 0.25 : 0.20 // 20% standard, 25% premium
        const expeditedFee = permitCost * expeditedPercentage

        // Create checkout session for expedited fee
        const stripe = getStripe()
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'http://localhost:3000'

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: user.email,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Expedited Processing - ${data.expeditedTier === 'premium' ? 'Premium' : 'Standard'}`,
                  description: `48-72 hour review guarantee for permit ${permit.permitNumber || permit.id}`,
                },
                unit_amount: Math.round(expeditedFee * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${appUrl}/permits/${data.permitId}/payment/success?session_id={CHECKOUT_SESSION_ID}&fee_type=expedited`,
          cancel_url: `${appUrl}/permits/${data.permitId}?canceled=true`,
          metadata: {
            permitId: data.permitId,
            feeType: 'expedited',
            expeditedTier: data.expeditedTier,
            userId: user.id,
          },
        })

        return reply.send({
          sessionId: session.id,
          url: session.url,
          amount: expeditedFee,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to create expedited checkout'),
        })
      }
    }
  )

  // POST /permits/:id/payment/document-prep - Add document preparation service
  fastify.post(
    '/:id/payment/document-prep',
    {
      preHandler: [authenticateUser, validateBody(addDocumentPrepSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const data = addDocumentPrepSchema.parse(request.body)

        const permit = await prismaAny.permit.findFirst({
          where: {
            id: data.permitId,
            applicantId: user.id,
          },
        })

        if (!permit) {
          return reply.code(404).send({
            error: 'Permit not found',
          })
        }

        // Document prep package prices
        const packagePrices: Record<string, number> = {
          basic: 150,
          standard: 300,
          premium: 500,
        }

        const docPrepFee = packagePrices[data.package]

        // Create checkout session
        const stripe = getStripe()
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'http://localhost:3000'

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: user.email,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Document Preparation - ${data.package.charAt(0).toUpperCase() + data.package.slice(1)} Package`,
                  description: getDocumentPrepDescription(data.package),
                },
                unit_amount: Math.round(docPrepFee * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${appUrl}/permits/${data.permitId}/payment/success?session_id={CHECKOUT_SESSION_ID}&fee_type=document_prep`,
          cancel_url: `${appUrl}/permits/${data.permitId}?canceled=true`,
          metadata: {
            permitId: data.permitId,
            feeType: 'document_prep',
            documentPrepPackage: data.package,
            userId: user.id,
          },
        })

        return reply.send({
          sessionId: session.id,
          url: session.url,
          amount: docPrepFee,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to create document prep checkout'),
        })
      }
    }
  )

  // GET /permits/:id/payment/fees - Get calculated fees for permit
  fastify.get(
    '/:id/payment/fees',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const permit = await prismaAny.permit.findFirst({
          where: {
            id,
            applicantId: user.id,
          },
          include: {
            jurisdiction: true,
          },
        })

        if (!permit) {
          return reply.code(404).send({
            error: 'Permit not found',
          })
        }

        // Calculate fees
        const permitCost = Number(permit.valuation || permit.calculatedFee || 1000)
        const platformFee = permitCost * 0.03 // 3% platform fee
        const expeditedStandardFee = permitCost * 0.20 // 20% for standard expedited
        const expeditedPremiumFee = permitCost * 0.25 // 25% for premium expedited

        const fees = {
          permitFee: permitCost,
          platformFee: platformFee,
          expedited: {
            standard: expeditedStandardFee,
            premium: expeditedPremiumFee,
          },
          documentPrep: {
            basic: 150,
            standard: 300,
            premium: 500,
          },
          total: permitCost + platformFee,
        }

        return reply.send({ fees })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to calculate fees'),
        })
      }
    }
  )

  // POST /permits/:id/payment/confirm - Confirm payment after Stripe webhook
  fastify.post(
    '/:id/payment/confirm',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { sessionId, feeType } = request.body as { sessionId: string; feeType: string }

        // Verify Stripe session
        const stripe = getStripe()
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (session.payment_status !== 'paid') {
          return reply.code(400).send({
            error: 'Payment not completed',
          })
        }

        // Update permit with payment information
        const permit = await prismaAny.permit.findFirst({
          where: {
            id,
            applicantId: user.id,
          },
        })

        if (!permit) {
          return reply.code(404).send({
            error: 'Permit not found',
          })
        }

        // Update permit based on fee type
        const updateData: any = {
          feePaid: true,
          feePaidAt: new Date(),
        }

        if (feeType === 'expedited') {
          updateData.expedited = true
          updateData.expeditedFee = Number(session.amount_total) / 100
          updateData.expeditedGuaranteeDays = session.metadata?.expeditedTier === 'premium' ? 48 : 72
        }

        await prismaAny.permit.update({
          where: { id },
          data: updateData,
        })

        return reply.send({
          success: true,
          permit: {
            id: permit.id,
            status: permit.kealeeStatus,
            feePaid: true,
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to confirm payment'),
        })
      }
    }
  )
}

// Helper functions
function getFeeDescription(
  feeType: string,
  expeditedTier?: string,
  documentPrepPackage?: string
): string {
  switch (feeType) {
    case 'permit_fee':
      return 'Permit Application Fee'
    case 'expedited':
      return `Expedited Processing - ${expeditedTier === 'premium' ? 'Premium' : 'Standard'}`
    case 'document_prep':
      return `Document Preparation - ${documentPrepPackage ? documentPrepPackage.charAt(0).toUpperCase() + documentPrepPackage.slice(1) : 'Standard'} Package`
    case 'platform_fee':
      return 'Platform Service Fee'
    default:
      return 'Permit Payment'
  }
}

function getDocumentPrepDescription(packageType: string): string {
  switch (packageType) {
    case 'basic':
      return 'Document organization + checklist review'
    case 'standard':
      return 'Document organization + checklist review + code compliance check'
    case 'premium':
      return 'Document organization + checklist review + code compliance check + professional consultation + resubmission management'
    default:
      return 'Document preparation service'
  }
}

