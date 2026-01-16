import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const serviceRequestService = {
  /**
   * Create service request
   */
  async createServiceRequest(data: {
    orgId: string
    title: string
    description?: string
    category: string
    priority?: string
    dueDate?: Date
    userId: string
  }) {
    // Verify org exists and user has access
    const org = await prismaAny.org.findFirst({
      where: {
        id: data.orgId,
        members: {
          some: {
            userId: data.userId,
          },
        },
      },
    })

    if (!org) {
      throw new NotFoundError('Org', data.orgId)
    }

    // Create service request
    const request = await prismaAny.serviceRequest.create({
      data: {
        orgId: data.orgId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: (data.priority as any) || 'normal',
        status: 'open',
        dueDate: data.dueDate,
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Auto-assign PM based on workload (simplified - can be enhanced)
    // TODO: Implement PM assignment algorithm
    // For now, leave assignedTo as null (PM will claim from queue)

    // Log audit
    await auditService.recordAudit({
      action: 'SERVICE_REQUEST_CREATED',
      entityType: 'ServiceRequest',
      entityId: request.id,
      userId: data.userId,
      reason: `Service request created: ${data.title}`,
      after: {
        category: data.category,
        priority: data.priority || 'normal',
      },
    })

    // Emit event
    await eventService.recordEvent({
      type: 'SERVICE_REQUEST_CREATED',
      entityType: 'ServiceRequest',
      entityId: request.id,
      userId: data.userId,
      payload: {
        requestType: (data as any).requestType,
        planId: (data as any).planId,
      },
    })

    return request
  },

  /**
   * Get service request
   */
  async getServiceRequest(requestId: string, userId?: string) {
    const where: any = { id: requestId }

    // If userId provided, ensure user has access (via org membership)
    if (userId) {
      where.org = {
        members: {
          some: {
            userId: userId,
          },
        },
      }
    }

    const request = await prismaAny.serviceRequest.findFirst({
      where,
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            serviceRequest: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
      },
    })

    if (!request) {
      throw new NotFoundError('ServiceRequest', requestId)
    }

    return request
  },

  /**
   * List service requests
   */
  async listServiceRequests(filters?: {
    userId?: string
    planId?: string
    status?: string
    requestType?: string
    assignedTo?: string
  }) {
    const where: any = {}

    if (filters?.userId) {
      where.org = {
        members: {
          some: {
            userId: filters.userId,
          },
        },
      }
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.requestType) {
      where.category = filters.requestType
    }

    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo
    }

    const requests = await prismaAny.serviceRequest.findMany({
      where,
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return requests
  },

  /**
   * Update service request status
   */
  async updateServiceRequestStatus(requestId: string, data: {
    status: string
    assignedTo?: string
    userId: string
  }) {
    const request = await prismaAny.serviceRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new NotFoundError('ServiceRequest', requestId)
    }

    const updated = await prismaAny.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: data.status as any,
        assignedTo: data.assignedTo,
      },
      include: {
        plan: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'SERVICE_REQUEST_STATUS_UPDATED',
      entityType: 'ServiceRequest',
      entityId: requestId,
      userId: data.userId,
      reason: `Service request status updated to ${data.status}`,
      before: {
        status: request.status,
      },
      after: {
        status: data.status,
        assignedTo: data.assignedTo,
      },
    })

    // Emit event
    await eventService.recordEvent({
      type: 'SERVICE_REQUEST_STATUS_UPDATED',
      entityType: 'ServiceRequest',
      entityId: requestId,
      userId: data.userId,
      payload: {
        previousStatus: request.status,
        newStatus: data.status,
        assignedTo: data.assignedTo,
      },
    })

    return updated
  },

  /**
   * Assign service request to PM
   */
  async assignServiceRequest(requestId: string, data: {
    assignedTo: string
    userId: string
  }) {
    const request = await prismaAny.serviceRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new NotFoundError('ServiceRequest', requestId)
    }

    const updated = await prismaAny.serviceRequest.update({
      where: { id: requestId },
      data: {
        assignedTo: data.assignedTo,
        status: request.status === 'open' ? 'in_progress' : request.status,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'SERVICE_REQUEST_ASSIGNED',
      entityType: 'ServiceRequest',
      entityId: requestId,
      userId: data.userId,
      reason: `Service request assigned to PM: ${data.assignedTo}`,
      after: {
        assignedTo: data.assignedTo,
      },
    })

    return updated
  },

  /**
   * Create task for service request
   */
  async createTask(requestId: string, data: {
    title: string
    description?: string
    assignedTo?: string
    dueDate?: Date
    userId: string
  }) {
    const request = await prismaAny.serviceRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new NotFoundError('ServiceRequest', requestId)
    }

    const task = await prismaAny.task.create({
      data: {
        serviceRequestId: requestId,
        title: data.title,
        description: data.description,
        pmId: data.assignedTo || '',
        dueDate: data.dueDate,
        status: 'pending',
      },
      include: {
        serviceRequest: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task.id,
      userId: data.userId,
      reason: `Task created for service request: ${data.title}`,
      after: {
        title: data.title,
        requestId: requestId,
      },
    })

    return task
  },

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, data: {
    status: string
    userId: string
  }) {
    const task = await prismaAny.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      throw new NotFoundError('Task', taskId)
    }

    const updateData: any = {
      status: data.status as any,
    }

    if (data.status === 'completed') {
      updateData.completedAt = new Date()
    }

    const updated = await prismaAny.task.update({
      where: { id: taskId },
      data: updateData,
    })

    // Check if all tasks are completed, update request status
    if (data.status === 'completed') {
      const allTasks = await prismaAny.task.findMany({
        where: { serviceRequestId: task.serviceRequestId },
      })

      const allCompleted = allTasks.every((t: any) => t.status === 'completed' || t.id === taskId)

      if (allCompleted && allTasks.length > 0 && task.serviceRequestId) {
        await prismaAny.serviceRequest.update({
          where: { id: task.serviceRequestId },
          data: { status: 'completed', completedAt: new Date() },
        })
      }
    }

    // Log audit
    await auditService.recordAudit({
      action: 'TASK_STATUS_UPDATED',
      entityType: 'Task',
      entityId: taskId,
      userId: data.userId,
      reason: `Task status updated to ${data.status}`,
      before: {
        status: task.status,
      },
      after: {
        status: data.status,
      },
    })

    return updated
  },

  /**
   * List tasks
   */
  async listTasks(filters?: {
    requestId?: string
    assignedTo?: string
    status?: string
  }) {
    const where: any = {}

    if (filters?.requestId) {
      where.requestId = filters.requestId
    }

    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const tasks = await prismaAny.task.findMany({
      where,
      include: {
        serviceRequest: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return tasks
  },
}
