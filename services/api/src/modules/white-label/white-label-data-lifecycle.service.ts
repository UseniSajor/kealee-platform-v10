import { createHash } from 'node:crypto'
import { prisma } from '../../lib/prisma'
import type { CreateTenantDataRequestInput, ReviewTenantDataRequestInput } from './white-label.dto'
import type { TenantActor } from './white-label.service'

const db = prisma as any
const ACTIVE_REQUEST_STATUSES = ['REQUESTED', 'APPROVED', 'PROCESSING'] as const

type DataRequestActor = TenantActor & { actorType: 'PLATFORM_ADMIN' | 'TENANT_ADMIN' }

function lifecycleError(message: string, statusCode: number): Error {
  return Object.assign(new Error(message), { statusCode })
}

async function ensureWhiteLabelTenant(orgId: string) {
  const profile = await db.whiteLabelTenantProfile.findUnique({
    where: { orgId },
    select: { id: true, status: true },
  })
  if (!profile) throw lifecycleError('White-label tenant not found', 404)
  return profile
}

async function lifecycleAudit(
  orgId: string,
  actor: DataRequestActor,
  action: string,
  requestId: string,
  values?: { reason?: string; metadata?: unknown },
) {
  await db.tenantAuditEvent.create({
    data: {
      orgId,
      actorUserId: actor.userId,
      actorType: actor.actorType,
      action,
      resourceType: 'TENANT_DATA_LIFECYCLE_REQUEST',
      resourceId: requestId,
      reason: values?.reason,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      metadata: values?.metadata,
    },
  })
}

export async function listTenantDataRequests(orgId: string) {
  await ensureWhiteLabelTenant(orgId)
  return db.tenantDataLifecycleRequest.findMany({
    where: { orgId },
    select: {
      id: true,
      orgId: true,
      requestType: true,
      status: true,
      scope: true,
      requestedById: true,
      requestedByType: true,
      requestReason: true,
      requestedRetentionDays: true,
      effectiveRetentionDays: true,
      scheduledFor: true,
      approvedById: true,
      approvalReason: true,
      approvedAt: true,
      rejectedAt: true,
      processingStartedAt: true,
      completedAt: true,
      failedAt: true,
      failureReason: true,
      exportSha256: true,
      exportExpiresAt: true,
      executionSummary: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createTenantDataRequest(
  orgId: string,
  input: CreateTenantDataRequestInput,
  actor: DataRequestActor,
  options: { autoApproveTenantExport?: boolean } = {},
) {
  await ensureWhiteLabelTenant(orgId)
  const active = await db.tenantDataLifecycleRequest.findFirst({
    where: { orgId, requestType: input.requestType, status: { in: [...ACTIVE_REQUEST_STATUSES] } },
    select: { id: true },
  })
  if (active) throw lifecycleError(`An active ${input.requestType.toLowerCase()} request already exists`, 409)

  const autoApprove = input.requestType === 'DATA_EXPORT'
    && actor.actorType === 'TENANT_ADMIN'
    && options.autoApproveTenantExport === true
  const now = new Date()
  const request = await db.tenantDataLifecycleRequest.create({
    data: {
      orgId,
      requestType: input.requestType,
      requestedById: actor.userId,
      requestedByType: actor.actorType,
      requestReason: input.reason,
      requestedRetentionDays: input.requestType === 'RETENTION_CHANGE' ? input.requestedRetentionDays : null,
      status: autoApprove ? 'APPROVED' : 'REQUESTED',
      approvedById: autoApprove ? actor.userId : null,
      approvalReason: autoApprove ? 'Tenant administrator self-service control-plane export' : null,
      approvedAt: autoApprove ? now : null,
      scheduledFor: autoApprove ? now : null,
      executionSummary: input.requestType === 'DATA_EXPORT'
        ? { exportExpiresInHours: input.exportExpiresInHours ?? 24 }
        : undefined,
    },
  })
  await lifecycleAudit(orgId, actor, 'TENANT_DATA_REQUEST_CREATED', request.id, {
    reason: input.reason,
    metadata: { requestType: input.requestType, autoApproved: autoApprove },
  })
  return request
}

export async function reviewTenantDataRequest(
  orgId: string,
  requestId: string,
  input: ReviewTenantDataRequestInput,
  actor: DataRequestActor,
) {
  const current = await db.tenantDataLifecycleRequest.findFirst({ where: { id: requestId, orgId } })
  if (!current) throw lifecycleError('Tenant data request not found', 404)
  if (current.status !== 'REQUESTED') throw lifecycleError('Only requested data workflows can be reviewed', 409)

  const now = new Date()
  const request = await db.tenantDataLifecycleRequest.update({
    where: { id: requestId },
    data: input.action === 'APPROVE'
      ? {
          status: 'APPROVED',
          approvedById: actor.userId,
          approvalReason: input.reason,
          approvedAt: now,
          scheduledFor: input.scheduledFor ?? now,
        }
      : {
          status: 'REJECTED',
          approvedById: actor.userId,
          approvalReason: input.reason,
          rejectedAt: now,
        },
  })
  await lifecycleAudit(orgId, actor, `TENANT_DATA_REQUEST_${input.action}D`, requestId, {
    reason: input.reason,
    metadata: { scheduledFor: request.scheduledFor },
  })
  return request
}

export async function cancelTenantDataRequest(
  orgId: string,
  requestId: string,
  reason: string,
  actor: DataRequestActor,
) {
  const result = await db.tenantDataLifecycleRequest.updateMany({
    where: { id: requestId, orgId, status: { in: ['REQUESTED', 'APPROVED'] } },
    data: { status: 'CANCELLED', failureReason: reason },
  })
  if (result.count !== 1) throw lifecycleError('Only requested or approved data workflows can be cancelled', 409)
  await lifecycleAudit(orgId, actor, 'TENANT_DATA_REQUEST_CANCELLED', requestId, { reason })
  return db.tenantDataLifecycleRequest.findUnique({ where: { id: requestId } })
}

async function loadControlPlaneExport(orgId: string, requestId: string) {
  const [org, profile, domains, products, plan, deployment, usageRollups, evaluationSuites, auditEvents, requests] = await Promise.all([
    db.org.findUnique({
      where: { id: orgId },
      select: { id: true, tenantKind: true, name: true, slug: true, description: true, logo: true, status: true, createdAt: true, updatedAt: true },
    }),
    db.whiteLabelTenantProfile.findUnique({ where: { orgId } }),
    db.tenantDomain.findMany({
      where: { orgId },
      select: { id: true, hostname: true, status: true, isPrimary: true, provider: true, verifiedAt: true, createdAt: true, updatedAt: true },
    }),
    db.tenantProductAssignment.findMany({
      where: { orgId },
      include: { productTemplate: { select: { key: true, name: true, version: true } } },
    }),
    db.tenantPlan.findUnique({
      where: { orgId },
      select: {
        id: true, planKey: true, planName: true, baseMonthlyAmountCents: true, supportTier: true,
        includedUsage: true, overageRates: true, billingStatus: true, currentPeriodStart: true,
        currentPeriodEnd: true, cancelAtPeriodEnd: true, createdAt: true, updatedAt: true,
      },
    }),
    db.tenantDeploymentConfig.findUnique({
      where: { orgId },
      select: {
        id: true, mode: true, storageNamespace: true, vectorNamespace: true, queueNamespace: true,
        region: true, dataRetentionDays: true, backupPolicy: true, securityControls: true,
        serviceLevel: true, createdAt: true, updatedAt: true,
      },
    }),
    db.tenantUsageRollup.findMany({ where: { orgId }, orderBy: { periodStart: 'asc' } }),
    db.tenantEvaluationSuite.findMany({
      where: { orgId },
      include: { cases: true, runs: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    }),
    db.tenantAuditEvent.findMany({
      where: { orgId },
      select: {
        id: true, actorType: true, action: true, resourceType: true, resourceId: true,
        reason: true, beforeData: true, afterData: true, metadata: true, occurredAt: true,
      },
      orderBy: { occurredAt: 'asc' },
    }),
    db.tenantDataLifecycleRequest.findMany({
      where: { orgId },
      select: {
        id: true, requestType: true, status: true, scope: true, requestedByType: true,
        requestReason: true, requestedRetentionDays: true, effectiveRetentionDays: true,
        scheduledFor: true, approvalReason: true, approvedAt: true, rejectedAt: true,
        processingStartedAt: true, completedAt: true, failedAt: true, failureReason: true,
        exportSha256: true, exportExpiresAt: true, createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return {
    format: 'kealee-white-label-control-plane-export',
    version: 1,
    requestId,
    orgId,
    generatedAt: new Date().toISOString(),
    scope: 'WHITE_LABEL_CONTROL_PLANE',
    exclusions: [
      'homeowner and project data',
      'raw usage events',
      'secret values and vault references',
      'provider credentials',
      'platform support network identifiers',
    ],
    data: { org, profile, domains, products, plan, deployment, usageRollups, evaluationSuites, auditEvents, lifecycleRequests: requests },
  }
}

export async function executeTenantDataExport(orgId: string, requestId: string, actor: DataRequestActor) {
  const transition = await db.tenantDataLifecycleRequest.updateMany({
    where: { id: requestId, orgId, requestType: 'DATA_EXPORT', status: 'APPROVED' },
    data: { status: 'PROCESSING', processingStartedAt: new Date(), failureReason: null, failedAt: null },
  })
  if (transition.count !== 1) throw lifecycleError('Approved tenant export request not found or already processed', 409)

  try {
    const request = await db.tenantDataLifecycleRequest.findUnique({ where: { id: requestId } })
    const payload = await loadControlPlaneExport(orgId, requestId)
    const serialized = JSON.stringify(payload)
    const sha256 = createHash('sha256').update(serialized).digest('hex')
    const requestedHours = Number(request?.executionSummary?.exportExpiresInHours ?? 24)
    const expiresInHours = Number.isFinite(requestedHours) ? Math.min(168, Math.max(1, requestedHours)) : 24
    const exportExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    const completed = await db.tenantDataLifecycleRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        exportPayload: payload,
        exportSha256: sha256,
        exportExpiresAt,
        completedAt: new Date(),
        executionSummary: { format: payload.format, version: payload.version, exportExpiresInHours: expiresInHours },
      },
    })
    await lifecycleAudit(orgId, actor, 'TENANT_DATA_EXPORT_COMPLETED', requestId, { metadata: { sha256, exportExpiresAt } })
    return completed
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tenant export failed'
    await db.tenantDataLifecycleRequest.update({
      where: { id: requestId },
      data: { status: 'FAILED', failedAt: new Date(), failureReason: message },
    })
    throw error
  }
}

export async function getTenantDataExport(orgId: string, requestId: string) {
  const request = await db.tenantDataLifecycleRequest.findFirst({
    where: { id: requestId, orgId, requestType: 'DATA_EXPORT' },
  })
  if (!request) throw lifecycleError('Tenant export request not found', 404)
  if (request.status !== 'COMPLETED' || !request.exportPayload) {
    throw lifecycleError('Tenant export is not ready', 409)
  }
  if (!request.exportExpiresAt || request.exportExpiresAt.getTime() <= Date.now()) {
    throw lifecycleError('Tenant export has expired', 410)
  }
  return { payload: request.exportPayload, sha256: request.exportSha256, expiresAt: request.exportExpiresAt }
}

export async function purgeExpiredTenantExports(orgId: string, actor: DataRequestActor) {
  await ensureWhiteLabelTenant(orgId)
  const result = await db.tenantDataLifecycleRequest.updateMany({
    where: { orgId, requestType: 'DATA_EXPORT', exportExpiresAt: { lte: new Date() }, exportPayload: { not: null } },
    data: { exportPayload: null },
  })
  await lifecycleAudit(orgId, actor, 'TENANT_DATA_EXPORTS_PURGED', orgId, { metadata: { count: result.count } })
  return { purged: result.count }
}

export function assertTenantDeletionConfirmation(orgId: string, confirmation: string) {
  const expected = `DELETE WHITE-LABEL TENANT ${orgId}`
  if (confirmation !== expected) throw lifecycleError(`Confirmation must exactly match: ${expected}`, 400)
}

export async function executeTenantDataDeletion(
  orgId: string,
  requestId: string,
  confirmation: string,
  reason: string,
  actor: DataRequestActor,
) {
  assertTenantDeletionConfirmation(orgId, confirmation)
  const request = await db.tenantDataLifecycleRequest.findFirst({ where: { id: requestId, orgId } })
  if (!request || request.requestType !== 'DATA_DELETION') throw lifecycleError('Tenant deletion request not found', 404)
  if (request.status !== 'APPROVED') throw lifecycleError('Tenant deletion request is not approved', 409)
  if (request.scheduledFor && request.scheduledFor.getTime() > Date.now()) {
    throw lifecycleError('Tenant deletion request is not yet scheduled for execution', 409)
  }

  const [externalDomain, deployment, plan, secretReferenceCount] = await Promise.all([
    db.tenantDomain.findFirst({ where: { orgId, providerProjectId: { not: null } }, select: { id: true } }),
    db.tenantDeploymentConfig.findUnique({ where: { orgId } }),
    db.tenantPlan.findUnique({ where: { orgId } }),
    db.tenantSecretReference.count({ where: { orgId } }),
  ])
  if (externalDomain) throw lifecycleError('Deprovision all provider-managed custom domains before deletion', 409)
  if (secretReferenceCount > 0) {
    throw lifecycleError('Revoke tenant provider secrets and remove their vault references before deletion', 409)
  }
  if (deployment && deployment.mode !== 'SHARED' && (deployment.environmentKey || deployment.databaseRef)) {
    throw lifecycleError('Decommission the dedicated tenant environment before deletion', 409)
  }
  const inactiveBillingStatuses = new Set(['DRAFT', 'INACTIVE', 'CANCELED', 'CANCELLED', 'ENDED'])
  if (plan?.stripeSubscriptionId && !inactiveBillingStatuses.has(String(plan.billingStatus).toUpperCase())) {
    throw lifecycleError('Cancel the active tenant subscription before deletion', 409)
  }

  const transition = await db.tenantDataLifecycleRequest.updateMany({
    where: { id: requestId, orgId, requestType: 'DATA_DELETION', status: 'APPROVED' },
    data: { status: 'PROCESSING', processingStartedAt: new Date(), failureReason: null, failedAt: null },
  })
  if (transition.count !== 1) throw lifecycleError('Tenant deletion request is already being processed', 409)

  try {
    const summary = await db.$transaction(async (tx: any) => {
      const deleted: Record<string, number> = {}
      deleted.domains = (await tx.tenantDomain.deleteMany({ where: { orgId } })).count
      deleted.productAssignments = (await tx.tenantProductAssignment.deleteMany({ where: { orgId } })).count
      deleted.usageEvents = (await tx.tenantUsageEvent.deleteMany({ where: { orgId } })).count
      deleted.usageRollups = (await tx.tenantUsageRollup.deleteMany({ where: { orgId } })).count
      deleted.evaluationSuites = (await tx.tenantEvaluationSuite.deleteMany({ where: { orgId } })).count
      deleted.supportSessions = (await tx.tenantSupportAccessSession.deleteMany({ where: { orgId } })).count
      deleted.plans = (await tx.tenantPlan.deleteMany({ where: { orgId } })).count
      deleted.deployments = (await tx.tenantDeploymentConfig.deleteMany({ where: { orgId } })).count
      deleted.profiles = (await tx.whiteLabelTenantProfile.deleteMany({ where: { orgId } })).count
      await tx.org.update({ where: { id: orgId }, data: { status: 'ARCHIVED' } })
      const executionSummary = {
        scope: 'WHITE_LABEL_CONTROL_PLANE',
        deleted,
        retainedForCompliance: ['tenant_data_lifecycle_requests', 'tenant_audit_events'],
        operationalAndProjectDataDeleted: false,
      }
      await tx.tenantDataLifecycleRequest.update({
        where: { id: requestId },
        data: { status: 'COMPLETED', completedAt: new Date(), executionSummary },
      })
      return executionSummary
    })
    await lifecycleAudit(orgId, actor, 'TENANT_DATA_DELETION_COMPLETED', requestId, { reason, metadata: summary })
    return db.tenantDataLifecycleRequest.findUnique({ where: { id: requestId } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tenant deletion failed'
    await db.tenantDataLifecycleRequest.update({
      where: { id: requestId },
      data: { status: 'FAILED', failedAt: new Date(), failureReason: message },
    })
    throw error
  }
}

export async function executeTenantRetentionChange(orgId: string, requestId: string, actor: DataRequestActor) {
  const request = await db.tenantDataLifecycleRequest.findFirst({ where: { id: requestId, orgId } })
  if (!request || request.requestType !== 'RETENTION_CHANGE') throw lifecycleError('Tenant retention request not found', 404)
  if (request.status !== 'APPROVED') throw lifecycleError('Tenant retention request is not approved', 409)
  if (!request.requestedRetentionDays) throw lifecycleError('Requested retention days are missing', 409)
  if (request.scheduledFor && request.scheduledFor.getTime() > Date.now()) {
    throw lifecycleError('Tenant retention request is not yet scheduled for execution', 409)
  }

  const transition = await db.tenantDataLifecycleRequest.updateMany({
    where: { id: requestId, orgId, requestType: 'RETENTION_CHANGE', status: 'APPROVED' },
    data: { status: 'PROCESSING', processingStartedAt: new Date(), failureReason: null, failedAt: null },
  })
  if (transition.count !== 1) throw lifecycleError('Tenant retention request is already being processed', 409)

  try {
    const completed = await db.$transaction(async (tx: any) => {
      const before = await tx.tenantDeploymentConfig.findUnique({ where: { orgId } })
      await tx.tenantDeploymentConfig.upsert({
        where: { orgId },
        update: { dataRetentionDays: request.requestedRetentionDays },
        create: {
          orgId,
          storageNamespace: `tenants/${orgId}`,
          vectorNamespace: `tenant_${orgId.replace(/-/g, '_')}`,
          queueNamespace: `tenant:${orgId}`,
          dataRetentionDays: request.requestedRetentionDays,
        },
      })
      return tx.tenantDataLifecycleRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          effectiveRetentionDays: request.requestedRetentionDays,
          completedAt: new Date(),
          executionSummary: { previousRetentionDays: before?.dataRetentionDays ?? null, effectiveRetentionDays: request.requestedRetentionDays },
        },
      })
    })
    await lifecycleAudit(orgId, actor, 'TENANT_RETENTION_CHANGE_COMPLETED', requestId, {
      metadata: { effectiveRetentionDays: request.requestedRetentionDays },
    })
    return completed
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tenant retention change failed'
    await db.tenantDataLifecycleRequest.update({
      where: { id: requestId },
      data: { status: 'FAILED', failedAt: new Date(), failureReason: message },
    })
    throw error
  }
}
