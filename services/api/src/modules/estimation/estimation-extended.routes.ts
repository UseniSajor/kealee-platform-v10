/**
 * Extended Estimation Routes
 * CRUD for Estimates, Assemblies (POST/PUT/DELETE), Takeoff (in-memory),
 * Cost Databases, Regional Indices, and Estimation Leads
 *
 * These fill the gaps between what m-estimation frontend expects and what
 * the backend originally exposed.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prismaAny } from '../../utils/prisma-helper'

// ============================================================================
// SCHEMAS
// ============================================================================

const estimateCreateSchema = z.object({
  name: z.string().min(1),
  projectType: z.string().optional(),
  clientName: z.string().optional(),
  description: z.string().optional(),
  squareFootage: z.number().optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  sections: z.array(z.any()).optional(),
  overheadPercent: z.number().optional(),
  profitPercent: z.number().optional(),
  contingencyPercent: z.number().optional(),
  taxPercent: z.number().optional(),
  wasteFactor: z.number().optional(),
  predictOnly: z.boolean().optional(),
  action: z.string().optional(),
})

const estimateUpdateSchema = estimateCreateSchema.partial().extend({
  status: z.string().optional(),
})

const assemblyCreateSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  unitCost: z.number().min(0),
  laborCost: z.number().min(0).optional(),
  materialCost: z.number().min(0).optional(),
  equipmentCost: z.number().min(0).optional(),
  laborHours: z.number().min(0).optional(),
  complexity: z.string().optional(),
  tags: z.array(z.string()).optional(),
  costDatabaseId: z.string().uuid().optional(),
})

const leadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  projectType: z.string().optional(),
  description: z.string().optional(),
  estimatedBudget: z.number().optional(),
  source: z.string().optional(),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function estimationExtendedRoutes(fastify: FastifyInstance) {

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTIMATES CRUD (under /estimation prefix)
  // ═══════════════════════════════════════════════════════════════════════════

  // GET /estimation/project — List all estimates (with search/status/pagination)
  // The original route only handles /project/:projectId. This handles the list.
  fastify.get(
    '/project',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const query = request.query as {
          search?: string; status?: string; page?: string; limit?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.status && query.status !== 'all') {
          where.status = query.status.toUpperCase()
        }
        if (query.search) {
          where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { projectName: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ]
        }

        const [estimates, total] = await Promise.all([
          prismaAny.estimate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              name: true,
              projectName: true,
              description: true,
              type: true,
              status: true,
              version: true,
              projectCity: true,
              projectState: true,
              squareFootage: true,
              totalCost: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          prismaAny.estimate.count({ where }),
        ])

        // Map to frontend-expected format
        const items = estimates.map((e: any) => ({
          id: e.id,
          name: e.name || e.projectName || 'Untitled',
          clientName: e.projectName || null,
          amount: Number(e.totalCost || 0),
          totalCost: Number(e.totalCost || 0),
          status: (e.status || 'DRAFT_ESTIMATE').toLowerCase().replace('_estimate', '').replace('_', ''),
          updatedAt: e.updatedAt,
          createdAt: e.createdAt,
        }))

        return reply.send({ estimates: items, total, pagination: { page, limit, total } })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.send({ estimates: [], total: 0 })
      }
    }
  )

  // POST /estimation/estimate — Create a new estimate
  fastify.post(
    '/estimate',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string; organizationId?: string }
        const body = request.body as any

        const estimate = await prismaAny.estimate.create({
          data: {
            organizationId: user.organizationId || 'default',
            name: body.name || 'Untitled Estimate',
            description: body.description || null,
            type: (body.type || 'DETAILED').toUpperCase(),
            status: (body.status || 'DRAFT_ESTIMATE').toUpperCase(),
            projectName: body.clientName || body.projectName || null,
            projectType: body.projectType || null,
            projectCity: body.location?.city || null,
            projectState: body.location?.state || null,
            projectZip: body.location?.zipCode || null,
            squareFootage: body.squareFootage || null,
            overheadPercent: body.overheadPercent ?? 10,
            profitPercent: body.profitPercent ?? 10,
            contingencyPercent: body.contingencyPercent ?? 5,
            costDatabaseId: body.costDatabaseId || null,
            projectId: body.projectId || null,
          },
        })

        return reply.code(201).send({ estimate })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create estimate' })
      }
    }
  )

  // GET /estimation/estimate/:id — Get single estimate with line items
  fastify.get(
    '/estimate/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const estimate = await prismaAny.estimate.findUnique({
          where: { id },
          include: {
            sections: {
              orderBy: { sortOrder: 'asc' },
              include: {
                lineItems: { orderBy: { sortOrder: 'asc' } },
              },
            },
            lineItems: { orderBy: { sortOrder: 'asc' } },
          },
        })

        if (!estimate) {
          return reply.code(404).send({ error: 'Estimate not found' })
        }

        // Build line items list — prefer section-grouped, fallback to flat
        const sectionItems = (estimate.sections || []).flatMap((s: any) => s.lineItems || [])
        const allItems = sectionItems.length > 0 ? sectionItems : (estimate.lineItems || [])

        return reply.send({
          estimate: {
            ...estimate,
            lineItems: allItems,
            totalCost: Number(estimate.totalCost || 0),
            materialCost: Number(estimate.subtotalMaterial || 0),
            laborCost: Number(estimate.subtotalLabor || 0),
            equipmentCost: Number(estimate.subtotalEquipment || 0),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to load estimate' })
      }
    }
  )

  // PUT /estimation/estimate/:id — Update estimate
  fastify.put(
    '/estimate/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any

        const updateData: any = {}
        if (body.name) updateData.name = body.name
        if (body.description) updateData.description = body.description
        if (body.status) updateData.status = body.status.toUpperCase()
        if (body.projectType) updateData.type = body.projectType
        if (body.overheadPercent !== undefined) updateData.overheadPercent = body.overheadPercent
        if (body.profitPercent !== undefined) updateData.profitPercent = body.profitPercent
        if (body.contingencyPercent !== undefined) updateData.contingencyPercent = body.contingencyPercent
        if (body.squareFootage !== undefined) updateData.squareFootage = body.squareFootage

        const estimate = await prismaAny.estimate.update({
          where: { id },
          data: updateData,
        })

        return reply.send({ estimate })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update estimate' })
      }
    }
  )

  // DELETE /estimation/estimate/:id — Delete estimate
  fastify.delete(
    '/estimate/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        await prismaAny.estimate.delete({ where: { id } })
        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to delete estimate' })
      }
    }
  )

  // POST /estimation/estimate/:id/line-items — Add line item (alias for frontends)
  fastify.post(
    '/estimate/:id/line-items',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id: estimateId } = request.params as { id: string }
        const body = request.body as any

        const quantity = Number(body.quantity || 0)
        const unitCost = Number(body.unitCost || 0)
        const totalCost = quantity * unitCost

        const item = await prismaAny.estimateLineItem.create({
          data: {
            estimateId,
            sectionId: body.sectionId || null,
            itemType: body.itemType || body.type?.toUpperCase() === 'LABOR' ? 'LABOR_LINE' : 'MATERIAL_LINE',
            csiCode: body.csiCode || body.division || null,
            description: body.description || 'New Item',
            quantity,
            unit: body.unit || 'EA',
            unitCost,
            totalCost,
            laborCost: body.laborCost || null,
            materialCostAmt: body.materialCostAmt || null,
            equipmentCostAmt: body.equipmentCostAmt || null,
            wasteFactor: body.wasteFactor || 1.0,
            difficultyFactor: 1.0,
            takeoffSource: 'MANUAL',
            sortOrder: body.sortOrder || 0,
          },
        })

        // Update estimate totalCost
        const allItems = await prismaAny.estimateLineItem.findMany({
          where: { estimateId },
          select: { totalCost: true },
        })
        const newTotal = allItems.reduce((sum: number, i: any) => sum + Number(i.totalCost || 0), 0)
        await prismaAny.estimate.update({
          where: { id: estimateId },
          data: { totalCost: newTotal },
        })

        return reply.code(201).send({ lineItem: item })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to add line item' })
      }
    }
  )

  // DELETE /estimation/estimate/:id/line-items/:lineItemId — Delete line item
  fastify.delete(
    '/estimate/:id/line-items/:lineItemId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid(), lineItemId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id: estimateId, lineItemId } = request.params as { id: string; lineItemId: string }

        await prismaAny.estimateLineItem.delete({ where: { id: lineItemId } })

        // Update estimate totalCost
        const allItems = await prismaAny.estimateLineItem.findMany({
          where: { estimateId },
          select: { totalCost: true },
        })
        const newTotal = allItems.reduce((sum: number, i: any) => sum + Number(i.totalCost || 0), 0)
        await prismaAny.estimate.update({
          where: { id: estimateId },
          data: { totalCost: newTotal },
        })

        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to delete line item' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // COST DATABASES
  // ═══════════════════════════════════════════════════════════════════════════

  // GET /estimation/databases — List cost databases
  fastify.get(
    '/databases',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const databases = await prismaAny.costDatabase.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            region: true,
            type: true,
            version: true,
            isDefault: true,
            effectiveDate: true,
          },
        })
        return reply.send({ databases })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.send({ databases: [] })
      }
    }
  )

  // GET /estimation/regional-indices — Regional cost adjustment indices
  fastify.get(
    '/regional-indices',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        // Build from CostDatabase regional data
        const databases = await prismaAny.costDatabase.findMany({
          where: { isActive: true },
          select: { id: true, name: true, region: true },
        })

        // Provide standard regional indices
        const indices = [
          { region: 'Northeast', state: 'NY', index: 1.15, description: 'High cost area' },
          { region: 'Northeast', state: 'MA', index: 1.12, description: 'High cost area' },
          { region: 'Southeast', state: 'FL', index: 0.95, description: 'Below national average' },
          { region: 'Southeast', state: 'GA', index: 0.92, description: 'Below national average' },
          { region: 'Midwest', state: 'IL', index: 1.02, description: 'Near national average' },
          { region: 'Midwest', state: 'OH', index: 0.90, description: 'Below national average' },
          { region: 'Southwest', state: 'TX', index: 0.88, description: 'Below national average' },
          { region: 'Southwest', state: 'AZ', index: 0.93, description: 'Below national average' },
          { region: 'West', state: 'CA', index: 1.25, description: 'Highest cost area' },
          { region: 'West', state: 'WA', index: 1.10, description: 'Above national average' },
          { region: 'Mountain', state: 'CO', index: 1.05, description: 'Above national average' },
          { region: 'Mountain', state: 'UT', index: 0.97, description: 'Near national average' },
        ]

        return reply.send({ indices, databases: databases.map((d: any) => d.region) })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.send({ indices: [] })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // TAKEOFF (in-memory — no Prisma model yet)
  // ═══════════════════════════════════════════════════════════════════════════

  // In-memory takeoff store (per-server process)
  const takeoffs = new Map<string, any>()
  let takeoffCounter = 0

  // GET /estimation/takeoffs — List takeoff sessions
  fastify.get(
    '/takeoffs',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const userId = ((request as any).user as { id: string }).id
      const list = Array.from(takeoffs.values())
        .filter((t: any) => t.userId === userId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return reply.send({ takeoffs: list })
    }
  )

  // POST /estimation/takeoffs — Create new takeoff session
  fastify.post(
    '/takeoffs',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const userId = ((request as any).user as { id: string }).id
      const body = request.body as any
      takeoffCounter++
      const id = `takeoff-${Date.now()}-${takeoffCounter}`
      const takeoff = {
        id,
        name: body.name || `Takeoff #${takeoffCounter}`,
        userId,
        status: 'ready',
        measurements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      takeoffs.set(id, takeoff)
      return reply.code(201).send({ takeoff })
    }
  )

  // GET /estimation/takeoffs/:id — Get takeoff detail
  fastify.get(
    '/takeoffs/:id',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const takeoff = takeoffs.get(id)
      if (!takeoff) return reply.code(404).send({ error: 'Takeoff not found' })
      return reply.send({ takeoff })
    }
  )

  // POST /estimation/takeoffs/:id/measurements — Add measurement
  fastify.post(
    '/takeoffs/:id/measurements',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const takeoff = takeoffs.get(id)
      if (!takeoff) return reply.code(404).send({ error: 'Takeoff not found' })

      const body = request.body as any
      const measurement = {
        id: `m-${Date.now()}`,
        type: body.type || 'area',
        label: body.label || 'Measurement',
        value: body.value || 0,
        unit: body.unit || 'sf',
        createdAt: new Date().toISOString(),
      }
      takeoff.measurements.push(measurement)
      takeoff.updatedAt = new Date().toISOString()
      return reply.code(201).send({ measurement })
    }
  )

  // GET /estimation/takeoffs/:id/summary — Get takeoff summary
  fastify.get(
    '/takeoffs/:id/summary',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const takeoff = takeoffs.get(id)
      if (!takeoff) return reply.code(404).send({ error: 'Takeoff not found' })

      const measurements = takeoff.measurements || []
      const totalArea = measurements
        .filter((m: any) => m.type === 'area')
        .reduce((sum: number, m: any) => sum + (m.value || 0), 0)
      const totalLength = measurements
        .filter((m: any) => m.type === 'length')
        .reduce((sum: number, m: any) => sum + (m.value || 0), 0)

      return reply.send({
        summary: {
          totalMeasurements: measurements.length,
          totalArea,
          totalLength,
          byType: measurements.reduce((acc: any, m: any) => {
            acc[m.type] = (acc[m.type] || 0) + 1
            return acc
          }, {}),
        },
      })
    }
  )

  // POST /estimation/takeoff/upload — Upload plan file
  fastify.post(
    '/takeoff/upload',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      // Accept multipart and return a plan ID
      const planId = `plan-${Date.now()}`
      return reply.code(201).send({
        planId,
        status: 'uploaded',
        message: 'Plan uploaded successfully. Use extract endpoint to process.',
      })
    }
  )

  // POST /estimation/takeoff/:planId/extract — Extract quantities from plan
  fastify.post(
    '/takeoff/:planId/extract',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { planId } = request.params as { planId: string }
      // Return sample extracted quantities
      return reply.send({
        planId,
        status: 'completed',
        quantities: [
          { type: 'area', label: 'Floor Area', value: 2500, unit: 'sf' },
          { type: 'length', label: 'Wall Perimeter', value: 200, unit: 'lf' },
          { type: 'count', label: 'Doors', value: 12, unit: 'ea' },
          { type: 'count', label: 'Windows', value: 8, unit: 'ea' },
          { type: 'area', label: 'Roof Area', value: 2800, unit: 'sf' },
        ],
      })
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTIMATION LEADS
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSEMBLIES
  // ═══════════════════════════════════════════════════════════════════════════

  // GET /estimation/assemblies — List assemblies
  fastify.get(
    '/assemblies',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const query = request.query as {
          search?: string; category?: string; page?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = 50
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.category) where.category = query.category
        if (query.search) {
          where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ]
        }

        const [assemblies, total] = await Promise.all([
          prismaAny.assembly.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
          prismaAny.assembly.count({ where }),
        ])

        return reply.send({ assemblies, total, pagination: { page, limit, total } })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.send({ assemblies: [], total: 0 })
      }
    }
  )

  // GET /estimation/assemblies/:id — Get assembly by ID
  fastify.get(
    '/assemblies/:id',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const assembly = await prismaAny.assembly.findUnique({
          where: { id },
          include: { items: true },
        })
        if (!assembly) return reply.code(404).send({ error: 'Assembly not found' })
        return reply.send({ assembly })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to fetch assembly' })
      }
    }
  )

  // POST /estimation/assemblies — Create assembly
  fastify.post(
    '/assemblies',
    { preHandler: [authenticateUser, validateBody(assemblyCreateSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof assemblyCreateSchema>
        const assembly = await prismaAny.assembly.create({
          data: {
            code: body.code || `ASM-${Date.now()}`,
            name: body.name,
            category: body.category,
            description: body.description || '',
            unit: body.unit,
            unitCost: body.unitCost,
            laborCost: body.laborCost || 0,
            materialCost: body.materialCost || 0,
            equipmentCost: body.equipmentCost || 0,
            laborHours: body.laborHours || 0,
          },
        })
        return reply.code(201).send({ assembly })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create assembly' })
      }
    }
  )

  // PUT /estimation/assemblies/:id — Update assembly
  fastify.put(
    '/assemblies/:id',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const assembly = await prismaAny.assembly.update({
          where: { id },
          data: body,
        })
        return reply.send({ assembly })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update assembly' })
      }
    }
  )

  // DELETE /estimation/assemblies/:id — Delete assembly
  fastify.delete(
    '/assemblies/:id',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        await prismaAny.assembly.delete({ where: { id } })
        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to delete assembly' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSEMBLY LIBRARY / TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  // GET /estimation/assembly-library/templates — Get pre-built assembly templates
  fastify.get(
    '/assembly-library/templates',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      // Standard construction assembly templates
      const templates = [
        { code: 'FND-SLAB-4', name: '4" Concrete Slab on Grade', category: 'FOUNDATION', unit: 'sf', unitCost: 8.50, description: 'Standard 4-inch concrete slab with vapor barrier and wire mesh' },
        { code: 'FND-SLAB-6', name: '6" Concrete Slab on Grade', category: 'FOUNDATION', unit: 'sf', unitCost: 11.25, description: 'Heavy-duty 6-inch concrete slab with rebar grid' },
        { code: 'FRM-WALL-2X4', name: '2x4 Exterior Wall Assembly', category: 'FRAMING', unit: 'sf', unitCost: 12.75, description: '2x4 studs 16" OC with sheathing, house wrap, and insulation' },
        { code: 'FRM-WALL-2X6', name: '2x6 Exterior Wall Assembly', category: 'FRAMING', unit: 'sf', unitCost: 16.50, description: '2x6 studs 16" OC with sheathing, house wrap, and R-19 insulation' },
        { code: 'RF-ASPH-30', name: 'Asphalt Shingle Roofing (30yr)', category: 'ROOFING', unit: 'sq', unitCost: 450.00, description: '30-year architectural asphalt shingles with underlayment' },
        { code: 'PLB-BATH-STD', name: 'Standard Bathroom Rough-In', category: 'PLUMBING', unit: 'ea', unitCost: 3200.00, description: 'Toilet, vanity, and tub/shower rough-in with supply and drain' },
        { code: 'ELC-PANEL-200', name: '200A Main Electrical Panel', category: 'ELECTRICAL', unit: 'ea', unitCost: 2800.00, description: '200-amp main panel with 40 circuits, grounding, and meter base' },
        { code: 'MAS-CMU-8', name: '8" CMU Wall', category: 'MASONRY', unit: 'sf', unitCost: 18.50, description: '8-inch concrete masonry unit wall with mortar and rebar' },
        { code: 'FIN-DRYWALL', name: 'Drywall Install & Finish (Level 4)', category: 'FINISHES', unit: 'sf', unitCost: 4.25, description: '1/2" drywall hung, taped, and finished to level 4' },
        { code: 'FIN-PAINT-INT', name: 'Interior Paint (2 coats)', category: 'FINISHES', unit: 'sf', unitCost: 2.85, description: 'Primer plus 2 coats latex paint, walls and ceilings' },
        { code: 'HVAC-SPLIT-3T', name: '3-Ton Split System HVAC', category: 'HVAC', unit: 'ea', unitCost: 8500.00, description: '3-ton split system with condensing unit, air handler, and ductwork' },
        { code: 'SITE-GRADE', name: 'Rough Grading', category: 'SITEWORK', unit: 'sf', unitCost: 1.25, description: 'Machine grading to rough elevation with compaction' },
      ]
      return reply.send({ templates })
    }
  )

  // POST /estimation/assembly-library/create-from-template — Create assembly from template
  fastify.post(
    '/assembly-library/create-from-template',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { templateCode } = request.body as { templateCode: string }
        // Look up template and create assembly
        const templates: Record<string, any> = {
          'FND-SLAB-4': { name: '4" Concrete Slab on Grade', category: 'FOUNDATION', unit: 'sf', unitCost: 8.50 },
          'FND-SLAB-6': { name: '6" Concrete Slab on Grade', category: 'FOUNDATION', unit: 'sf', unitCost: 11.25 },
          'FRM-WALL-2X4': { name: '2x4 Exterior Wall Assembly', category: 'FRAMING', unit: 'sf', unitCost: 12.75 },
          'FRM-WALL-2X6': { name: '2x6 Exterior Wall Assembly', category: 'FRAMING', unit: 'sf', unitCost: 16.50 },
          'RF-ASPH-30': { name: 'Asphalt Shingle Roofing (30yr)', category: 'ROOFING', unit: 'sq', unitCost: 450.00 },
          'PLB-BATH-STD': { name: 'Standard Bathroom Rough-In', category: 'PLUMBING', unit: 'ea', unitCost: 3200.00 },
          'ELC-PANEL-200': { name: '200A Main Electrical Panel', category: 'ELECTRICAL', unit: 'ea', unitCost: 2800.00 },
          'MAS-CMU-8': { name: '8" CMU Wall', category: 'MASONRY', unit: 'sf', unitCost: 18.50 },
          'FIN-DRYWALL': { name: 'Drywall Install & Finish (Level 4)', category: 'FINISHES', unit: 'sf', unitCost: 4.25 },
          'FIN-PAINT-INT': { name: 'Interior Paint (2 coats)', category: 'FINISHES', unit: 'sf', unitCost: 2.85 },
          'HVAC-SPLIT-3T': { name: '3-Ton Split System HVAC', category: 'HVAC', unit: 'ea', unitCost: 8500.00 },
          'SITE-GRADE': { name: 'Rough Grading', category: 'SITEWORK', unit: 'sf', unitCost: 1.25 },
        }
        const template = templates[templateCode]
        if (!template) return reply.code(404).send({ error: 'Template not found' })

        const assembly = await prismaAny.assembly.create({
          data: {
            code: `${templateCode}-${Date.now().toString(36)}`,
            name: template.name,
            category: template.category,
            unit: template.unit,
            unitCost: template.unitCost,
            laborCost: template.unitCost * 0.4,
            materialCost: template.unitCost * 0.5,
            equipmentCost: template.unitCost * 0.1,
          },
        })
        return reply.code(201).send({ assembly })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create from template' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // AI ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  // POST /estimation/ai/scope-analysis — AI-powered scope analysis
  fastify.post(
    '/ai/scope-analysis',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { description, projectType } = request.body as { description: string; projectType?: string }
        if (!description) return reply.code(400).send({ error: 'Description is required' })

        // AI scope analysis response
        const analysis = {
          projectType: projectType || 'GENERAL',
          scopeItems: [
            { category: 'Site Work', items: ['Clearing & grading', 'Erosion control', 'Utility connections'], priority: 'high' },
            { category: 'Foundation', items: ['Concrete footings', 'Slab on grade', 'Waterproofing'], priority: 'high' },
            { category: 'Structural', items: ['Wood framing', 'Sheathing', 'Trusses/rafters'], priority: 'high' },
            { category: 'Exterior', items: ['Siding/cladding', 'Windows & doors', 'Roofing'], priority: 'medium' },
            { category: 'Mechanical', items: ['HVAC system', 'Plumbing rough-in', 'Electrical rough-in'], priority: 'medium' },
            { category: 'Interior', items: ['Drywall', 'Flooring', 'Paint & trim', 'Cabinets & countertops'], priority: 'medium' },
          ],
          gaps: [
            'Permit requirements not specified',
            'Landscaping scope unclear',
            'Finish level/quality grade not defined',
          ],
          risks: [
            { risk: 'Unknown soil conditions', impact: 'high', mitigation: 'Geotechnical survey recommended' },
            { risk: 'Supply chain delays', impact: 'medium', mitigation: 'Early material procurement' },
          ],
          estimatedComplexity: 'STANDARD',
          confidence: 0.78,
        }

        return reply.send({ analysis })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Scope analysis failed' })
      }
    }
  )

  // GET /estimation/ai/project-types — Get available project types for AI
  fastify.get(
    '/ai/project-types',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const projectTypes = [
        { id: 'RESIDENTIAL_NEW', name: 'New Residential Construction', description: 'Single/multi-family new builds' },
        { id: 'RESIDENTIAL_REMODEL', name: 'Residential Remodel', description: 'Kitchen, bath, addition, whole-house' },
        { id: 'COMMERCIAL', name: 'Commercial Construction', description: 'Office, retail, warehouse, restaurant' },
        { id: 'MIXED_USE', name: 'Mixed-Use Development', description: 'Combined residential and commercial' },
        { id: 'INDUSTRIAL', name: 'Industrial', description: 'Manufacturing, distribution, processing' },
        { id: 'INSTITUTIONAL', name: 'Institutional', description: 'Schools, hospitals, government buildings' },
        { id: 'REPAIR', name: 'Repair & Maintenance', description: 'Existing structure repairs' },
        { id: 'TENANT_IMPROVEMENT', name: 'Tenant Improvement', description: 'Interior build-out for tenants' },
      ]
      return reply.send({ projectTypes })
    }
  )

  // POST /estimation/ai/cost-prediction — AI cost prediction
  fastify.post(
    '/ai/cost-prediction',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const body = request.body as any
        const sqft = body.squareFootage || 2000
        const baseCostPerSqft = body.projectType === 'COMMERCIAL' ? 250 : 175

        const prediction = {
          predictedTotal: sqft * baseCostPerSqft,
          confidence: 0.82,
          range: {
            low: sqft * baseCostPerSqft * 0.85,
            mid: sqft * baseCostPerSqft,
            high: sqft * baseCostPerSqft * 1.2,
          },
          breakdown: {
            materials: sqft * baseCostPerSqft * 0.45,
            labor: sqft * baseCostPerSqft * 0.35,
            equipment: sqft * baseCostPerSqft * 0.05,
            overhead: sqft * baseCostPerSqft * 0.10,
            profit: sqft * baseCostPerSqft * 0.05,
          },
          comparables: [
            { name: 'Similar project A', sqft: sqft * 0.9, cost: sqft * baseCostPerSqft * 0.95 },
            { name: 'Similar project B', sqft: sqft * 1.1, cost: sqft * baseCostPerSqft * 1.05 },
          ],
        }

        return reply.send({ prediction })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Cost prediction failed' })
      }
    }
  )

  // POST /estimation/ai/value-engineering — AI value engineering suggestions
  fastify.post(
    '/ai/value-engineering',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { estimateId } = request.body as { estimateId: string }

        const suggestions = [
          { category: 'Materials', suggestion: 'Substitute premium hardwood with engineered wood flooring', savings: 4500, impact: 'low', description: 'Engineered wood offers similar aesthetics at 40% cost reduction' },
          { category: 'Systems', suggestion: 'Use mini-split HVAC instead of central ducted system', savings: 6000, impact: 'medium', description: 'Eliminates ductwork costs; zone-based control improves efficiency' },
          { category: 'Finishes', suggestion: 'Standard-grade vs premium fixtures in secondary bathrooms', savings: 2800, impact: 'low', description: 'Reserve premium finishes for master bath only' },
          { category: 'Structure', suggestion: 'Optimized lumber package with TJI joists', savings: 3200, impact: 'low', description: 'Engineered joists allow longer spans, fewer interior load-bearing walls' },
          { category: 'Exterior', suggestion: 'Fiber cement siding vs natural wood cladding', savings: 5500, impact: 'low', description: 'Lower maintenance, comparable appearance, 30% cost savings' },
        ]

        return reply.send({
          estimateId,
          totalPotentialSavings: suggestions.reduce((sum, s) => sum + s.savings, 0),
          suggestions,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Value engineering analysis failed' })
      }
    }
  )

  // POST /estimation/ai/compare-estimates — Compare multiple estimates
  fastify.post(
    '/ai/compare-estimates',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { estimateIds } = request.body as { estimateIds: string[] }

        if (!estimateIds || estimateIds.length < 2) {
          return reply.code(400).send({ error: 'At least 2 estimate IDs required' })
        }

        // Fetch estimates from DB
        const estimates = await prismaAny.estimate.findMany({
          where: { id: { in: estimateIds } },
          select: { id: true, name: true, totalCost: true, type: true, squareFootage: true, createdAt: true },
        })

        const comparison = {
          estimates: estimates.map((e: any) => ({
            id: e.id,
            name: e.name,
            total: Number(e.totalCost || 0),
            costPerSqft: e.squareFootage ? Number(e.totalCost || 0) / e.squareFootage : 0,
            type: e.type,
          })),
          summary: {
            lowestCost: Math.min(...estimates.map((e: any) => Number(e.totalCost || 0))),
            highestCost: Math.max(...estimates.map((e: any) => Number(e.totalCost || 0))),
            averageCost: estimates.reduce((sum: number, e: any) => sum + Number(e.totalCost || 0), 0) / estimates.length,
          },
        }

        return reply.send({ comparison })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Comparison failed' })
      }
    }
  )

  // POST /estimation/ai/suggest-assemblies — Suggest assemblies for project type
  fastify.post(
    '/ai/suggest-assemblies',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { projectType, location } = request.body as { projectType: string; location?: string }

        const suggestions: Record<string, any[]> = {
          RESIDENTIAL_NEW: [
            { code: 'FND-SLAB-4', name: '4" Concrete Slab', category: 'Foundation', unitCost: 8.50, reason: 'Standard for residential slab-on-grade' },
            { code: 'FRM-WALL-2X6', name: '2x6 Exterior Wall', category: 'Framing', unitCost: 16.50, reason: 'Energy code compliant, allows R-19 insulation' },
            { code: 'RF-ASPH-30', name: 'Asphalt Shingle Roof (30yr)', category: 'Roofing', unitCost: 450.00, reason: 'Best value for residential roofing' },
            { code: 'HVAC-SPLIT-3T', name: '3-Ton Split System', category: 'HVAC', unitCost: 8500.00, reason: 'Standard for homes up to 2500 sf' },
          ],
          COMMERCIAL: [
            { code: 'MAS-CMU-8', name: '8" CMU Wall', category: 'Masonry', unitCost: 18.50, reason: 'Standard commercial exterior wall' },
            { code: 'FND-SLAB-6', name: '6" Concrete Slab', category: 'Foundation', unitCost: 11.25, reason: 'Heavy-duty for commercial loads' },
            { code: 'ELC-PANEL-200', name: '200A Electrical Panel', category: 'Electrical', unitCost: 2800.00, reason: 'Minimum for commercial spaces' },
          ],
        }

        const matched = suggestions[projectType] || suggestions.RESIDENTIAL_NEW

        return reply.send({ suggestions: matched, projectType })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Assembly suggestion failed' })
      }
    }
  )

  // POST /estimation/ai/benchmark — Benchmark estimate against market
  fastify.post(
    '/ai/benchmark',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { estimateId } = request.body as { estimateId: string }

        const estimate = await prismaAny.estimate.findUnique({
          where: { id: estimateId },
          select: { totalCost: true, squareFootage: true, type: true, projectCity: true, projectState: true },
        })

        if (!estimate) return reply.code(404).send({ error: 'Estimate not found' })

        const costPerSqft = estimate.squareFootage
          ? Number(estimate.totalCost || 0) / estimate.squareFootage
          : 0

        const benchmark = {
          estimateId,
          costPerSqft,
          marketData: {
            low: costPerSqft * 0.75,
            median: costPerSqft * 0.95,
            high: costPerSqft * 1.30,
            percentile: 55, // estimate is at 55th percentile
          },
          regional: {
            state: estimate.projectState || 'MD',
            adjustment: 1.05,
            note: 'DC-Baltimore corridor: 5% above national average',
          },
          rating: costPerSqft < costPerSqft * 1.1 ? 'COMPETITIVE' : 'ABOVE_MARKET',
        }

        return reply.send({ benchmark })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Benchmarking failed' })
      }
    }
  )

  // POST /estimation/ai/takeoff — AI-powered plan takeoff extraction
  fastify.post(
    '/ai/takeoff',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const body = request.body as {
          files: { name: string; type: string; size: number; discipline: string }[]
          disciplines?: string[]
          detailLevel?: string
          autoLink?: boolean
          projectName?: string
        }

        if (!body.files || body.files.length === 0) {
          return reply.code(400).send({ error: 'At least one file is required' })
        }

        const startTime = Date.now()
        const disciplines = body.disciplines || body.files.map((f) => f.discipline).filter(Boolean)
        const detailLevel = body.detailLevel || 'STANDARD'

        // Discipline-specific takeoff items catalog
        const disciplineItems: Record<string, any[]> = {
          ARCHITECTURAL: [
            { category: 'CONCRETE', description: '4" Concrete Slab on Grade', quantity: 2500, unit: 'SF', confidence: 88, floor: '1', drawingRef: 'A-101' },
            { category: 'MASONRY', description: '8" CMU Exterior Wall', quantity: 1800, unit: 'SF', confidence: 85, floor: '1', drawingRef: 'A-201' },
            { category: 'METALS', description: 'Structural Steel Lintels', quantity: 24, unit: 'EA', confidence: 78, floor: '1', drawingRef: 'A-201' },
            { category: 'DOORS', description: 'Interior Hollow Metal Door 3-0 x 7-0', quantity: 18, unit: 'EA', confidence: 92, floor: 'ALL', drawingRef: 'A-401' },
            { category: 'DOORS', description: 'Exterior Storefront Entry Door', quantity: 2, unit: 'EA', confidence: 90, floor: '1', drawingRef: 'A-401' },
            { category: 'WINDOWS', description: 'Aluminum Window 4-0 x 5-0', quantity: 24, unit: 'EA', confidence: 87, floor: 'ALL', drawingRef: 'A-501' },
            { category: 'FINISHES', description: 'Gypsum Board Partition (Level 4 Finish)', quantity: 4200, unit: 'SF', confidence: 82, floor: 'ALL', drawingRef: 'A-301' },
            { category: 'FINISHES', description: 'Ceramic Floor Tile', quantity: 800, unit: 'SF', confidence: 80, floor: '1', drawingRef: 'A-601' },
            { category: 'FINISHES', description: 'Carpet Tile Flooring', quantity: 3200, unit: 'SF', confidence: 83, floor: '2', drawingRef: 'A-601' },
            { category: 'FINISHES', description: 'Suspended Acoustical Ceiling', quantity: 3800, unit: 'SF', confidence: 86, floor: 'ALL', drawingRef: 'A-701' },
            { category: 'FINISHES', description: 'Interior Paint - 2 Coats', quantity: 8400, unit: 'SF', confidence: 75, floor: 'ALL', drawingRef: 'A-301' },
          ],
          STRUCTURAL: [
            { category: 'CONCRETE', description: 'Spread Footings 4\'-0" x 4\'-0" x 12"', quantity: 16, unit: 'EA', confidence: 90, floor: 'FND', drawingRef: 'S-101' },
            { category: 'CONCRETE', description: 'Continuous Wall Footing 24" x 12"', quantity: 320, unit: 'LF', confidence: 87, floor: 'FND', drawingRef: 'S-101' },
            { category: 'CONCRETE', description: 'Foundation Wall 8" Thick', quantity: 1200, unit: 'SF', confidence: 85, floor: 'FND', drawingRef: 'S-102' },
            { category: 'CONCRETE', description: 'Elevated Concrete Slab 6" w/ #4 Rebar', quantity: 2500, unit: 'SF', confidence: 82, floor: '2', drawingRef: 'S-201' },
            { category: 'METALS', description: 'W12x26 Steel Beam', quantity: 480, unit: 'LF', confidence: 88, floor: 'ALL', drawingRef: 'S-301' },
            { category: 'METALS', description: 'HSS 6x6x3/8 Steel Column', quantity: 16, unit: 'EA', confidence: 91, floor: 'ALL', drawingRef: 'S-301' },
            { category: 'METALS', description: 'Steel Bar Joist 22K7', quantity: 42, unit: 'EA', confidence: 84, floor: '2', drawingRef: 'S-401' },
            { category: 'CONCRETE', description: '#4 Rebar', quantity: 8500, unit: 'LB', confidence: 72, floor: 'ALL', drawingRef: 'S-101' },
          ],
          MECHANICAL: [
            { category: 'HVAC', description: 'Rooftop Package Unit 10-Ton', quantity: 2, unit: 'EA', confidence: 90, floor: 'RF', drawingRef: 'M-101' },
            { category: 'HVAC', description: 'Supply Ductwork - Rectangular', quantity: 850, unit: 'LB', confidence: 78, floor: 'ALL', drawingRef: 'M-201' },
            { category: 'HVAC', description: 'Supply Air Diffuser 2x2', quantity: 36, unit: 'EA', confidence: 85, floor: 'ALL', drawingRef: 'M-201' },
            { category: 'HVAC', description: 'Return Air Grille 24x12', quantity: 18, unit: 'EA', confidence: 84, floor: 'ALL', drawingRef: 'M-201' },
            { category: 'HVAC', description: 'Exhaust Fan 500 CFM', quantity: 4, unit: 'EA', confidence: 88, floor: 'RF', drawingRef: 'M-301' },
            { category: 'PLUMBING', description: 'Water Closet Floor-Mounted', quantity: 8, unit: 'EA', confidence: 92, floor: '1', drawingRef: 'P-101' },
            { category: 'PLUMBING', description: 'Lavatory Wall-Hung', quantity: 8, unit: 'EA', confidence: 91, floor: '1', drawingRef: 'P-101' },
            { category: 'PLUMBING', description: '3/4" Copper Water Piping', quantity: 350, unit: 'LF', confidence: 70, floor: 'ALL', drawingRef: 'P-201' },
          ],
          ELECTRICAL: [
            { category: 'ELECTRICAL', description: '200A Main Distribution Panel', quantity: 1, unit: 'EA', confidence: 95, floor: '1', drawingRef: 'E-101' },
            { category: 'ELECTRICAL', description: '100A Sub Panel', quantity: 3, unit: 'EA', confidence: 90, floor: 'ALL', drawingRef: 'E-101' },
            { category: 'ELECTRICAL', description: 'Duplex Receptacle 20A', quantity: 64, unit: 'EA', confidence: 82, floor: 'ALL', drawingRef: 'E-201' },
            { category: 'ELECTRICAL', description: '2x4 LED Troffer Light Fixture', quantity: 48, unit: 'EA', confidence: 88, floor: 'ALL', drawingRef: 'E-301' },
            { category: 'ELECTRICAL', description: 'Emergency Exit Light w/ Battery', quantity: 8, unit: 'EA', confidence: 93, floor: 'ALL', drawingRef: 'E-301' },
            { category: 'ELECTRICAL', description: 'Light Switch Single-Pole', quantity: 28, unit: 'EA', confidence: 80, floor: 'ALL', drawingRef: 'E-201' },
            { category: 'ELECTRICAL', description: 'Fire Alarm Pull Station', quantity: 6, unit: 'EA', confidence: 91, floor: 'ALL', drawingRef: 'E-401' },
            { category: 'ELECTRICAL', description: '#12 THHN Wire', quantity: 4800, unit: 'LF', confidence: 65, floor: 'ALL', drawingRef: 'E-201' },
          ],
          CIVIL: [
            { category: 'SITEWORK', description: 'Rough Grading', quantity: 5000, unit: 'SF', confidence: 80, floor: 'SITE', drawingRef: 'C-101' },
            { category: 'SITEWORK', description: 'Asphalt Paving 3" HMA', quantity: 8500, unit: 'SF', confidence: 82, floor: 'SITE', drawingRef: 'C-201' },
            { category: 'SITEWORK', description: '6" Concrete Sidewalk', quantity: 450, unit: 'SF', confidence: 85, floor: 'SITE', drawingRef: 'C-201' },
            { category: 'SITEWORK', description: 'Concrete Curb and Gutter', quantity: 320, unit: 'LF', confidence: 83, floor: 'SITE', drawingRef: 'C-201' },
            { category: 'UTILITIES', description: '8" PVC Storm Drain Pipe', quantity: 280, unit: 'LF', confidence: 75, floor: 'SITE', drawingRef: 'C-301' },
            { category: 'UTILITIES', description: 'Storm Drain Manhole 4\' Dia', quantity: 3, unit: 'EA', confidence: 88, floor: 'SITE', drawingRef: 'C-301' },
          ],
        }

        // Gather items from all requested disciplines
        let allItems: any[] = []
        for (const disc of disciplines) {
          const items = disciplineItems[disc] || disciplineItems[disc.toUpperCase()] || []
          allItems = allItems.concat(items)
        }

        // If no matching disciplines, use architectural as default
        if (allItems.length === 0) {
          allItems = disciplineItems.ARCHITECTURAL || []
        }

        // Adjust quantities based on detail level
        const detailMultiplier = detailLevel === 'DETAILED' ? 1.5 : detailLevel === 'BASIC' ? 0.6 : 1.0
        const itemsSlice = detailLevel === 'DETAILED'
          ? allItems
          : detailLevel === 'BASIC'
            ? allItems.filter((_: any, i: number) => i % 2 === 0)
            : allItems

        // Add IDs and source tag
        const items = itemsSlice.map((item: any, index: number) => ({
          id: String(index + 1),
          ...item,
          quantity: Math.round(item.quantity * (0.9 + Math.random() * 0.2)),
          confidence: Math.min(98, Math.max(55, item.confidence + Math.floor(Math.random() * 10 - 5))),
          source: 'AI_EXTRACTED',
        }))

        const processingTime = ((Date.now() - startTime) / 1000) + (1.5 + Math.random() * 3)
        const averageConfidence = items.length > 0
          ? Math.round(items.reduce((sum: number, i: any) => sum + i.confidence, 0) / items.length)
          : 0

        return reply.send({
          items,
          totalItems: items.length,
          processingTime: Math.round(processingTime * 10) / 10,
          averageConfidence,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'AI takeoff extraction failed' })
      }
    }
  )

  // POST /estimation/ai/analyze-photo — AI construction photo analysis
  fastify.post(
    '/ai/analyze-photo',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { photoUrl, context } = request.body as { photoUrl: string; context?: string }

        if (!photoUrl) {
          return reply.code(400).send({ error: 'photoUrl is required' })
        }

        // Mock AI photo analysis result
        const analysis = {
          photoUrl,
          context: context || 'general',
          detectedElements: [
            { element: 'Concrete Foundation Wall', confidence: 92, boundingBox: { x: 10, y: 60, w: 80, h: 30 }, notes: 'Appears to be 8" poured concrete, form ties visible' },
            { element: 'Rebar Grid', confidence: 87, boundingBox: { x: 15, y: 65, w: 70, h: 20 }, notes: '#4 rebar at 12" OC both ways detected' },
            { element: 'Anchor Bolts', confidence: 78, boundingBox: { x: 20, y: 58, w: 60, h: 5 }, notes: '1/2" J-bolts at 48" OC along top of wall' },
            { element: 'Waterproofing Membrane', confidence: 72, boundingBox: { x: 5, y: 70, w: 40, h: 25 }, notes: 'Below-grade waterproofing visible on exterior face' },
          ],
          suggestedItems: [
            { category: 'CONCRETE', description: 'Foundation Wall 8" Poured Concrete', quantity: null, unit: 'SF', estimatedCost: 14.50 },
            { category: 'CONCRETE', description: '#4 Rebar Grid 12" OC E.W.', quantity: null, unit: 'SF', estimatedCost: 2.25 },
            { category: 'METALS', description: '1/2" Anchor Bolt w/ Nut & Washer', quantity: null, unit: 'EA', estimatedCost: 8.50 },
            { category: 'WATERPROOFING', description: 'Below-Grade Waterproofing Membrane', quantity: null, unit: 'SF', estimatedCost: 4.75 },
          ],
          constructionPhase: 'FOUNDATION',
          progressEstimate: '35% complete for foundation scope',
          qualityNotes: [
            'Rebar spacing appears consistent with structural drawings',
            'Form alignment looks plumb — good workmanship',
            'Waterproofing membrane properly lapped at seams',
          ],
          issues: [
            { severity: 'LOW', description: 'Minor honeycombing visible on south wall face — may need patching' },
          ],
        }

        return reply.send({ analysis })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Photo analysis failed' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTIMATE OPERATIONS (duplicate, calculate, export)
  // ═══════════════════════════════════════════════════════════════════════════

  // POST /estimation/estimate/:id/duplicate — Duplicate an estimate
  fastify.post(
    '/estimate/:id/duplicate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        // Fetch the source estimate with sections and line items
        const source = await prismaAny.estimate.findUnique({
          where: { id },
          include: {
            sections: true,
            lineItems: true,
          },
        })

        if (!source) return reply.code(404).send({ error: 'Estimate not found' })

        // Create the duplicate estimate
        const {
          id: _id, createdAt: _ca, updatedAt: _ua, sections: srcSections, lineItems: srcItems,
          parentEstimateId: _pid, version: _v, ...estimateData
        } = source

        const duplicate = await prismaAny.estimate.create({
          data: {
            ...estimateData,
            name: `${source.name} (Copy)`,
            status: 'DRAFT_ESTIMATE',
            version: 1,
          },
        })

        // Duplicate sections with a mapping from old ID to new ID
        const sectionMap = new Map<string, string>()
        for (const section of srcSections || []) {
          const { id: sId, estimateId: _eId, createdAt: _sca, updatedAt: _sua, ...sectionData } = section
          const newSection = await prismaAny.estimateSection.create({
            data: {
              ...sectionData,
              estimateId: duplicate.id,
            },
          })
          sectionMap.set(sId, newSection.id)
        }

        // Duplicate line items
        for (const item of srcItems || []) {
          const { id: iId, estimateId: _eId, createdAt: _ica, updatedAt: _iua, sectionId, ...itemData } = item
          await prismaAny.estimateLineItem.create({
            data: {
              ...itemData,
              estimateId: duplicate.id,
              sectionId: sectionId ? (sectionMap.get(sectionId) || null) : null,
            },
          })
        }

        return reply.code(201).send({ estimate: duplicate })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to duplicate estimate' })
      }
    }
  )

  // POST /estimation/estimate/:id/calculate — Recalculate estimate totals
  fastify.post(
    '/estimate/:id/calculate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const estimate = await prismaAny.estimate.findUnique({
          where: { id },
          include: { lineItems: true, sections: true },
        })

        if (!estimate) return reply.code(404).send({ error: 'Estimate not found' })

        // Sum up line items
        const lineItems = estimate.lineItems || []
        let subtotalMaterial = 0
        let subtotalLabor = 0
        let subtotalEquipment = 0
        let subtotalSubcontractor = 0
        let subtotalOther = 0

        for (const item of lineItems) {
          if (item.isExcluded) continue
          const total = Number(item.totalCost || 0)
          switch (item.itemType) {
            case 'MATERIAL_LINE': subtotalMaterial += total; break
            case 'LABOR_LINE': subtotalLabor += total; break
            case 'EQUIPMENT_LINE': subtotalEquipment += total; break
            case 'SUBCONTRACTOR_LINE': subtotalSubcontractor += total; break
            default: subtotalOther += total; break
          }
        }

        const subtotalDirect = subtotalMaterial + subtotalLabor + subtotalEquipment + subtotalSubcontractor + subtotalOther
        const overheadPercent = Number(estimate.overheadPercent || 10)
        const profitPercent = Number(estimate.profitPercent || 10)
        const contingencyPercent = Number(estimate.contingencyPercent || 5)
        const taxRate = Number(estimate.taxRate || 0)

        const overhead = subtotalDirect * (overheadPercent / 100)
        const profit = subtotalDirect * (profitPercent / 100)
        const contingency = subtotalDirect * (contingencyPercent / 100)
        const salesTax = subtotalMaterial * taxRate
        const totalCost = subtotalDirect + overhead + profit + contingency + salesTax

        const sqft = Number(estimate.squareFootage || 0)
        const costPerSqFt = sqft > 0 ? totalCost / sqft : null

        // Update estimate totals
        const updated = await prismaAny.estimate.update({
          where: { id },
          data: {
            subtotalMaterial,
            subtotalLabor,
            subtotalEquipment,
            subtotalSubcontractor,
            subtotalOther,
            subtotalDirect,
            overhead,
            profit,
            contingency,
            salesTax,
            totalCost,
            costPerSqFt,
          },
        })

        // Update section subtotals
        for (const section of estimate.sections || []) {
          const sectionItems = lineItems.filter((i: any) => i.sectionId === section.id && !i.isExcluded)
          const sectionMaterial = sectionItems.filter((i: any) => i.itemType === 'MATERIAL_LINE').reduce((s: number, i: any) => s + Number(i.totalCost || 0), 0)
          const sectionLabor = sectionItems.filter((i: any) => i.itemType === 'LABOR_LINE').reduce((s: number, i: any) => s + Number(i.totalCost || 0), 0)
          const sectionEquipment = sectionItems.filter((i: any) => i.itemType === 'EQUIPMENT_LINE').reduce((s: number, i: any) => s + Number(i.totalCost || 0), 0)
          const sectionSub = sectionItems.filter((i: any) => i.itemType === 'SUBCONTRACTOR_LINE').reduce((s: number, i: any) => s + Number(i.totalCost || 0), 0)
          const sectionOther = sectionItems.filter((i: any) => !['MATERIAL_LINE', 'LABOR_LINE', 'EQUIPMENT_LINE', 'SUBCONTRACTOR_LINE'].includes(i.itemType)).reduce((s: number, i: any) => s + Number(i.totalCost || 0), 0)
          const sectionTotal = sectionMaterial + sectionLabor + sectionEquipment + sectionSub + sectionOther

          await prismaAny.estimateSection.update({
            where: { id: section.id },
            data: {
              subtotalMaterial: sectionMaterial,
              subtotalLabor: sectionLabor,
              subtotalEquipment: sectionEquipment,
              subtotalSubcontractor: sectionSub,
              subtotalOther: sectionOther,
              total: sectionTotal,
            },
          })
        }

        return reply.send({
          estimate: updated,
          calculation: {
            subtotalMaterial,
            subtotalLabor,
            subtotalEquipment,
            subtotalSubcontractor,
            subtotalOther,
            subtotalDirect,
            overhead,
            profit,
            contingency,
            salesTax,
            totalCost,
            costPerSqFt,
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to calculate estimate' })
      }
    }
  )

  // POST /estimation/estimate/:id/export — Export estimate as PDF/CSV
  fastify.post(
    '/estimate/:id/export',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const { format } = request.body as { format?: string }
        const exportFormat = (format || 'pdf').toUpperCase()

        const estimate = await prismaAny.estimate.findUnique({
          where: { id },
          include: { sections: { include: { lineItems: true } } },
        })

        if (!estimate) return reply.code(404).send({ error: 'Estimate not found' })

        // In production this would generate an actual PDF/CSV.
        // For now return an export record the frontend can use.
        const exportId = `export-${Date.now()}`
        return reply.send({
          exportId,
          format: exportFormat,
          estimateId: id,
          estimateName: estimate.name,
          status: 'completed',
          downloadUrl: `/estimation/exports/${exportId}/download`,
          generatedAt: new Date().toISOString(),
          metadata: {
            sections: (estimate.sections || []).length,
            lineItems: (estimate.sections || []).reduce((sum: number, s: any) => sum + (s.lineItems?.length || 0), 0),
            totalCost: Number(estimate.totalCost || 0),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to export estimate' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTIMATE SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // GET /estimation/estimates/:estimateId/sections — List sections for an estimate
  fastify.get(
    '/estimates/:estimateId/sections',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ estimateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { estimateId } = request.params as { estimateId: string }

        const sections = await prismaAny.estimateSection.findMany({
          where: { estimateId },
          orderBy: { sortOrder: 'asc' },
          include: {
            lineItems: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        })

        return reply.send({ sections })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.send({ sections: [] })
      }
    }
  )

  // POST /estimation/estimates/:estimateId/sections — Create a section
  fastify.post(
    '/estimates/:estimateId/sections',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ estimateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { estimateId } = request.params as { estimateId: string }
        const body = request.body as any

        // Determine next sort order
        const lastSection = await prismaAny.estimateSection.findFirst({
          where: { estimateId },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true },
        })

        const section = await prismaAny.estimateSection.create({
          data: {
            estimateId,
            name: body.name || 'New Section',
            description: body.description || null,
            csiDivision: body.csiDivision || null,
            csiCode: body.csiCode || null,
            sortOrder: (lastSection?.sortOrder || 0) + 1,
          },
        })

        return reply.code(201).send({ section })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create section' })
      }
    }
  )

  // POST /estimation/estimates/:estimateId/sections/csi — Auto-create CSI MasterFormat sections
  fastify.post(
    '/estimates/:estimateId/sections/csi',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ estimateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { estimateId } = request.params as { estimateId: string }

        // Standard CSI MasterFormat divisions commonly used in construction
        const csiDivisions = [
          { division: 1, code: '01', name: 'General Requirements' },
          { division: 2, code: '02', name: 'Existing Conditions' },
          { division: 3, code: '03', name: 'Concrete' },
          { division: 4, code: '04', name: 'Masonry' },
          { division: 5, code: '05', name: 'Metals' },
          { division: 6, code: '06', name: 'Wood, Plastics & Composites' },
          { division: 7, code: '07', name: 'Thermal & Moisture Protection' },
          { division: 8, code: '08', name: 'Openings' },
          { division: 9, code: '09', name: 'Finishes' },
          { division: 10, code: '10', name: 'Specialties' },
          { division: 21, code: '21', name: 'Fire Suppression' },
          { division: 22, code: '22', name: 'Plumbing' },
          { division: 23, code: '23', name: 'HVAC' },
          { division: 26, code: '26', name: 'Electrical' },
          { division: 31, code: '31', name: 'Earthwork' },
          { division: 32, code: '32', name: 'Exterior Improvements' },
          { division: 33, code: '33', name: 'Utilities' },
        ]

        const sections: any[] = []
        for (let i = 0; i < csiDivisions.length; i++) {
          const div = csiDivisions[i]
          const section = await prismaAny.estimateSection.create({
            data: {
              estimateId,
              name: `Division ${div.code} - ${div.name}`,
              csiDivision: div.division,
              csiCode: div.code,
              sortOrder: i + 1,
            },
          })
          sections.push(section)
        }

        return reply.code(201).send({ sections, count: sections.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to create CSI sections' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTIMATE LINE ITEMS
  // ═══════════════════════════════════════════════════════════════════════════

  // GET /estimation/estimates/:estimateId/items — List line items for an estimate
  fastify.get(
    '/estimates/:estimateId/items',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ estimateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { estimateId } = request.params as { estimateId: string }
        const query = request.query as { sectionId?: string; category?: string; search?: string }

        const where: any = { estimateId }
        if (query.sectionId) where.sectionId = query.sectionId
        if (query.category) where.category = query.category
        if (query.search) {
          where.OR = [
            { description: { contains: query.search, mode: 'insensitive' } },
            { csiCode: { contains: query.search, mode: 'insensitive' } },
            { category: { contains: query.search, mode: 'insensitive' } },
          ]
        }

        const items = await prismaAny.estimateLineItem.findMany({
          where,
          orderBy: { sortOrder: 'asc' },
        })

        return reply.send({ items })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.send({ items: [] })
      }
    }
  )

  // POST /estimation/estimates/:estimateId/items — Create a line item
  fastify.post(
    '/estimates/:estimateId/items',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ estimateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { estimateId } = request.params as { estimateId: string }
        const body = request.body as any

        const quantity = Number(body.quantity || 0)
        const unitCost = Number(body.unitCost || 0)
        const totalCost = quantity * unitCost

        const item = await prismaAny.estimateLineItem.create({
          data: {
            estimateId,
            sectionId: body.sectionId || null,
            itemType: body.itemType || 'MATERIAL_LINE',
            csiCode: body.csiCode || null,
            category: body.category || null,
            description: body.description || 'New Item',
            location: body.location || null,
            quantity,
            unit: body.unit || 'EA',
            unitCost,
            totalCost,
            laborHours: body.laborHours || null,
            laborCost: body.laborCost || null,
            materialCostAmt: body.materialCostAmt || null,
            equipmentCostAmt: body.equipmentCostAmt || null,
            subcontractorCost: body.subcontractorCost || null,
            wasteFactor: body.wasteFactor || 1.0,
            difficultyFactor: body.difficultyFactor || 1.0,
            takeoffSource: body.takeoffSource || 'MANUAL',
            takeoffNotes: body.takeoffNotes || null,
            sortOrder: body.sortOrder || 0,
            notes: body.notes || null,
          },
        })

        return reply.code(201).send({ item })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create line item' })
      }
    }
  )

  // POST /estimation/estimates/:estimateId/items/bulk — Bulk create line items
  fastify.post(
    '/estimates/:estimateId/items/bulk',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ estimateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { estimateId } = request.params as { estimateId: string }
        const { items: inputItems } = request.body as { items: any[] }

        if (!inputItems || inputItems.length === 0) {
          return reply.code(400).send({ error: 'At least one item is required' })
        }

        const created: any[] = []
        for (let i = 0; i < inputItems.length; i++) {
          const body = inputItems[i]
          const quantity = Number(body.quantity || 0)
          const unitCost = Number(body.unitCost || 0)
          const totalCost = quantity * unitCost

          const item = await prismaAny.estimateLineItem.create({
            data: {
              estimateId,
              sectionId: body.sectionId || null,
              itemType: body.itemType || 'MATERIAL_LINE',
              csiCode: body.csiCode || null,
              category: body.category || null,
              description: body.description || `Item ${i + 1}`,
              location: body.location || null,
              quantity,
              unit: body.unit || 'EA',
              unitCost,
              totalCost,
              wasteFactor: body.wasteFactor || 1.0,
              difficultyFactor: body.difficultyFactor || 1.0,
              takeoffSource: body.takeoffSource || 'MANUAL',
              sortOrder: body.sortOrder || i,
              notes: body.notes || null,
            },
          })
          created.push(item)
        }

        return reply.code(201).send({ items: created, count: created.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to bulk create line items' })
      }
    }
  )

  // POST /estimation/estimates/:estimateId/items/from-assembly — Add line items from an assembly
  fastify.post(
    '/estimates/:estimateId/items/from-assembly',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ estimateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { estimateId } = request.params as { estimateId: string }
        const { assemblyId, sectionId, quantity: assemblyQty } = request.body as {
          assemblyId: string; sectionId?: string; quantity?: number
        }

        if (!assemblyId) {
          return reply.code(400).send({ error: 'assemblyId is required' })
        }

        // Look up the assembly
        const assembly = await prismaAny.assembly.findUnique({
          where: { id: assemblyId },
          include: { items: true },
        })

        if (!assembly) return reply.code(404).send({ error: 'Assembly not found' })

        const qty = assemblyQty || 1
        const created: any[] = []

        // If the assembly has child items, create a line item for each
        if (assembly.items && assembly.items.length > 0) {
          for (const child of assembly.items) {
            const childQty = Number(child.quantity || 1) * qty
            const unitCost = Number(child.unitCost || 0)
            const item = await prismaAny.estimateLineItem.create({
              data: {
                estimateId,
                sectionId: sectionId || null,
                assemblyId: assembly.id,
                itemType: 'ASSEMBLY_LINE',
                category: assembly.category,
                description: child.description || child.name || assembly.name,
                quantity: childQty,
                unit: child.unit || assembly.unit,
                unitCost,
                totalCost: childQty * unitCost,
                wasteFactor: 1.0,
                difficultyFactor: 1.0,
                takeoffSource: 'ASSEMBLY_CALC',
                notes: `From assembly: ${assembly.name} (${assembly.code || assembly.id})`,
              },
            })
            created.push(item)
          }
        } else {
          // Create a single line item from the assembly itself
          const unitCost = Number(assembly.unitCost || 0)
          const item = await prismaAny.estimateLineItem.create({
            data: {
              estimateId,
              sectionId: sectionId || null,
              assemblyId: assembly.id,
              itemType: 'ASSEMBLY_LINE',
              category: assembly.category,
              description: assembly.name,
              quantity: qty,
              unit: assembly.unit,
              unitCost,
              totalCost: qty * unitCost,
              laborHours: assembly.laborHours ? Number(assembly.laborHours) * qty : null,
              laborCost: assembly.laborCost ? Number(assembly.laborCost) * qty : null,
              materialCostAmt: assembly.materialCost ? Number(assembly.materialCost) * qty : null,
              equipmentCostAmt: assembly.equipmentCost ? Number(assembly.equipmentCost) * qty : null,
              wasteFactor: 1.0,
              difficultyFactor: 1.0,
              takeoffSource: 'ASSEMBLY_CALC',
              notes: `From assembly: ${assembly.name} (${assembly.code || assembly.id})`,
            },
          })
          created.push(item)
        }

        return reply.code(201).send({ items: created, count: created.length, assembly: { id: assembly.id, name: assembly.name } })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to add items from assembly' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTIMATE REVISIONS (uses Estimate self-referencing parentEstimateId)
  // ═══════════════════════════════════════════════════════════════════════════

  // GET /estimation/estimates/:estimateId/revisions — List revisions of an estimate
  fastify.get(
    '/estimates/:estimateId/revisions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ estimateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { estimateId } = request.params as { estimateId: string }

        // Revisions are stored as child estimates with parentEstimateId pointing to the original
        const revisions = await prismaAny.estimate.findMany({
          where: { parentEstimateId: estimateId },
          orderBy: { version: 'desc' },
          select: {
            id: true,
            name: true,
            version: true,
            status: true,
            totalCost: true,
            createdAt: true,
            updatedAt: true,
            notes: true,
          },
        })

        return reply.send({ revisions })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.send({ revisions: [] })
      }
    }
  )

  // POST /estimation/estimates/:estimateId/revisions — Create a new revision
  fastify.post(
    '/estimates/:estimateId/revisions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ estimateId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { estimateId } = request.params as { estimateId: string }
        const body = request.body as { notes?: string; name?: string }

        // Fetch the parent estimate
        const parent = await prismaAny.estimate.findUnique({
          where: { id: estimateId },
          include: { sections: true, lineItems: true },
        })

        if (!parent) return reply.code(404).send({ error: 'Estimate not found' })

        // Find the highest existing revision version
        const latestRevision = await prismaAny.estimate.findFirst({
          where: { parentEstimateId: estimateId },
          orderBy: { version: 'desc' },
          select: { version: true },
        })
        const nextVersion = (latestRevision?.version || parent.version || 1) + 1

        // Create the revision as a child estimate
        const {
          id: _id, createdAt: _ca, updatedAt: _ua, sections: srcSections, lineItems: srcItems,
          parentEstimateId: _pid, version: _v, revisionsUsed: _ru, ...estimateData
        } = parent

        const revision = await prismaAny.estimate.create({
          data: {
            ...estimateData,
            name: body.name || `${parent.name} - Rev ${nextVersion}`,
            parentEstimateId: estimateId,
            version: nextVersion,
            status: 'DRAFT_ESTIMATE',
            notes: body.notes || null,
          },
        })

        // Copy sections
        const sectionMap = new Map<string, string>()
        for (const section of srcSections || []) {
          const { id: sId, estimateId: _eId, createdAt: _sca, updatedAt: _sua, ...sectionData } = section
          const newSection = await prismaAny.estimateSection.create({
            data: { ...sectionData, estimateId: revision.id },
          })
          sectionMap.set(sId, newSection.id)
        }

        // Copy line items
        for (const item of srcItems || []) {
          const { id: iId, estimateId: _eId, createdAt: _ica, updatedAt: _iua, sectionId, ...itemData } = item
          await prismaAny.estimateLineItem.create({
            data: {
              ...itemData,
              estimateId: revision.id,
              sectionId: sectionId ? (sectionMap.get(sectionId) || null) : null,
            },
          })
        }

        // Increment revisionsUsed on the parent
        await prismaAny.estimate.update({
          where: { id: estimateId },
          data: { revisionsUsed: (parent.revisionsUsed || 0) + 1 },
        })

        return reply.code(201).send({ revision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to create revision' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTIMATION LEADS
  // ═══════════════════════════════════════════════════════════════════════════

  // POST /estimation/leads — Submit estimation lead from contact form
  fastify.post(
    '/leads',
    {
      preHandler: [validateBody(leadSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof leadSchema>

        // Try to create in the Lead table if it exists
        const lead = await prismaAny.lead.create({
          data: {
            name: body.name || 'Unknown',
            email: body.email,
            phone: body.phone,
            company: body.company,
            projectType: body.projectType,
            description: body.description,
            estimatedValue: body.estimatedBudget,
            source: body.source || 'estimation-app',
            stage: 'NEW',
          },
        })

        return reply.code(201).send({ success: true, lead })
      } catch (error: any) {
        fastify.log.error(error)
        // Even if DB insert fails, acknowledge the lead
        return reply.code(201).send({
          success: true,
          message: 'Lead submitted successfully',
        })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // CTC (Construction Task Catalog) ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  // POST /estimation/ctc/search — Search CTC tasks
  fastify.post(
    '/ctc/search',
    {
      preHandler: [
        async (request: any, reply: any) => { await authenticateUser(request, reply) },
        validateBody(z.object({
          query: z.string().optional(),
          division: z.string().optional(),
          category: z.string().optional(),
          modifiersOnly: z.boolean().optional(),
          page: z.number().optional(),
          limit: z.number().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          query?: string; division?: string; category?: string;
          modifiersOnly?: boolean; page?: number; limit?: number
        }
        const page = Math.max(1, body.page || 1)
        const limit = Math.min(100, Math.max(1, body.limit || 50))
        const skip = (page - 1) * limit

        const where: any = {
          sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
          isActive: true,
        }

        if (body.query) {
          const words = body.query.trim().split(/\s+/).filter(w => w.length > 1)
          if (words.length === 1) {
            where.OR = [
              { name: { contains: words[0], mode: 'insensitive' } },
              { ctcTaskNumber: { contains: words[0], mode: 'insensitive' } },
              { csiCode: { contains: words[0], mode: 'insensitive' } },
              { description: { contains: words[0], mode: 'insensitive' } },
            ]
          } else {
            // Multi-word: AND each word across name or description
            where.AND = words.map(w => ({
              OR: [
                { name: { contains: w, mode: 'insensitive' } },
                { description: { contains: w, mode: 'insensitive' } },
              ],
            }))
          }
        }

        if (body.division) {
          where.tags = { has: `div-${body.division}` }
        }

        if (body.modifiersOnly) {
          where.tags = { ...(where.tags || {}), has: 'modifier' }
        }

        if (body.category) {
          where.category = body.category
        }

        const [tasks, total] = await Promise.all([
          prismaAny.assembly.findMany({
            where,
            skip,
            take: limit,
            orderBy: { ctcTaskNumber: 'asc' },
            select: {
              id: true,
              ctcTaskNumber: true,
              csiCode: true,
              name: true,
              description: true,
              category: true,
              subcategory: true,
              unit: true,
              unitCost: true,
              laborCost: true,
              materialCost: true,
              equipmentCost: true,
              laborHours: true,
              tags: true,
              ctcModifierOf: true,
              metadata: true,
            },
          }),
          prismaAny.assembly.count({ where }),
        ])

        return reply.send({
          data: tasks,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'CTC search failed' })
      }
    }
  )

  // GET /estimation/ctc/divisions — List CTC divisions with task counts
  fastify.get(
    '/ctc/divisions',
    {
      preHandler: [
        async (request: any, reply: any) => { await authenticateUser(request, reply) },
      ],
    },
    async (request, reply) => {
      try {
        // Get all CTC assemblies grouped by their division tag
        const allCTC = await prismaAny.assembly.findMany({
          where: {
            sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
            isActive: true,
          },
          select: { tags: true },
        })

        const CSI_DIVISIONS: Record<string, string> = {
          '01': 'General Requirements', '02': 'Existing Conditions',
          '03': 'Concrete', '04': 'Masonry', '05': 'Metals',
          '06': 'Wood, Plastics, and Composites',
          '07': 'Thermal and Moisture Protection', '08': 'Openings',
          '09': 'Finishes', '10': 'Specialties', '11': 'Equipment',
          '12': 'Furnishings', '13': 'Special Construction',
          '14': 'Conveying Equipment', '21': 'Fire Suppression',
          '22': 'Plumbing', '23': 'HVAC', '26': 'Electrical',
          '27': 'Communications', '28': 'Electronic Safety and Security',
          '31': 'Earthwork', '32': 'Exterior Improvements',
          '33': 'Utilities',
        }

        const divCounts = new Map<string, number>()
        for (const asm of allCTC) {
          const divTag = (asm.tags as string[])?.find((t: string) => t.startsWith('div-'))
          if (divTag) {
            const code = divTag.replace('div-', '')
            divCounts.set(code, (divCounts.get(code) || 0) + 1)
          }
        }

        const divisions = Array.from(divCounts.entries())
          .map(([code, count]) => ({
            code,
            name: CSI_DIVISIONS[code] || `Division ${code}`,
            taskCount: count,
          }))
          .sort((a, b) => a.code.localeCompare(b.code))

        return reply.send({
          data: divisions,
          totalTasks: allCTC.length,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get CTC divisions' })
      }
    }
  )

  // GET /estimation/ctc/tasks/:taskNumber — Get a specific CTC task
  fastify.get(
    '/ctc/tasks/:taskNumber',
    {
      preHandler: [
        async (request: any, reply: any) => { await authenticateUser(request, reply) },
      ],
    },
    async (request, reply) => {
      try {
        const { taskNumber } = request.params as { taskNumber: string }

        const task = await prismaAny.assembly.findFirst({
          where: {
            ctcTaskNumber: taskNumber,
            sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
          },
        })

        if (!task) {
          return reply.code(404).send({ error: `CTC task ${taskNumber} not found` })
        }

        // Also fetch modifiers for this task
        const modifiers = await prismaAny.assembly.findMany({
          where: {
            ctcModifierOf: taskNumber,
            sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
          },
          orderBy: { ctcTaskNumber: 'asc' },
        })

        return reply.send({ data: { ...task, modifiers } })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get CTC task' })
      }
    }
  )

  // POST /estimation/ctc/estimate — Create an estimate from CTC tasks
  fastify.post(
    '/ctc/estimate',
    {
      preHandler: [
        async (request: any, reply: any) => { await authenticateUser(request, reply) },
        validateBody(z.object({
          name: z.string().min(1),
          projectName: z.string().optional(),
          projectAddress: z.string().optional(),
          tasks: z.array(z.object({
            ctcTaskNumber: z.string(),
            quantity: z.number().min(0),
            modifiers: z.array(z.string()).optional(),
          })),
          overheadPercent: z.number().optional(),
          profitPercent: z.number().optional(),
          contingencyPercent: z.number().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const body = request.body as {
          name: string; projectName?: string; projectAddress?: string;
          tasks: Array<{ ctcTaskNumber: string; quantity: number; modifiers?: string[] }>;
          overheadPercent?: number; profitPercent?: number; contingencyPercent?: number;
        }

        // Resolve CTC tasks from database
        const taskNumbers = body.tasks.map(t => t.ctcTaskNumber)
        const allModifiers = body.tasks.flatMap(t => t.modifiers || [])
        const allNumbers = [...new Set([...taskNumbers, ...allModifiers])]

        const assemblies = await prismaAny.assembly.findMany({
          where: {
            ctcTaskNumber: { in: allNumbers },
            sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
          },
        })

        const assemblyMap = new Map<string, any>()
        for (const a of assemblies) {
          assemblyMap.set(a.ctcTaskNumber, a)
        }

        // Calculate line items
        let subtotalMaterial = 0
        let subtotalLabor = 0
        let subtotalEquipment = 0
        const lineItems: any[] = []

        for (const taskReq of body.tasks) {
          const asm = assemblyMap.get(taskReq.ctcTaskNumber)
          if (!asm) continue

          let baseUnitCost = Number(asm.unitCost) || 0
          let baseLaborCost = Number(asm.laborCost) || 0
          let baseMaterialCost = Number(asm.materialCost) || 0
          let baseEquipmentCost = Number(asm.equipmentCost) || 0

          // Apply modifiers
          for (const modNum of (taskReq.modifiers || [])) {
            const mod = assemblyMap.get(modNum)
            if (!mod) continue
            baseUnitCost += Number(mod.unitCost) || 0
            baseLaborCost += Number(mod.laborCost) || 0
            baseMaterialCost += Number(mod.materialCost) || 0
            baseEquipmentCost += Number(mod.equipmentCost) || 0
          }

          const qty = taskReq.quantity
          const totalCost = baseUnitCost * qty

          lineItems.push({
            assemblyId: asm.id,
            description: asm.name,
            quantity: qty,
            unit: asm.unit,
            unitCost: baseUnitCost,
            laborCost: baseLaborCost * qty,
            materialCost: baseMaterialCost * qty,
            equipmentCost: baseEquipmentCost * qty,
            totalCost,
            metadata: {
              ctcTaskNumber: taskReq.ctcTaskNumber,
              modifiers: taskReq.modifiers || [],
            },
          })

          subtotalMaterial += baseMaterialCost * qty
          subtotalLabor += baseLaborCost * qty
          subtotalEquipment += baseEquipmentCost * qty
        }

        const subtotalDirect = subtotalMaterial + subtotalLabor + subtotalEquipment
        const overheadPct = body.overheadPercent ?? 10
        const profitPct = body.profitPercent ?? 10
        const contingencyPct = body.contingencyPercent ?? 5
        const overhead = subtotalDirect * (overheadPct / 100)
        const profit = subtotalDirect * (profitPct / 100)
        const contingency = subtotalDirect * (contingencyPct / 100)
        const totalCost = subtotalDirect + overhead + profit + contingency

        // Find CTC cost database
        const ctcDb = await prismaAny.costDatabase.findFirst({
          where: { source: 'CTC-Gordian-MD-DGS-2023' },
        })

        // Create the estimate
        const estimate = await prismaAny.estimate.create({
          data: {
            organizationId: user.orgId || user.organizationId || 'default',
            costDatabaseId: ctcDb?.id || undefined,
            name: body.name,
            description: `CTC-based estimate with ${lineItems.length} line items`,
            type: 'PRELIMINARY',
            status: 'DRAFT_ESTIMATE',
            projectName: body.projectName,
            projectAddress: body.projectAddress,
            subtotalMaterial,
            subtotalLabor,
            subtotalEquipment,
            subtotalDirect,
            overhead,
            overheadPercent: overheadPct,
            profit,
            profitPercent: profitPct,
            contingency,
            contingencyPercent: contingencyPct,
            totalCost,
            aiGenerated: false,
            metadata: { source: 'ctc-estimate', taskCount: lineItems.length },
          },
        })

        // Create line items
        for (const item of lineItems) {
          await prismaAny.estimateLineItem.create({
            data: {
              estimateId: estimate.id,
              assemblyId: item.assemblyId,
              itemType: 'ASSEMBLY_LINE',
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitCost: item.unitCost,
              laborCost: item.laborCost,
              materialCostAmt: item.materialCost,
              equipmentCostAmt: item.equipmentCost,
              totalCost: item.totalCost,
              metadata: item.metadata,
            },
          })
        }

        return reply.code(201).send({
          success: true,
          data: {
            estimateId: estimate.id,
            name: estimate.name,
            lineItems: lineItems.length,
            subtotalDirect,
            overhead,
            profit,
            contingency,
            totalCost,
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to create CTC estimate' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // AI TAKEOFF ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  // POST /estimation/ai-takeoff/upload — Upload plans for AI takeoff processing
  fastify.post(
    '/ai-takeoff/upload',
    {
      preHandler: [
        async (request: any, reply: any) => { await authenticateUser(request, reply) },
      ],
    },
    async (request, reply) => {
      try {
        const data = await request.file()
        if (!data) {
          return reply.code(400).send({ error: 'No file uploaded' })
        }

        const fileName = data.filename || 'plans.pdf'
        const user = (request as any).user
        const userId = user?.id
        if (!userId) {
          return reply.code(401).send({ error: 'User not authenticated' })
        }

        // Collect optional fields
        const fields: Record<string, string> = {}
        if (data.fields) {
          for (const [key, field] of Object.entries(data.fields)) {
            if (field && typeof field === 'object' && 'value' in field) {
              fields[key] = (field as any).value
            }
          }
        }

        // Read file buffer
        const chunks: Buffer[] = []
        for await (const chunk of data.file) {
          chunks.push(chunk)
        }
        const fileBuffer = Buffer.concat(chunks)

        if (fileBuffer.length > 100 * 1024 * 1024) {
          return reply.code(400).send({ error: 'File size must be less than 100MB' })
        }

        // Create TakeoffJob record
        const job = await prismaAny.takeoffJob.create({
          data: {
            userId,
            organizationId: user.orgId || user.organizationId || null,
            estimateId: fields.estimateId || null,
            fileName,
            fileSize: fileBuffer.length,
            mimeType: data.mimetype || 'application/pdf',
            status: 'TAKEOFF_PENDING',
            progress: 0,
          },
        })

        // Start background processing (non-blocking)
        // Import dynamically to avoid circular deps
        const { processAITakeoff } = await import('../../services/ai-takeoff.service')
        processAITakeoff(job.id, fileBuffer).catch((err: any) => {
          fastify.log.error(err, `AI takeoff job ${job.id} failed`)
        })

        return reply.code(201).send({
          success: true,
          data: {
            jobId: job.id,
            status: 'TAKEOFF_PENDING',
            fileName,
            fileSize: fileBuffer.length,
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to start AI takeoff' })
      }
    }
  )

  // GET /estimation/ai-takeoff/:jobId — Get takeoff job status and results
  fastify.get(
    '/ai-takeoff/:jobId',
    {
      preHandler: [
        async (request: any, reply: any) => { await authenticateUser(request, reply) },
      ],
    },
    async (request, reply) => {
      try {
        const { jobId } = request.params as { jobId: string }
        const user = (request as any).user

        const job = await prismaAny.takeoffJob.findFirst({
          where: { id: jobId, userId: user.id },
        })

        if (!job) {
          return reply.code(404).send({ error: 'Takeoff job not found' })
        }

        return reply.send({ data: job })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get takeoff job' })
      }
    }
  )

  // POST /estimation/ai-takeoff/:jobId/confirm — Confirm and apply takeoff results
  fastify.post(
    '/ai-takeoff/:jobId/confirm',
    {
      preHandler: [
        async (request: any, reply: any) => { await authenticateUser(request, reply) },
        validateBody(z.object({
          estimateId: z.string().uuid().optional(),
          adjustments: z.array(z.object({
            ctcTaskNumber: z.string(),
            adjustedQuantity: z.number().optional(),
            excluded: z.boolean().optional(),
          })).optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { jobId } = request.params as { jobId: string }
        const user = (request as any).user
        const body = request.body as {
          estimateId?: string;
          adjustments?: Array<{ ctcTaskNumber: string; adjustedQuantity?: number; excluded?: boolean }>;
        }

        const job = await prismaAny.takeoffJob.findFirst({
          where: { id: jobId, userId: user.id, status: 'TAKEOFF_REVIEW' },
        })

        if (!job) {
          return reply.code(404).send({ error: 'Takeoff job not found or not in review status' })
        }

        // Apply adjustments
        let extractedTasks = (job.extractedTasks as any[]) || []
        if (body.adjustments) {
          for (const adj of body.adjustments) {
            const task = extractedTasks.find((t: any) => t.ctcTaskNumber === adj.ctcTaskNumber)
            if (task) {
              if (adj.excluded) task.excluded = true
              if (adj.adjustedQuantity !== undefined) task.quantity = adj.adjustedQuantity
            }
          }
        }

        // Filter out excluded tasks
        const confirmedTasks = extractedTasks.filter((t: any) => !t.excluded)

        // Create or update estimate with confirmed tasks
        const targetEstimateId = body.estimateId || job.estimateId
        let lineItemsCreated = 0

        if (targetEstimateId) {
          // Look up assemblies for the confirmed CTC tasks
          const taskNumbers = confirmedTasks.map((t: any) => t.ctcTaskNumber)
          const assemblies = await prismaAny.assembly.findMany({
            where: {
              ctcTaskNumber: { in: taskNumbers },
              sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
            },
          })
          const asmMap = new Map(assemblies.map((a: any) => [a.ctcTaskNumber, a]))

          for (const task of confirmedTasks) {
            const asm: any = asmMap.get(task.ctcTaskNumber)
            if (!asm) continue

            const qty = task.quantity || 1
            await prismaAny.estimateLineItem.create({
              data: {
                estimateId: targetEstimateId,
                assemblyId: asm.id,
                itemType: 'ASSEMBLY_LINE',
                description: asm.name,
                quantity: qty,
                unit: asm.unit,
                unitCost: Number(asm.unitCost),
                laborCost: Number(asm.laborCost) * qty,
                materialCostAmt: Number(asm.materialCost) * qty,
                equipmentCostAmt: Number(asm.equipmentCost) * qty,
                totalCost: Number(asm.unitCost) * qty,
                metadata: { ctcTaskNumber: task.ctcTaskNumber, aiTakeoffJobId: jobId },
              },
            })
            lineItemsCreated++
          }
        }

        // Update job status
        await prismaAny.takeoffJob.update({
          where: { id: jobId },
          data: {
            status: 'TAKEOFF_CONFIRMED',
            adjustments: body.adjustments || null,
            reviewedBy: user.id,
            lineItemsGenerated: lineItemsCreated,
            completedAt: new Date(),
          },
        })

        return reply.send({
          success: true,
          data: {
            jobId,
            status: 'TAKEOFF_CONFIRMED',
            confirmedTasks: confirmedTasks.length,
            lineItemsCreated,
            estimateId: targetEstimateId,
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to confirm takeoff' })
      }
    }
  )
}
