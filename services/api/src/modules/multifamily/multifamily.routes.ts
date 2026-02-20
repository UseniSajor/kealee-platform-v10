import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// Multifamily Routes — Units, Draw Requests, Area Phases
// Prefix: /pm/multifamily
// ============================================================================

export async function multifamilyRoutes(fastify: FastifyInstance) {
  // ── Unit Routes ──────────────────────────────────────────────────────────

  // GET /pm/multifamily/units — list units for a project
  fastify.get('/units', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, status, building, floor, phaseId } = req.query as Record<string, string>
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' })

    const where: any = { projectId }
    if (status) where.status = status
    if (building) where.building = building
    if (floor) where.floor = parseInt(floor)
    if (phaseId) where.phaseId = phaseId

    const units = await prisma.multifamilyUnit.findMany({
      where,
      orderBy: [{ building: 'asc' }, { floor: 'asc' }, { number: 'asc' }],
    })
    return { units }
  })

  // GET /pm/multifamily/units/stats — unit statistics for a project
  fastify.get('/units/stats', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = req.query as Record<string, string>
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' })

    const units = await prisma.multifamilyUnit.findMany({ where: { projectId } })
    const total = units.length
    const complete = units.filter(u => u.status === 'COMPLETE' || u.status === 'TURNED_OVER').length
    const inProgress = units.filter(u => !['NOT_STARTED', 'COMPLETE', 'TURNED_OVER'].includes(u.status)).length
    const punch = units.filter(u => u.status === 'PUNCH').length

    return {
      total,
      complete,
      inProgress,
      punch,
      pctComplete: total > 0 ? Math.round((complete / total) * 100) : 0,
    }
  })

  // GET /pm/multifamily/units/:id — get unit by ID
  fastify.get('/units/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const unit = await prisma.multifamilyUnit.findUnique({ where: { id } })
    if (!unit) return reply.status(404).send({ error: 'Unit not found' })
    return { unit }
  })

  // POST /pm/multifamily/units — create a unit
  fastify.post('/units', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any
    if (!body.projectId || !body.number) {
      return reply.status(400).send({ error: 'projectId and number are required' })
    }

    const unit = await prisma.multifamilyUnit.create({
      data: {
        projectId: body.projectId,
        number: body.number,
        building: body.building || 'Building A',
        floor: body.floor || 1,
        unitType: body.unitType || '1BR',
        sqft: body.sqft || 0,
        status: body.status || 'NOT_STARTED',
        phaseId: body.phaseId || null,
        notes: body.notes || null,
      },
    })
    return reply.status(201).send({ unit })
  })

  // POST /pm/multifamily/units/bulk — bulk create units
  fastify.post('/units/bulk', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, units: unitInputs } = req.body as { projectId: string; units: any[] }
    if (!projectId || !Array.isArray(unitInputs)) {
      return reply.status(400).send({ error: 'projectId and units array are required' })
    }

    const data = unitInputs.map((u: any) => ({
      projectId,
      number: u.number,
      building: u.building || 'Building A',
      floor: u.floor || 1,
      unitType: u.unitType || '1BR',
      sqft: u.sqft || 0,
      status: u.status || 'NOT_STARTED',
      phaseId: u.phaseId || null,
    }))

    const result = await prisma.multifamilyUnit.createMany({ data, skipDuplicates: true })
    return reply.status(201).send({ created: result.count })
  })

  // PATCH /pm/multifamily/units/:id — update a unit
  fastify.patch('/units/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const body = req.body as any

    const unit = await prisma.multifamilyUnit.update({
      where: { id },
      data: {
        ...(body.number !== undefined && { number: body.number }),
        ...(body.building !== undefined && { building: body.building }),
        ...(body.floor !== undefined && { floor: body.floor }),
        ...(body.unitType !== undefined && { unitType: body.unitType }),
        ...(body.sqft !== undefined && { sqft: body.sqft }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.punchItems !== undefined && { punchItems: body.punchItems }),
        ...(body.phaseId !== undefined && { phaseId: body.phaseId }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.turnoverDate !== undefined && { turnoverDate: body.turnoverDate ? new Date(body.turnoverDate) : null }),
      },
    })
    return { unit }
  })

  // DELETE /pm/multifamily/units/:id — delete a unit
  fastify.delete('/units/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    await prisma.multifamilyUnit.delete({ where: { id } })
    return { deleted: true }
  })

  // ── Draw Request Routes ──────────────────────────────────────────────────

  // GET /pm/multifamily/draws — list draw requests
  fastify.get('/draws', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId, status } = req.query as Record<string, string>
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' })

    const where: any = { projectId }
    if (status) where.status = status

    const draws = await prisma.drawRequest.findMany({
      where,
      orderBy: { drawNumber: 'asc' },
    })
    return { draws }
  })

  // GET /pm/multifamily/draws/stats — draw statistics
  fastify.get('/draws/stats', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = req.query as Record<string, string>
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' })

    const draws = await prisma.drawRequest.findMany({ where: { projectId } })
    const totalScheduled = draws.reduce((s, d) => s + d.scheduledAmount, 0)
    const totalBilled = draws.reduce((s, d) => s + d.previouslyBilled + d.currentBilling, 0)
    const totalFunded = draws.filter(d => d.status === 'FUNDED').reduce((s, d) => s + d.currentBilling, 0)
    const pending = draws.filter(d => ['DRAFT', 'SUBMITTED', 'IN_REVIEW'].includes(d.status)).length

    return {
      totalDraws: draws.length,
      totalScheduled,
      totalBilled,
      totalFunded,
      pending,
      pctDrawn: totalScheduled > 0 ? Math.round((totalBilled / totalScheduled) * 100) : 0,
    }
  })

  // GET /pm/multifamily/draws/:id — get draw by ID
  fastify.get('/draws/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const draw = await prisma.drawRequest.findUnique({ where: { id } })
    if (!draw) return reply.status(404).send({ error: 'Draw not found' })
    return { draw }
  })

  // POST /pm/multifamily/draws — create draw request
  fastify.post('/draws', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any
    if (!body.projectId) return reply.status(400).send({ error: 'projectId is required' })

    // Auto-increment draw number
    const lastDraw = await prisma.drawRequest.findFirst({
      where: { projectId: body.projectId },
      orderBy: { drawNumber: 'desc' },
    })

    const draw = await prisma.drawRequest.create({
      data: {
        projectId: body.projectId,
        drawNumber: (lastDraw?.drawNumber || 0) + 1,
        periodEnd: body.periodEnd ? new Date(body.periodEnd) : null,
        description: body.description || '',
        scheduledAmount: body.scheduledAmount || 0,
        previouslyBilled: body.previouslyBilled || 0,
        currentBilling: body.currentBilling || 0,
        retainage: body.retainage ?? 10,
        status: 'DRAFT',
        createdBy: body.createdBy || null,
      },
    })
    return reply.status(201).send({ draw })
  })

  // PATCH /pm/multifamily/draws/:id — update draw
  fastify.patch('/draws/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const body = req.body as any

    const draw = await prisma.drawRequest.update({
      where: { id },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.periodEnd !== undefined && { periodEnd: body.periodEnd ? new Date(body.periodEnd) : null }),
        ...(body.scheduledAmount !== undefined && { scheduledAmount: body.scheduledAmount }),
        ...(body.previouslyBilled !== undefined && { previouslyBilled: body.previouslyBilled }),
        ...(body.currentBilling !== undefined && { currentBilling: body.currentBilling }),
        ...(body.retainage !== undefined && { retainage: body.retainage }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.aiaDocumentUrl !== undefined && { aiaDocumentUrl: body.aiaDocumentUrl }),
      },
    })
    return { draw }
  })

  // POST /pm/multifamily/draws/:id/submit — submit draw for review
  fastify.post('/draws/:id/submit', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const draw = await prisma.drawRequest.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    })
    return { draw }
  })

  // POST /pm/multifamily/draws/:id/approve — approve draw
  fastify.post('/draws/:id/approve', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const draw = await prisma.drawRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date() },
    })
    return { draw }
  })

  // POST /pm/multifamily/draws/:id/fund — mark draw as funded
  fastify.post('/draws/:id/fund', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const draw = await prisma.drawRequest.update({
      where: { id },
      data: { status: 'FUNDED', fundedAt: new Date() },
    })
    return { draw }
  })

  // POST /pm/multifamily/draws/:id/reject — reject draw
  fastify.post('/draws/:id/reject', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const body = req.body as any
    const draw = await prisma.drawRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason: body.reason || null },
    })
    return { draw }
  })

  // ── Area Phase Routes ────────────────────────────────────────────────────

  // GET /pm/multifamily/phases — list phases
  fastify.get('/phases', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = req.query as Record<string, string>
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' })

    const phases = await prisma.multifamilyAreaPhase.findMany({
      where: { projectId },
      include: { units: { select: { id: true, number: true, status: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return { phases }
  })

  // GET /pm/multifamily/phases/timeline — timeline view
  fastify.get('/phases/timeline', async (req: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = req.query as Record<string, string>
    if (!projectId) return reply.status(400).send({ error: 'projectId is required' })

    const phases = await prisma.multifamilyAreaPhase.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    })
    return { phases }
  })

  // GET /pm/multifamily/phases/:id — get phase by ID
  fastify.get('/phases/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const phase = await prisma.multifamilyAreaPhase.findUnique({
      where: { id },
      include: { units: true },
    })
    if (!phase) return reply.status(404).send({ error: 'Phase not found' })
    return { phase }
  })

  // POST /pm/multifamily/phases — create phase
  fastify.post('/phases', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any
    if (!body.projectId) return reply.status(400).send({ error: 'projectId is required' })

    const phase = await prisma.multifamilyAreaPhase.create({
      data: {
        projectId: body.projectId,
        name: body.name || 'New Phase',
        description: body.description || '',
        status: body.status || 'PLANNED',
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        unitCount: body.unitCount || 0,
        areas: body.areas || [],
      },
    })
    return reply.status(201).send({ phase })
  })

  // PATCH /pm/multifamily/phases/:id — update phase
  fastify.patch('/phases/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const body = req.body as any

    const phase = await prisma.multifamilyAreaPhase.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.unitCount !== undefined && { unitCount: body.unitCount }),
        ...(body.completedUnits !== undefined && { completedUnits: body.completedUnits }),
        ...(body.areas !== undefined && { areas: body.areas }),
      },
    })
    return { phase }
  })

  // DELETE /pm/multifamily/phases/:id — delete phase
  fastify.delete('/phases/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    // Unlink units first
    await prisma.multifamilyUnit.updateMany({
      where: { phaseId: id },
      data: { phaseId: null },
    })
    await prisma.multifamilyAreaPhase.delete({ where: { id } })
    return { deleted: true }
  })

  // POST /pm/multifamily/phases/:id/assign-units — assign units to phase
  fastify.post('/phases/:id/assign-units', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const { unitIds } = req.body as { unitIds: string[] }
    if (!Array.isArray(unitIds)) return reply.status(400).send({ error: 'unitIds array is required' })

    await prisma.multifamilyUnit.updateMany({
      where: { id: { in: unitIds } },
      data: { phaseId: id },
    })

    // Update unit count
    const count = await prisma.multifamilyUnit.count({ where: { phaseId: id } })
    await prisma.multifamilyAreaPhase.update({
      where: { id },
      data: { unitCount: count },
    })

    return { assigned: unitIds.length }
  })
}
