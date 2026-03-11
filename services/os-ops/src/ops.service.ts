/**
 * OS-Ops Service — turnover checklists, warranty management, maintenance work orders
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const opsService = {
  // ── Turnover Checklists ────────────────────────────────────

  async createChecklist(data: {
    projectId: string;
    orgId: string;
    title: string;
    description?: string;
    category?: string;
    targetDate?: Date;
    templateId?: string;
  }) {
    return prisma.turnoverChecklist.create({
      data: {
        projectId: data.projectId,
        orgId: data.orgId,
        title: data.title,
        description: data.description,
        category: data.category,
        targetDate: data.targetDate,
        templateId: data.templateId,
        status: 'DRAFT',
      },
      include: { items: true },
    });
  },

  async getChecklist(id: string) {
    return prisma.turnoverChecklist.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  },

  async listChecklists(projectId: string) {
    return prisma.turnoverChecklist.findMany({
      where: { projectId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async addChecklistItem(checklistId: string, data: {
    category: string;
    title: string;
    description?: string;
    sortOrder?: number;
    requiresPhoto?: boolean;
    requiresDocument?: boolean;
    requiresSignature?: boolean;
  }) {
    const item = await prisma.turnoverItem.create({
      data: {
        checklistId,
        category: data.category,
        title: data.title,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
        requiresPhoto: data.requiresPhoto ?? false,
        requiresDocument: data.requiresDocument ?? false,
        requiresSignature: data.requiresSignature ?? false,
        status: 'PENDING',
      },
    });

    // Update checklist totals
    await this.recalculateChecklistProgress(checklistId);
    return item;
  },

  async completeChecklistItem(itemId: string, completedBy: string, data?: {
    photoUrl?: string;
    documentUrl?: string;
    signatureUrl?: string;
    notes?: string;
  }) {
    const item = await prisma.turnoverItem.update({
      where: { id: itemId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy,
        photoUrl: data?.photoUrl,
        documentUrl: data?.documentUrl,
        signatureUrl: data?.signatureUrl,
        notes: data?.notes,
      },
    });

    await this.recalculateChecklistProgress(item.checklistId);
    return item;
  },

  async recalculateChecklistProgress(checklistId: string) {
    const items = await prisma.turnoverItem.findMany({
      where: { checklistId },
    });

    const total = items.length;
    const completed = items.filter(i => i.status === 'COMPLETED').length;
    const pct = total > 0 ? (completed / total) * 100 : 0;

    await prisma.turnoverChecklist.update({
      where: { id: checklistId },
      data: {
        totalItems: total,
        completedItems: completed,
        completionPct: pct,
        status: pct >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: pct >= 100 ? new Date() : null,
      },
    });
  },

  async signOffChecklist(id: string, signedOffBy: string) {
    return prisma.turnoverChecklist.update({
      where: { id },
      data: {
        status: 'SIGNED_OFF',
        signedOffBy,
        signedOffAt: new Date(),
      },
    });
  },

  // ── Maintenance Schedules ──────────────────────────────────

  async createMaintenanceSchedule(data: {
    projectId: string;
    orgId: string;
    title: string;
    description?: string;
    category?: string;
    frequency: string;
    nextDueDate?: Date;
    assignedTo?: string;
    assignedName?: string;
    vendorName?: string;
    estimatedCost?: number;
  }) {
    return prisma.maintenanceSchedule.create({
      data: {
        projectId: data.projectId,
        orgId: data.orgId,
        title: data.title,
        description: data.description,
        category: data.category,
        frequency: data.frequency,
        nextDueDate: data.nextDueDate,
        assignedTo: data.assignedTo,
        assignedName: data.assignedName,
        vendorName: data.vendorName,
        estimatedCost: data.estimatedCost,
        isActive: true,
      },
    });
  },

  async listMaintenanceSchedules(projectId: string) {
    return prisma.maintenanceSchedule.findMany({
      where: { projectId, isActive: true },
      include: { workOrders: { where: { status: { not: 'CLOSED' } } } },
      orderBy: { nextDueDate: 'asc' },
    });
  },

  async getOverdueSchedules(orgId: string) {
    return prisma.maintenanceSchedule.findMany({
      where: {
        orgId,
        isActive: true,
        nextDueDate: { lt: new Date() },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  },

  // ── Maintenance Work Orders ────────────────────────────────

  async createWorkOrder(data: {
    projectId: string;
    orgId: string;
    scheduleId?: string;
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    assignedTo?: string;
    assignedName?: string;
    scheduledDate?: Date;
    location?: string;
    estimatedCost?: number;
    reportedBy?: string;
  }) {
    return prisma.maintenanceWorkOrder.create({
      data: {
        projectId: data.projectId,
        orgId: data.orgId,
        scheduleId: data.scheduleId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: (data.priority as any) ?? 'MEDIUM',
        assignedTo: data.assignedTo,
        assignedName: data.assignedName,
        scheduledDate: data.scheduledDate,
        location: data.location,
        estimatedCost: data.estimatedCost,
        reportedBy: data.reportedBy,
        status: 'OPEN',
      },
    });
  },

  async getWorkOrder(id: string) {
    return prisma.maintenanceWorkOrder.findUnique({
      where: { id },
      include: { schedule: true },
    });
  },

  async listWorkOrders(projectId: string, options?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { projectId };
    if (options?.status) where.status = options.status;
    if (options?.priority) where.priority = options.priority;

    const [workOrders, total] = await Promise.all([
      prisma.maintenanceWorkOrder.findMany({
        where,
        include: { schedule: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.maintenanceWorkOrder.count({ where }),
    ]);

    return { workOrders, total };
  },

  async updateWorkOrderStatus(id: string, status: string, data?: {
    resolution?: string;
    actualCost?: number;
    laborHours?: number;
    materialsCost?: number;
  }) {
    const updateData: any = { status };
    if (status === 'IN_PROGRESS') updateData.startedAt = new Date();
    if (status === 'COMPLETED' || status === 'CLOSED') {
      updateData.completedAt = new Date();
      if (data?.resolution) updateData.resolution = data.resolution;
      if (data?.actualCost != null) updateData.actualCost = data.actualCost;
      if (data?.laborHours != null) updateData.laborHours = data.laborHours;
      if (data?.materialsCost != null) updateData.materialsCost = data.materialsCost;
    }

    return prisma.maintenanceWorkOrder.update({
      where: { id },
      data: updateData,
    });
  },

  // ── Payment Schedule Templates (OS-Pay) ────────────────────

  async createPaymentTemplate(data: {
    orgId: string;
    name: string;
    description?: string;
    projectType?: string;
    milestones: unknown[];
    isDefault?: boolean;
  }) {
    return prisma.paymentScheduleTemplate.create({
      data: {
        orgId: data.orgId,
        name: data.name,
        description: data.description,
        projectType: data.projectType,
        milestones: data.milestones as any,
        totalMilestones: Array.isArray(data.milestones) ? data.milestones.length : 0,
        isDefault: data.isDefault ?? false,
      },
    });
  },

  async listPaymentTemplates(orgId: string) {
    return prisma.paymentScheduleTemplate.findMany({
      where: { orgId },
      orderBy: { usageCount: 'desc' },
    });
  },

  // ── Escrow Reconciliation (OS-Pay) ─────────────────────────

  async createEscrowReconciliation(data: {
    projectId: string;
    orgId: string;
    periodStart: Date;
    periodEnd: Date;
    expectedBalance: number;
    actualBalance: number;
    totalDeposits?: number;
    totalDisbursements?: number;
    totalHolds?: number;
  }) {
    const discrepancy = data.actualBalance - data.expectedBalance;
    return prisma.escrowReconciliation.create({
      data: {
        projectId: data.projectId,
        orgId: data.orgId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        expectedBalance: data.expectedBalance,
        actualBalance: data.actualBalance,
        discrepancy: Math.abs(discrepancy),
        hasDiscrepancy: Math.abs(discrepancy) > 0.01,
        totalDeposits: data.totalDeposits ?? 0,
        totalDisbursements: data.totalDisbursements ?? 0,
        totalHolds: data.totalHolds ?? 0,
        status: 'DRAFT',
      },
    });
  },

  async listReconciliations(projectId: string) {
    return prisma.escrowReconciliation.findMany({
      where: { projectId },
      orderBy: { periodEnd: 'desc' },
    });
  },
};
