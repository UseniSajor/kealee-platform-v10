import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

interface MeetingListFilters {
  projectId: string
  type?: string
  dateFrom?: string
  dateTo?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

class MeetingService {
  async list(filters: MeetingListFilters) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 25
    const skip = (page - 1) * limit

    const where: any = { projectId: filters.projectId }

    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status
    if (filters.dateFrom || filters.dateTo) {
      where.date = {}
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo)
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { agenda: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prismaAny.meeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { attendees: true, actionItems: true } },
        },
      }),
      prismaAny.meeting.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getById(id: string) {
    const meeting = await prismaAny.meeting.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        attendees: { orderBy: { name: 'asc' } },
        actionItems: {
          orderBy: { createdAt: 'asc' },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!meeting) throw new NotFoundError('Meeting', id)
    return meeting
  }

  async create(data: {
    projectId: string
    title: string
    type?: string
    date: string
    startTime?: string
    endTime?: string
    location?: string
    agenda?: string
    recurringSchedule?: any
    createdById: string
  }) {
    const count = await prismaAny.meeting.count({
      where: { projectId: data.projectId },
    })

    return prismaAny.meeting.create({
      data: {
        projectId: data.projectId,
        meetingNumber: count + 1,
        title: data.title,
        type: data.type ?? 'PROGRESS',
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        agenda: data.agenda,
        status: 'SCHEDULED',
        createdById: data.createdById,
        recurringSchedule: data.recurringSchedule,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async update(id: string, data: {
    title?: string
    type?: string
    date?: string
    startTime?: string
    endTime?: string
    location?: string
    agenda?: string
    recurringSchedule?: any
  }) {
    const existing = await prismaAny.meeting.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Meeting', id)

    const updateData: any = { ...data }
    if (data.date) updateData.date = new Date(data.date)

    return prismaAny.meeting.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async cancel(id: string) {
    const existing = await prismaAny.meeting.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Meeting', id)

    return prismaAny.meeting.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
  }

  async addAttendees(meetingId: string, attendees: Array<{
    userId?: string
    name: string
    email?: string
    company?: string
    role?: string
  }>) {
    const meeting = await prismaAny.meeting.findUnique({ where: { id: meetingId } })
    if (!meeting) throw new NotFoundError('Meeting', meetingId)

    const created = await Promise.all(
      attendees.map((att) =>
        prismaAny.meetingAttendee.create({
          data: {
            meetingId,
            userId: att.userId,
            name: att.name,
            email: att.email,
            company: att.company,
            role: att.role,
          },
        })
      )
    )

    return created
  }

  async updateAttendee(attendeeId: string, data: {
    attended?: boolean
    signatureUrl?: string
    role?: string
  }) {
    const existing = await prismaAny.meetingAttendee.findUnique({ where: { id: attendeeId } })
    if (!existing) throw new NotFoundError('MeetingAttendee', attendeeId)

    return prismaAny.meetingAttendee.update({
      where: { id: attendeeId },
      data,
    })
  }

  async saveMinutes(id: string, minutes: string) {
    const existing = await prismaAny.meeting.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Meeting', id)

    return prismaAny.meeting.update({
      where: { id },
      data: { minutes },
    })
  }

  async addActionItem(meetingId: string, data: {
    description: string
    assignedToId?: string
    assignedToName?: string
    dueDate?: string
    priority?: string
  }) {
    const meeting = await prismaAny.meeting.findUnique({ where: { id: meetingId } })
    if (!meeting) throw new NotFoundError('Meeting', meetingId)

    return prismaAny.meetingActionItem.create({
      data: {
        meetingId,
        description: data.description,
        assignedToId: data.assignedToId,
        assignedToName: data.assignedToName,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority ?? 'MEDIUM',
        status: 'OPEN',
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async updateActionItem(itemId: string, data: {
    description?: string
    assignedToId?: string
    assignedToName?: string
    dueDate?: string
    priority?: string
    status?: string
    notes?: string
  }) {
    const existing = await prismaAny.meetingActionItem.findUnique({ where: { id: itemId } })
    if (!existing) throw new NotFoundError('MeetingActionItem', itemId)

    const updateData: any = { ...data }
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
    if (data.status === 'COMPLETED') updateData.completedAt = new Date()

    return prismaAny.meetingActionItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async complete(id: string) {
    const existing = await prismaAny.meeting.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Meeting', id)

    return prismaAny.meeting.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        attendees: true,
        actionItems: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })
  }

  async getOpenActionItems(projectId: string) {
    return prismaAny.meetingActionItem.findMany({
      where: {
        meeting: { projectId },
        status: { not: 'COMPLETED' },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        meeting: { select: { id: true, title: true, meetingNumber: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }
}

export const meetingService = new MeetingService()
