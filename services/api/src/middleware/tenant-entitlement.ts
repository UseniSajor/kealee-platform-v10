import type { FastifyReply, FastifyRequest } from 'fastify'
import { entitlementService } from '../modules/entitlements/entitlement.service'

type ModuleKeyResolver = string | ((request: FastifyRequest) => string)

/**
 * Route guard for professional tenant modules. Organization context must have
 * been authenticated and explicitly selected before this guard runs.
 */
export function requireTenantModule(moduleKey: ModuleKeyResolver) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user
    if (!user) return reply.code(401).send({ error: 'Not authenticated' })
    if (!user.organizationId) {
      return reply.code(403).send({ error: 'Explicit professional organization context is required' })
    }

    const resolvedModuleKey = typeof moduleKey === 'function' ? moduleKey(request) : moduleKey
    const decision = await entitlementService.getModuleAccessDecision(
      user.organizationId,
      resolvedModuleKey,
    )
    if (!decision.hasAccess) {
      return reply.code(403).send({
        error: 'Module access denied',
        code: decision.reason,
        moduleKey: resolvedModuleKey,
      })
    }
  }
}
