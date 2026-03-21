/**
 * dp.routes.ts — Design Professionals Routes
 * Prefix: /design-professionals
 */
import type { FastifyInstance } from 'fastify'
import { authenticateUser } from '../../middleware/auth'
import {
  RegisterDPBodyDto,
  UpdateDPProfileDto,
  DPParamsDto,
  AssignDPBodyDto,
  UpdateAssignmentBodyDto,
} from './dp.dto'
import {
  registerDesignProfessional,
  getDPProfile,
  updateDPProfile,
  listDesignProfessionals,
  assignDP,
  listProjectAssignments,
  updateAssignment,
  adminVerifyDP,
} from './dp.service'

export async function dpRoutes(fastify: FastifyInstance) {
  // ─── Public routes ────────────────────────────────────────────────────────

  /** GET /design-professionals — browse verified professionals */
  fastify.get('/', async (request, reply) => {
    const { role, jurisdiction, page, limit } = request.query as any
    const result = await listDesignProfessionals({
      role,
      jurisdiction,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })
    return reply.send(result)
  })

  // ─── Auth-required routes ─────────────────────────────────────────────────

  fastify.addHook('preHandler', authenticateUser)

  /** POST /design-professionals/register — submit registration */
  fastify.post('/register', async (request, reply) => {
    const user = (request as any).user
    const body = RegisterDPBodyDto.parse(request.body)
    const profile = await registerDesignProfessional(user.id, body)
    return reply.status(201).send({ profile })
  })

  /** GET /design-professionals/me — get my profile */
  fastify.get('/me', async (request, reply) => {
    const user = (request as any).user
    const profile = await getDPProfile(user.id)
    if (!profile) return reply.status(404).send({ error: 'Profile not found. Please register first.' })
    return reply.send({ profile })
  })

  /** PATCH /design-professionals/me — update my profile */
  fastify.patch('/me', async (request, reply) => {
    const user = (request as any).user
    const body = UpdateDPProfileDto.parse(request.body)
    const profile = await updateDPProfile(user.id, body)
    return reply.send({ profile })
  })

  /** GET /design-professionals/:id — get profile by id */
  fastify.get('/:id', async (request, reply) => {
    const { id } = DPParamsDto.parse(request.params)
    // Look up by professional id — find profile and map user
    const db = (await import('../../lib/prisma')).default as any
    const profile = await db.designProfessional?.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    })
    if (!profile || profile.status !== 'VERIFIED') {
      return reply.status(404).send({ error: 'Professional not found' })
    }
    return reply.send({ profile })
  })

  // ─── Assignments ─────────────────────────────────────────────────────────

  /** POST /design-professionals/assignments — assign DP to project */
  fastify.post('/assignments', async (request, reply) => {
    const user = (request as any).user
    const body = AssignDPBodyDto.parse(request.body)
    const assignment = await assignDP(body.projectId, body.professionalId, body.role, user.id)
    return reply.status(201).send({ assignment })
  })

  /** GET /design-professionals/assignments/project/:projectId */
  fastify.get('/assignments/project/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string }
    const assignments = await listProjectAssignments(projectId)
    return reply.send({ assignments })
  })

  /** PATCH /design-professionals/assignments/:id — accept/decline/complete */
  fastify.patch('/assignments/:id', async (request, reply) => {
    const user = (request as any).user
    const { id } = DPParamsDto.parse(request.params)
    const body = UpdateAssignmentBodyDto.parse(request.body)
    const assignment = await updateAssignment(id, user.id, body.status)
    return reply.send({ assignment })
  })

  // ─── Admin ────────────────────────────────────────────────────────────────

  /** POST /design-professionals/:id/verify — admin verify */
  fastify.post('/:id/verify', async (request, reply) => {
    const user = (request as any).user
    const { id } = DPParamsDto.parse(request.params)
    const profile = await adminVerifyDP(id, user.id)
    return reply.send({ profile })
  })

  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as any).statusCode ?? 500
    fastify.log.error(error)
    return reply.status(statusCode).send({ error: error.message, statusCode })
  })
}
