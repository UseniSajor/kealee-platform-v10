import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams } from '../../middleware/validation.middleware'
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
      const contract = await prisma.contractAgreement.findUnique({
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
      const contract = await prisma.contractAgreement.findUnique({
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
  fastify.post('/webhooks/docusign', async (request, reply) => {
    // Note: In production, verify webhook signature for security
    const payload = request.body
    await docusignService.handleWebhook(payload)
    return reply.send({ status: 'ok' })
  })
}
