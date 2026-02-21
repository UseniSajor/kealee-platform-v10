/**
 * Lien Waiver API Routes
 * Handles lien waiver generation, signing, notarization, and verification
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware'
import { LienWaiverService } from '../modules/compliance/lien-waiver.service'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GenerateWaiverSchema = z.object({
  escrowTransactionId: z.string().uuid(),
  contractId: z.string().uuid(),
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().optional(),
  waiverType: z.enum(['CONDITIONAL', 'UNCONDITIONAL']),
  waiverScope: z.enum(['PARTIAL', 'FINAL']),
  projectName: z.string(),
  projectAddress: z.string(),
  claimantName: z.string(),
  claimantAddress: z.string(),
  throughDate: z.coerce.date(),
  waiverAmount: z.number().positive(),
  cumulativeAmount: z.number().positive(),
  state: z.string().length(2).toUpperCase(), // US state code
})

const SendForSignatureSchema = z.object({
  signerEmail: z.string().email(),
  signerName: z.string(),
  signerRole: z.enum(['CONTRACTOR', 'SUBCONTRACTOR', 'SUPPLIER']),
  dueDate: z.coerce.date().optional(),
})

const RecordSignatureSchema = z.object({
  signerRole: z.enum(['CONTRACTOR', 'SUBCONTRACTOR', 'SUPPLIER']),
  signerName: z.string(),
  signerTitle: z.string().optional(),
  signerCompany: z.string().optional(),
  signatureImageUrl: z.string().url(),
  ipAddress: z.string(),
  electronicConsentGiven: z.boolean().default(true),
})

const NotarizeWaiverSchema = z.object({
  notaryName: z.string(),
  notaryLicenseNumber: z.string(),
  notaryState: z.string().length(2).toUpperCase(),
  notaryCommissionExpires: z.coerce.date(),
  notarizedDocumentUrl: z.string().url(),
})

const ListWaiversSchema = z.object({
  contractId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  paymentReleaseId: z.string().uuid().optional(),
  waiverType: z.enum(['CONDITIONAL', 'UNCONDITIONAL']).optional(),
  waiverScope: z.enum(['PARTIAL', 'FINAL']).optional(),
  status: z.enum(['GENERATED', 'SENT', 'SIGNED', 'NOTARIZED', 'RECORDED', 'EXPIRED']).optional(),
  state: z.string().length(2).toUpperCase().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const WaiverIdParamSchema = z.object({
  id: z.string().uuid(),
})

const VerifyWaiverSchema = z.object({
  waiverId: z.string().uuid(),
  verificationCode: z.string().optional(),
})

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

const requireFinanceAccess = requireRole(['admin', 'finance', 'pm'])

// ============================================================================
// ROUTES
// ============================================================================

export async function lienWaiverRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/lien-waivers/generate
   * Generate a new lien waiver
   */
  fastify.post(
    '/lien-waivers/generate',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Generate a new lien waiver',
        body: GenerateWaiverSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const userId = request.user!.id
        const data = GenerateWaiverSchema.parse(request.body)

        // generateWaiver(data: GenerateWaiverDTO) — only pass fields in the DTO
        const waiver = await LienWaiverService.generateWaiver({
          escrowTransactionId: data.escrowTransactionId,
          contractId: data.contractId,
          projectId: data.projectId,
          milestoneId: data.milestoneId,
          waiverType: data.waiverType,
          waiverScope: data.waiverScope,
          throughDate: data.throughDate,
          waiverAmount: data.waiverAmount,
          cumulativeAmount: data.cumulativeAmount,
          createdBy: userId,
        })

        return reply.code(201).send({
          success: true,
          waiver,
          message: 'Lien waiver generated successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to generate lien waiver',
        })
      }
    }
  )

  /**
   * GET /api/lien-waivers
   * List lien waivers with filtering
   */
  fastify.get(
    '/lien-waivers',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'List lien waivers with filtering',
        querystring: ListWaiversSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ListWaiversSchema.parse(request.query)

        // listWaivers takes { contractId?, projectId?, status?, waiverType?, waiverScope?, state?, limit?, offset? }
        const result = await LienWaiverService.listWaivers({
          contractId: filters.contractId,
          projectId: filters.projectId,
          status: filters.status as any,
          waiverType: filters.waiverType as any,
          waiverScope: filters.waiverScope as any,
          state: filters.state,
          limit: filters.limit,
          offset: (filters.page - 1) * filters.limit,
        })

        return reply.send({
          success: true,
          ...result,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to list lien waivers',
        })
      }
    }
  )

  /**
   * GET /api/lien-waivers/:id
   * Get lien waiver details
   */
  fastify.get(
    '/lien-waivers/:id',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Get lien waiver details',
        params: WaiverIdParamSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = WaiverIdParamSchema.parse(request.params)

        const waiver = await LienWaiverService.getWaiver(id)

        return reply.send({
          success: true,
          waiver,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get lien waiver',
        })
      }
    }
  )

  /**
   * POST /api/lien-waivers/:id/send
   * Send waiver for digital signature
   */
  fastify.post(
    '/lien-waivers/:id/send',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Send waiver for digital signature',
        params: WaiverIdParamSchema,
        body: SendForSignatureSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = WaiverIdParamSchema.parse(request.params)
        const data = SendForSignatureSchema.parse(request.body)

        // sendForSignature(lienWaiverId, senderId) — takes two positional args
        const waiver = await LienWaiverService.sendForSignature(id, request.user!.id)

        return reply.send({
          success: true,
          waiver,
          message: 'Lien waiver sent for signature',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to send lien waiver',
        })
      }
    }
  )

  /**
   * POST /api/lien-waivers/:id/sign
   * Record a signature for a waiver
   */
  fastify.post(
    '/lien-waivers/:id/sign',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Record a signature for a waiver',
        params: WaiverIdParamSchema,
        body: RecordSignatureSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = WaiverIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = RecordSignatureSchema.parse(request.body)

        // recordSignature(data: SignWaiverDTO) — map route fields to DTO fields
        const signature = await LienWaiverService.recordSignature({
          lienWaiverId: id,
          signerId: userId,
          signerRole: data.signerRole,
          signerName: data.signerName,
          signerTitle: data.signerTitle,
          signerCompany: data.signerCompany,
          signerEmail: '', // Not provided by route schema, use empty default
          signatureImageUrl: data.signatureImageUrl,
          ipAddress: data.ipAddress,
          electronicConsentGiven: data.electronicConsentGiven,
        })

        return reply.send({
          success: true,
          signature,
          message: 'Signature recorded successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to record signature',
        })
      }
    }
  )

  /**
   * POST /api/lien-waivers/:id/notarize
   * Notarize a lien waiver (for states requiring it)
   */
  fastify.post(
    '/lien-waivers/:id/notarize',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Notarize a lien waiver',
        params: WaiverIdParamSchema,
        body: NotarizeWaiverSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = WaiverIdParamSchema.parse(request.params)
        const data = NotarizeWaiverSchema.parse(request.body)

        // notarizeWaiver(data: NotarizeWaiverDTO) — map route fields to DTO fields
        const waiver = await LienWaiverService.notarizeWaiver({
          lienWaiverId: id,
          signatureId: '', // TODO: Route schema needs signatureId field
          notaryName: data.notaryName,
          notaryCommission: data.notaryLicenseNumber,
          notaryExpiration: data.notaryCommissionExpires,
          notarySealUrl: data.notarizedDocumentUrl,
        })

        return reply.send({
          success: true,
          waiver,
          message: 'Lien waiver notarized successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to notarize lien waiver',
        })
      }
    }
  )

  /**
   * GET /api/lien-waivers/contract/:contractId
   * Get all waivers for a contract
   */
  fastify.get(
    '/lien-waivers/contract/:contractId',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Get all waivers for a contract',
        params: z.object({ contractId: z.string().uuid() }),
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { contractId } = request.params as { contractId: string }

        const waivers = await LienWaiverService.getWaiversForContract(contractId)

        return reply.send({
          success: true,
          waivers,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get contract waivers',
        })
      }
    }
  )

  /**
   * GET /api/lien-waivers/payment/:paymentReleaseId
   * Get all waivers for a payment release
   */
  fastify.get(
    '/lien-waivers/payment/:paymentReleaseId',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Get all waivers for a payment release',
        params: z.object({ paymentReleaseId: z.string().uuid() }),
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { paymentReleaseId } = request.params as { paymentReleaseId: string }

        const waivers = await LienWaiverService.getWaiversForPayment(paymentReleaseId)

        return reply.send({
          success: true,
          waivers,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get payment waivers',
        })
      }
    }
  )

  /**
   * POST /api/lien-waivers/verify
   * Verify a lien waiver (public endpoint with optional authentication)
   */
  fastify.post(
    '/lien-waivers/verify',
    {
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Verify a lien waiver authenticity',
        body: VerifyWaiverSchema,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = VerifyWaiverSchema.parse(request.body)

        // verifyWaiver(lienWaiverId) — takes only one arg
        const verification = await LienWaiverService.verifyWaiver(data.waiverId)

        return reply.send({
          success: true,
          ...verification,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to verify lien waiver',
        })
      }
    }
  )

  /**
   * GET /api/lien-waivers/contract/:contractId/compliance
   * Check lien waiver compliance for a contract
   */
  fastify.get(
    '/lien-waivers/contract/:contractId/compliance',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Check lien waiver compliance for a contract',
        params: z.object({ contractId: z.string().uuid() }),
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { contractId } = request.params as { contractId: string }

        const compliance = await LienWaiverService.checkCompliance(contractId)

        return reply.send({
          success: true,
          compliance,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to check compliance',
        })
      }
    }
  )

  /**
   * GET /api/lien-waivers/stats
   * Get lien waiver statistics (admin only)
   */
  fastify.get(
    '/lien-waivers/stats',
    {
      preHandler: [authenticateUser, requireRole(['admin'])],
      schema: {
        tags: ['Lien Waivers'],
        summary: 'Get lien waiver statistics',
        querystring: z.object({
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
          state: z.string().length(2).toUpperCase().optional(),
        }),
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = request.query as any

        const stats = await LienWaiverService.getWaiverStats(filters)

        return reply.send({
          success: true,
          stats,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get lien waiver statistics',
        })
      }
    }
  )
}

