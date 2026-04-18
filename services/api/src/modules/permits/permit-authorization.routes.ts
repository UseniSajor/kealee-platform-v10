/**
 * Permit Authorization Routes
 * Handles managed permit submission authorization workflows
 * Allows project owners to authorize Kealee to manage their permit submissions
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import { RedisClient } from '@kealee/redis'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PermitAuthorizationRequestSchema = z.object({
  projectId: z.string().uuid().optional(),
  permitId: z.string().optional(),
  
  // Owner info
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().optional(),
  
  // Contractor info (if authorizing on behalf of contractor)
  contractorName: z.string().optional(),
  contractorCompany: z.string().optional(),
  contractorEmail: z.string().email().optional(),
  contractorPhone: z.string().optional(),
  
  // Authorization details
  authorizationType: z.enum(['OWNER_CONSENT', 'CONTRACTOR_AUTHORIZATION', 'BOTH']),
  submissionMethod: z.enum(['SELF', 'ASSISTED', 'KEALEE_MANAGED']),
  
  // Jurisdiction
  jurisdiction: z.string(),
  projectScope: z.string(),
})

const PermitAuthorizationSignatureSchema = z.object({
  authorizationId: z.string().uuid(),
  ownerSignature: z.string().optional(), // Base64 or URL
  contractorSignature: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function registerPermitAuthorizationRoutes(fastify: FastifyInstance) {
  const redis = await RedisClient.getInstance()

  /**
   * POST /permits/authorization/initiate
   * Initiate authorization workflow for managed submission
   * Public/authenticated endpoint
   */
  fastify.post<{ Body: z.infer<typeof PermitAuthorizationRequestSchema> }>(
    '/permits/authorization/initiate',
    async (request, reply) => {
      try {
        const validatedData = PermitAuthorizationRequestSchema.parse(request.body)

        // Create authorization record
        const authorization = await prisma.permitAuthorization.create({
          data: {
            projectId: validatedData.projectId,
            permitId: validatedData.permitId,
            ownerName: validatedData.ownerName,
            ownerEmail: validatedData.ownerEmail,
            ownerPhone: validatedData.ownerPhone,
            contractorName: validatedData.contractorName,
            contractorCompany: validatedData.contractorCompany,
            contractorEmail: validatedData.contractorEmail,
            contractorPhone: validatedData.contractorPhone,
            authorizationType: validatedData.authorizationType as any,
            submissionMethod: validatedData.submissionMethod as any,
            jurisdiction: validatedData.jurisdiction,
            projectScope: validatedData.projectScope,
          },
        })

        // Generate signing URLs for both parties
        const ownerSigningUrl = `${process.env.APP_URL}/permit-authorization/${authorization.id}/sign/owner`
        const contractorSigningUrl = `${process.env.APP_URL}/permit-authorization/${authorization.id}/sign/contractor`

        // Store signing session in Redis
        await redis.setex(
          `permit_auth_session:${authorization.id}`,
          86400 * 7, // 7-day expiry
          JSON.stringify({
            authorizationId: authorization.id,
            status: 'AWAITING_SIGNATURES',
            createdAt: new Date().toISOString(),
          })
        )

        // Log event
        fastify.log.info({
          event: 'permit.authorization.initiated',
          authorizationId: authorization.id,
          ownerEmail: validatedData.ownerEmail,
          submissionMethod: validatedData.submissionMethod,
        })

        return reply.status(201).send({
          authorizationId: authorization.id,
          status: 'AWAITING_SIGNATURES',
          ownerSigningUrl,
          contractorSigningUrl,
          expiresAt: new Date(Date.now() + 86400 * 7 * 1000),
          message:
            validatedData.authorizationType === 'BOTH'
              ? 'Authorization URLs sent to both parties. Please sign to authorize Kealee to manage your permit.'
              : 'Please sign below to authorize Kealee to manage your permit submission.',
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            details: error.errors,
          })
        }
        fastify.log.error(error)
        throw error
      }
    }
  )

  /**
   * POST /permits/authorization/{authorizationId}/sign
   * Record digital signature for authorization
   */
  fastify.post<{ Body: z.infer<typeof PermitAuthorizationSignatureSchema> }>(
    '/permits/authorization/:authorizationId/sign',
    async (request, reply) => {
      try {
        const { authorizationId } = request.params as { authorizationId: string }
        const validatedData = PermitAuthorizationSignatureSchema.parse(request.body)

        // Get authorization record
        const authorization = await prisma.permitAuthorization.findUniqueOrThrow({
          where: { id: authorizationId },
        })

        // Determine who is signing (owner or contractor)
        const isOwnerSigning = validatedData.ownerSignature &&
          !authorization.ownerSignedAt
        const isContractorSigning = validatedData.contractorSignature &&
          !authorization.contractorSignedAt

        // Update authorization with signatures
        const updated = await prisma.permitAuthorization.update({
          where: { id: authorizationId },
          data: {
            ...(isOwnerSigning && {
              ownerSignature: validatedData.ownerSignature,
              ownerSignedAt: new Date(),
            }),
            ...(isContractorSigning && {
              contractorSignature: validatedData.contractorSignature,
              contractorSignedAt: new Date(),
            }),
          },
        })

        // Check if all required signatures are present
        const allSignaturesComplete =
          (authorization.authorizationType === 'OWNER_CONSENT' && updated.ownerSignedAt) ||
          (authorization.authorizationType === 'CONTRACTOR_AUTHORIZATION' && updated.contractorSignedAt) ||
          (authorization.authorizationType === 'BOTH' && updated.ownerSignedAt && updated.contractorSignedAt)

        // Mark as complete if all signatures obtained
        if (allSignaturesComplete) {
          await prisma.permitAuthorization.update({
            where: { id: authorizationId },
            data: {
              consentGiven: true,
              consentDate: new Date(),
              consentExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            },
          })

          fastify.log.info({
            event: 'permit.authorization.completed',
            authorizationId,
            allSignaturesComplete: true,
          })

          return reply.send({
            authorizationId,
            status: 'SIGNED_AND_COMPLETE',
            message: 'Authorization complete. Kealee is now authorized to manage your permit submission.',
            nextSteps: [
              'Your permit documents will be prepared',
              'We will submit to the appropriate jurisdiction',
              'You will receive status updates via email',
            ],
          })
        }

        // Partial signatures
        fastify.log.info({
          event: 'permit.authorization.signature_recorded',
          authorizationId,
          ownerSigned: updated.ownerSignedAt ? true : false,
          contractorSigned: updated.contractorSignedAt ? true : false,
        })

        return reply.send({
          authorizationId,
          status: isOwnerSigning ? 'OWNER_SIGNED' : 'CONTRACTOR_SIGNED',
          ownerSigned: updated.ownerSignedAt ? true : false,
          contractorSigned: updated.contractorSignedAt ? true : false,
          message: allSignaturesComplete
            ? 'All signatures received. Authorization complete.'
            : 'Signature recorded. Awaiting remaining signatures.',
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          error: 'SIGNATURE_ERROR',
          message: 'Failed to record signature',
        })
      }
    }
  )

  /**
   * GET /permits/authorization/{authorizationId}/status
   * Check authorization status and signing progress
   */
  fastify.get<{ Params: { authorizationId: string } }>(
    '/permits/authorization/:authorizationId/status',
    async (request, reply) => {
      try {
        const { authorizationId } = request.params

        const authorization = await prisma.permitAuthorization.findUniqueOrThrow({
          where: { id: authorizationId },
        })

        let status = 'PENDING'
        if (authorization.consentGiven) {
          status = 'COMPLETE'
        } else if (authorization.ownerSignedAt && authorization.authorizationType === 'OWNER_CONSENT') {
          status = 'SIGNED'
        } else if (
          authorization.ownerSignedAt ||
          authorization.contractorSignedAt
        ) {
          status = 'PARTIALLY_SIGNED'
        }

        return reply.send({
          authorizationId,
          status,
          submissionMethod: authorization.submissionMethod,
          jurisdiction: authorization.jurisdiction,
          projectScope: authorization.projectScope,
          ownerSigned: !!authorization.ownerSignedAt,
          contractorSigned: !!authorization.contractorSignedAt,
          consentGiven: authorization.consentGiven,
          consentExpiry: authorization.consentExpiry,
          createdAt: authorization.createdAt,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'Authorization not found',
        })
      }
    }
  )

  /**
   * POST /permits/authorization/{authorizationId}/revoke
   * Revoke authorization for managed submission
   */
  fastify.post<{ Body: { reason?: string } }>(
    '/permits/authorization/:authorizationId/revoke',
    async (request, reply) => {
      try {
        const { authorizationId } = request.params as { authorizationId: string }
        const { reason } = request.body

        await prisma.permitAuthorization.update({
          where: { id: authorizationId },
          data: {
            revokedAt: new Date(),
            revocationReason: reason,
            consentGiven: false,
          },
        })

        fastify.log.info({
          event: 'permit.authorization.revoked',
          authorizationId,
          reason,
        })

        return reply.send({
          authorizationId,
          status: 'REVOKED',
          message: 'Authorization has been revoked. Kealee will no longer manage this permit.',
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          error: 'REVOCATION_ERROR',
          message: 'Failed to revoke authorization',
        })
      }
    }
  )

  /**
   * GET /permits/{permitId}/managed-status
   * Get managed submission status for a permit
   */
  fastify.get<{ Params: { permitId: string } }>(
    '/permits/:permitId/managed-status',
    async (request, reply) => {
      try {
        const { permitId } = request.params

        const authorization = await prisma.permitAuthorization.findFirst({
          where: { permitId },
        })

        if (!authorization) {
          return reply.status(404).send({
            error: 'NOT_FOUND',
            message: 'No managed authorization found for this permit',
          })
        }

        if (!authorization.consentGiven || authorization.revokedAt) {
          return reply.status(403).send({
            error: 'NOT_AUTHORIZED',
            message: 'This permit is not currently authorized for managed submission',
          })
        }

        return reply.send({
          permitId,
          authorizationId: authorization.id,
          managedBy: 'KEALEE',
          submissionMethod: authorization.submissionMethod,
          jurisdiction: authorization.jurisdiction,
          authorizedAt: authorization.consentDate,
          authorizationExpires: authorization.consentExpiry,
          status: 'ACTIVE',
        })
      } catch (error) {
        fastify.log.error(error)
        throw error
      }
    }
  )

  fastify.log.info('Permit authorization routes registered')
}
