import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@kealee/database'

export async function projectOutputRoutes(fastify: FastifyInstance) {
  // GET /api/project-output/:id — fetch ProjectOutput status + result
  fastify.get<{ Params: { id: string } }>('/project-output/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params

      // Query with indexed fields for performance
      const output = await prisma.projectOutput.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          type: true,
          resultJson: true,
          pdfUrl: true,
          downloadUrl: true,
          generatedAt: true,
          completedAt: true,
          metadata: true,
        },
      })

      if (!output) {
        return reply.status(404).send({
          error: 'ProjectOutput not found',
          id,
        })
      }

      // Extract result summary from resultJson
      const resultJson = output.resultJson as any
      const summary = resultJson?.summary || resultJson?.title || 'Your project analysis'
      const nextStep = resultJson?.nextStep || 'Next step available'
      const confidence = resultJson?.confidence || 'medium'

      // If failed, return fallback output
      if (output.status === 'failed') {
        return reply.send({
          id: output.id,
          status: 'failed',
          type: output.type,
          summary: 'Your project analysis is ready to continue',
          nextStep: 'Order Permit Package',
          confidence: 'medium',
          updatedAt: output.completedAt || output.generatedAt,
          fallback: true,
        })
      }

      // If pending/generating, return status with eta
      if (output.status === 'pending' || output.status === 'generating') {
        const metadata = output.metadata as any
        const serviceType = output.type || 'project'

        // Estimate based on type
        const etas: Record<string, number> = {
          design: 2,
          permit: 1,
          concept: 1.5,
          estimate: 0.5,
          change_order: 0.5,
        }
        const etaHours = etas[serviceType] || 2

        return reply.send({
          id: output.id,
          status: output.status,
          type: output.type,
          summary: output.status === 'generating' ? 'Generating your plan...' : 'Processing your request...',
          nextStep: 'Please wait',
          confidence: 'medium',
          updatedAt: output.generatedAt,
          estimatedHours: etaHours,
          isProcessing: true,
        })
      }

      // Completed: return full result
      return reply.send({
        id: output.id,
        status: output.status,
        type: output.type,
        summary,
        resultJson,
        pdfUrl: output.pdfUrl,
        downloadUrl: output.downloadUrl,
        nextStep,
        confidence,
        updatedAt: output.completedAt || output.generatedAt,
        isCompleted: true,
      })
    } catch (err: any) {
      fastify.log.error(err)
      return reply.status(500).send({
        error: 'Failed to fetch ProjectOutput',
        message: err?.message,
      })
    }
  })
}
