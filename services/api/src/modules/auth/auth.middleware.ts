import { FastifyRequest, FastifyReply } from 'fastify'
import { authService } from './auth.service'

export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'Missing or invalid authorization header',
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const user = await authService.verifyToken(token)

    // Attach user to request for use in routes
    ;(request as any).user = user

    return
  } catch (error: any) {
    return reply.code(401).send({
      error: error.message || 'Invalid or expired token',
    })
  }
}
