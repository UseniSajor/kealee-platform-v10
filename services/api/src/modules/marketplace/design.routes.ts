import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody } from '../../middleware/validation.middleware'
import { designService } from './design.service'

const checkoutSchema = z.object({
    packageId: z.string(),
})

export async function designRoutes(fastify: FastifyInstance) {
    /**
     * Create checkout session for design package
     */
    fastify.post(
        '/design/checkout',
        {
            preHandler: [
                authenticateUser,
                validateBody(checkoutSchema),
            ],
        },
        async (request, reply) => {
            const user = (request as any).user as { id: string }
            const { packageId } = request.body as any

            const result = await designService.createCheckoutSession(packageId, user.id)

            return reply.send(result)
        }
    )
}
