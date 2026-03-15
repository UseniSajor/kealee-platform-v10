/**
 * pm-features.routes.ts
 *
 * Construction OS feature gate endpoints.
 * Mounted at /pm/features by pm.routes.ts.
 *
 *   GET  /pm/features                     — list all OS features
 *   GET  /pm/features/project/:projectId  — get project OS access record
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { autoProvisionOSAccess } from '../../middleware/feature-gate.middleware'

export async function pmFeaturesRoutes(fastify: FastifyInstance) {
  // GET /pm/features — list all Construction OS feature definitions
  fastify.get('/', { preHandler: [authenticateUser] }, async (_req, reply) => {
    const features = await prismaAny.constructionOSFeature.findMany({
      orderBy: [{ phase: 'asc' }, { slug: 'asc' }],
    }).catch(() => [])
    return reply.send({ features })
  })

  // GET /pm/features/project/:projectId — get project OS access + auto-provision
  fastify.get(
    '/project/:projectId',
    { preHandler: [authenticateUser, autoProvisionOSAccess] },
    async (req, reply) => {
      const { projectId } = req.params as { projectId: string }

      const access = await prismaAny.projectOSAccess.findUnique({
        where: { projectId },
      }).catch(() => null)

      if (!access) {
        return reply.status(404).send({
          error: 'No OS access record for this project',
          projectId,
        })
      }

      return reply.send({ access })
    },
  )
}
