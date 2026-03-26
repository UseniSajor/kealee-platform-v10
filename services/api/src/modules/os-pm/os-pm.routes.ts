/**
 * OS-PM (Construction Project Management) API Routes
 *
 * GET    /os-pm/projects             — list projects
 * GET    /os-pm/projects/:id         — project detail + phase + milestones
 * POST   /os-pm/projects/:id/phase   — advance phase
 * GET    /os-pm/projects/:id/milestones — list milestones
 * PATCH  /os-pm/projects/:id/milestones/:mId — update milestone status
 * GET    /os-pm/projects/:id/tasks   — list tasks
 * GET    /os-pm/projects/:id/rfis    — list RFIs
 * POST   /os-pm/projects/:id/rfis    — create RFI
 * GET    /os-pm/projects/:id/change-orders — list change orders
 * GET    /os-pm/projects/:id/dashboard — aggregated dashboard data
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import {
  getMilestonesForPhase,
  isValidPhaseTransition,
  estimateCompletionDate,
  type ProjectPhase,
} from './phase-engine'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const AdvancePhaseBody = z.object({
  targetPhase: z.enum([
    'PRE_DESIGN', 'ARCHITECT', 'PERMIT',
    'PRE_CONSTRUCTION', 'CONSTRUCTION', 'CLOSEOUT',
  ]),
  notes: z.string().optional(),
})

const UpdateMilestoneBody = z.object({
  status:      z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED']),
  completedAt: z.string().datetime().optional(),
  notes:       z.string().optional(),
})

const CreateRFIBody = z.object({
  subject:     z.string().min(1),
  description: z.string().min(1),
  assignedTo:  z.string().optional(),
  dueDate:     z.string().datetime().optional(),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

// ---------------------------------------------------------------------------
// Helper: get project or 404
// ---------------------------------------------------------------------------

async function getProject(id: string) {
  const rows = await prismaAny.$queryRaw`
    SELECT id, name, status, current_phase, created_at, updated_at
    FROM "Project"
    WHERE id = ${id}
    LIMIT 1
  ` as Array<Record<string, any>>
  return rows[0] ?? null
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export async function osPmRoutes(fastify: FastifyInstance) {

  // GET /os-pm/projects — list projects (basic)
  fastify.get('/projects', async (request, reply) => {
    try {
      const rows = await prismaAny.$queryRaw`
        SELECT id, name, status, current_phase, created_at, updated_at
        FROM "Project"
        ORDER BY created_at DESC
        LIMIT 100
      ` as Array<Record<string, any>>
      return reply.send({ projects: rows, count: rows.length })
    } catch (err: any) {
      fastify.log.error(err, 'os-pm GET /projects')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // GET /os-pm/projects/:id — project detail
  fastify.get('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const project = await getProject(id)
      if (!project) return reply.status(404).send({ error: 'Project not found' })
      return reply.send(project)
    } catch (err: any) {
      fastify.log.error(err, 'os-pm GET /projects/:id')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // POST /os-pm/projects/:id/phase — advance to next phase
  fastify.post('/projects/:id/phase', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = AdvancePhaseBody.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.errors })
    }

    const { targetPhase, notes } = body.data

    try {
      const project = await getProject(id)
      if (!project) return reply.status(404).send({ error: 'Project not found' })

      const currentPhase = (project.current_phase ?? 'PRE_DESIGN') as ProjectPhase

      if (!isValidPhaseTransition(currentPhase, targetPhase as ProjectPhase)) {
        return reply.status(400).send({
          error: `Invalid phase transition: ${currentPhase} → ${targetPhase}. Only forward transitions are allowed.`,
        })
      }

      // Update project phase
      await prismaAny.$executeRaw`
        UPDATE "Project"
        SET current_phase = ${targetPhase}, updated_at = NOW()
        WHERE id = ${id}
      `

      // Auto-generate milestones for the new phase
      const milestones = getMilestonesForPhase(targetPhase as ProjectPhase)
      const phaseStart = new Date()

      for (const m of milestones) {
        const dueDate = new Date(phaseStart)
        dueDate.setDate(dueDate.getDate() + m.estimatedDaysFromPhaseStart)

        // Check if milestone already exists
        const existing = await prismaAny.$queryRaw`
          SELECT id FROM "PhaseMilestone"
          WHERE project_id = ${id} AND name = ${m.name}
          LIMIT 1
        ` as Array<{ id: string }>

        if (!existing.length) {
          await prismaAny.$executeRaw`
            INSERT INTO "PhaseMilestone"
              (project_id, name, description, phase, required, due_date, status, created_at, updated_at)
            VALUES
              (${id}, ${m.name}, ${m.description}, ${m.phase}, ${m.required},
               ${dueDate.toISOString()}::timestamptz,
               'PENDING', NOW(), NOW())
          `
        }
      }

      // Log activity
      const estimatedCompletion = estimateCompletionDate(targetPhase as ProjectPhase, phaseStart)
      fastify.log.info({
        projectId: id,
        fromPhase: currentPhase,
        toPhase: targetPhase,
        milestonesCreated: milestones.length,
        estimatedCompletion: estimatedCompletion.toISOString(),
        notes,
      }, 'Phase advanced')

      return reply.send({
        success: true,
        previousPhase: currentPhase,
        currentPhase: targetPhase,
        milestonesGenerated: milestones.length,
        estimatedPhaseCompletion: estimatedCompletion.toISOString(),
      })
    } catch (err: any) {
      fastify.log.error(err, 'os-pm POST /projects/:id/phase')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // GET /os-pm/projects/:id/milestones
  fastify.get('/projects/:id/milestones', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const rows = await prismaAny.$queryRaw`
        SELECT id, name, description, phase, required, status, due_date, completed_at, notes, created_at
        FROM "PhaseMilestone"
        WHERE project_id = ${id}
        ORDER BY due_date ASC NULLS LAST
      ` as Array<Record<string, any>>
      return reply.send({ milestones: rows, count: rows.length })
    } catch (err: any) {
      fastify.log.error(err, 'os-pm GET /projects/:id/milestones')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // PATCH /os-pm/projects/:id/milestones/:mId
  fastify.patch('/projects/:id/milestones/:mId', async (request, reply) => {
    const { id, mId } = request.params as { id: string; mId: string }
    const body = UpdateMilestoneBody.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.errors })
    }

    const { status, completedAt, notes } = body.data

    try {
      await prismaAny.$executeRaw`
        UPDATE "PhaseMilestone" SET
          status       = ${status},
          completed_at = ${completedAt ? `${completedAt}::timestamptz` : null},
          notes        = ${notes ?? null},
          updated_at   = NOW()
        WHERE id = ${mId} AND project_id = ${id}
      `
      return reply.send({ success: true, milestoneId: mId, status })
    } catch (err: any) {
      fastify.log.error(err, 'os-pm PATCH /projects/:id/milestones/:mId')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // GET /os-pm/projects/:id/tasks
  fastify.get('/projects/:id/tasks', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const rows = await prismaAny.$queryRaw`
        SELECT id, title, description, status, priority, assigned_to,
               due_date, completed_at, created_at
        FROM "Task"
        WHERE project_id = ${id}
        ORDER BY created_at DESC
        LIMIT 200
      ` as Array<Record<string, any>>
      return reply.send({ tasks: rows, count: rows.length })
    } catch (err: any) {
      fastify.log.error(err, 'os-pm GET /projects/:id/tasks')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // GET /os-pm/projects/:id/rfis
  fastify.get('/projects/:id/rfis', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const rows = await prismaAny.$queryRaw`
        SELECT id, subject, description, status, priority, assigned_to,
               due_date, response, resolved_at, created_at
        FROM "RFI"
        WHERE project_id = ${id}
        ORDER BY created_at DESC
        LIMIT 200
      ` as Array<Record<string, any>>
      return reply.send({ rfis: rows, count: rows.length })
    } catch (err: any) {
      fastify.log.error(err, 'os-pm GET /projects/:id/rfis')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // POST /os-pm/projects/:id/rfis — create RFI
  fastify.post('/projects/:id/rfis', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = CreateRFIBody.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid body', details: body.error.errors })
    }

    const { subject, description, assignedTo, dueDate, priority } = body.data

    try {
      const rows = await prismaAny.$queryRaw`
        INSERT INTO "RFI"
          (project_id, subject, description, priority, assigned_to, due_date, status, created_at, updated_at)
        VALUES
          (${id}, ${subject}, ${description}, ${priority}, ${assignedTo ?? null},
           ${dueDate ? `${dueDate}::timestamptz` : null},
           'OPEN', NOW(), NOW())
        RETURNING id, subject, status, priority
      ` as Array<Record<string, any>>

      return reply.status(201).send(rows[0])
    } catch (err: any) {
      fastify.log.error(err, 'os-pm POST /projects/:id/rfis')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // GET /os-pm/projects/:id/change-orders
  fastify.get('/projects/:id/change-orders', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const rows = await prismaAny.$queryRaw`
        SELECT id, title, description, status, amount_cents, reason,
               approved_by, approved_at, created_at
        FROM "ChangeOrder"
        WHERE project_id = ${id}
        ORDER BY created_at DESC
      ` as Array<Record<string, any>>
      return reply.send({ changeOrders: rows, count: rows.length })
    } catch (err: any) {
      fastify.log.error(err, 'os-pm GET /projects/:id/change-orders')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })

  // GET /os-pm/projects/:id/dashboard — aggregated view
  fastify.get('/projects/:id/dashboard', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const [project, milestones, tasks, rfis, changeOrders] = await Promise.all([
        getProject(id),
        prismaAny.$queryRaw`
          SELECT id, name, phase, status, required, due_date, completed_at
          FROM "PhaseMilestone" WHERE project_id = ${id} ORDER BY due_date ASC NULLS LAST
        ` as Promise<Array<Record<string, any>>>,
        prismaAny.$queryRaw`
          SELECT id, title, status, priority, due_date
          FROM "Task" WHERE project_id = ${id} ORDER BY due_date ASC NULLS LAST LIMIT 50
        ` as Promise<Array<Record<string, any>>>,
        prismaAny.$queryRaw`
          SELECT id, subject, status, priority, due_date
          FROM "RFI" WHERE project_id = ${id} AND status != 'CLOSED' ORDER BY created_at DESC LIMIT 20
        ` as Promise<Array<Record<string, any>>>,
        prismaAny.$queryRaw`
          SELECT id, title, status, amount_cents FROM "ChangeOrder"
          WHERE project_id = ${id} ORDER BY created_at DESC LIMIT 20
        ` as Promise<Array<Record<string, any>>>,
      ])

      if (!project) return reply.status(404).send({ error: 'Project not found' })

      // Compute milestone stats
      const milestoneStats = {
        total:     milestones.length,
        completed: milestones.filter((m) => m.status === 'COMPLETED').length,
        overdue:   milestones.filter((m) => m.status !== 'COMPLETED' && m.due_date && new Date(m.due_date) < new Date()).length,
        required:  milestones.filter((m) => m.required && m.status !== 'COMPLETED').length,
      }

      // Compute task stats
      const taskStats = {
        total:      tasks.length,
        inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        completed:  tasks.filter((t) => t.status === 'COMPLETED').length,
        overdue:    tasks.filter((t) => t.status !== 'COMPLETED' && t.due_date && new Date(t.due_date) < new Date()).length,
      }

      // Compute change order financials
      const coStats = {
        total:             changeOrders.length,
        pending:           changeOrders.filter((c) => c.status === 'PENDING').length,
        approvedAmountCents: changeOrders
          .filter((c) => c.status === 'APPROVED')
          .reduce((sum, c) => sum + (c.amount_cents ?? 0), 0),
      }

      return reply.send({
        project,
        milestoneStats,
        taskStats,
        coStats,
        recentMilestones: milestones.slice(0, 5),
        openRFIs: rfis,
        changeOrders: changeOrders.slice(0, 5),
      })
    } catch (err: any) {
      fastify.log.error(err, 'os-pm GET /projects/:id/dashboard')
      return reply.status(500).send({ error: sanitizeErrorMessage(err) })
    }
  })
}
