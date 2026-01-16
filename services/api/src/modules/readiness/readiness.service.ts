import { prismaAny } from '../../utils/prisma-helper'
import { AuthorizationError, NotFoundError, ValidationError } from '../../errors/app.error'
import {
  EvidenceType,
  ProjectCategory,
  ProjectMemberRole,
  ReadinessItemStatus,
  ReadinessItemType,
} from '@prisma/client'
import { validateReadinessItemResponse } from '../../schemas/readiness.schemas'

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v === 'true' || v === '1'
  return false
}

async function requireOrgAdmin(orgId: string, userId: string) {
  const membership = await prismaAny.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { roleKey: true },
  })
  if (!membership || membership.roleKey !== 'ADMIN') {
    throw new AuthorizationError('Admin access required for readiness configuration')
  }
}

export const readinessService = {
  async listTemplates(params: { orgId?: string; category?: ProjectCategory; activeOnly?: unknown }) {
    const activeOnly = toBool(params.activeOnly)
    return prismaAny.readinessTemplate.findMany({
      where: {
        ...(params.orgId ? { orgId: params.orgId } : {}),
        ...(params.category ? { OR: [{ category: params.category }, { category: null }] } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    })
  },

  async createTemplate(input: { orgId?: string | null; name: string; category?: ProjectCategory | null; isActive?: boolean }, actorUserId: string) {
    if (input.orgId) await requireOrgAdmin(input.orgId, actorUserId)

    return prismaAny.readinessTemplate.create({
      data: {
        orgId: input.orgId ?? null,
        name: input.name,
        category: input.category ?? null,
        isActive: input.isActive ?? true,
      },
      include: { items: { orderBy: { order: 'asc' } } },
    })
  },

  async addTemplateItem(
    templateId: string,
    input: {
      title: string
      description?: string | null
      type: ReadinessItemType
      required?: boolean
      order?: number
      dueDays?: number | null
      defaultAssigneeRole?: ProjectMemberRole | null
      config?: unknown | null
    },
    actorUserId: string
  ) {
    const template = await prismaAny.readinessTemplate.findUnique({ where: { id: templateId } })
    if (!template) throw new NotFoundError('ReadinessTemplate', templateId)
    if (template.orgId) await requireOrgAdmin(template.orgId, actorUserId)

    const item = await prismaAny.readinessTemplateItem.create({
      data: {
        templateId,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        required: input.required ?? true,
        order: input.order ?? 0,
        dueDays: input.dueDays ?? null,
        defaultAssigneeRole: input.defaultAssigneeRole ?? null,
        config: (input.config as any) ?? null,
      },
    })
    return item
  },

  async generateProjectReadiness(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, orgId: true, ownerId: true, category: true, createdAt: true },
    })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) throw new AuthorizationError('Only the project owner can generate readiness')

    const existing = await prismaAny.readinessItem.count({ where: { projectId } })
    if (existing > 0) {
      return prismaAny.readinessItem.findMany({
        where: { projectId },
        include: { evidence: true },
        orderBy: { createdAt: 'asc' },
      })
    }

    // Prefer org-specific templates when orgId present; otherwise use global templates.
    const templates = await prismaAny.readinessTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          ...(project.orgId ? [{ orgId: project.orgId }] : []),
          { orgId: null },
        ],
        AND: [{ OR: [{ category: project.category }, { category: null }] }],
      },
      include: { items: true },
    })

    // If org has any templates, ignore global ones to avoid duplicates.
    const hasOrgTemplates = project.orgId ? templates.some((t) => t.orgId === project.orgId) : false
    const effectiveTemplates = hasOrgTemplates ? templates.filter((t) => t.orgId === project.orgId) : templates.filter((t) => t.orgId === null)

    const templateItems = effectiveTemplates.flatMap((t) => t.items).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const created = await prismaAny.$transaction(
      templateItems.map((ti) => {
        const dueDate = ti.dueDays != null ? new Date(project.createdAt.getTime() + ti.dueDays * 24 * 3600 * 1000) : undefined
        const assigneeUserId =
          ti.defaultAssigneeRole === ProjectMemberRole.OWNER || !ti.defaultAssigneeRole ? project.ownerId : null

        return prismaAny.readinessItem.create({
          data: {
            projectId,
            title: ti.title,
            description: ti.description,
            type: ti.type,
            required: ti.required,
            status: ReadinessItemStatus.PENDING,
            dueDate,
            assigneeUserId,
            response: null,
          },
        })
      })
    )

    // Return created items
    const items = await prismaAny.readinessItem.findMany({
      where: { projectId },
      include: { evidence: true },
      orderBy: { createdAt: 'asc' },
    })

    return items
  },

  async listProjectReadiness(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) throw new AuthorizationError('Only the project owner can view readiness (for now)')

    return prismaAny.readinessItem.findMany({
      where: { projectId },
      include: { evidence: true },
      orderBy: { createdAt: 'asc' },
    })
  },

  async updateReadinessItem(itemId: string, userId: string, input: { status?: ReadinessItemStatus; response?: unknown | null; dueDate?: string | null; assigneeUserId?: string | null }) {
    const item = await prismaAny.readinessItem.findUnique({
      where: { id: itemId },
      include: { project: { select: { id: true, ownerId: true, orgId: true } } },
    })
    if (!item) throw new NotFoundError('ReadinessItem', itemId)
    if (item.project.ownerId !== userId) throw new AuthorizationError('Only the project owner can update readiness (for now)')

    // Prompt 1.6: Validate type-specific response when provided
    if (input.response !== undefined && input.response !== null) {
      const validation = validateReadinessItemResponse(item.type, input.response)
      if (!validation.valid) {
        throw new ValidationError(validation.error || 'Invalid response format for this readiness item type')
      }
      // Use normalized response
      input.response = validation.normalized
    }

    // Require response when completing DOCUMENT_UPLOAD or QUESTION_ANSWER items
    const newStatus = input.status ?? item.status
    if ((newStatus === ReadinessItemStatus.COMPLETED || newStatus === ReadinessItemStatus.APPROVED) &&
        (item.type === ReadinessItemType.DOCUMENT_UPLOAD || item.type === ReadinessItemType.QUESTION_ANSWER) &&
        !input.response) {
      throw new ValidationError(`Response is required when completing ${item.type} items`)
    }

    const oldStatus = item.status
    const isCompleting = (oldStatus !== ReadinessItemStatus.COMPLETED && oldStatus !== ReadinessItemStatus.APPROVED) &&
      (newStatus === ReadinessItemStatus.COMPLETED || newStatus === ReadinessItemStatus.APPROVED)

    const updated = await prismaAny.readinessItem.update({
      where: { id: itemId },
      data: {
        status: input.status,
        response: input.response === undefined ? undefined : (input.response as any),
        dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null,
        assigneeUserId: input.assigneeUserId === undefined ? undefined : input.assigneeUserId,
        completedAt:
          (newStatus === ReadinessItemStatus.COMPLETED || newStatus === ReadinessItemStatus.APPROVED) && !item.completedAt ? new Date() : undefined,
        approvedAt:
          newStatus === ReadinessItemStatus.APPROVED && !item.approvedAt ? new Date() : undefined,
        approvedById:
          newStatus === ReadinessItemStatus.APPROVED ? userId : undefined,
      },
      include: { evidence: true },
    })

    // Prompt 1.5: Audit logging for completions
    if (isCompleting) {
      await prismaAny.auditLog.create({
        data: {
          action: 'COMPLETE_READINESS_ITEM',
          entityType: 'ReadinessItem',
          entityId: itemId,
          userId,
          reason: `Readiness item "${item.title}" marked as ${newStatus}`,
          before: { status: oldStatus, projectId: item.projectId },
          after: { status: newStatus, projectId: item.projectId },
        },
      })

      await prismaAny.event.create({
        data: {
          type: 'READINESS_ITEM_COMPLETED',
          entityType: 'ReadinessItem',
          entityId: itemId,
          userId,
          orgId: item.project.orgId || null,
          payload: { title: item.title, oldStatus, newStatus, projectId: item.projectId },
        },
      })
    }

    return updated
  },

  async attachEvidenceToReadinessItem(
    itemId: string,
    userId: string,
    input: {
      url: string
      fileName?: string | null
      mimeType?: string | null
      sizeBytes?: number | null
      type?: EvidenceType
      metadata?: unknown | null
    }
  ) {
    const item = await prismaAny.readinessItem.findUnique({
      where: { id: itemId },
      include: { project: { select: { id: true, ownerId: true } } },
    })
    if (!item) throw new NotFoundError('ReadinessItem', itemId)
    if (item.project.ownerId !== userId) throw new AuthorizationError('Only the project owner can upload evidence (for now)')

    const evidence = await prismaAny.evidence.create({
      data: {
        projectId: item.project.id,
        readinessItemId: item.id,
        type: input.type ?? EvidenceType.DOCUMENT,
        url: input.url,
        fileName: input.fileName ?? null,
        mimeType: input.mimeType ?? null,
        sizeBytes: input.sizeBytes ?? null,
        metadata: (input.metadata as any) ?? null,
        createdById: userId,
      },
    })

    return evidence
  },

  // Prompt 1.5: Readiness gate and completion tracking
  async getReadinessCompletion(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) throw new AuthorizationError('Only the project owner can view readiness completion')

    const items = await prismaAny.readinessItem.findMany({
      where: { projectId },
      select: { id: true, required: true, status: true },
    })

    const total = items.length
    const required = items.filter((i) => i.required).length
    const completed = items.filter((i) => i.status === ReadinessItemStatus.APPROVED || i.status === ReadinessItemStatus.COMPLETED).length
    const requiredCompleted = items.filter((i) => i.required && (i.status === ReadinessItemStatus.APPROVED || i.status === ReadinessItemStatus.COMPLETED)).length

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const requiredPercentage = required > 0 ? Math.round((requiredCompleted / required) * 100) : 100
    const allRequiredComplete = required === requiredCompleted

    return {
      total,
      required,
      completed,
      requiredCompleted,
      percentage,
      requiredPercentage,
      allRequiredComplete,
    }
  },

  async checkReadinessGate(projectId: string): Promise<{ canProceed: boolean; reason?: string }> {
    const items = await prismaAny.readinessItem.findMany({
      where: { projectId },
      select: { id: true, title: true, required: true, status: true },
    })

    const requiredItems = items.filter((i) => i.required)
    const incompleteRequired = requiredItems.filter(
      (i) => i.status !== ReadinessItemStatus.APPROVED && i.status !== ReadinessItemStatus.COMPLETED
    )

    if (incompleteRequired.length > 0) {
      return {
        canProceed: false,
        reason: `Cannot proceed to READINESS status: ${incompleteRequired.length} required item(s) incomplete: ${incompleteRequired.map((i) => i.title).join(', ')}`,
      }
    }

    return { canProceed: true }
  },

  async bulkCompleteItems(
    projectId: string,
    userId: string,
    itemIds: string[],
    reason?: string
  ) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    })
    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) throw new AuthorizationError('Only the project owner can bulk complete items')

    const items = await prismaAny.readinessItem.findMany({
      where: { id: { in: itemIds }, projectId },
      include: { project: { select: { id: true } } },
    })

    if (items.length !== itemIds.length) {
      throw new NotFoundError('Some readiness items not found or do not belong to this project')
    }

    const now = new Date()

    // Update items and create audit logs
    const results = await prismaAny.$transaction(
      items.map((item) =>
        prismaAny.readinessItem.update({
          where: { id: item.id },
          data: {
            status: ReadinessItemStatus.COMPLETED,
            completedAt: item.completedAt || now,
            approvedAt: item.approvedAt || now,
            approverUserId: userId,
          },
        })
      )
    )

    // Create audit log for bulk completion
    await prismaAny.auditLog.create({
      data: {
        action: 'BULK_COMPLETE_READINESS_ITEMS',
        entityType: 'Project',
        entityId: projectId,
        userId,
        reason: reason || `Bulk completed ${itemIds.length} readiness item(s)`,
        before: { itemIds, statuses: items.map((i) => ({ id: i.id, status: i.status })) },
        after: { itemIds, statuses: results.map((r) => ({ id: r.id, status: r.status })) },
      },
    })

    // Create event log
    await prismaAny.event.create({
      data: {
        type: 'READINESS_ITEMS_BULK_COMPLETED',
        entityType: 'Project',
        entityId: projectId,
        userId,
        orgId: project.orgId || null,
        payload: { itemIds, count: itemIds.length, reason },
      },
    })

    return results
  },
}

