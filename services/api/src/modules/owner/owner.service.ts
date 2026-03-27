/**
 * owner.service.ts
 * Owner-scoped project, engagement, readiness, and timeline service.
 * Wraps canonical Project + ContractAgreement models — never replaces them.
 */
import { prisma } from '../../lib/prisma'
import { emitEvent } from '../../lib/emit-event'
import type {
  CreateProjectBody,
  UpdateProjectBody,
  ProjectSummaryDto,
  ProjectDetailDto,
  EngagementSummaryDto,
  EngagementDetailDto,
  TimelineEventDto,
  ReadinessDto,
} from './owner.dto'

const db = prisma as any   // prismaAny alias for strict-TS compatibility

// ─── PROJECTS ────────────────────────────────────────────────────────────────

export async function ownerListProjects(userId: string): Promise<ProjectSummaryDto[]> {
  const rows = await db.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { memberships: { some: { userId, role: 'OWNER' } } },
      ],
    },
    include: {
      memberships: { select: { id: true } },
      contracts: {
        where: { status: { not: 'CANCELLED' } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((p: any) => ({
    id: p.id,
    name: p.name ?? 'Untitled Project',
    category: p.category ?? 'OTHER',
    status: p.status ?? 'ACTIVE',
    currentPhase: p.currentPhase ?? null,
    constructionReadiness: p.constructionReadiness ?? 'NOT_READY',
    budgetTotal: p.budgetTotal ? Number(p.budgetTotal) : null,
    address: p.address ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    scheduledStartDate: p.scheduledStartDate?.toISOString() ?? null,
    scheduledEndDate: p.scheduledEndDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    memberCount: p.memberships.length,
    openEngagements: p.contracts.length,
  }))
}

export async function ownerGetProject(projectId: string, userId: string): Promise<ProjectDetailDto | null> {
  const p = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { memberships: { some: { userId, role: 'OWNER' } } },
      ],
    },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      contracts: {
        where: { status: { not: 'CANCELLED' } },
        select: { id: true },
      },
    },
  })

  if (!p) return null

  // Fetch readiness in parallel
  const readiness = await ownerGetReadiness(projectId, userId)

  // Build phases from project data (using projectPhases if exists, else derived)
  const phases = await _derivePhases(p)

  return {
    id: p.id,
    name: p.name ?? 'Untitled Project',
    category: p.category ?? 'OTHER',
    status: p.status ?? 'ACTIVE',
    currentPhase: p.currentPhase ?? null,
    constructionReadiness: p.constructionReadiness ?? 'NOT_READY',
    budgetTotal: p.budgetTotal ? Number(p.budgetTotal) : null,
    address: p.address ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    scheduledStartDate: p.scheduledStartDate?.toISOString() ?? null,
    scheduledEndDate: p.scheduledEndDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    description: p.description ?? null,
    orgId: p.orgId ?? null,
    ownerId: p.ownerId ?? userId,
    memberCount: p.memberships.length,
    openEngagements: p.contracts.length,
    memberships: p.memberships.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      name: m.user?.name ?? null,
      email: m.user?.email ?? '',
    })),
    phases,
    readiness,
  }
}

export async function ownerCreateProject(userId: string, orgId: string | null, body: CreateProjectBody) {
  // Only allowed with adminOverride or via lead flow
  if (!body.adminOverride) {
    throw Object.assign(new Error('Projects must be created from a WON lead. Use POST /owner/projects with adminOverride=true and adminReason.'), { statusCode: 422 })
  }

  const project = await db.project.create({
    data: {
      name: body.name,
      category: body.category,
      description: body.description,
      budgetTotal: body.budgetTotal,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      scheduledStartDate: body.scheduledStartDate ? new Date(body.scheduledStartDate) : undefined,
      scheduledEndDate: body.scheduledEndDate ? new Date(body.scheduledEndDate) : undefined,
      ownerId: userId,
      orgId,
      status: 'ACTIVE',
      constructionReadiness: 'NOT_READY',
      memberships: {
        create: { userId, role: 'OWNER' },
      },
    },
  })

  // Log audit event
  await _logEvent(project.id, userId, 'PROJECT_CREATED', 'Project created via admin override', {
    adminReason: body.adminReason,
  })

  emitEvent({
    type: 'project.created',
    projectId: project.id,
    initiatorId: userId,
    entity: { type: 'project', id: project.id },
    payload: { projectId: project.id, name: project.name, category: project.category },
  })

  return project
}

export async function ownerUpdateProject(projectId: string, userId: string, body: UpdateProjectBody) {
  // Verify ownership
  const existing = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { memberships: { some: { userId, role: 'OWNER' } } }],
    },
  })
  if (!existing) throw Object.assign(new Error('Project not found or access denied'), { statusCode: 404 })

  return db.project.update({
    where: { id: projectId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.budgetTotal && { budgetTotal: body.budgetTotal }),
      ...(body.address && { address: body.address }),
      ...(body.city && { city: body.city }),
      ...(body.state && { state: body.state }),
      ...(body.scheduledStartDate && { scheduledStartDate: new Date(body.scheduledStartDate) }),
      ...(body.scheduledEndDate && { scheduledEndDate: new Date(body.scheduledEndDate) }),
    },
  })
}

// ─── READINESS ────────────────────────────────────────────────────────────────

export async function ownerGetReadiness(projectId: string, userId: string): Promise<ReadinessDto> {
  // Verify access
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { memberships: { some: { userId, role: 'OWNER' } } }],
    },
    select: { constructionReadiness: true },
  })
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 })

  // Fetch readiness checklist items
  const items = await db.readinessChecklistItem
    ? await db.readinessChecklistItem.findMany({
        where: { projectId },
        orderBy: [{ required: 'desc' }, { category: 'asc' }],
      })
    : []

  const completedItems = items.filter((i: any) => i.status === 'COMPLETED' || i.status === 'READY')
  const gate = project.constructionReadiness ?? 'NOT_READY'

  // Determine if can advance to next gate
  const requiredItems = items.filter((i: any) => i.required)
  const canAdvance = requiredItems.length === 0 || requiredItems.every((i: any) =>
    i.status === 'COMPLETED' || i.status === 'READY' || i.status === 'OVERRIDDEN'
  )

  return {
    gate,
    items: items.map((i: any) => ({
      id: i.id,
      label: i.label ?? i.name ?? 'Checklist item',
      category: i.category ?? 'GENERAL',
      status: i.status ?? 'NOT_STARTED',
      required: i.required ?? false,
      completedAt: i.completedAt?.toISOString() ?? null,
      notes: i.notes ?? null,
    })),
    completedCount: completedItems.length,
    totalCount: items.length,
    canAdvance,
  }
}

export async function ownerAdvanceReadiness(projectId: string, userId: string, targetGate: string, notes?: string) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { memberships: { some: { userId, role: 'OWNER' } } }],
    },
    select: { id: true, constructionReadiness: true },
  })
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 })

  const gateOrder = ['NOT_READY', 'DESIGN_READY', 'PERMITS_SUBMITTED', 'CONSTRUCTION_READY']
  const currentIdx = gateOrder.indexOf(project.constructionReadiness ?? 'NOT_READY')
  const targetIdx = gateOrder.indexOf(targetGate)

  if (targetIdx <= currentIdx) {
    throw Object.assign(new Error('Target gate must be ahead of current gate'), { statusCode: 422 })
  }
  if (targetIdx > currentIdx + 1) {
    throw Object.assign(new Error('Cannot skip readiness gates'), { statusCode: 422 })
  }

  await db.project.update({
    where: { id: projectId },
    data: { constructionReadiness: targetGate },
  })

  await _logEvent(projectId, userId, 'READINESS_ADVANCE', `Readiness advanced to ${targetGate}`, {
    from: project.constructionReadiness,
    to: targetGate,
    notes,
  })

  emitEvent({
    type: 'project.readiness.advanced',
    projectId,
    initiatorId: userId,
    entity: { type: 'project', id: projectId },
    payload: { projectId, from: project.constructionReadiness, to: targetGate },
  })

  return { projectId, gate: targetGate }
}

// ─── ENGAGEMENTS (ContractAgreement wrapper) ──────────────────────────────────

export async function ownerListEngagements(projectId: string, userId: string): Promise<EngagementSummaryDto[]> {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { memberships: { some: { userId, role: 'OWNER' } } }],
    },
    select: { id: true },
  })
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 })

  const contracts = await db.contractAgreement.findMany({
    where: { projectId },
    include: {
      milestones: { select: { amount: true, status: true } },
      escrowAgreement: { select: { currentBalance: true } },
      contractor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return contracts.map((c: any) => {
    const paidAmount = c.milestones
      .filter((m: any) => m.status === 'PAID')
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0)
    const pendingAmount = c.milestones
      .filter((m: any) => m.status !== 'PAID')
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0)

    return {
      id: c.id,
      projectId: c.projectId,
      contractorId: c.contractorId,
      contractorName: c.contractor?.name ?? null,
      amount: Number(c.amount),
      status: c.status,
      signedAt: c.signedAt?.toISOString() ?? null,
      expiresAt: c.expiresAt?.toISOString() ?? null,
      milestoneCount: c.milestones.length,
      paidAmount,
      pendingAmount,
      escrowBalance: c.escrowAgreement ? Number(c.escrowAgreement.currentBalance) : null,
    }
  })
}

export async function ownerGetEngagement(contractId: string, userId: string): Promise<EngagementDetailDto | null> {
  const contract = await db.contractAgreement.findFirst({
    where: {
      id: contractId,
      project: {
        OR: [{ ownerId: userId }, { memberships: { some: { userId, role: 'OWNER' } } }],
      },
    },
    include: {
      contractor: { select: { id: true, name: true } },
      milestones: {
        orderBy: { dependsOnId: 'asc' },
      },
      escrowAgreement: true,
      disputes: { select: { id: true, reason: true, status: true, createdAt: true } },
    },
  })

  if (!contract) return null

  const paidAmount = contract.milestones
    .filter((m: any) => m.status === 'PAID')
    .reduce((sum: number, m: any) => sum + Number(m.amount), 0)
  const pendingAmount = contract.milestones
    .filter((m: any) => m.status !== 'PAID')
    .reduce((sum: number, m: any) => sum + Number(m.amount), 0)

  return {
    id: contract.id,
    projectId: contract.projectId,
    contractorId: contract.contractorId,
    contractorName: contract.contractor?.name ?? null,
    amount: Number(contract.amount),
    status: contract.status,
    signedAt: contract.signedAt?.toISOString() ?? null,
    expiresAt: contract.expiresAt?.toISOString() ?? null,
    milestoneCount: contract.milestones.length,
    paidAmount,
    pendingAmount,
    escrowBalance: contract.escrowAgreement ? Number(contract.escrowAgreement.currentBalance) : null,
    milestones: contract.milestones.map((m: any, idx: number) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? null,
      amount: Number(m.amount),
      status: m.status,
      completedAt: m.completedAt?.toISOString() ?? null,
      approvedAt: m.approvedAt?.toISOString() ?? null,
      paidAt: m.paidAt?.toISOString() ?? null,
      order: idx + 1,
    })),
    escrow: contract.escrowAgreement
      ? {
          id: contract.escrowAgreement.id,
          status: contract.escrowAgreement.status,
          totalContractAmount: Number(contract.escrowAgreement.totalContractAmount),
          currentBalance: Number(contract.escrowAgreement.currentBalance),
          availableBalance: Number(contract.escrowAgreement.availableBalance),
          heldBalance: Number(contract.escrowAgreement.heldBalance),
          holdbackPercentage: contract.escrowAgreement.holdbackPercentage,
        }
      : null,
    disputes: contract.disputes.map((d: any) => ({
      id: d.id,
      reason: d.reason,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
  }
}

// ─── TIMELINE ────────────────────────────────────────────────────────────────

export async function ownerGetTimeline(projectId: string, userId: string): Promise<TimelineEventDto[]> {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { memberships: { some: { userId, role: 'OWNER' } } }],
    },
    select: { id: true, createdAt: true, ownerId: true },
  })
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 })

  // Collect timeline events from audit logs if available
  const events: TimelineEventDto[] = []

  // Project creation event
  events.push({
    id: `created-${project.id}`,
    type: 'PROJECT_CREATED',
    title: 'Project Created',
    description: null,
    occurredAt: project.createdAt.toISOString(),
    actorId: project.ownerId,
    actorName: null,
    metadata: {},
  })

  // Try to get audit log events
  try {
    const auditLogs = await db.auditLog?.findMany({
      where: { entityId: projectId, entityType: 'PROJECT' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    if (auditLogs) {
      for (const log of auditLogs) {
        events.push({
          id: log.id,
          type: log.action as TimelineEventDto['type'],
          title: log.action?.replace(/_/g, ' ') ?? 'Event',
          description: log.description ?? null,
          occurredAt: log.createdAt.toISOString(),
          actorId: log.userId ?? null,
          actorName: null,
          metadata: (log.metadata as Record<string, unknown>) ?? {},
        })
      }
    }
  } catch {
    // auditLog model may not exist — graceful fallback
  }

  // Contract creation events
  try {
    const contracts = await db.contractAgreement.findMany({
      where: { projectId },
      select: { id: true, createdAt: true, contractorId: true, amount: true },
      orderBy: { createdAt: 'asc' },
    })
    for (const c of contracts) {
      events.push({
        id: `engagement-${c.id}`,
        type: 'ENGAGEMENT_CREATED',
        title: 'Contractor Engagement Created',
        description: `Contract value: $${Number(c.amount).toLocaleString()}`,
        occurredAt: c.createdAt.toISOString(),
        actorId: c.contractorId,
        actorName: null,
        metadata: { contractId: c.id, amount: Number(c.amount) },
      })
    }
  } catch { /* ignore */ }

  // Sort by date desc
  return events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function _derivePhases(p: any) {
  // Try projectPhases relation first; fall back to derived from currentPhase
  try {
    if (p.phases?.length) {
      return p.phases.map((ph: any, i: number) => ({
        id: ph.id,
        name: ph.name,
        status: ph.status,
        order: ph.order ?? i + 1,
        startedAt: ph.startedAt?.toISOString() ?? null,
        completedAt: ph.completedAt?.toISOString() ?? null,
      }))
    }
  } catch { /* ignore */ }

  // Derive from enum phases
  const ORDERED_PHASES = [
    'IDEA', 'LAND', 'FEASIBILITY', 'DESIGN', 'PERMITS',
    'PRE_CONSTRUCTION', 'CONSTRUCTION', 'INSPECTIONS',
    'PAYMENTS', 'CLOSEOUT', 'OPERATIONS',
  ]
  const currentIdx = ORDERED_PHASES.indexOf(p.currentPhase ?? 'IDEA')
  return ORDERED_PHASES.map((name, i) => ({
    id: `phase-${i}`,
    name,
    status: i < currentIdx ? 'COMPLETED' : i === currentIdx ? 'IN_PROGRESS' : 'NOT_STARTED',
    order: i + 1,
    startedAt: null,
    completedAt: null,
  }))
}

async function _logEvent(
  projectId: string,
  userId: string,
  action: string,
  description: string,
  metadata: Record<string, unknown>
) {
  try {
    await db.auditLog?.create({
      data: { entityId: projectId, entityType: 'PROJECT', userId, action, description, metadata },
    })
  } catch { /* auditLog may not exist — silent fail */ }
}
