/**
 * PM Documents Service
 * Handles document management, versioning, distribution, and templates
 */
import { prismaAny } from '../../utils/prisma-helper'

class PmDocumentsService {
  async list(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.type) where.type = params.type.toUpperCase()
    if (params.category) where.category = params.category
    if (params.status) where.status = params.status.toUpperCase()
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    const page = params.page || 1
    const limit = params.limit || 50
    const [documents, total] = await Promise.all([
      prismaAny.document.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prismaAny.document.count({ where }),
    ])
    return { documents, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async getById(id: string) {
    const document = await prismaAny.document.findUnique({
      where: { id },
      include: { distributions: true },
    })
    if (!document) throw new Error('Document not found')
    return document
  }

  async create(data: any, userId: string) {
    return prismaAny.document.create({
      data: {
        projectId: data.projectId, type: data.type ? data.type.toUpperCase() : 'GENERAL',
        title: data.title, description: data.description || null,
        category: data.category || null, fileUrl: data.fileUrl || null,
        fileName: data.fileName || null, fileSize: data.fileSize || null,
        mimeType: data.mimeType || null, version: 1,
        status: 'ACTIVE', createdById: userId, metadata: data.metadata || {},
      },
    })
  }

  async update(id: string, updates: any) {
    const existing = await prismaAny.document.findUnique({ where: { id } })
    if (!existing) throw new Error('Document not found')
    return prismaAny.document.update({
      where: { id },
      data: {
        ...(updates.type && { type: updates.type.toUpperCase() }),
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.status && { status: updates.status.toUpperCase() }),
        ...(updates.metadata && { metadata: updates.metadata }),
      },
    })
  }

  async softDelete(id: string) {
    const existing = await prismaAny.document.findUnique({ where: { id } })
    if (!existing) throw new Error('Document not found')
    return prismaAny.document.update({ where: { id }, data: { status: 'ARCHIVED' } })
  }

  async addVersion(id: string, data: any, userId: string) {
    const existing = await prismaAny.document.findUnique({ where: { id } })
    if (!existing) throw new Error('Document not found')
    const newVersion = (existing.version || 1) + 1
    await prismaAny.document.update({
      where: { id },
      data: { version: newVersion, fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize, mimeType: data.mimeType, updatedAt: new Date() },
    })
    return { documentId: id, version: newVersion, fileUrl: data.fileUrl, fileName: data.fileName }
  }

  async getVersions(id: string) {
    const document = await prismaAny.document.findUnique({ where: { id } })
    if (!document) throw new Error('Document not found')
    return { documentId: id, currentVersion: document.version, versions: [{ version: document.version, fileUrl: document.fileUrl, fileName: document.fileName, updatedAt: document.updatedAt }] }
  }

  async distribute(id: string, data: any, userId: string) {
    const existing = await prismaAny.document.findUnique({ where: { id } })
    if (!existing) throw new Error('Document not found')
    const distributions = await Promise.all(
      (data.recipients || []).map((recipientId: string) =>
        prismaAny.documentDistribution.create({
          data: { documentId: id, recipientId, distributedBy: userId, distributedAt: new Date(), method: data.method || 'EMAIL' },
        })
      )
    )
    return { documentId: id, distributions }
  }

  async search(params: any) {
    return this.list({ ...params, search: params.q || params.search })
  }

  async getTemplates(params: any) {
    const where: any = { isTemplate: true }
    if (params.category) where.category = params.category
    if (params.type) where.type = params.type.toUpperCase()
    const templates = await prismaAny.document.findMany({ where, orderBy: { title: 'asc' } })
    return { templates }
  }
}

export const pmDocumentsService = new PmDocumentsService()
