import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

class SafetyService {
  // ── Incidents ──

  async listIncidents(filters: {
    projectId: string
    severity?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 25
    const skip = (page - 1) * limit

    const where: any = { projectId: filters.projectId }

    if (filters.severity) where.severity = filters.severity
    if (filters.status) where.status = filters.status
    if (filters.dateFrom || filters.dateTo) {
      where.date = {}
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo)
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prismaAny.safetyIncident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prismaAny.safetyIncident.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getIncidentById(id: string) {
    const incident = await prismaAny.safetyIncident.findUnique({
      where: { id },
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (!incident) throw new NotFoundError('SafetyIncident', id)
    return incident
  }

  async createIncident(data: {
    projectId: string
    title: string
    description: string
    date: string
    time?: string
    location?: string
    severity?: string
    witnesses?: string[]
    injuredParty?: string
    injuryDescription?: string
    immediateAction?: string
    photos?: string[]
    oshaRecordable?: boolean
    notifiedParties?: string[]
    reportedById: string
  }) {
    const count = await prismaAny.safetyIncident.count({
      where: { projectId: data.projectId },
    })

    return prismaAny.safetyIncident.create({
      data: {
        projectId: data.projectId,
        incidentNumber: count + 1,
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        time: data.time,
        location: data.location,
        severity: data.severity ?? 'NEAR_MISS',
        status: 'REPORTED',
        reportedById: data.reportedById,
        witnesses: data.witnesses ?? [],
        injuredParty: data.injuredParty,
        injuryDescription: data.injuryDescription,
        immediateAction: data.immediateAction,
        photos: data.photos ?? [],
        oshaRecordable: data.oshaRecordable ?? false,
        notifiedParties: data.notifiedParties ?? [],
      },
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async updateIncident(id: string, data: {
    title?: string
    description?: string
    severity?: string
    location?: string
    witnesses?: string[]
    injuredParty?: string
    injuryDescription?: string
    immediateAction?: string
    photos?: string[]
    oshaRecordable?: boolean
    notifiedParties?: string[]
  }) {
    const existing = await prismaAny.safetyIncident.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('SafetyIncident', id)

    return prismaAny.safetyIncident.update({
      where: { id },
      data,
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async investigateIncident(id: string, data: { rootCause?: string; correctiveAction?: string }) {
    const existing = await prismaAny.safetyIncident.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('SafetyIncident', id)

    return prismaAny.safetyIncident.update({
      where: { id },
      data: { ...data, status: 'INVESTIGATING' },
    })
  }

  async addCorrectiveAction(id: string, data: { correctiveAction: string; correctiveActionDueDate?: string }) {
    const existing = await prismaAny.safetyIncident.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('SafetyIncident', id)

    return prismaAny.safetyIncident.update({
      where: { id },
      data: {
        correctiveAction: data.correctiveAction,
        correctiveActionDueDate: data.correctiveActionDueDate ? new Date(data.correctiveActionDueDate) : undefined,
        status: 'CORRECTIVE_ACTION',
      },
    })
  }

  async closeIncident(id: string) {
    const existing = await prismaAny.safetyIncident.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('SafetyIncident', id)

    return prismaAny.safetyIncident.update({
      where: { id },
      data: { status: 'CLOSED' },
    })
  }

  async getIncidentStats(projectId: string) {
    const [total, nearMiss, firstAid, medical, lostTime, oshaRecordable] = await Promise.all([
      prismaAny.safetyIncident.count({ where: { projectId } }),
      prismaAny.safetyIncident.count({ where: { projectId, severity: 'NEAR_MISS' } }),
      prismaAny.safetyIncident.count({ where: { projectId, severity: 'FIRST_AID' } }),
      prismaAny.safetyIncident.count({ where: { projectId, severity: 'MEDICAL' } }),
      prismaAny.safetyIncident.count({ where: { projectId, severity: 'LOST_TIME' } }),
      prismaAny.safetyIncident.count({ where: { projectId, oshaRecordable: true } }),
    ])
    return { total, nearMiss, firstAid, medical, lostTime, oshaRecordable }
  }

  // ── Toolbox Talks ──

  async listToolboxTalks(filters: {
    projectId: string
    dateFrom?: string
    dateTo?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 25
    const skip = (page - 1) * limit

    const where: any = { projectId: filters.projectId }
    if (filters.dateFrom || filters.dateTo) {
      where.date = {}
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo)
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { topic: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prismaAny.toolboxTalk.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { attendees: true },
      }),
      prismaAny.toolboxTalk.count({ where }),
    ])

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async getToolboxTalkById(id: string) {
    const talk = await prismaAny.toolboxTalk.findUnique({
      where: { id },
      include: { attendees: true },
    })
    if (!talk) throw new NotFoundError('ToolboxTalk', id)
    return talk
  }

  async createToolboxTalk(data: {
    projectId: string
    title: string
    topic?: string
    content?: string
    presenterId?: string
    presenterName?: string
    date: string
    duration?: number
    weatherConditions?: string
  }) {
    return prismaAny.toolboxTalk.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        topic: data.topic,
        content: data.content,
        presenterId: data.presenterId,
        presenterName: data.presenterName,
        date: new Date(data.date),
        duration: data.duration,
        weatherConditions: data.weatherConditions,
      },
      include: { attendees: true },
    })
  }

  async updateToolboxTalk(id: string, data: Record<string, any>) {
    const existing = await prismaAny.toolboxTalk.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('ToolboxTalk', id)

    if (data.date) data.date = new Date(data.date)
    return prismaAny.toolboxTalk.update({ where: { id }, data, include: { attendees: true } })
  }

  async recordAttendance(toolboxTalkId: string, attendees: Array<{ name: string; company?: string; trade?: string }>) {
    const existing = await prismaAny.toolboxTalk.findUnique({ where: { id: toolboxTalkId } })
    if (!existing) throw new NotFoundError('ToolboxTalk', toolboxTalkId)

    const records = await Promise.all(
      attendees.map((a) =>
        prismaAny.toolboxTalkAttendee.create({
          data: {
            toolboxTalkId,
            name: a.name,
            company: a.company,
            trade: a.trade,
            signedAt: new Date(),
          },
        })
      )
    )
    return records
  }

  async getSafetyDashboard(projectId: string) {
    const [incidentStats, recentIncidents, recentTalks, totalTalks] = await Promise.all([
      this.getIncidentStats(projectId),
      prismaAny.safetyIncident.findMany({
        where: { projectId },
        take: 5,
        orderBy: { date: 'desc' },
      }),
      prismaAny.toolboxTalk.findMany({
        where: { projectId },
        take: 5,
        orderBy: { date: 'desc' },
        include: { attendees: true },
      }),
      prismaAny.toolboxTalk.count({ where: { projectId } }),
    ])

    return { incidentStats, recentIncidents, recentTalks, totalTalks }
  }
}

export const safetyService = new SafetyService()
