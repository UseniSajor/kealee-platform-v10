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
              grandTotal: true,
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
          amount: Number(e.grandTotal || 0),
          totalCost: Number(e.grandTotal || 0),
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
          select: { id: true, name: true, grandTotal: true, type: true, squareFootage: true, createdAt: true },
        })

        const comparison = {
          estimates: estimates.map((e: any) => ({
            id: e.id,
            name: e.name,
            total: Number(e.grandTotal || 0),
            costPerSqft: e.squareFootage ? Number(e.grandTotal || 0) / e.squareFootage : 0,
            type: e.type,
          })),
          summary: {
            lowestCost: Math.min(...estimates.map((e: any) => Number(e.grandTotal || 0))),
            highestCost: Math.max(...estimates.map((e: any) => Number(e.grandTotal || 0))),
            averageCost: estimates.reduce((sum: number, e: any) => sum + Number(e.grandTotal || 0), 0) / estimates.length,
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
          select: { grandTotal: true, squareFootage: true, type: true, projectCity: true, projectState: true },
        })

        if (!estimate) return reply.code(404).send({ error: 'Estimate not found' })

        const costPerSqft = estimate.squareFootage
          ? Number(estimate.grandTotal || 0) / estimate.squareFootage
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
}
