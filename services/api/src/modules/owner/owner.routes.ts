/**
 * owner.routes.ts
 * Owner-namespaced API routes.
 * All routes require authenticated owner-role user.
 * Prefix: /owner
 */
import type { FastifyInstance } from 'fastify'
import { authenticateUser } from '../middleware/auth'
import {
  CreateProjectBodyDto,
  UpdateProjectBodyDto,
  ProjectParamsDto,
  EngagementParamsDto,
  AdvanceReadinessBodyDto,
} from './owner.dto'
import {
  ownerListProjects,
  ownerGetProject,
  ownerCreateProject,
  ownerUpdateProject,
  ownerGetReadiness,
  ownerAdvanceReadiness,
  ownerListEngagements,
  ownerGetEngagement,
  ownerGetTimeline,
} from './owner.service'

export async function ownerRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser)

  // ─── Projects ───────────────────────────────────────────────────────────────

  /** GET /owner/projects — list all projects where requester is owner */
  fastify.get('/projects', async (request, reply) => {
    const user = (request as any).user
    const projects = await ownerListProjects(user.id)
    return reply.send({ projects, total: projects.length })
  })

  /** POST /owner/projects — create project (admin-override only) */
  fastify.post('/projects', async (request, reply) => {
    const user = (request as any).user
    const body = CreateProjectBodyDto.parse(request.body)
    const project = await ownerCreateProject(user.id, user.orgId ?? null, body)
    return reply.status(201).send({ project })
  })

  /** GET /owner/projects/:id — project detail */
  fastify.get('/projects/:id', async (request, reply) => {
    const user = (request as any).user
    const { id } = ProjectParamsDto.parse(request.params)
    const project = await ownerGetProject(id, user.id)
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    return reply.send({ project })
  })

  /** PATCH /owner/projects/:id — update project metadata */
  fastify.patch('/projects/:id', async (request, reply) => {
    const user = (request as any).user
    const { id } = ProjectParamsDto.parse(request.params)
    const body = UpdateProjectBodyDto.parse(request.body)
    const project = await ownerUpdateProject(id, user.id, body)
    return reply.send({ project })
  })

  // ─── Readiness ──────────────────────────────────────────────────────────────

  /** GET /owner/projects/:id/readiness — checklist + gate status */
  fastify.get('/projects/:id/readiness', async (request, reply) => {
    const user = (request as any).user
    const { id } = ProjectParamsDto.parse(request.params)
    const readiness = await ownerGetReadiness(id, user.id)
    return reply.send(readiness)
  })

  /** POST /owner/projects/:id/readiness/advance — advance to next gate */
  fastify.post('/projects/:id/readiness/advance', async (request, reply) => {
    const user = (request as any).user
    const { id } = ProjectParamsDto.parse(request.params)
    const body = AdvanceReadinessBodyDto.parse(request.body)
    const result = await ownerAdvanceReadiness(id, user.id, body.targetGate, body.notes)
    return reply.send(result)
  })

  // ─── Timeline ───────────────────────────────────────────────────────────────

  /** GET /owner/projects/:id/timeline — chronological event history */
  fastify.get('/projects/:id/timeline', async (request, reply) => {
    const user = (request as any).user
    const { id } = ProjectParamsDto.parse(request.params)
    const events = await ownerGetTimeline(id, user.id)
    return reply.send({ events, total: events.length })
  })

  // ─── Engagements ────────────────────────────────────────────────────────────

  /** GET /owner/projects/:id/engagements — list engagements on project */
  fastify.get('/projects/:id/engagements', async (request, reply) => {
    const user = (request as any).user
    const { id } = ProjectParamsDto.parse(request.params)
    const engagements = await ownerListEngagements(id, user.id)
    return reply.send({ engagements, total: engagements.length })
  })

  /** GET /owner/engagements/:contractId — engagement detail */
  fastify.get('/engagements/:contractId', async (request, reply) => {
    const user = (request as any).user
    const { contractId } = EngagementParamsDto.parse(request.params)
    const engagement = await ownerGetEngagement(contractId, user.id)
    if (!engagement) return reply.status(404).send({ error: 'Engagement not found' })
    return reply.send({ engagement })
  })

  // ─── Error handler ───────────────────────────────────────────────────────────
  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as any).statusCode ?? 500
    fastify.log.error(error)
    return reply.status(statusCode).send({
      error: error.message ?? 'Internal server error',
      statusCode,
    })
  })
}
