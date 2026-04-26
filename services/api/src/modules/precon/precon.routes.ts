/**
 * KEALEE PLATFORM - PRE-CONSTRUCTION ROUTES
 * API endpoints for project owner pre-con workflow
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { preconService, DESIGN_PACKAGE_FEES, PLATFORM_COMMISSION_RATE } from './precon.service'
import { ensureDigitalTwin } from '../../lib/twin/digital-twin.service'

// Validation Schemas
const createPreConSchema = z.object({
  name: z.string().min(3).max(200),
  category: z.enum(['KITCHEN', 'BATHROOM', 'ADDITION', 'NEW_CONSTRUCTION', 'RENOVATION', 'EXTERIOR', 'OTHER']),
  description: z.string().min(20).max(5000),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().min(5).max(10).optional(),
  squareFootage: z.number().min(50).max(100000).optional(),
  rooms: z.number().min(1).max(50).optional(),
  floors: z.number().min(1).max(10).optional(),
  features: z.array(z.string()).optional(),
  complexity: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY']).optional(),
  designPackageTier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
})

const updatePreConSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  squareFootage: z.number().min(50).max(100000).optional(),
  rooms: z.number().min(1).max(50).optional(),
  floors: z.number().min(1).max(10).optional(),
  features: z.array(z.string()).optional(),
  complexity: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY']).optional(),
  minimumBid: z.number().min(1000).optional(),
  biddingDeadline: z.string().datetime().optional(),
})

const selectConceptSchema = z.object({
  conceptId: z.string().uuid(),
  feedback: z.string().max(2000).optional(),
  rating: z.number().min(1).max(5).optional(),
})

const awardBidSchema = z.object({
  bidId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
})

const openMarketplaceSchema = z.object({
  minimumBid: z.number().min(1000).optional(),
  biddingDeadline: z.string().datetime().optional(),
  maxBids: z.number().min(1).max(20).optional(),
})

const ratifyContractSchema = z.object({
  contractId: z.string().uuid(),
  escrowAgreementId: z.string().uuid(),
  signedAt: z.string().datetime(),
})

const payDesignFeeSchema = z.object({
  paymentIntentId: z.string(),
})

export async function preconRoutes(fastify: FastifyInstance) {
  // ============================================
  // DASHBOARD & OVERVIEW
  // ============================================

  /**
   * GET /precon/dashboard - Get owner's pre-con dashboard summary
   */
  fastify.get('/dashboard', { preHandler: [authenticateUser] }, async (request, reply) => {
    const user = (request as any).user as { id: string }
    const dashboard = await preconService.getDashboardSummary(user.id)
    return reply.send({ dashboard })
  })

  /**
   * GET /precon/fee-info - Get fee structure information
   * NOTE: Lead sale pricing is NOT included (B2B only)
   */
  fastify.get('/fee-info', async (request, reply) => {
    return reply.send({
      designPackages: {
        BASIC: {
          price: DESIGN_PACKAGE_FEES.BASIC,
          description: 'Basic concept sketches and layout options',
          includes: ['2 concept options', 'Basic floor plan', 'Material suggestions'],
        },
        STANDARD: {
          price: DESIGN_PACKAGE_FEES.STANDARD,
          description: 'Detailed designs with 3D renderings',
          includes: ['3 concept options', 'Detailed floor plans', '3D renderings', 'Material specifications', 'Cost estimate'],
        },
        PREMIUM: {
          price: DESIGN_PACKAGE_FEES.PREMIUM,
          description: 'Full architectural package with construction docs',
          includes: ['5 concept options', 'Full architectural drawings', '3D walkthrough', 'Material specifications', 'Detailed cost breakdown', 'Permit-ready documents'],
        },
      },
      platformCommission: {
        rate: PLATFORM_COMMISSION_RATE,
        ratePercent: `${PLATFORM_COMMISSION_RATE * 100}%`,
        description: 'Platform fee on contract value (paid by contractor)',
        collectionMethod: 'Automatically deducted from contractor payment at contract signing',
      },
    })
  })

  // ============================================
  // PRE-CON PROJECT CRUD
  // ============================================

  /**
   * POST /precon/projects - Create new pre-con project
   */
  fastify.post(
    '/projects',
    { preHandler: [authenticateUser, validateBody(createPreConSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string; orgId?: string }
      const body = request.body as z.infer<typeof createPreConSchema>

      const precon = await preconService.createPreConProject(body, user.id, user.orgId)

      return reply.code(201).send({
        precon,
        nextStep: 'Pay design package fee to begin design process',
        designPackageFee: DESIGN_PACKAGE_FEES[body.designPackageTier ?? 'STANDARD'],
      })
    }
  )

  /**
   * GET /precon/projects - List user's pre-con projects
   */
  fastify.get(
    '/projects',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          phase: z.string().optional(),
          category: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const query = request.query as { phase?: string; category?: string }

      const projects = await preconService.listPreConProjects(user.id, query as any)

      return reply.send({ projects })
    }
  )

  /**
   * GET /precon/projects/:id - Get pre-con project details
   */
  fastify.get(
    '/projects/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }

      const precon = await preconService.getPreConProject(id, user.id)

      return reply.send({ precon })
    }
  )

  // ============================================
  // PHASE TRANSITIONS
  // ============================================

  /**
   * POST /precon/projects/:id/pay-design-fee - Pay design package fee
   */
  fastify.post(
    '/projects/:id/pay-design-fee',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(payDesignFeeSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const { paymentIntentId } = request.body as z.infer<typeof payDesignFeeSchema>

      const precon = await preconService.payDesignPackageFee(id, user.id, paymentIntentId)

      return reply.send({
        precon,
        message: 'Design package fee paid. Design process will begin shortly.',
        nextPhase: 'DESIGN_IN_PROGRESS',
      })
    }
  )

  /**
   * POST /precon/projects/:id/select-concept - Owner selects a design concept
   */
  fastify.post(
    '/projects/:id/select-concept',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(selectConceptSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as z.infer<typeof selectConceptSchema>

      const concept = await preconService.selectDesignConcept(id, user.id, body)

      return reply.send({
        concept,
        message: 'Design concept selected and approved.',
        nextStep: 'Generate Suggested Retail Price (SRP)',
      })
    }
  )

  /**
   * POST /precon/projects/:id/generate-srp - Generate SRP
   */
  fastify.post(
    '/projects/:id/generate-srp',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }

      const precon = await preconService.generateSRP(id, user.id)

      return reply.send({
        precon,
        srp: {
          total: precon.suggestedRetailPrice,
          breakdown: precon.srpBreakdown,
          confidence: precon.srpConfidence,
          validUntil: precon.srpValidUntil,
        },
        message: 'Suggested Retail Price generated.',
        nextStep: 'Open marketplace for contractor bids',
      })
    }
  )

  /**
   * POST /precon/projects/:id/open-marketplace - Open for bidding
   */
  fastify.post(
    '/projects/:id/open-marketplace',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(openMarketplaceSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as z.infer<typeof openMarketplaceSchema>

      const precon = await preconService.openMarketplace(id, user.id, body)

      return reply.send({
        precon,
        message: 'Marketplace opened. Contractors can now submit bids.',
        biddingSettings: {
          minimumBid: precon.minimumBid,
          deadline: precon.biddingDeadline,
          maxBids: precon.maxBids,
        },
      })
    }
  )

  /**
   * POST /precon/projects/:id/award-bid - Award bid to contractor
   */
  fastify.post(
    '/projects/:id/award-bid',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(awardBidSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as z.infer<typeof awardBidSchema>

      const bid = await preconService.awardBid(id, user.id, body)

      return reply.send({
        bid,
        message: 'Bid awarded. Contract will be prepared for signing.',
        nextStep: 'Sign contract to begin project',
        platformFee: {
          type: 'CONTRACT_COMMISSION',
          rate: `${PLATFORM_COMMISSION_RATE * 100}%`,
          amount: Number(bid.bidAmount) * PLATFORM_COMMISSION_RATE,
          note: 'This fee is automatically collected from contractor at contract signing',
        },
      })
    }
  )

  /**
   * POST /precon/projects/:id/ratify-contract - Contract signed
   * This is the GUARANTEED FEE COLLECTION POINT
   */
  fastify.post(
    '/projects/:id/ratify-contract',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(ratifyContractSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as z.infer<typeof ratifyContractSchema>

      const precon = await preconService.ratifyContract(id, user.id, body)

      return reply.send({
        precon,
        message: 'Contract ratified! Platform fee has been held in escrow.',
        feeCollection: {
          status: 'HELD_IN_ESCROW',
          method: 'Will be deducted from contractor first milestone payment',
          guaranteed: true,
        },
        nextStep: 'Project ready to begin!',
      })
    }
  )

  // ============================================
  // DESIGN CONCEPTS (Read only for owner)
  // ============================================

  /**
   * GET /precon/projects/:id/concepts - Get design concepts
   */
  fastify.get(
    '/projects/:id/concepts',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }

      const precon = await preconService.getPreConProject(id, user.id)

      return reply.send({
        concepts: precon.designConcepts,
        selectedConceptId: precon.selectedConceptId,
      })
    }
  )

  // ============================================
  // BIDS (Read only for owner)
  // ============================================

  /**
   * GET /precon/projects/:id/bids - Get contractor bids
   */
  fastify.get(
    '/projects/:id/bids',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }

      const precon = await preconService.getPreConProject(id, user.id)

      return reply.send({
        bids: precon.bids,
        awardedBidId: precon.awardedBidId,
        biddingSettings: {
          minimumBid: precon.minimumBid,
          deadline: precon.biddingDeadline,
          isOpen: precon.phase === 'BIDDING_OPEN',
        },
      })
    }
  )

  // ============================================
  // FEES & PAYMENTS
  // ============================================

  /**
   * GET /precon/projects/:id/fees - Get platform fees for project
   */
  fastify.get(
    '/projects/:id/fees',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }

      const precon = await preconService.getPreConProject(id, user.id)

      // Filter fees - only show DESIGN_PACKAGE and CONTRACT_COMMISSION to owner
      // Lead sale fees are B2B only and hidden from owner
      const ownerVisibleFees = precon.platformFees.filter(
        (f: any) => f.feeType !== 'LEAD_SALE'
      )

      return reply.send({
        fees: ownerVisibleFees,
        summary: {
          designPackagePaid: precon.designPackagePaid,
          platformCommission: precon.contractAmount
            ? Number(precon.contractAmount) * PLATFORM_COMMISSION_RATE
            : null,
          commissionNote: 'Platform commission is paid by the contractor, not you.',
        },
      })
    }
  )

  // ============================================
  // PRE-CON COMPLETION → ACTIVE PROJECT
  // ============================================

  /**
   * POST /precon/projects/:id/complete - Complete pre-con and create active project
   * Creates a Project record, links PreCon → Project, adds ProjectMembership
   */
  fastify.post(
    '/projects/:id/complete',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const { prismaAny } = await import('../../utils/prisma-helper')

      // Verify the precon project is in CONTRACT_RATIFIED phase
      const precon = await preconService.getPreConProject(id, user.id)

      if (precon.phase !== 'CONTRACT_RATIFIED') {
        return reply.status(400).send({
          error: 'Contract must be ratified before completing pre-construction',
        })
      }

      // Check if already linked to a project
      if (precon.projectId) {
        return reply.send({
          project: await prismaAny.project.findUnique({ where: { id: precon.projectId } }),
          message: 'Project already created from this pre-con',
        })
      }

      // Create the active Project from PreCon data
      const selectedConcept = precon.designConcepts?.find((c: any) => c.isSelected)

      const project = await prismaAny.project.create({
        data: {
          name: precon.name,
          ownerId: user.id,
          orgId: precon.orgId || null,
          category: precon.category,
          description: precon.description,
          address: precon.address,
          city: precon.city,
          state: precon.state,
          zipCode: precon.zipCode,
          budgetTotal: precon.contractAmount || precon.suggestedRetailPrice || null,
          status: 'ACTIVE',
          currentPhase: 'PRE_CONSTRUCTION',
        },
      })

      // Ensure DigitalTwin exists for the new project (DDTS enforcement)
      await ensureDigitalTwin(project.id, precon.orgId || undefined)

      // Add owner as project member
      await prismaAny.projectMembership.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: 'OWNER',
        },
      })

      // Add awarded contractor as project member if exists
      if (precon.awardedContractorId) {
        try {
          // Get contractor user ID from contractor profile
          const contractorProfile = await prismaAny.contractorProfile.findUnique({
            where: { id: precon.awardedContractorId },
            select: { userId: true },
          })
          if (contractorProfile?.userId) {
            await prismaAny.projectMembership.create({
              data: {
                projectId: project.id,
                userId: contractorProfile.userId,
                role: 'CONTRACTOR',
              },
            })
          }
        } catch {
          // Non-critical — contractor membership can be added later
        }
      }

      // Complete the precon and link to project
      await preconService.completePreCon(id, user.id, project.id)

      return reply.code(201).send({
        project,
        preconId: id,
        message: 'Project created from pre-construction. Ready for construction phase!',
      })
    }
  )
}
