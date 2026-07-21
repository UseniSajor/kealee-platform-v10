/**
 * PM Service — Consolidated project management operations
 *
 * Covers: Schedules, Milestones, RFIs, Submittals, Change Orders,
 * Inspections, Daily Logs, Documents, Drawings, Meetings, Budget
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Shared types ──────────────────────────────────────────────────────

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function paginate(page: number, limit: number, total: number): Pagination {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

const userSelect = { id: true, name: true, email: true } as const;

// =====================================================================
// SCHEDULE
// =====================================================================

export const scheduleService = {
  async list(params: {
    projectId: string;
    status?: string;
    assignedTo?: string;
    trade?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { projectId: params.projectId };
    if (params.status) where.status = params.status.toUpperCase();
    if (params.assignedTo) where.assignedTo = params.assignedTo;
    if (params.trade) where.trade = params.trade;
    if (params.startDate || params.endDate) {
      where.startDate = {};
      if (params.startDate) where.startDate.gte = new Date(params.startDate);
      if (params.endDate) where.startDate.lte = new Date(params.endDate);
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 50;

    const [items, total] = await Promise.all([
      prisma.scheduleItem.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scheduleItem.count({ where }),
    ]);

    return { items, pagination: paginate(page, limit, total) };
  },

  async getById(id: string) {
    const item = await prisma.scheduleItem.findUnique({ where: { id } });
    if (!item) throw new Error('Schedule item not found');
    return item;
  },

  async create(
    data: {
      projectId: string;
      title: string;
      description?: string;
      startDate: string;
      endDate?: string;
      duration?: number;
      trade?: string;
      assignedTo?: string;
      dependencies?: string[];
      milestone?: boolean;
      criticalPath?: boolean;
      progress?: number;
      status?: string;
      priority?: string;
      color?: string;
      metadata?: Record<string, any>;
    },
    userId: string
  ) {
    return prisma.scheduleItem.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description ?? null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        duration: data.duration ?? null,
        trade: data.trade ?? null,
        assignedTo: data.assignedTo ?? null,
        dependencies: data.dependencies ?? [],
        milestone: data.milestone ?? false,
        criticalPath: data.criticalPath ?? false,
        progress: data.progress ?? 0,
        status: data.status ?? 'NOT_STARTED',
        priority: data.priority ?? 'MEDIUM',
        color: data.color ?? null,
        createdById: userId,
        metadata: data.metadata ?? {},
      },
    });
  },

  async update(id: string, updates: Record<string, any>) {
    const existing = await prisma.scheduleItem.findUnique({ where: { id } });
    if (!existing) throw new Error('Schedule item not found');

    return prisma.scheduleItem.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.startDate && { startDate: new Date(updates.startDate) }),
        ...(updates.endDate !== undefined && {
          endDate: updates.endDate ? new Date(updates.endDate) : null,
        }),
        ...(updates.duration !== undefined && { duration: updates.duration }),
        ...(updates.trade !== undefined && { trade: updates.trade }),
        ...(updates.assignedTo !== undefined && { assignedTo: updates.assignedTo }),
        ...(updates.dependencies && { dependencies: updates.dependencies }),
        ...(updates.milestone !== undefined && { milestone: updates.milestone }),
        ...(updates.criticalPath !== undefined && { criticalPath: updates.criticalPath }),
        ...(updates.progress !== undefined && { progress: updates.progress }),
        ...(updates.status && { status: updates.status.toUpperCase() }),
        ...(updates.priority && { priority: updates.priority.toUpperCase() }),
        ...(updates.color !== undefined && { color: updates.color }),
        ...(updates.metadata && { metadata: updates.metadata }),
      },
    });
  },

  async delete(id: string) {
    const existing = await prisma.scheduleItem.findUnique({ where: { id } });
    if (!existing) throw new Error('Schedule item not found');
    await prisma.scheduleItem.delete({ where: { id } });
    return { success: true };
  },

  async updateProgress(id: string, progress: number) {
    const existing = await prisma.scheduleItem.findUnique({ where: { id } });
    if (!existing) throw new Error('Schedule item not found');
    const status =
      progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    return prisma.scheduleItem.update({ where: { id }, data: { progress, status } });
  },

  async bulkUpdate(items: Array<{ id: string; updates: Record<string, any> }>) {
    const results = await Promise.all(
      items.map(({ id, updates }) => scheduleService.update(id, updates))
    );
    return { updated: results.length, items: results };
  },

  async getGanttData(projectId: string) {
    const items = await prisma.scheduleItem.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
      take: 500,
    });
    return {
      tasks: items.map((item: any) => ({
        id: item.id,
        name: item.title,
        start: item.startDate,
        end: item.endDate,
        progress: item.progress ?? 0,
        dependencies: item.dependencies ?? [],
        milestone: item.milestone ?? false,
        criticalPath: item.criticalPath ?? false,
        color: item.color,
        trade: item.trade,
        assignedTo: item.assignedTo,
        status: item.status,
      })),
    };
  },

  async getCriticalPath(projectId: string) {
    const items = await prisma.scheduleItem.findMany({
      where: { projectId, criticalPath: true },
      orderBy: { startDate: 'asc' },
    });
    return { items };
  },
};

// =====================================================================
// MILESTONES
// =====================================================================

export const milestoneService = {
  async list(projectId: string) {
    const milestones = await prisma.scheduleItem.findMany({
      where: { projectId, milestone: true },
      orderBy: { startDate: 'asc' },
    });
    return { milestones };
  },

  async create(
    data: {
      projectId: string;
      title: string;
      description?: string;
      startDate: string;
      endDate?: string;
      priority?: string;
      color?: string;
      metadata?: Record<string, any>;
    },
    userId: string
  ) {
    return prisma.scheduleItem.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description ?? null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        milestone: true,
        progress: 0,
        status: 'NOT_STARTED',
        priority: data.priority ?? 'HIGH',
        color: data.color ?? null,
        createdById: userId,
        metadata: data.metadata ?? {},
      },
    });
  },

  async update(id: string, updates: Record<string, any>) {
    return scheduleService.update(id, updates);
  },

  async delete(id: string) {
    return scheduleService.delete(id);
  },
};

// =====================================================================
// RFIs
// =====================================================================

export const rfiService = {
  async list(filters: {
    projectId: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: any = {
      projectId: filters.projectId,
      status: { not: 'VOID' },
    };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedToId = filters.assignedTo;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { question: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      (prisma as any).rFI.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: userSelect },
          assignedTo: { select: userSelect },
          _count: { select: { responses: true } },
        },
      }),
      (prisma as any).rFI.count({ where }),
    ]);

    return { data, pagination: paginate(page, limit, total) };
  },

  async getById(id: string) {
    const rfi = await (prisma as any).rFI.findUnique({
      where: { id },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
        closedBy: { select: userSelect },
        responses: {
          orderBy: { createdAt: 'asc' },
          include: { responder: { select: userSelect } },
        },
      },
    });
    if (!rfi) throw new Error('RFI not found');
    return rfi;
  },

  async create(data: {
    projectId: string;
    subject: string;
    question: string;
    priority?: string;
    assignedToId?: string;
    dueDate?: string;
    costImpact?: boolean;
    scheduleImpact?: boolean;
    drawingRef?: string;
    specSection?: string;
    distributionList?: string[];
    createdById: string;
  }) {
    const count = await (prisma as any).rFI.count({
      where: { projectId: data.projectId },
    });

    return (prisma as any).rFI.create({
      data: {
        projectId: data.projectId,
        rfiNumber: count + 1,
        subject: data.subject,
        question: data.question,
        status: 'DRAFT',
        priority: data.priority ?? 'MEDIUM',
        createdById: data.createdById,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        costImpact: data.costImpact ?? false,
        scheduleImpact: data.scheduleImpact ?? false,
        drawingRef: data.drawingRef,
        specSection: data.specSection,
        distributionList: data.distributionList ?? [],
      },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  },

  async update(
    id: string,
    data: {
      subject?: string;
      question?: string;
      priority?: string;
      status?: string;
      assignedToId?: string;
      dueDate?: string;
      costImpact?: boolean;
      scheduleImpact?: boolean;
      drawingRef?: string;
      specSection?: string;
      distributionList?: string[];
    }
  ) {
    const existing = await (prisma as any).rFI.findUnique({ where: { id } });
    if (!existing) throw new Error('RFI not found');

    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    return (prisma as any).rFI.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  },

  async softDelete(id: string) {
    const existing = await (prisma as any).rFI.findUnique({ where: { id } });
    if (!existing) throw new Error('RFI not found');
    return (prisma as any).rFI.update({
      where: { id },
      data: { status: 'VOID' },
    });
  },

  async addResponse(data: {
    rfiId: string;
    responderId: string;
    response: string;
    isOfficial?: boolean;
    attachmentIds?: string[];
  }) {
    const rfi = await (prisma as any).rFI.findUnique({ where: { id: data.rfiId } });
    if (!rfi) throw new Error('RFI not found');

    const responseRecord = await (prisma as any).rFIResponse.create({
      data: {
        rfiId: data.rfiId,
        responderId: data.responderId,
        response: data.response,
        isOfficial: data.isOfficial ?? false,
        attachmentIds: data.attachmentIds ?? [],
      },
      include: { responder: { select: userSelect } },
    });

    // Auto-transition to ANSWERED when first response arrives on OPEN RFI
    if (rfi.status === 'OPEN') {
      await (prisma as any).rFI.update({
        where: { id: data.rfiId },
        data: { status: 'ANSWERED' },
      });
    }

    return responseRecord;
  },

  async close(id: string, closedById: string) {
    const existing = await (prisma as any).rFI.findUnique({ where: { id } });
    if (!existing) throw new Error('RFI not found');

    return (prisma as any).rFI.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedById },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
        closedBy: { select: userSelect },
      },
    });
  },

  async reopen(id: string) {
    const existing = await (prisma as any).rFI.findUnique({ where: { id } });
    if (!existing) throw new Error('RFI not found');

    return (prisma as any).rFI.update({
      where: { id },
      data: { status: 'OPEN', closedAt: null, closedById: null },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  },

  async getStats(projectId: string) {
    const now = new Date();
    const [total, open, closed, overdue] = await Promise.all([
      (prisma as any).rFI.count({ where: { projectId, status: { not: 'VOID' } } }),
      (prisma as any).rFI.count({ where: { projectId, status: 'OPEN' } }),
      (prisma as any).rFI.count({ where: { projectId, status: 'CLOSED' } }),
      (prisma as any).rFI.count({
        where: { projectId, status: { in: ['OPEN', 'DRAFT'] }, dueDate: { lt: now } },
      }),
    ]);
    return { total, open, closed, overdue };
  },
};

// =====================================================================
// SUBMITTALS
// =====================================================================

export const submittalService = {
  async list(filters: {
    projectId: string;
    status?: string;
    type?: string;
    assignedTo?: string;
    specSection?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: any = { projectId: filters.projectId };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.assignedTo) where.assignedToId = filters.assignedTo;
    if (filters.specSection) where.specSection = filters.specSection;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      (prisma as any).submittal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: userSelect },
          assignedTo: { select: userSelect },
          _count: { select: { reviews: true } },
        },
      }),
      (prisma as any).submittal.count({ where }),
    ]);

    return { data, pagination: paginate(page, limit, total) };
  },

  async getById(id: string) {
    const submittal = await (prisma as any).submittal.findUnique({
      where: { id },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { reviewer: { select: userSelect } },
        },
      },
    });
    if (!submittal) throw new Error('Submittal not found');
    return submittal;
  },

  async create(data: {
    projectId: string;
    title: string;
    description?: string;
    type?: string;
    specSection?: string;
    assignedToId?: string;
    dueDate?: string;
    contractorId?: string;
    subcontractorName?: string;
    copies?: number;
    remarks?: string;
    createdById: string;
  }) {
    const count = await (prisma as any).submittal.count({
      where: { projectId: data.projectId },
    });

    return (prisma as any).submittal.create({
      data: {
        projectId: data.projectId,
        submittalNumber: count + 1,
        title: data.title,
        description: data.description,
        type: data.type ?? 'PRODUCT_DATA',
        status: 'DRAFT',
        specSection: data.specSection,
        createdById: data.createdById,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        contractorId: data.contractorId,
        subcontractorName: data.subcontractorName,
        copies: data.copies ?? 1,
        remarks: data.remarks,
      },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      type?: string;
      specSection?: string;
      assignedToId?: string;
      dueDate?: string;
      contractorId?: string;
      subcontractorName?: string;
      copies?: number;
      remarks?: string;
    }
  ) {
    const existing = await (prisma as any).submittal.findUnique({ where: { id } });
    if (!existing) throw new Error('Submittal not found');

    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    return (prisma as any).submittal.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  },

  async softDelete(id: string) {
    const existing = await (prisma as any).submittal.findUnique({ where: { id } });
    if (!existing) throw new Error('Submittal not found');
    return (prisma as any).submittal.update({
      where: { id },
      data: { status: 'VOID' },
    });
  },

  async submit(id: string) {
    const existing = await (prisma as any).submittal.findUnique({ where: { id } });
    if (!existing) throw new Error('Submittal not found');

    return (prisma as any).submittal.update({
      where: { id },
      data: { status: 'SUBMITTED', receivedDate: new Date() },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  },

  async addReview(data: {
    submittalId: string;
    reviewerId: string;
    status: string;
    comments?: string;
    stampUrl?: string;
  }) {
    const submittal = await (prisma as any).submittal.findUnique({
      where: { id: data.submittalId },
    });
    if (!submittal) throw new Error('Submittal not found');

    const review = await (prisma as any).submittalReview.create({
      data: {
        submittalId: data.submittalId,
        reviewerId: data.reviewerId,
        status: data.status,
        comments: data.comments,
        stampUrl: data.stampUrl,
        reviewedAt: new Date(),
      },
      include: { reviewer: { select: userSelect } },
    });

    // Update submittal status based on review outcome
    const updateData: any = { status: data.status };
    if (data.status === 'APPROVED' || data.status === 'APPROVED_AS_NOTED') {
      updateData.approvedDate = new Date();
    }

    await (prisma as any).submittal.update({
      where: { id: data.submittalId },
      data: updateData,
    });

    return review;
  },

  async resubmit(id: string) {
    const existing = await (prisma as any).submittal.findUnique({ where: { id } });
    if (!existing) throw new Error('Submittal not found');

    return (prisma as any).submittal.update({
      where: { id },
      data: { status: 'SUBMITTED', receivedDate: new Date(), approvedDate: null },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  },

  async getStats(projectId: string) {
    const [total, draft, submitted, underReview, approved, rejected] = await Promise.all([
      (prisma as any).submittal.count({ where: { projectId } }),
      (prisma as any).submittal.count({ where: { projectId, status: 'DRAFT' } }),
      (prisma as any).submittal.count({ where: { projectId, status: 'SUBMITTED' } }),
      (prisma as any).submittal.count({ where: { projectId, status: 'UNDER_REVIEW' } }),
      (prisma as any).submittal.count({
        where: { projectId, status: { in: ['APPROVED', 'APPROVED_AS_NOTED'] } },
      }),
      (prisma as any).submittal.count({
        where: { projectId, status: { in: ['REJECTED', 'REVISE_RESUBMIT'] } },
      }),
    ]);
    return { total, draft, submitted, underReview, approved, rejected };
  },

  async getLog(projectId: string) {
    return (prisma as any).submittal.findMany({
      where: { projectId },
      orderBy: { submittalNumber: 'asc' },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
        _count: { select: { reviews: true } },
      },
    });
  },
};

// =====================================================================
// CHANGE ORDERS
// =====================================================================

export const changeOrderService = {
  async list(filters: {
    projectId: string;
    status?: string;
    requestedBy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { projectId, status, requestedBy, search, page = 1, limit = 50 } = filters;
    const where: any = { projectId };
    if (status) where.status = status;
    if (requestedBy) where.requestedBy = requestedBy;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { changeOrderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      (prisma as any).changeOrder.findMany({
        where,
        include: {
          approvals: true,
          lineItems: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).changeOrder.count({ where }),
    ]);

    return { items, pagination: paginate(page, limit, total) };
  },

  async getById(id: string) {
    const co = await (prisma as any).changeOrder.findUnique({
      where: { id },
      include: {
        approvals: {
          include: { approver: { select: userSelect } },
        },
        lineItems: true,
        project: { select: { id: true, name: true } },
      },
    });
    if (!co) throw new Error('Change order not found');
    return co;
  },

  async create(data: {
    projectId: string;
    title: string;
    description?: string;
    reason?: string;
    requestedBy?: string;
    totalCost?: number;
    scheduleDaysImpact?: number;
    lineItems?: Array<{
      description: string;
      quantity?: number;
      unitCost?: number;
      totalCost?: number;
      category?: string;
    }>;
    metadata?: Record<string, any>;
  }) {
    const count = await (prisma as any).changeOrder.count({
      where: { projectId: data.projectId },
    });

    const { lineItems, ...coData } = data;

    return (prisma as any).changeOrder.create({
      data: {
        ...coData,
        changeOrderNumber: `CO-${String(count + 1).padStart(3, '0')}`,
        status: 'DRAFT',
        lineItems: lineItems?.length ? { create: lineItems } : undefined,
      },
      include: { lineItems: true },
    });
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      reason?: string;
      totalCost?: number;
      scheduleDaysImpact?: number;
      lineItems?: Array<{
        description: string;
        quantity?: number;
        unitCost?: number;
        totalCost?: number;
        category?: string;
      }>;
    }
  ) {
    const { lineItems, ...coData } = data;

    if (lineItems) {
      await (prisma as any).changeOrderLineItem.deleteMany({
        where: { changeOrderId: id },
      });
      await (prisma as any).changeOrderLineItem.createMany({
        data: lineItems.map((li) => ({ ...li, changeOrderId: id })),
      });
    }

    return (prisma as any).changeOrder.update({
      where: { id },
      data: coData,
      include: { lineItems: true, approvals: true },
    });
  },

  async softDelete(id: string) {
    return (prisma as any).changeOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  },

  async submit(id: string) {
    return (prisma as any).changeOrder.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
      include: { lineItems: true },
    });
  },

  async approve(
    id: string,
    data: { approverId: string; role: string; comments?: string }
  ) {
    await (prisma as any).changeOrderApproval.create({
      data: {
        changeOrderId: id,
        approverId: data.approverId,
        role: data.role,
        status: 'APPROVED',
        comments: data.comments,
        approvedAt: new Date(),
        decidedAt: new Date(),
      },
    });

    return (prisma as any).changeOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: data.approverId },
      include: { approvals: true, lineItems: true },
    });
  },

  async reject(
    id: string,
    data: { approverId: string; role: string; reason: string }
  ) {
    await (prisma as any).changeOrderApproval.create({
      data: {
        changeOrderId: id,
        approverId: data.approverId,
        role: data.role,
        status: 'REJECTED',
        comments: data.reason,
        decidedAt: new Date(),
      },
    });

    return (prisma as any).changeOrder.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: data.reason,
        reviewedAt: new Date(),
      },
      include: { approvals: true, lineItems: true },
    });
  },

  async getStats(projectId: string) {
    const where: any = { projectId };
    const [total, byStatus, totalAmount] = await Promise.all([
      (prisma as any).changeOrder.count({ where }),
      (prisma as any).changeOrder.groupBy({ by: ['status'], where, _count: true }),
      (prisma as any).changeOrder.aggregate({ where, _sum: { totalCost: true } }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce(
        (acc: any, s: any) => ({ ...acc, [s.status]: s._count }),
        {}
      ),
      totalAmount: totalAmount._sum?.totalCost ?? 0,
    };
  },
};

// =====================================================================
// INSPECTIONS
// =====================================================================

export const inspectionService = {
  async list(params: {
    projectId: string;
    type?: string;
    status?: string;
    result?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { projectId: params.projectId };
    if (params.type) where.type = params.type.toUpperCase();
    if (params.status) where.status = params.status.toUpperCase();
    if (params.result) where.result = params.result.toUpperCase();
    if (params.startDate || params.endDate) {
      where.scheduledDate = {};
      if (params.startDate) where.scheduledDate.gte = new Date(params.startDate);
      if (params.endDate) where.scheduledDate.lte = new Date(params.endDate);
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 50;

    const [inspections, total] = await Promise.all([
      (prisma as any).inspection.findMany({
        where,
        include: { findings: true },
        orderBy: { scheduledDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).inspection.count({ where }),
    ]);

    return { inspections, pagination: paginate(page, limit, total) };
  },

  async getById(id: string) {
    const inspection = await (prisma as any).inspection.findUnique({
      where: { id },
      include: { findings: { orderBy: { createdAt: 'desc' } } },
    });
    if (!inspection) throw new Error('Inspection not found');
    return inspection;
  },

  async schedule(
    data: {
      projectId: string;
      type: string;
      title: string;
      description?: string;
      scheduledDate: string;
      scheduledTime?: string;
      inspectorId?: string;
      inspectorName?: string;
      location?: string;
      checklistItems?: any[];
      preparationItems?: any[];
      metadata?: Record<string, any>;
    },
    userId: string
  ) {
    return (prisma as any).inspection.create({
      data: {
        projectId: data.projectId,
        type: data.type.toUpperCase(),
        title: data.title,
        description: data.description ?? null,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime ?? null,
        inspectorId: data.inspectorId ?? null,
        inspectorName: data.inspectorName ?? null,
        location: data.location ?? null,
        checklistItems: data.checklistItems ?? [],
        preparationItems: data.preparationItems ?? [],
        status: 'SCHEDULED',
        createdById: userId,
        metadata: data.metadata ?? {},
      },
      include: { findings: true },
    });
  },

  async update(id: string, updates: Record<string, any>) {
    const existing = await (prisma as any).inspection.findUnique({ where: { id } });
    if (!existing) throw new Error('Inspection not found');

    return (prisma as any).inspection.update({
      where: { id },
      data: {
        ...(updates.type && { type: updates.type.toUpperCase() }),
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.scheduledDate && { scheduledDate: new Date(updates.scheduledDate) }),
        ...(updates.scheduledTime !== undefined && { scheduledTime: updates.scheduledTime }),
        ...(updates.inspectorId !== undefined && { inspectorId: updates.inspectorId }),
        ...(updates.inspectorName !== undefined && { inspectorName: updates.inspectorName }),
        ...(updates.location !== undefined && { location: updates.location }),
        ...(updates.checklistItems && { checklistItems: updates.checklistItems }),
        ...(updates.preparationItems && { preparationItems: updates.preparationItems }),
        ...(updates.metadata && { metadata: updates.metadata }),
      },
      include: { findings: true },
    });
  },

  async conduct(
    id: string,
    data: {
      result: string;
      notes?: string;
      conductedAt?: string;
      conductedBy?: string;
      checklistResults?: any[];
    },
    userId: string
  ) {
    const existing = await (prisma as any).inspection.findUnique({ where: { id } });
    if (!existing) throw new Error('Inspection not found');
    if (existing.status === 'COMPLETED') throw new Error('Inspection already conducted');

    return (prisma as any).inspection.update({
      where: { id },
      data: {
        result: data.result.toUpperCase(),
        notes: data.notes ?? null,
        conductedAt: data.conductedAt ? new Date(data.conductedAt) : new Date(),
        conductedBy: data.conductedBy ?? userId,
        checklistResults: data.checklistResults ?? [],
        status: 'COMPLETED',
      },
      include: { findings: true },
    });
  },

  async addFinding(
    inspectionId: string,
    data: {
      type: string;
      severity: string;
      title: string;
      description?: string;
      location?: string;
      photoUrls?: string[];
      correctionRequired?: boolean;
      correctionDeadline?: string;
      assignedTo?: string;
      metadata?: Record<string, any>;
    },
    userId: string
  ) {
    const existing = await (prisma as any).inspection.findUnique({
      where: { id: inspectionId },
    });
    if (!existing) throw new Error('Inspection not found');

    return (prisma as any).inspectionFinding.create({
      data: {
        inspectionId,
        type: data.type.toUpperCase(),
        severity: data.severity.toUpperCase(),
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        photoUrls: data.photoUrls ?? [],
        correctionRequired: data.correctionRequired ?? false,
        correctionDeadline: data.correctionDeadline
          ? new Date(data.correctionDeadline)
          : null,
        assignedTo: data.assignedTo ?? null,
        status: 'OPEN',
        createdById: userId,
        metadata: data.metadata ?? {},
      },
    });
  },

  async updateFinding(
    inspectionId: string,
    findingId: string,
    updates: Record<string, any>
  ) {
    const finding = await (prisma as any).inspectionFinding.findFirst({
      where: { id: findingId, inspectionId },
    });
    if (!finding) throw new Error('Finding not found');

    return (prisma as any).inspectionFinding.update({
      where: { id: findingId },
      data: {
        ...(updates.type && { type: updates.type.toUpperCase() }),
        ...(updates.severity && { severity: updates.severity.toUpperCase() }),
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.location !== undefined && { location: updates.location }),
        ...(updates.photoUrls && { photoUrls: updates.photoUrls }),
        ...(updates.correctionRequired !== undefined && {
          correctionRequired: updates.correctionRequired,
        }),
        ...(updates.assignedTo !== undefined && { assignedTo: updates.assignedTo }),
      },
    });
  },

  async resolveFinding(
    inspectionId: string,
    findingId: string,
    resolution: { notes?: string; resolvedBy?: string },
    userId: string
  ) {
    const finding = await (prisma as any).inspectionFinding.findFirst({
      where: { id: findingId, inspectionId },
    });
    if (!finding) throw new Error('Finding not found');
    if (finding.status === 'RESOLVED') throw new Error('Finding already resolved');

    return (prisma as any).inspectionFinding.update({
      where: { id: findingId },
      data: {
        status: 'RESOLVED',
        resolutionNotes: resolution.notes ?? null,
        resolvedBy: resolution.resolvedBy ?? userId,
        resolvedAt: new Date(),
      },
    });
  },

  async getStats(projectId: string) {
    const inspections = await (prisma as any).inspection.findMany({
      where: { projectId },
      include: { findings: true },
    });

    const total = inspections.length;
    const scheduled = inspections.filter((i: any) => i.status === 'SCHEDULED').length;
    const completed = inspections.filter((i: any) => i.status === 'COMPLETED').length;
    const passed = inspections.filter((i: any) => i.result === 'PASS').length;
    const failed = inspections.filter((i: any) => i.result === 'FAIL').length;
    const conditional = inspections.filter(
      (i: any) => i.result === 'CONDITIONAL'
    ).length;

    const allFindings = inspections.flatMap((i: any) => i.findings ?? []);

    return {
      total,
      scheduled,
      completed,
      passed,
      failed,
      conditional,
      passRate: completed > 0 ? (passed / completed) * 100 : 0,
      findings: {
        total: allFindings.length,
        open: allFindings.filter((f: any) => f.status === 'OPEN').length,
        resolved: allFindings.filter((f: any) => f.status === 'RESOLVED').length,
      },
    };
  },
};

// =====================================================================
// DAILY LOGS
// =====================================================================

export const dailyLogService = {
  async list(filters: {
    projectId: string;
    contractorId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { projectId, contractorId, startDate, endDate, page = 1, limit = 50 } = filters;
    const where: any = { projectId };
    if (contractorId) where.contractorId = contractorId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      (prisma as any).dailyLog.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          contractor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).dailyLog.count({ where }),
    ]);

    return { items, pagination: paginate(page, limit, total) };
  },

  async getById(id: string) {
    const log = await (prisma as any).dailyLog.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true, email: true } },
      },
    });
    if (!log) throw new Error('Daily log not found');
    return log;
  },

  async create(data: {
    projectId: string;
    date: string;
    weather?: string;
    temperatureHigh?: number;
    temperatureLow?: number;
    crewCount?: number;
    hoursWorked?: number;
    activities?: string;
    materials?: string;
    equipment?: string;
    visitors?: string;
    safetyIncidents?: string;
    delays?: string;
    notes?: string;
    contractorId?: string;
    createdById?: string;
    metadata?: Record<string, any>;
  }) {
    return (prisma as any).dailyLog.create({
      data: {
        projectId: data.projectId,
        date: new Date(data.date),
        weather: data.weather ?? null,
        temperatureHigh: data.temperatureHigh ?? null,
        temperatureLow: data.temperatureLow ?? null,
        crewCount: data.crewCount ?? 0,
        hoursWorked: data.hoursWorked ?? 0,
        activities: data.activities ?? null,
        materials: data.materials ?? null,
        equipment: data.equipment ?? null,
        visitors: data.visitors ?? null,
        safetyIncidents: data.safetyIncidents ?? null,
        delays: data.delays ?? null,
        notes: data.notes ?? null,
        contractorId: data.contractorId ?? null,
        createdById: data.createdById ?? null,
        metadata: data.metadata ?? {},
      },
      include: { project: { select: { id: true, name: true } } },
    });
  },

  async update(id: string, data: Record<string, any>) {
    const existing = await (prisma as any).dailyLog.findUnique({ where: { id } });
    if (!existing) throw new Error('Daily log not found');

    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);

    return (prisma as any).dailyLog.update({ where: { id }, data: updateData });
  },

  async delete(id: string) {
    const existing = await (prisma as any).dailyLog.findUnique({ where: { id } });
    if (!existing) throw new Error('Daily log not found');
    await (prisma as any).dailyLog.delete({ where: { id } });
    return { success: true };
  },

  async signOff(id: string, userId: string) {
    const log = await (prisma as any).dailyLog.findUnique({ where: { id } });
    if (!log) throw new Error('Daily log not found');
    const metadata = (log.metadata as any) || {};
    return (prisma as any).dailyLog.update({
      where: { id },
      data: {
        metadata: {
          ...metadata,
          signedBy: userId,
          signedAt: new Date().toISOString(),
        },
      },
    });
  },

  async getSummary(filters: {
    projectId: string;
    startDate: string;
    endDate: string;
  }) {
    const where: any = {
      projectId: filters.projectId,
      date: {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      },
    };

    const logs = await (prisma as any).dailyLog.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const totalCrewHours = logs.reduce(
      (sum: number, l: any) => sum + (l.crewCount || 0) * (l.hoursWorked || 0),
      0
    );
    const weatherDays = logs.reduce((acc: any, l: any) => {
      const w = l.weather || 'unknown';
      acc[w] = (acc[w] || 0) + 1;
      return acc;
    }, {});

    return {
      totalLogs: logs.length,
      totalCrewHours,
      weatherDays,
      logs,
    };
  },
};

// =====================================================================
// DOCUMENTS
// =====================================================================

export const documentService = {
  async list(params: {
    projectId: string;
    type?: string;
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { projectId: params.projectId };
    if (params.type) where.type = params.type.toUpperCase();
    if (params.category) where.category = params.category;
    if (params.status) where.status = params.status.toUpperCase();
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 50;

    const [documents, total] = await Promise.all([
      (prisma as any).document.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).document.count({ where }),
    ]);

    return { documents, pagination: paginate(page, limit, total) };
  },

  async getById(id: string) {
    const document = await (prisma as any).document.findUnique({
      where: { id },
      include: { distributions: true },
    });
    if (!document) throw new Error('Document not found');
    return document;
  },

  async create(
    data: {
      projectId: string;
      type?: string;
      title: string;
      description?: string;
      category?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      metadata?: Record<string, any>;
    },
    userId: string
  ) {
    return (prisma as any).document.create({
      data: {
        projectId: data.projectId,
        type: data.type ? data.type.toUpperCase() : 'GENERAL',
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? null,
        fileUrl: data.fileUrl ?? null,
        fileName: data.fileName ?? null,
        fileSize: data.fileSize ?? null,
        mimeType: data.mimeType ?? null,
        version: 1,
        status: 'ACTIVE',
        createdById: userId,
        metadata: data.metadata ?? {},
      },
    });
  },

  async update(id: string, updates: Record<string, any>) {
    const existing = await (prisma as any).document.findUnique({ where: { id } });
    if (!existing) throw new Error('Document not found');

    return (prisma as any).document.update({
      where: { id },
      data: {
        ...(updates.type && { type: updates.type.toUpperCase() }),
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.status && { status: updates.status.toUpperCase() }),
        ...(updates.metadata && { metadata: updates.metadata }),
      },
    });
  },

  async softDelete(id: string) {
    const existing = await (prisma as any).document.findUnique({ where: { id } });
    if (!existing) throw new Error('Document not found');
    return (prisma as any).document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  },

  async addVersion(
    id: string,
    data: {
      fileUrl: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    },
    userId: string
  ) {
    const existing = await (prisma as any).document.findUnique({ where: { id } });
    if (!existing) throw new Error('Document not found');

    const newVersion = (existing.version || 1) + 1;
    await (prisma as any).document.update({
      where: { id },
      data: {
        version: newVersion,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        updatedAt: new Date(),
      },
    });

    return {
      documentId: id,
      version: newVersion,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
    };
  },

  async getVersions(id: string) {
    const document = await (prisma as any).document.findUnique({ where: { id } });
    if (!document) throw new Error('Document not found');
    return {
      documentId: id,
      currentVersion: document.version,
      versions: [
        {
          version: document.version,
          fileUrl: document.fileUrl,
          fileName: document.fileName,
          updatedAt: document.updatedAt,
        },
      ],
    };
  },

  async distribute(
    id: string,
    data: { recipients: string[]; method?: string },
    userId: string
  ) {
    const existing = await (prisma as any).document.findUnique({ where: { id } });
    if (!existing) throw new Error('Document not found');

    const distributions = await Promise.all(
      data.recipients.map((recipientId: string) =>
        (prisma as any).documentDistribution.create({
          data: {
            documentId: id,
            recipientId,
            distributedBy: userId,
            distributedAt: new Date(),
            method: data.method ?? 'EMAIL',
          },
        })
      )
    );

    return { documentId: id, distributions };
  },
};

// =====================================================================
// DRAWINGS
// =====================================================================

export const drawingService = {
  async list(filters: {
    projectId: string;
    discipline?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { projectId, discipline, status, search, page = 1, limit = 25 } = filters;
    const where: any = {
      projectId,
      OR: [
        { type: { contains: 'DRAWING' } },
        { metadata: { path: ['discipline'], not: undefined } },
      ],
    };

    if (status) where.status = status;
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      (prisma as any).document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).document.count({ where }),
    ]);

    // Post-filter by discipline from metadata if specified
    const filtered = discipline
      ? items.filter((doc: any) => {
          const meta = doc.metadata as any;
          return meta && meta.discipline === discipline;
        })
      : items;

    return {
      items: filtered,
      total: discipline ? filtered.length : total,
      pagination: paginate(page, limit, discipline ? filtered.length : total),
    };
  },

  async getById(id: string) {
    const drawing = await (prisma as any).document.findUnique({ where: { id } });
    if (!drawing) throw new Error('Drawing not found');
    return drawing;
  },

  async upload(data: {
    projectId: string;
    name: string;
    description?: string;
    fileUrl?: string;
    format?: string;
    size?: number;
    discipline?: string;
    drawingNumber?: string;
    tags?: string[];
  }) {
    return (prisma as any).document.create({
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
    });
  },

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      discipline?: string;
      drawingNumber?: string;
      tags?: string[];
      status?: string;
    }
  ) {
    const existing = await (prisma as any).document.findUnique({ where: { id } });
    if (!existing) throw new Error('Drawing not found');

    const existingMeta = (existing.metadata as any) || {};
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags) updateData.tags = data.tags;
    if (data.status) updateData.status = data.status;
    if (data.discipline !== undefined || data.drawingNumber !== undefined) {
      updateData.metadata = {
        ...existingMeta,
        ...(data.discipline !== undefined && { discipline: data.discipline }),
        ...(data.drawingNumber !== undefined && { drawingNumber: data.drawingNumber }),
      };
    }

    return (prisma as any).document.update({ where: { id }, data: updateData });
  },

  async archive(id: string) {
    return (prisma as any).document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  },

  async addRevision(
    id: string,
    data: {
      fileUrl?: string;
      format?: string;
      size?: number;
      description?: string;
    }
  ) {
    const existing = await (prisma as any).document.findUnique({ where: { id } });
    if (!existing) throw new Error('Drawing not found');

    const existingMeta = (existing.metadata as any) || {};

    // Supersede the current document
    await (prisma as any).document.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        metadata: {
          ...existingMeta,
          superseded: true,
          supersededAt: new Date().toISOString(),
        },
      },
    });

    // Create new revision
    return (prisma as any).document.create({
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
    });
  },

  async getRevisions(id: string) {
    const doc = await (prisma as any).document.findUnique({ where: { id } });
    if (!doc) throw new Error('Drawing not found');

    return (prisma as any).document.findMany({
      where: { projectId: doc.projectId, type: 'DRAWING', name: doc.name },
      orderBy: { version: 'desc' },
    });
  },

  async getSets(projectId: string) {
    const drawings = await (prisma as any).document.findMany({
      where: {
        projectId,
        OR: [
          { type: { contains: 'DRAWING' } },
          { metadata: { path: ['discipline'], not: undefined } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    const sets: Record<string, any[]> = {};
    for (const doc of drawings) {
      const meta = (doc.metadata as any) || {};
      const disc = meta.discipline || 'UNCATEGORIZED';
      if (!sets[disc]) sets[disc] = [];
      sets[disc].push(doc);
    }

    return Object.entries(sets).map(([discipline, documents]) => ({
      discipline,
      count: documents.length,
      documents,
    }));
  },

  async getCurrent(projectId: string) {
    const drawings = await (prisma as any).document.findMany({
      where: {
        projectId,
        OR: [
          { type: { contains: 'DRAWING' } },
          { metadata: { path: ['discipline'], not: undefined } },
        ],
        status: { not: 'ARCHIVED' },
      },
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
    });

    const latestByName: Record<string, any> = {};
    for (const doc of drawings) {
      if (!latestByName[doc.name] || doc.version > latestByName[doc.name].version) {
        latestByName[doc.name] = doc;
      }
    }
    return Object.values(latestByName);
  },
};

// =====================================================================
// MEETINGS
// =====================================================================

export const meetingService = {
  async list(filters: {
    projectId: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: any = { projectId: filters.projectId };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { agenda: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      (prisma as any).meeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          createdBy: { select: userSelect },
          _count: { select: { attendees: true, actionItems: true } },
        },
      }),
      (prisma as any).meeting.count({ where }),
    ]);

    return { data, pagination: paginate(page, limit, total) };
  },

  async getById(id: string) {
    const meeting = await (prisma as any).meeting.findUnique({
      where: { id },
      include: {
        createdBy: { select: userSelect },
        attendees: { orderBy: { name: 'asc' } },
        actionItems: {
          orderBy: { createdAt: 'asc' },
          include: { assignedTo: { select: userSelect } },
        },
      },
    });
    if (!meeting) throw new Error('Meeting not found');
    return meeting;
  },

  async create(data: {
    projectId: string;
    title: string;
    type?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    agenda?: string;
    recurringSchedule?: any;
    createdById: string;
  }) {
    const count = await (prisma as any).meeting.count({
      where: { projectId: data.projectId },
    });

    return (prisma as any).meeting.create({
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
      include: { createdBy: { select: userSelect } },
    });
  },

  async update(
    id: string,
    data: {
      title?: string;
      type?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      location?: string;
      agenda?: string;
      recurringSchedule?: any;
    }
  ) {
    const existing = await (prisma as any).meeting.findUnique({ where: { id } });
    if (!existing) throw new Error('Meeting not found');

    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);

    return (prisma as any).meeting.update({
      where: { id },
      data: updateData,
      include: { createdBy: { select: userSelect } },
    });
  },

  async cancel(id: string) {
    const existing = await (prisma as any).meeting.findUnique({ where: { id } });
    if (!existing) throw new Error('Meeting not found');

    return (prisma as any).meeting.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  },

  async complete(id: string) {
    const existing = await (prisma as any).meeting.findUnique({ where: { id } });
    if (!existing) throw new Error('Meeting not found');

    return (prisma as any).meeting.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        createdBy: { select: userSelect },
        attendees: true,
        actionItems: {
          include: { assignedTo: { select: userSelect } },
        },
      },
    });
  },

  async saveMinutes(id: string, minutes: string) {
    const existing = await (prisma as any).meeting.findUnique({ where: { id } });
    if (!existing) throw new Error('Meeting not found');

    return (prisma as any).meeting.update({
      where: { id },
      data: { minutes },
    });
  },

  async addAttendees(
    meetingId: string,
    attendees: Array<{
      userId?: string;
      name: string;
      email?: string;
      company?: string;
      role?: string;
    }>
  ) {
    const meeting = await (prisma as any).meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) throw new Error('Meeting not found');

    return Promise.all(
      attendees.map((att) =>
        (prisma as any).meetingAttendee.create({
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
    );
  },

  async updateAttendee(
    attendeeId: string,
    data: { attended?: boolean; signatureUrl?: string; role?: string }
  ) {
    const existing = await (prisma as any).meetingAttendee.findUnique({
      where: { id: attendeeId },
    });
    if (!existing) throw new Error('Meeting attendee not found');

    return (prisma as any).meetingAttendee.update({
      where: { id: attendeeId },
      data,
    });
  },

  async addActionItem(
    meetingId: string,
    data: {
      description: string;
      assignedToId?: string;
      assignedToName?: string;
      dueDate?: string;
      priority?: string;
    }
  ) {
    const meeting = await (prisma as any).meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) throw new Error('Meeting not found');

    return (prisma as any).meetingActionItem.create({
      data: {
        meetingId,
        description: data.description,
        assignedToId: data.assignedToId,
        assignedToName: data.assignedToName,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority ?? 'MEDIUM',
        status: 'OPEN',
      },
      include: { assignedTo: { select: userSelect } },
    });
  },

  async updateActionItem(
    itemId: string,
    data: {
      description?: string;
      assignedToId?: string;
      assignedToName?: string;
      dueDate?: string;
      priority?: string;
      status?: string;
      notes?: string;
    }
  ) {
    const existing = await (prisma as any).meetingActionItem.findUnique({
      where: { id: itemId },
    });
    if (!existing) throw new Error('Action item not found');

    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.status === 'COMPLETED') updateData.completedAt = new Date();

    return (prisma as any).meetingActionItem.update({
      where: { id: itemId },
      data: updateData,
      include: { assignedTo: { select: userSelect } },
    });
  },

  async getOpenActionItems(projectId: string) {
    return (prisma as any).meetingActionItem.findMany({
      where: {
        meeting: { projectId },
        status: { not: 'COMPLETED' },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        meeting: { select: { id: true, title: true, meetingNumber: true } },
        assignedTo: { select: userSelect },
      },
    });
  },
};

// =====================================================================
// BUDGET
// =====================================================================

export const budgetService = {
  async getOverview(projectId: string) {
    const lines = await (prisma as any).budgetLine.findMany({
      where: { projectId },
    });

    const totalBudget = lines.reduce(
      (sum: number, l: any) => sum + (parseFloat(l.budgetAmount) || 0),
      0
    );
    const totalActual = lines.reduce(
      (sum: number, l: any) => sum + (parseFloat(l.actualAmount) || 0),
      0
    );
    const totalCommitted = lines.reduce(
      (sum: number, l: any) => sum + (parseFloat(l.committedAmount) || 0),
      0
    );
    const totalVariance = totalBudget - totalActual;

    return {
      projectId,
      totalBudget,
      totalActual,
      totalCommitted,
      totalVariance,
      variancePercent: totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0,
      lineCount: lines.length,
    };
  },

  async listLines(params: {
    projectId: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { projectId: params.projectId };
    if (params.category) where.category = params.category;
    if (params.status) where.status = params.status.toUpperCase();

    const page = params.page ?? 1;
    const limit = params.limit ?? 50;

    const [lines, total] = await Promise.all([
      (prisma as any).budgetLine.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).budgetLine.count({ where }),
    ]);

    return { lines, pagination: paginate(page, limit, total) };
  },

  async createLine(
    data: {
      projectId: string;
      code?: string;
      name: string;
      category?: string;
      description?: string;
      budgetAmount?: number;
      sortOrder?: number;
      metadata?: Record<string, any>;
    },
    userId: string
  ) {
    return (prisma as any).budgetLine.create({
      data: {
        projectId: data.projectId,
        code: data.code ?? null,
        name: data.name,
        category: data.category ?? null,
        description: data.description ?? null,
        budgetAmount: data.budgetAmount ?? 0,
        actualAmount: 0,
        committedAmount: 0,
        sortOrder: data.sortOrder ?? 0,
        status: 'ACTIVE',
        createdById: userId,
        metadata: data.metadata ?? {},
      },
    });
  },

  async updateLine(id: string, updates: Record<string, any>) {
    const existing = await (prisma as any).budgetLine.findUnique({ where: { id } });
    if (!existing) throw new Error('Budget line not found');

    return (prisma as any).budgetLine.update({
      where: { id },
      data: {
        ...(updates.code !== undefined && { code: updates.code }),
        ...(updates.name && { name: updates.name }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.budgetAmount !== undefined && { budgetAmount: updates.budgetAmount }),
        ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
        ...(updates.status && { status: updates.status.toUpperCase() }),
        ...(updates.metadata && { metadata: updates.metadata }),
      },
    });
  },

  async deleteLine(id: string) {
    const existing = await (prisma as any).budgetLine.findUnique({ where: { id } });
    if (!existing) throw new Error('Budget line not found');
    await (prisma as any).budgetLine.delete({ where: { id } });
    return { success: true };
  },

  async listEntries(params: {
    projectId?: string;
    budgetLineId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (params.budgetLineId) where.budgetLineId = params.budgetLineId;
    if (params.projectId) where.budgetLine = { projectId: params.projectId };
    if (params.type) where.type = params.type.toUpperCase();

    const page = params.page ?? 1;
    const limit = params.limit ?? 50;

    const [entries, total] = await Promise.all([
      (prisma as any).budgetEntry.findMany({
        where,
        include: { budgetLine: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).budgetEntry.count({ where }),
    ]);

    return { entries, pagination: paginate(page, limit, total) };
  },

  async createEntry(
    data: {
      budgetLineId: string;
      type: string;
      amount: number;
      description?: string;
      vendor?: string;
      invoiceNumber?: string;
      date?: string;
      metadata?: Record<string, any>;
    },
    userId: string
  ) {
    const entry = await (prisma as any).budgetEntry.create({
      data: {
        budgetLineId: data.budgetLineId,
        type: data.type.toUpperCase(),
        amount: data.amount,
        description: data.description ?? null,
        vendor: data.vendor ?? null,
        invoiceNumber: data.invoiceNumber ?? null,
        date: data.date ? new Date(data.date) : new Date(),
        createdById: userId,
        metadata: data.metadata ?? {},
      },
    });

    // Auto-increment the corresponding line total
    const line = await (prisma as any).budgetLine.findUnique({
      where: { id: data.budgetLineId },
    });
    if (line) {
      const field =
        data.type.toUpperCase() === 'COMMITTED' ? 'committedAmount' : 'actualAmount';
      await (prisma as any).budgetLine.update({
        where: { id: data.budgetLineId },
        data: { [field]: { increment: data.amount } },
      });
    }

    return entry;
  },

  async updateEntry(id: string, updates: Record<string, any>) {
    const existing = await (prisma as any).budgetEntry.findUnique({ where: { id } });
    if (!existing) throw new Error('Budget entry not found');

    return (prisma as any).budgetEntry.update({
      where: { id },
      data: {
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.vendor !== undefined && { vendor: updates.vendor }),
        ...(updates.invoiceNumber !== undefined && {
          invoiceNumber: updates.invoiceNumber,
        }),
        ...(updates.date && { date: new Date(updates.date) }),
        ...(updates.metadata && { metadata: updates.metadata }),
      },
    });
  },

  async getVarianceReport(projectId: string) {
    const lines = await (prisma as any).budgetLine.findMany({
      where: { projectId },
    });

    const report = lines.map((line: any) => {
      const budget = parseFloat(line.budgetAmount) || 0;
      const actual = parseFloat(line.actualAmount) || 0;
      const variance = budget - actual;
      return {
        id: line.id,
        name: line.name,
        code: line.code,
        category: line.category,
        budgetAmount: budget,
        actualAmount: actual,
        variance,
        variancePercent: budget > 0 ? (variance / budget) * 100 : 0,
        status:
          variance < 0
            ? 'OVER_BUDGET'
            : variance === 0
              ? 'ON_BUDGET'
              : 'UNDER_BUDGET',
      };
    });

    return { lines: report };
  },

  async getForecast(projectId: string) {
    const lines = await (prisma as any).budgetLine.findMany({
      where: { projectId },
    });
    const entries = await (prisma as any).budgetEntry.findMany({
      where: { budgetLine: { projectId } },
      orderBy: { date: 'asc' },
    });

    const totalBudget = lines.reduce(
      (s: number, l: any) => s + (parseFloat(l.budgetAmount) || 0),
      0
    );
    const totalActual = lines.reduce(
      (s: number, l: any) => s + (parseFloat(l.actualAmount) || 0),
      0
    );
    const totalCommitted = lines.reduce(
      (s: number, l: any) => s + (parseFloat(l.committedAmount) || 0),
      0
    );

    return {
      projectId,
      totalBudget,
      totalActual,
      totalCommitted,
      projectedTotal: totalActual + totalCommitted,
      projectedVariance: totalBudget - (totalActual + totalCommitted),
      burnRate: entries.length > 0 ? totalActual / entries.length : 0,
      entryCount: entries.length,
    };
  },

  async getSnapshots(projectId: string) {
    return {
      snapshots: await (prisma as any).budgetSnapshot.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    };
  },

  async takeSnapshot(projectId: string, userId: string, label?: string) {
    const overview = await budgetService.getOverview(projectId);
    const lines = await (prisma as any).budgetLine.findMany({
      where: { projectId },
    });

    return (prisma as any).budgetSnapshot.create({
      data: {
        projectId,
        label: label || new Date().toISOString(),
        totalBudget: overview.totalBudget,
        totalActual: overview.totalActual,
        totalCommitted: overview.totalCommitted,
        totalVariance: overview.totalVariance,
        lineData: lines,
        createdById: userId,
      },
    });
  },

  async getAlerts(projectId: string) {
    return {
      alerts: await (prisma as any).budgetAlert.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    };
  },

  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = await (prisma as any).budgetAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new Error('Budget alert not found');

    return (prisma as any).budgetAlert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });
  },
};
