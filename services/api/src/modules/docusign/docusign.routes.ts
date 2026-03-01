import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { docusignService } from './docusign.service'

export async function docusignRoutes(fastify: FastifyInstance) {
  // Send contract for signature (Prompt 2.4)
  fastify.post(
    '/contracts/:contractId/send-for-signature',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }
      const result = await docusignService.createEnvelope(contractId, user.id)
      return reply.code(201).send({ envelopeId: result.envelopeId, recipientViewUrl: result.recipientViewUrl })
    }
  )

  // Get signature status (Prompt 2.4)
  fastify.get(
    '/contracts/:contractId/signature-status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }

      // Verify user has access to contract
      const contract = await prismaAny.contractAgreement.findUnique({
        where: { id: contractId },
        select: { id: true, ownerId: true, contractorId: true, docusignEnvelopeId: true },
      })

      if (!contract) {
        return reply.code(404).send({ error: 'Contract not found' })
      }

      if (contract.ownerId !== user.id && contract.contractorId !== user.id) {
        return reply.code(403).send({ error: 'Unauthorized' })
      }

      if (!contract.docusignEnvelopeId) {
        return reply.send({ status: 'DRAFT', message: 'Contract not yet sent for signature' })
      }

      const status = await docusignService.getEnvelopeStatus(contract.docusignEnvelopeId)
      return reply.send({ status })
    }
  )

  // Download signed document (Prompt 2.4)
  fastify.get(
    '/contracts/:contractId/signed-document',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }

      // Verify user has access to contract
      const contract = await prismaAny.contractAgreement.findUnique({
        where: { id: contractId },
        select: { id: true, ownerId: true, contractorId: true, docusignEnvelopeId: true, status: true },
      })

      if (!contract) {
        return reply.code(404).send({ error: 'Contract not found' })
      }

      if (contract.ownerId !== user.id && contract.contractorId !== user.id) {
        return reply.code(403).send({ error: 'Unauthorized' })
      }

      if (!contract.docusignEnvelopeId) {
        return reply.code(400).send({ error: 'Contract not yet sent for signature' })
      }

      if (contract.status !== 'SIGNED' && contract.status !== 'ACTIVE') {
        return reply.code(400).send({ error: 'Contract not fully signed' })
      }

      const pdfBuffer = await docusignService.getSignedDocument(contract.docusignEnvelopeId)
      reply.type('application/pdf')
      reply.header('Content-Disposition', `attachment; filename="contract_${contractId}.pdf"`)
      return reply.send(pdfBuffer)
    }
  )

  // DocuSign webhook handler (Prompt 2.4)
  fastify.post(
    '/webhooks/docusign',
    {
      config: { rawBody: true },
    },
    async (request, reply) => {
      try {
        // Note: In production, verify webhook signature for security
        const payload = request.body as any
        await docusignService.handleWebhook(payload)
        return reply.send({ status: 'ok' })
      } catch (error: any) {
        fastify.log.error('DocuSign webhook error:', error)
        // Always return 200 to DocuSign even on error
        return reply.send({ status: 'ok', error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST /docusign/templates - Create document template
  fastify.post(
    '/templates',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          templateContent: z.string().min(1),
          signerRoles: z.array(z.string()),
          fields: z.array(z.object({
            role: z.string(),
            fieldType: z.enum(['signature', 'date', 'text', 'checkbox']),
            x: z.number(),
            y: z.number(),
            page: z.number(),
            width: z.number().optional(),
            height: z.number().optional(),
            required: z.boolean().optional(),
          })).optional(),
          metadata: z.record(z.any()).optional(),
        })),
      ],
    },
    async (request, reply) => {
      const body = request.body as any
      const template = await docusignService.createDocumentTemplate(body)
      return reply.code(201).send({ template })
    }
  )

  // GET /docusign/templates - List document templates
  fastify.get(
    '/templates',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      const query = request.query as {
        status?: string
        limit?: string
        offset?: string
      }
      const result = await docusignService.listDocumentTemplates({
        status: query.status,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })
      return reply.send(result)
    }
  )

  // GET /docusign/templates/:id - Get document template
  fastify.get(
    '/templates/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const template = await docusignService.getDocumentTemplate(id)
      return reply.send({ template })
    }
  )

  // GET /docusign/envelopes/:envelopeId/status - Get detailed envelope status
  fastify.get(
    '/envelopes/:envelopeId/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ envelopeId: z.string() })),
      ],
    },
    async (request, reply) => {
      const { envelopeId } = request.params as { envelopeId: string }
      const status = await docusignService.getDetailedEnvelopeStatus(envelopeId)
      return reply.send({ status })
    }
  )

  // POST /docusign/envelopes/:envelopeId/track - Track document status
  fastify.post(
    '/envelopes/:envelopeId/track',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ envelopeId: z.string() })),
      ],
    },
    async (request, reply) => {
      const { envelopeId } = request.params as { envelopeId: string }
      const result = await docusignService.trackDocumentStatus(envelopeId)
      return reply.send({ result })
    }
  )

  // GET /docusign/auth - Get authorization URL
  fastify.get(
    '/auth',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      const query = request.query as { redirectUri?: string }
      const redirectUri = query.redirectUri || `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/docusign/callback`
      const result = await docusignService.getAuthUrl(redirectUri)
      return reply.send(result)
    }
  )

  // GET /docusign/envelopes - List envelopes
  fastify.get(
    '/envelopes',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      const query = request.query as {
        fromDate?: string
        status?: string
        limit?: string
      }
      const result = await docusignService.listEnvelopes({
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        status: query.status,
        limit: query.limit ? parseInt(query.limit) : undefined,
      })
      return reply.send(result)
    }
  )

  // POST /docusign/envelopes - Create envelope from template
  fastify.post(
    '/envelopes',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          templateId: z.string().min(1),
          recipientEmail: z.string().email(),
          recipientName: z.string().min(1),
          documentName: z.string().optional(),
          customFields: z.record(z.any()).optional(),
          embeddedSigning: z.boolean().optional().default(false),
          returnUrl: z.string().url().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string; email?: string }
      const body = request.body as {
        templateId: string
        recipientEmail: string
        recipientName: string
        documentName?: string
        customFields?: Record<string, any>
        embeddedSigning?: boolean
        returnUrl?: string
      }
      const result = await docusignService.createEnvelopeFromTemplate({
        ...body,
        userId: user.id,
        userEmail: user.email,
      })
      return reply.code(201).send(result)
    }
  )

  // GET /docusign/envelopes/:envelopeId/documents/:documentId - Get document info
  fastify.get(
    '/envelopes/:envelopeId/documents/:documentId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({
          envelopeId: z.string(),
          documentId: z.string(),
        })),
      ],
    },
    async (request, reply) => {
      const { envelopeId, documentId } = request.params as {
        envelopeId: string
        documentId: string
      }
      const result = await docusignService.getDocumentInfo(envelopeId, documentId)
      return reply.send(result)
    }
  )

  // PUT /docusign/envelopes/:envelopeId - Update envelope (void, remind, resend)
  fastify.put(
    '/envelopes/:envelopeId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ envelopeId: z.string() })),
        validateBody(z.object({
          action: z.enum(['void', 'remind', 'resend']),
          reason: z.string().optional(),
          reminderDelay: z.string().optional(),
          reminderFrequency: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { envelopeId } = request.params as { envelopeId: string }
      const body = request.body as {
        action: 'void' | 'remind' | 'resend'
        reason?: string
        reminderDelay?: string
        reminderFrequency?: string
      }

      let result: any

      switch (body.action) {
        case 'void':
          result = await docusignService.voidEnvelope(envelopeId, body.reason || 'Voided by user request', user.id)
          break
        case 'remind':
          result = await docusignService.remindEnvelope(
            envelopeId,
            body.reminderDelay || '1',
            body.reminderFrequency || '2'
          )
          break
        case 'resend':
          result = await docusignService.resendEnvelope(envelopeId)
          break
        default:
          return reply.code(400).send({ error: 'Invalid action' })
      }

      return reply.send({
        success: true,
        envelopeId,
        action: body.action,
        result,
      })
    }
  )

  // GET /docusign/callback - Handle DocuSign callback (OAuth redirect or signing completion)
  fastify.get(
    '/callback',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as {
          envelopeId?: string
          event?: string
          state?: string
        }

        const result = await docusignService.handleCallback({
          envelopeId: query.envelopeId,
          event: query.event,
          state: query.state,
          userId: user.id,
        })

        // Redirect to the specified URL
        return reply.redirect(result.redirectUrl)
      } catch (error: any) {
        request.log.error('DocuSign callback error:', error)
        const redirectUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/documents?error=callback_failed`
        return reply.redirect(redirectUrl)
      }
    }
  )
}
