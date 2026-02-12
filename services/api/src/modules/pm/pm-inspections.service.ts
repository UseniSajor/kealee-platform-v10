/**
 * PM Inspections Service
 */
import { prismaAny } from '../../utils/prisma-helper'

class PmInspectionsService {
  async list(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.type) where.type = params.type.toUpperCase()
    if (params.status) where.status = params.status.toUpperCase()
    if (params.result) where.result = params.result.toUpperCase()
    if (params.startDate || params.endDate) {
      where.scheduledDate = {}
      if (params.startDate) where.scheduledDate.gte = new Date(params.startDate)
      if (params.endDate) where.scheduledDate.lte = new Date(params.endDate)
    }
    const page = params.page || 1
    const limit = params.limit || 50
    const [inspections, total] = await Promise.all([
      prismaAny.inspection.findMany({ where, include: { findings: true }, orderBy: { scheduledDate: 'asc' }, skip: (page - 1) * limit, take: limit }),
      prismaAny.inspection.count({ where }),
    ])
    return { inspections, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }
  async getById(id: string) {
    const r = await prismaAny.inspection.findUnique({ where: { id }, include: { findings: { orderBy: { createdAt: 'desc' } } } })
    if (!r) throw new Error('Inspection not found')
    return r
  }
  async schedule(data: any, userId: string) {
    return prismaAny.inspection.create({ data: { projectId: data.projectId, type: data.type.toUpperCase(), title: data.title, description: data.description, scheduledDate: new Date(data.scheduledDate), scheduledTime: data.scheduledTime || null, inspectorId: data.inspectorId || null, inspectorName: data.inspectorName || null, location: data.location || null, checklistItems: data.checklistItems || [], preparationItems: data.preparationItems || [], status: 'SCHEDULED', createdById: userId, metadata: data.metadata || {} }, include: { findings: true } })
  }
  async update(id: string, u: any) {
    const e = await prismaAny.inspection.findUnique({ where: { id } })
    if (!e) throw new Error('Inspection not found')
    return prismaAny.inspection.update({ where: { id }, data: { ...(u.type && { type: u.type.toUpperCase() }), ...(u.title && { title: u.title }), ...(u.description !== undefined && { description: u.description }), ...(u.scheduledDate && { scheduledDate: new Date(u.scheduledDate) }), ...(u.scheduledTime !== undefined && { scheduledTime: u.scheduledTime }), ...(u.inspectorId !== undefined && { inspectorId: u.inspectorId }), ...(u.inspectorName !== undefined && { inspectorName: u.inspectorName }), ...(u.location !== undefined && { location: u.location }), ...(u.checklistItems && { checklistItems: u.checklistItems }), ...(u.preparationItems && { preparationItems: u.preparationItems }), ...(u.metadata && { metadata: u.metadata }) }, include: { findings: true } })
  }
  async conduct(id: string, data: any, userId: string) {
    const e = await prismaAny.inspection.findUnique({ where: { id } })
    if (!e) throw new Error('Inspection not found')
    if (e.status === 'COMPLETED') throw new Error('Already conducted')
    return prismaAny.inspection.update({ where: { id }, data: { result: data.result.toUpperCase(), notes: data.notes || null, conductedAt: data.conductedAt ? new Date(data.conductedAt) : new Date(), conductedBy: data.conductedBy || userId, checklistResults: data.checklistResults || [], status: 'COMPLETED' }, include: { findings: true } })
  }
  async addFinding(inspectionId: string, data: any, userId: string) {
    const e = await prismaAny.inspection.findUnique({ where: { id: inspectionId } })
    if (!e) throw new Error('Inspection not found')
    return prismaAny.inspectionFinding.create({ data: { inspectionId, type: data.type.toUpperCase(), severity: data.severity.toUpperCase(), title: data.title, description: data.description || null, location: data.location || null, photoUrls: data.photoUrls || [], correctionRequired: data.correctionRequired || false, correctionDeadline: data.correctionDeadline ? new Date(data.correctionDeadline) : null, assignedTo: data.assignedTo || null, status: 'OPEN', createdById: userId, metadata: data.metadata || {} } })
  }
  async updateFinding(inspectionId: string, findingId: string, u: any) {
    const f = await prismaAny.inspectionFinding.findFirst({ where: { id: findingId, inspectionId } })
    if (!f) throw new Error('Finding not found')
    return prismaAny.inspectionFinding.update({ where: { id: findingId }, data: { ...(u.type && { type: u.type.toUpperCase() }), ...(u.severity && { severity: u.severity.toUpperCase() }), ...(u.title && { title: u.title }), ...(u.description !== undefined && { description: u.description }), ...(u.location !== undefined && { location: u.location }), ...(u.photoUrls && { photoUrls: u.photoUrls }), ...(u.correctionRequired !== undefined && { correctionRequired: u.correctionRequired }), ...(u.assignedTo !== undefined && { assignedTo: u.assignedTo }) } })
  }
  async resolveFinding(inspectionId: string, findingId: string, resolution: any, userId: string) {
    const f = await prismaAny.inspectionFinding.findFirst({ where: { id: findingId, inspectionId } })
    if (!f) throw new Error('Finding not found')
    if (f.status === 'RESOLVED') throw new Error('Already resolved')
    return prismaAny.inspectionFinding.update({ where: { id: findingId }, data: { status: 'RESOLVED', resolutionNotes: resolution.notes || null, resolvedBy: resolution.resolvedBy || userId, resolvedAt: new Date() } })
  }
  async getStats(projectId: string) {
    const ins = await prismaAny.inspection.findMany({ where: { projectId }, include: { findings: true } })
    const t = ins.length, s = ins.filter((i: any) => i.status === 'SCHEDULED').length, c = ins.filter((i: any) => i.status === 'COMPLETED').length
    const p = ins.filter((i: any) => i.result === 'PASS').length, fl = ins.filter((i: any) => i.result === 'FAIL').length
    const af = ins.flatMap((i: any) => i.findings || [])
    return { total: t, scheduled: s, completed: c, passed: p, failed: fl, conditional: ins.filter((i: any) => i.result === 'CONDITIONAL').length, passRate: c > 0 ? (p / c) * 100 : 0, findings: { total: af.length, open: af.filter((f: any) => f.status === 'OPEN').length, resolved: af.filter((f: any) => f.status === 'RESOLVED').length } }
  }
}
export const pmInspectionsService = new PmInspectionsService()
