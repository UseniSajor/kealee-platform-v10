/**
 * Cost Import Routes
 * Upload cost books (CSV/JSON) and bulk-import materials, labor rates,
 * equipment rates, and assemblies into a CostDatabase.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter(l => l.trim())
  return lines.map(line => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue }
      if (char === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue }
      current += char
    }
    fields.push(current.trim())
    return fields
  })
}

// ---------------------------------------------------------------------------
// Column Mappings
// ---------------------------------------------------------------------------

const COLUMN_MAPS: Record<string, string[]> = {
  materials: ['csiCode', 'name', 'description', 'category', 'unit', 'unitCost', 'minCost', 'maxCost', 'wasteFactor', 'supplier'],
  labor: ['trade', 'classification', 'description', 'baseRate', 'burdenRate', 'totalRate', 'overtimeMultiplier', 'region'],
  equipment: ['category', 'name', 'description', 'dailyRate', 'weeklyRate', 'monthlyRate', 'operatorRequired', 'fuelCostPerHour'],
  assemblies: ['csiCode', 'name', 'description', 'category', 'unit', 'materialCost', 'laborCost', 'equipmentCost', 'laborHours', 'crewSize'],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNumberOrUndefined(val: string): number | undefined {
  if (!val || val === '') return undefined
  const n = parseFloat(val)
  return isNaN(n) ? undefined : n
}

function toBooleanOrUndefined(val: string): boolean | undefined {
  if (!val || val === '') return undefined
  const lower = val.toLowerCase()
  if (lower === 'true' || lower === '1' || lower === 'yes') return true
  if (lower === 'false' || lower === '0' || lower === 'no') return false
  return undefined
}

function mapRowToMaterial(row: string[], columns: string[], costDatabaseId: string): any {
  const obj: any = { costDatabaseId }
  columns.forEach((col, i) => {
    const val = row[i] || ''
    switch (col) {
      case 'unitCost':
      case 'minCost':
      case 'maxCost':
      case 'wasteFactor':
        obj[col] = toNumberOrUndefined(val)
        break
      default:
        if (val) obj[col] = val
    }
  })
  return obj
}

function mapRowToLabor(row: string[], columns: string[], costDatabaseId: string): any {
  const obj: any = { costDatabaseId }
  columns.forEach((col, i) => {
    const val = row[i] || ''
    switch (col) {
      case 'baseRate':
      case 'burdenRate':
      case 'totalRate':
      case 'overtimeMultiplier':
        obj[col] = toNumberOrUndefined(val)
        break
      default:
        if (val) obj[col] = val
    }
  })
  return obj
}

function mapRowToEquipment(row: string[], columns: string[], costDatabaseId: string): any {
  const obj: any = { costDatabaseId }
  columns.forEach((col, i) => {
    const val = row[i] || ''
    switch (col) {
      case 'dailyRate':
      case 'weeklyRate':
      case 'monthlyRate':
      case 'fuelCostPerHour':
        obj[col] = toNumberOrUndefined(val)
        break
      case 'operatorRequired':
        obj[col] = toBooleanOrUndefined(val)
        break
      default:
        if (val) obj[col] = val
    }
  })
  return obj
}

function mapRowToAssembly(row: string[], columns: string[], costDatabaseId: string): any {
  const obj: any = { costDatabaseId }
  columns.forEach((col, i) => {
    const val = row[i] || ''
    switch (col) {
      case 'materialCost':
      case 'laborCost':
      case 'equipmentCost':
      case 'laborHours':
      case 'crewSize':
        obj[col] = toNumberOrUndefined(val)
        break
      default:
        if (val) obj[col] = val
    }
  })
  // Compute unitCost from parts if not set
  const matCost = obj.materialCost || 0
  const labCost = obj.laborCost || 0
  const eqCost = obj.equipmentCost || 0
  obj.unitCost = matCost + labCost + eqCost
  // Default category to OTHER_ASSEMBLY if not a valid enum value
  if (!obj.category) obj.category = 'OTHER_ASSEMBLY'
  return obj
}

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const importTypeSchema = z.enum(['materials', 'labor', 'equipment', 'assemblies'])

const jsonImportSchema = z.object({
  costDatabaseId: z.string().uuid(),
  type: importTypeSchema,
  items: z.array(z.record(z.any())).min(1),
  overwrite: z.boolean().optional().default(false),
})

const costDatabaseCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  region: z.string().min(1),
  type: z.enum(['CUSTOM', 'IMPORTED']),
  version: z.string().min(1),
  source: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function costImportRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // POST /import/csv - Parse and import a cost book CSV
  // ========================================================================

  fastify.post('/import/csv', async (request, reply) => {
    try {
      const data = await request.file()
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' })
      }

      // Collect multipart fields
      const fields: Record<string, string> = {}
      if (data.fields) {
        for (const [key, field] of Object.entries(data.fields)) {
          if (field && typeof field === 'object' && 'value' in field) {
            fields[key] = (field as any).value
          }
        }
      }

      const type = fields.type as string
      if (!type || !['materials', 'labor', 'equipment', 'assemblies'].includes(type)) {
        return reply.code(400).send({ error: 'Invalid or missing type. Must be one of: materials, labor, equipment, assemblies' })
      }

      const overwrite = fields.overwrite === 'true'
      let costDatabaseId = fields.costDatabaseId

      // Read file content
      const chunks: Buffer[] = []
      for await (const chunk of data.file) {
        chunks.push(chunk)
      }
      const content = Buffer.concat(chunks).toString('utf-8')

      // Parse CSV
      const rows = parseCSV(content)
      if (rows.length < 2) {
        return reply.code(400).send({ error: 'CSV must contain a header row and at least one data row' })
      }

      // Skip header row
      const dataRows = rows.slice(1)
      const columns = COLUMN_MAPS[type]

      // Create cost database if none provided
      if (!costDatabaseId) {
        const fileName = data.filename || 'Imported Cost Book'
        const db = await (prisma as any).costDatabase.create({
          data: {
            name: fileName.replace(/\.csv$/i, ''),
            region: 'National',
            type: 'IMPORTED',
            version: '1.0',
            source: 'CSV Import',
          },
        })
        costDatabaseId = db.id
      }

      let imported = 0
      let skipped = 0
      const errors: string[] = []

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        const rowNum = i + 2 // +2 for 1-indexed + header

        try {
          let record: any

          switch (type) {
            case 'materials': {
              record = mapRowToMaterial(row, columns, costDatabaseId!)
              if (!record.name || record.unitCost === undefined) {
                skipped++
                errors.push(`Row ${rowNum}: Missing required field (name or unitCost)`)
                continue
              }
              if (overwrite && record.csiCode) {
                const existing = await (prisma as any).materialCost.findFirst({
                  where: { costDatabaseId, csiCode: record.csiCode, name: record.name },
                })
                if (existing) {
                  await (prisma as any).materialCost.update({
                    where: { id: existing.id },
                    data: record,
                  })
                  imported++
                  continue
                }
              }
              await (prisma as any).materialCost.create({ data: record })
              imported++
              break
            }

            case 'labor': {
              record = mapRowToLabor(row, columns, costDatabaseId!)
              if (!record.trade || record.totalRate === undefined) {
                skipped++
                errors.push(`Row ${rowNum}: Missing required field (trade or totalRate)`)
                continue
              }
              if (overwrite) {
                const existing = await (prisma as any).laborRate.findFirst({
                  where: { costDatabaseId, trade: record.trade, classification: record.classification || undefined },
                })
                if (existing) {
                  await (prisma as any).laborRate.update({
                    where: { id: existing.id },
                    data: record,
                  })
                  imported++
                  continue
                }
              }
              await (prisma as any).laborRate.create({ data: record })
              imported++
              break
            }

            case 'equipment': {
              record = mapRowToEquipment(row, columns, costDatabaseId!)
              if (!record.name || record.dailyRate === undefined) {
                skipped++
                errors.push(`Row ${rowNum}: Missing required field (name or dailyRate)`)
                continue
              }
              if (overwrite) {
                const existing = await (prisma as any).equipmentRate.findFirst({
                  where: { costDatabaseId, name: record.name, category: record.category },
                })
                if (existing) {
                  await (prisma as any).equipmentRate.update({
                    where: { id: existing.id },
                    data: record,
                  })
                  imported++
                  continue
                }
              }
              await (prisma as any).equipmentRate.create({ data: record })
              imported++
              break
            }

            case 'assemblies': {
              record = mapRowToAssembly(row, columns, costDatabaseId!)
              if (!record.name || !record.unit) {
                skipped++
                errors.push(`Row ${rowNum}: Missing required field (name or unit)`)
                continue
              }
              if (overwrite && record.csiCode) {
                const existing = await (prisma as any).assembly.findFirst({
                  where: { costDatabaseId, csiCode: record.csiCode, name: record.name },
                })
                if (existing) {
                  await (prisma as any).assembly.update({
                    where: { id: existing.id },
                    data: record,
                  })
                  imported++
                  continue
                }
              }
              await (prisma as any).assembly.create({ data: record })
              imported++
              break
            }
          }
        } catch (rowError: any) {
          skipped++
          errors.push(`Row ${rowNum}: ${rowError.message || 'Unknown error'}`)
        }
      }

      return reply.send({
        success: true,
        imported,
        skipped,
        errors,
        costDatabaseId,
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to import CSV') })
    }
  })

  // ========================================================================
  // POST /import/json - Bulk import from JSON
  // ========================================================================

  fastify.post(
    '/import/json',
    {
      preHandler: [validateBody(jsonImportSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof jsonImportSchema>
        const { costDatabaseId, type, items, overwrite } = body

        // Verify cost database exists
        const db = await (prisma as any).costDatabase.findUnique({
          where: { id: costDatabaseId },
        })
        if (!db) {
          return reply.code(404).send({ error: 'Cost database not found' })
        }

        let imported = 0
        let skipped = 0
        const errors: string[] = []

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const itemNum = i + 1

          try {
            switch (type) {
              case 'materials': {
                const data: any = { ...item, costDatabaseId }
                if (!data.name || data.unitCost === undefined) {
                  skipped++
                  errors.push(`Item ${itemNum}: Missing required field (name or unitCost)`)
                  continue
                }
                if (overwrite && data.csiCode) {
                  const existing = await (prisma as any).materialCost.findFirst({
                    where: { costDatabaseId, csiCode: data.csiCode, name: data.name },
                  })
                  if (existing) {
                    await (prisma as any).materialCost.update({
                      where: { id: existing.id },
                      data,
                    })
                    imported++
                    continue
                  }
                }
                await (prisma as any).materialCost.create({ data })
                imported++
                break
              }

              case 'labor': {
                const data: any = { ...item, costDatabaseId }
                if (!data.trade || data.totalRate === undefined) {
                  skipped++
                  errors.push(`Item ${itemNum}: Missing required field (trade or totalRate)`)
                  continue
                }
                if (overwrite) {
                  const existing = await (prisma as any).laborRate.findFirst({
                    where: { costDatabaseId, trade: data.trade, classification: data.classification || undefined },
                  })
                  if (existing) {
                    await (prisma as any).laborRate.update({
                      where: { id: existing.id },
                      data,
                    })
                    imported++
                    continue
                  }
                }
                await (prisma as any).laborRate.create({ data })
                imported++
                break
              }

              case 'equipment': {
                const data: any = { ...item, costDatabaseId }
                if (!data.name || data.dailyRate === undefined) {
                  skipped++
                  errors.push(`Item ${itemNum}: Missing required field (name or dailyRate)`)
                  continue
                }
                if (overwrite) {
                  const existing = await (prisma as any).equipmentRate.findFirst({
                    where: { costDatabaseId, name: data.name, category: data.category },
                  })
                  if (existing) {
                    await (prisma as any).equipmentRate.update({
                      where: { id: existing.id },
                      data,
                    })
                    imported++
                    continue
                  }
                }
                await (prisma as any).equipmentRate.create({ data })
                imported++
                break
              }

              case 'assemblies': {
                const data: any = { ...item, costDatabaseId }
                if (!data.name || !data.unit) {
                  skipped++
                  errors.push(`Item ${itemNum}: Missing required field (name or unit)`)
                  continue
                }
                // Compute unitCost if not provided
                if (data.unitCost === undefined) {
                  data.unitCost = (data.materialCost || 0) + (data.laborCost || 0) + (data.equipmentCost || 0)
                }
                if (!data.category) data.category = 'OTHER_ASSEMBLY'
                if (overwrite && data.csiCode) {
                  const existing = await (prisma as any).assembly.findFirst({
                    where: { costDatabaseId, csiCode: data.csiCode, name: data.name },
                  })
                  if (existing) {
                    await (prisma as any).assembly.update({
                      where: { id: existing.id },
                      data,
                    })
                    imported++
                    continue
                  }
                }
                await (prisma as any).assembly.create({ data })
                imported++
                break
              }
            }
          } catch (itemError: any) {
            skipped++
            errors.push(`Item ${itemNum}: ${itemError.message || 'Unknown error'}`)
          }
        }

        return reply.send({
          success: true,
          imported,
          skipped,
          errors,
          costDatabaseId,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to import JSON') })
      }
    }
  )

  // ========================================================================
  // GET /import/template/:type - Download CSV template
  // ========================================================================

  fastify.get('/import/template/:type', async (request, reply) => {
    try {
      const { type } = request.params as { type: string }

      if (!COLUMN_MAPS[type]) {
        return reply.code(400).send({ error: 'Invalid type. Must be one of: materials, labor, equipment, assemblies' })
      }

      const headers = COLUMN_MAPS[type].join(',')

      let exampleRow = ''
      switch (type) {
        case 'materials':
          exampleRow = '03.11.10,Portland Cement Type I/II,General purpose cement,Concrete,bag,12.50,11.00,14.00,1.05,BuilderSupply Co'
          break
        case 'labor':
          exampleRow = 'Electrician,Journeyman,Licensed journeyman electrician,65.00,32.50,97.50,1.5,National'
          break
        case 'equipment':
          exampleRow = 'Earthwork,Excavator 320,CAT 320 hydraulic excavator,850.00,3400.00,9500.00,true,45.00'
          break
        case 'assemblies':
          exampleRow = '04.22.10,8-inch CMU Wall,Standard 8-inch concrete masonry unit wall,CONCRETE_FLATWORK,sf,8.50,12.00,1.50,0.15,2'
          break
      }

      const csv = `${headers}\n${exampleRow}\n`

      reply.header('Content-Type', 'text/csv')
      reply.header('Content-Disposition', `attachment; filename="${type}-template.csv"`)
      return reply.send(csv)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to generate template') })
    }
  })

  // ========================================================================
  // POST /databases - Create a new cost database
  // ========================================================================

  fastify.post(
    '/databases',
    {
      preHandler: [validateBody(costDatabaseCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof costDatabaseCreateSchema>

        const db = await (prisma as any).costDatabase.create({
          data: {
            name: body.name,
            description: body.description,
            region: body.region,
            type: body.type,
            version: body.version,
            source: body.source,
          },
        })

        return reply.code(201).send({ data: db })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create cost database') })
      }
    }
  )

  // ========================================================================
  // GET /databases - List cost databases
  // ========================================================================

  fastify.get(
    '/databases',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            region: z.string().optional(),
            type: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; region?: string; type?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = { isActive: true }
        if (query.region) where.region = query.region
        if (query.type) where.type = query.type

        const [databases, total] = await Promise.all([
          (prisma as any).costDatabase.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              _count: {
                select: {
                  materials: true,
                  laborRates: true,
                  equipmentRates: true,
                  assemblies: true,
                },
              },
            },
          }),
          (prisma as any).costDatabase.count({ where }),
        ])

        return reply.send({
          data: databases,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list cost databases') })
      }
    }
  )
}
