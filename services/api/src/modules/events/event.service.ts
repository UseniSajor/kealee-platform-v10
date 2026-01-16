import { prisma } from '@kealee/database'

export interface CreateEventData {
  type: string
  entityType: string
  entityId: string
  userId?: string
  orgId?: string
  payload?: any
}

export class EventService {
  // Record an event (append-only)
  async recordEvent(data: CreateEventData) {
    const event = await prisma.event.create({
      data: {
        type: data.type,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        orgId: data.orgId,
        payload: data.payload || {},
      },
    })

    return event
  }

  // Get event by ID
  async getEventById(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    return event
  }

  // Get events with filtering
  async getEvents(filters: {
    type?: string
    entityType?: string
    entityId?: string
    userId?: string
    orgId?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }) {
    const page = filters.page || 1
    const limit = filters.limit || 50
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.entityType) {
      where.entityType = filters.entityType
    }

    if (filters.entityId) {
      where.entityId = filters.entityId
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.orgId) {
      where.orgId = filters.orgId
    }

    if (filters.startDate || filters.endDate) {
      where.occurredAt = {}
      if (filters.startDate) {
        where.occurredAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.occurredAt.lte = filters.endDate
      }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
      }),
      prisma.event.count({ where }),
    ])

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Get events for a specific entity
  async getEntityEvents(entityType: string, entityId: string, limit?: number) {
    const events = await prisma.event.findMany({
      where: {
        entityType,
        entityId,
      },
      take: limit || 100,
      orderBy: { occurredAt: 'desc' },
    })

    return events
  }

  // Get events for a user
  async getUserEvents(userId: string, limit?: number) {
    const events = await prisma.event.findMany({
      where: { userId },
      take: limit || 100,
      orderBy: { occurredAt: 'desc' },
    })

    return events
  }

  // Get events for an organization
  async getOrgEvents(orgId: string, limit?: number) {
    const events = await prisma.event.findMany({
      where: { orgId },
      take: limit || 100,
      orderBy: { occurredAt: 'desc' },
    })

    return events
  }

  // Get events by type
  async getEventsByType(type: string, limit?: number) {
    const events = await prisma.event.findMany({
      where: { type },
      take: limit || 100,
      orderBy: { occurredAt: 'desc' },
    })

    return events
  }

  // Get recent events (last N events)
  async getRecentEvents(limit: number = 50) {
    const events = await prisma.event.findMany({
      take: limit,
      orderBy: { occurredAt: 'desc' },
    })

    return events
  }

  // Count events by type
  async countEventsByType(type: string) {
    const count = await prisma.event.count({
      where: { type },
    })

    return count
  }

  // Get event statistics
  async getEventStats(filters?: {
    orgId?: string
    startDate?: Date
    endDate?: Date
  }) {
    const where: any = {}

    if (filters?.orgId) {
      where.orgId = filters.orgId
    }

    if (filters?.startDate || filters?.endDate) {
      where.occurredAt = {}
      if (filters.startDate) {
        where.occurredAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.occurredAt.lte = filters.endDate
      }
    }

    const [totalEvents, eventsByType] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.groupBy({
        by: ['type'],
        where,
        _count: {
          type: true,
        },
        orderBy: {
          _count: {
            type: 'desc',
          },
        },
        take: 10,
      }),
    ])

    return {
      totalEvents,
      eventsByType: eventsByType.map((e) => ({
        type: e.type,
        count: e._count.type,
      })),
    }
  }
}

export const eventService = new EventService()

// Helper function to easily log events
export async function logEvent(data: CreateEventData) {
  return eventService.recordEvent(data)
}
