import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { quotesService } from './quotes.service'

const submitQuoteSchema = z.object({
    leadId: z.string().uuid(),
    profileId: z.string().uuid(),
    amount: z.number().positive(),
    timeline: z.string().optional(),
    details: z.string().optional(),
})

export async function quotesRoutes(fastify: FastifyInstance) {
    /**
     * Submit a quote for a lead
     */
    fastify.post(
        '/quotes',
        {
            preHandler: [
                authenticateUser,
                validateBody(submitQuoteSchema),
            ],
        },
        async (request, reply) => {
            const user = (request as any).user as { id: string }
            const body = request.body as any

            const quote = await quotesService.submitQuote({
                ...body,
                userId: user.id,
            })

            return reply.code(201).send({
                success: true,
                quote,
            })
        }
    )

    /**
     * Get quotes for a lead
     */
    fastify.get(
        '/leads/:leadId/quotes',
        {
            preHandler: [
                authenticateUser,
                validateParams(z.object({ leadId: z.string().uuid() })),
            ],
        },
        async (request, reply) => {
            const { leadId } = request.params as { leadId: string }
            const quotes = await quotesService.listQuotes(leadId)

            return reply.send({
                success: true,
                quotes,
            })
        }
    )
}
