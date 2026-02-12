import { prismaAny } from '../../utils/prisma-helper'

class DrawingService {
  async list(filters: {
    projectId?: string
    discipline?: string
    status?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const { projectId, discipline, status, search, page = 1, limit = 25 } = filters
    const where: any = {
      OR: [
        { type: { contains: 'DRAWING' } },
        { metadata: { path: ['discipline'], not: undefined } },
      ],
    }

    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const [items, total] = await Promise.all([
      prismaAny.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prismaAny.document.count({ where }),
    ])

    // Post-filter by discipline from metadata if specified
    const filtered = discipline
      ? items.filter((doc: any) => {
          const meta = doc.metadata as any
          return meta && meta.discipline === discipline
        })
      : items

    return {
      items: filtered,
      total: discipline ? filtered.length : total,
      page,
      limit,
      totalPages: Math.ceil((discipline ? filtered.length : total) / limit),
    }
  }

  async getById(id: string) {
    return prismaAny.document.findUnique({
      where: { id },
    })
  }

  async upload(data: {
    projectId: string
    name: string
    description?: string
    fileUrl?: string
    format?: string
    size?: number
    discipline?: string
    drawingNumber?: string
    tags?: string[]
  }) {
    return prismaAny.document.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        description: data.description ?? null,
        type: 'DRAWING',
        category: 'DRAWINGS',
        fileUrl: data.fileUrl ?? null,
        format: data.format ?? 'PDF',
        size: data.size ?? null,
        status: 'DRAFT',
        version: 1,
        tags: data.tags ?? [],
        metadata: {
          discipline: data.discipline ?? null,
          drawingNumber: data.drawingNumber ?? null,
        },
      },
    })
  }

  async update(id: string, data: {
    name?: string
    description?: string
    discipline?: string
    drawingNumber?: string
    tags?: string[]
    status?: string
  }) {
    const existing = await prismaAny.document.findUnique({ where: { id } })
    if (!existing) return null

    const existingMeta = (existing.metadata as any) || {}
    const updateData: any = {}

    if (data.name) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.tags) updateData.tags = data.tags
    if (data.status) updateData.status = data.status
    if (data.discipline !== undefined || data.drawingNumber !== undefined) {
      updateData.metadata = {
        ...existingMeta,
        ...(data.discipline !== undefined && { discipline: data.discipline }),
        ...(data.drawingNumber !== undefined && { drawingNumber: data.drawingNumber }),
      }
    }

    return prismaAny.document.update({
      where: { id },
      data: updateData,
    })
  }

  async archive(id: string) {
    return prismaAny.document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  }

  async addRevision(id: string, data: {
    fileUrl?: string
    format?: string
    size?: number
    description?: string
  }) {
    const existing = await prismaAny.document.findUnique({ where: { id } })
    if (!existing) return null

    const existingMeta = (existing.metadata as any) || {}

    // Mark current as superseded
    await prismaAny.document.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        metadata: { ...existingMeta, superseded: true, supersededAt: new Date().toISOString() },
      },
    })

    // Create new revision
    return prismaAny.document.create({
      data: {
        projectId: existing.projectId,
        name: existing.name,
        description: data.description ?? existing.description,
        type: existing.type,
        category: existing.category,
        fileUrl: data.fileUrl ?? null,
        format: data.format ?? existing.format,
        size: data.size ?? null,
        status: 'DRAFT',
        version: existing.version + 1,
        tags: existing.tags ?? [],
        metadata: {
          ...existingMeta,
          previousVersionId: existing.id,
          superseded: false,
        },
      },
    })
  }

  async getRevisions(id: string) {
    const doc = await prismaAny.document.findUnique({ where: { id } })
    if (!doc) return []

    const meta = (doc.metadata as any) || {}
    const drawingNumber = meta.drawingNumber
    const discipline = meta.discipline

    // Find all documents with same drawing identity
    const allDocs = await prismaAny.document.findMany({
      where: {
        projectId: doc.projectId,
        type: 'DRAWING',
        name: doc.name,
      },
      orderBy: { version: 'desc' },
    })

    return allDocs
  }

  async getSets(projectId: string) {
    const drawings = await prismaAny.document.findMany({
      where: {
        projectId,
        OR: [
          { type: { contains: 'DRAWING' } },
          { metadata: { path: ['discipline'], not: undefined } },
        ],
      },
      orderBy: { name: 'asc' },
    })

    // Group by discipline from metadata
    const sets: Record<string, any[]> = {}
    for (const doc of drawings) {
      const meta = (doc.metadata as any) || {}
      const discipline = meta.discipline || 'UNCATEGORIZED'
      if (!sets[discipline]) sets[discipline] = []
      sets[discipline].push(doc)
    }

    return Object.entries(sets).map(([discipline, documents]) => ({
      discipline,
      count: documents.length,
      documents,
    }))
  }

  async getCurrent(projectId: string) {
    const drawings = await prismaAny.document.findMany({
      where: {
        projectId,
        OR: [
          { type: { contains: 'DRAWING' } },
          { metadata: { path: ['discipline'], not: undefined } },
        ],
        status: { not: 'ARCHIVED' },
      },
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
    })

    // Deduplicate to latest version per drawing name
    const latestByName: Record<string, any> = {}
    for (const doc of drawings) {
      if (!latestByName[doc.name] || doc.version > latestByName[doc.name].version) {
        latestByName[doc.name] = doc
      }
    }

    return Object.values(latestByName)
  }
}

export const drawingService = new DrawingService()
