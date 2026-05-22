/**
 * Command Center ↔ v30 bridge — customer product uses v30; CC KeaBots remain internal ops.
 */
import type { FastifyInstance } from 'fastify'
import { isV30Enabled, V30_PARALLEL_BOT_TYPES, V30_EXTERNAL_DESIGN_BOT_PATHS } from '@kealee/kealee-agent-stack'

export async function v30CommandBridgeRoutes(fastify: FastifyInstance) {
  fastify.get('/command-center/bridge', async (_request, reply) => {
    return reply.send({
      v30Enabled: isV30Enabled(),
      customerProductPath: 'v30',
      description:
        'Public homeowners use v30 (get-concept → parallel bots). Command Center KeaBots (keabot-*) are internal marketplace/PM ops — not replaced.',
      v30ParallelBots: V30_PARALLEL_BOT_TYPES,
      designBot: {
        canonical: 'packages/kealee-agent-stack/src/v30/design-bot-executor.ts',
        blockedDuplicates: V30_EXTERNAL_DESIGN_BOT_PATHS,
      },
      imageGeneration: {
        provider: 'replicate',
        env: 'REPLICATE_API_TOKEN',
        routes: ['/api/v30/renders', '/api/editor/renders', '/api/concept/generate'],
        pascalRole: '2D editor + scene geometry only (not image AI)',
      },
      commandCenterBots: 'services/command-center + bots/keabot-* (unchanged)',
      portalAdmin: 'apps/portal-admin — live prompt PATCH /v30/admin/bots/:botType',
    })
  })
}
