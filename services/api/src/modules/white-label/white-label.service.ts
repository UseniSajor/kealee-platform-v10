import { randomUUID } from 'node:crypto'
import { prisma } from '../../lib/prisma'
import type {
  CreateEvaluationSuiteInput,
  CreateWhiteLabelTenantInput,
  RecordTenantUsageInput,
  UpdateDeploymentInput,
  UpdateTenantPlanInput,
  UpdateTenantProductsInput,
  UpdateWhiteLabelProfileInput,
} from './white-label.dto'

const db = prisma as any

export interface TenantActor {
  userId: string
  ipAddress?: string
  userAgent?: string
}

function notFound(message: string): Error {
  return Object.assign(new Error(message), { statusCode: 404 })
}

function conflict(message: string): Error {
  return Object.assign(new Error(message), { statusCode: 409 })
}

function normalizeHostname(input: string): string {
  const candidate = input.trim().toLowerCase().replace(/\.$/, '')
  if (candidate.includes('://') || candidate.includes('/') || candidate.includes(':')) {
    throw Object.assign(new Error('Hostname must not contain a protocol, path, or port'), { statusCode: 400 })
  }
  if (!/^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(candidate)) {
    throw Object.assign(new Error('Invalid hostname'), { statusCode: 400 })
  }
  return candidate
}

async function audit(
  orgId: string,
  actor: TenantActor,
  action: string,
  resourceType: string,
  resourceId?: string,
  values?: { beforeData?: unknown; afterData?: unknown; reason?: string; metadata?: unknown },
) {
  await db.tenantAuditEvent.create({
    data: {
      orgId,
      actorUserId: actor.userId,
      actorType: 'PLATFORM_ADMIN',
      action,
      resourceType,
      resourceId,
      reason: values?.reason,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      beforeData: values?.beforeData,
      afterData: values?.afterData,
      metadata: values?.metadata,
    },
  })
}

const tenantInclude = {
  org: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      logo: true,
      _count: { select: { members: true, projects: true, entitlements: true } },
    },
  },
} as const

export async function listWhiteLabelTenants(params: {
  search?: string
  status?: string
  tier?: string
  page: number
  limit: number
}) {
  const where: any = {}
  if (params.status) where.status = params.status
  if (params.tier) where.tier = params.tier
  if (params.search) {
    where.OR = [
      { companyName: { contains: params.search, mode: 'insensitive' } },
      { productName: { contains: params.search, mode: 'insensitive' } },
      { org: { name: { contains: params.search, mode: 'insensitive' } } },
      { org: { slug: { contains: params.search, mode: 'insensitive' } } },
    ]
  }

  const [tenants, total] = await Promise.all([
    db.whiteLabelTenantProfile.findMany({
      where,
      include: tenantInclude,
      orderBy: { updatedAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    db.whiteLabelTenantProfile.count({ where }),
  ])

  const orgIds = tenants.map((tenant: any) => tenant.orgId)
  const [domainCounts, productCounts] = orgIds.length
    ? await Promise.all([
        db.tenantDomain.groupBy({ by: ['orgId'], where: { orgId: { in: orgIds } }, _count: { _all: true } }),
        db.tenantProductAssignment.groupBy({
          by: ['orgId'],
          where: { orgId: { in: orgIds }, enabled: true },
          _count: { _all: true },
        }),
      ])
    : [[], []]
  const domainsByOrg = new Map(domainCounts.map((row: any) => [row.orgId, row._count._all]))
  const productsByOrg = new Map(productCounts.map((row: any) => [row.orgId, row._count._all]))

  return {
    tenants: tenants.map((tenant: any) => ({
      ...tenant,
      domainCount: domainsByOrg.get(tenant.orgId) ?? 0,
      productCount: productsByOrg.get(tenant.orgId) ?? 0,
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  }
}

export async function getWhiteLabelTenant(orgId: string) {
  const profile = await db.whiteLabelTenantProfile.findUnique({
    where: { orgId },
    include: tenantInclude,
  })
  if (!profile) throw notFound('White-label tenant not found')

  const [domains, products, plan, deployment, usageRollups, evaluationSuites, supportAccess] = await Promise.all([
    db.tenantDomain.findMany({ where: { orgId }, orderBy: [{ isPrimary: 'desc' }, { hostname: 'asc' }] }),
    db.tenantProductAssignment.findMany({
      where: { orgId },
      include: { productTemplate: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.tenantPlan.findUnique({ where: { orgId } }),
    db.tenantDeploymentConfig.findUnique({ where: { orgId } }),
    db.tenantUsageRollup.findMany({ where: { orgId }, orderBy: { periodEnd: 'desc' }, take: 50 }),
    db.tenantEvaluationSuite.findMany({
      where: { orgId },
      include: { _count: { select: { cases: true, runs: true } }, runs: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    }),
    db.tenantSupportAccessSession.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 25 }),
  ])

  return { profile, domains, products, plan, deployment, usageRollups, evaluationSuites, supportAccess }
}

export async function createWhiteLabelTenant(input: CreateWhiteLabelTenantInput, actor: TenantActor) {
  const org = await db.org.findUnique({ where: { id: input.orgId }, select: { id: true, slug: true, name: true } })
  if (!org) throw notFound('Professional organization not found')
  const existing = await db.whiteLabelTenantProfile.findUnique({ where: { orgId: input.orgId } })
  if (existing) throw conflict('Organization is already configured as a white-label tenant')

  const templates = input.productKeys.length
    ? await db.whiteLabelProductTemplate.findMany({ where: { key: { in: input.productKeys }, isActive: true } })
    : []
  if (templates.length !== input.productKeys.length) throw notFound('One or more product templates were not found')

  const result = await db.$transaction(async (tx: any) => {
    const profile = await tx.whiteLabelTenantProfile.create({
      data: {
        orgId: org.id,
        companyName: input.companyName,
        productName: input.productName,
        tier: input.tier,
        status: 'PROVISIONING',
        kealeeBrandingVisible: input.tier === 'MANAGED_BRANDED',
        clientAdminEnabled: input.tier !== 'MANAGED_BRANDED',
        provisionedAt: new Date(),
      },
    })
    const plan = await tx.tenantPlan.create({
      data: {
        orgId: org.id,
        planKey: input.planKey,
        planName: input.planName,
        baseMonthlyAmountCents: input.baseMonthlyAmountCents,
      },
    })
    const deployment = await tx.tenantDeploymentConfig.create({
      data: {
        orgId: org.id,
        mode: input.tier === 'PRIVATE_ENTERPRISE' ? 'DEDICATED_KEALEE' : 'SHARED',
        storageNamespace: `tenants/${org.id}`,
        vectorNamespace: `tenant_${org.id.replace(/-/g, '_')}`,
        queueNamespace: `tenant:${org.id}`,
        serviceLevel: input.tier === 'PRIVATE_ENTERPRISE' ? 'ENTERPRISE' : 'STANDARD',
      },
    })
    if (templates.length) {
      await tx.tenantProductAssignment.createMany({
        data: templates.map((template: any) => ({ orgId: org.id, productTemplateId: template.id })),
      })
      const moduleKeys = Array.from(new Set(templates.flatMap((template: any) => template.enabledModuleKeys)))
      await Promise.all(moduleKeys.map((moduleKey) => tx.moduleEntitlement.upsert({
        where: { orgId_moduleKey: { orgId: org.id, moduleKey } },
        update: { enabled: true, enabledAt: new Date(), disabledAt: null },
        create: { orgId: org.id, moduleKey, enabled: true, enabledAt: new Date() },
      })))
    }
    await tx.tenantAuditEvent.create({
      data: {
        orgId: org.id,
        actorUserId: actor.userId,
        actorType: 'PLATFORM_ADMIN',
        action: 'TENANT_CREATED',
        resourceType: 'WHITE_LABEL_TENANT',
        resourceId: profile.id,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
        afterData: { tier: input.tier, productKeys: input.productKeys, planKey: input.planKey },
      },
    })
    return { profile, plan, deployment }
  })
  return result
}

export async function updateWhiteLabelProfile(orgId: string, input: UpdateWhiteLabelProfileInput, actor: TenantActor) {
  const before = await db.whiteLabelTenantProfile.findUnique({ where: { orgId } })
  if (!before) throw notFound('White-label tenant not found')
  const lifecycle: any = { ...input }
  if (input.status === 'ACTIVE' && !before.activatedAt) lifecycle.activatedAt = new Date()
  if (input.status === 'SUSPENDED') lifecycle.suspendedAt = new Date()
  if (input.status && input.status !== 'SUSPENDED') lifecycle.suspendedAt = null
  const profile = await db.whiteLabelTenantProfile.update({ where: { orgId }, data: lifecycle })
  await audit(orgId, actor, 'TENANT_PROFILE_UPDATED', 'WHITE_LABEL_TENANT', profile.id, { beforeData: before, afterData: profile })
  return profile
}

export async function listProductTemplates() {
  return db.whiteLabelProductTemplate.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
}

export async function listTenantDomains(orgId: string) {
  return db.tenantDomain.findMany({ where: { orgId }, orderBy: [{ isPrimary: 'desc' }, { hostname: 'asc' }] })
}

export async function createTenantDomain(orgId: string, input: { hostname: string; isPrimary: boolean }, actor: TenantActor) {
  await ensureTenant(orgId)
  const hostname = normalizeHostname(input.hostname)
  const domain = await db.$transaction(async (tx: any) => {
    if (input.isPrimary) await tx.tenantDomain.updateMany({ where: { orgId, isPrimary: true }, data: { isPrimary: false } })
    return tx.tenantDomain.create({
      data: { orgId, hostname, isPrimary: input.isPrimary, verificationToken: randomUUID() },
    })
  })
  await audit(orgId, actor, 'TENANT_DOMAIN_CREATED', 'TENANT_DOMAIN', domain.id, { afterData: domain })
  return domain
}

export async function updateTenantDomain(
  orgId: string,
  domainId: string,
  input: { status?: string; isPrimary?: boolean; failureReason?: string | null },
  actor: TenantActor,
) {
  const before = await db.tenantDomain.findFirst({ where: { id: domainId, orgId } })
  if (!before) throw notFound('Tenant domain not found')
  const data: any = { ...input }
  if (input.status === 'ACTIVE' && before.status !== 'ACTIVE') data.verifiedAt = new Date()
  data.lastCheckedAt = new Date()
  const domain = await db.$transaction(async (tx: any) => {
    if (input.isPrimary) await tx.tenantDomain.updateMany({ where: { orgId, isPrimary: true, id: { not: domainId } }, data: { isPrimary: false } })
    return tx.tenantDomain.update({ where: { id: domainId }, data })
  })
  await audit(orgId, actor, 'TENANT_DOMAIN_UPDATED', 'TENANT_DOMAIN', domain.id, { beforeData: before, afterData: domain })
  return domain
}

export async function deleteTenantDomain(orgId: string, domainId: string, actor: TenantActor) {
  const domain = await db.tenantDomain.findFirst({ where: { id: domainId, orgId } })
  if (!domain) throw notFound('Tenant domain not found')
  await db.tenantDomain.delete({ where: { id: domainId } })
  await audit(orgId, actor, 'TENANT_DOMAIN_DELETED', 'TENANT_DOMAIN', domain.id, { beforeData: domain })
}

export async function replaceTenantProducts(orgId: string, input: UpdateTenantProductsInput, actor: TenantActor) {
  await ensureTenant(orgId)
  const keys = input.products.map((item) => item.productKey)
  const templates = await db.whiteLabelProductTemplate.findMany({ where: { key: { in: keys }, isActive: true } })
  if (templates.length !== new Set(keys).size) throw notFound('One or more product templates were not found')
  const templateByKey = new Map(templates.map((template: any) => [template.key, template]))

  await db.$transaction(async (tx: any) => {
    const desiredIds = templates.map((template: any) => template.id)
    await tx.tenantProductAssignment.updateMany({
      where: { orgId, productTemplateId: { notIn: desiredIds }, enabled: true },
      data: { enabled: false, disabledAt: new Date() },
    })
    for (const item of input.products) {
      const template: any = templateByKey.get(item.productKey)
      await tx.tenantProductAssignment.upsert({
        where: { orgId_productTemplateId: { orgId, productTemplateId: template.id } },
        update: {
          enabled: item.enabled,
          displayName: item.displayName,
          configuration: item.configuration,
          enabledAt: item.enabled ? new Date() : undefined,
          disabledAt: item.enabled ? null : new Date(),
        },
        create: {
          orgId,
          productTemplateId: template.id,
          enabled: item.enabled,
          displayName: item.displayName,
          configuration: item.configuration,
          disabledAt: item.enabled ? null : new Date(),
        },
      })
    }
    const enabledModuleKeys = Array.from(new Set(input.products
      .filter((item) => item.enabled)
      .flatMap((item) => (templateByKey.get(item.productKey) as any).enabledModuleKeys)))
    for (const moduleKey of enabledModuleKeys) {
      await tx.moduleEntitlement.upsert({
        where: { orgId_moduleKey: { orgId, moduleKey } },
        update: { enabled: true, enabledAt: new Date(), disabledAt: null },
        create: { orgId, moduleKey, enabled: true, enabledAt: new Date() },
      })
    }
  })
  const products = await db.tenantProductAssignment.findMany({ where: { orgId }, include: { productTemplate: true } })
  await audit(orgId, actor, 'TENANT_PRODUCTS_REPLACED', 'TENANT_PRODUCT_ASSIGNMENT', undefined, { afterData: input })
  return products
}

export async function upsertTenantPlan(orgId: string, input: UpdateTenantPlanInput, actor: TenantActor) {
  await ensureTenant(orgId)
  const before = await db.tenantPlan.findUnique({ where: { orgId } })
  const plan = await db.tenantPlan.upsert({
    where: { orgId },
    update: input,
    create: { orgId, ...input },
  })
  await audit(orgId, actor, 'TENANT_PLAN_UPDATED', 'TENANT_PLAN', plan.id, { beforeData: before, afterData: plan })
  return plan
}

export async function recordTenantUsage(orgId: string, input: RecordTenantUsageInput) {
  await ensureTenant(orgId)
  return db.tenantUsageEvent.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    update: {},
    create: { orgId, ...input },
  })
}

export async function getTenantUsage(orgId: string, query: { from?: Date; to?: Date; metric?: string; limit: number }) {
  await ensureTenant(orgId)
  const occurredAt: any = {}
  if (query.from) occurredAt.gte = query.from
  if (query.to) occurredAt.lte = query.to
  const where: any = { orgId }
  if (Object.keys(occurredAt).length) where.occurredAt = occurredAt
  if (query.metric) where.metric = query.metric
  const [events, grouped] = await Promise.all([
    db.tenantUsageEvent.findMany({ where, orderBy: { occurredAt: 'desc' }, take: query.limit }),
    db.tenantUsageEvent.groupBy({
      by: ['metric', 'unit'],
      where,
      _sum: { quantity: true, unitCostCents: true },
      _count: { _all: true },
    }),
  ])
  return { events, summary: grouped }
}

export async function getTenantDeployment(orgId: string) {
  await ensureTenant(orgId)
  return db.tenantDeploymentConfig.findUnique({ where: { orgId } })
}

export async function upsertTenantDeployment(orgId: string, input: UpdateDeploymentInput, actor: TenantActor) {
  const tenant = await ensureTenant(orgId)
  const before = await db.tenantDeploymentConfig.findUnique({ where: { orgId } })
  const defaults = {
    storageNamespace: `tenants/${orgId}`,
    vectorNamespace: `tenant_${orgId.replace(/-/g, '_')}`,
    queueNamespace: `tenant:${orgId}`,
  }
  const deployment = await db.tenantDeploymentConfig.upsert({
    where: { orgId },
    update: input,
    create: { orgId, ...defaults, ...input, mode: input.mode ?? (tenant.tier === 'PRIVATE_ENTERPRISE' ? 'DEDICATED_KEALEE' : 'SHARED') },
  })
  await audit(orgId, actor, 'TENANT_DEPLOYMENT_UPDATED', 'TENANT_DEPLOYMENT', deployment.id, { beforeData: before, afterData: deployment })
  return deployment
}

export async function listEvaluationSuites(orgId: string) {
  await ensureTenant(orgId)
  return db.tenantEvaluationSuite.findMany({
    where: { orgId },
    include: { cases: true, runs: { orderBy: { createdAt: 'desc' }, take: 10 } },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createEvaluationSuite(orgId: string, input: CreateEvaluationSuiteInput, actor: TenantActor) {
  await ensureTenant(orgId)
  const { cases, ...suiteData } = input
  const suite = await db.tenantEvaluationSuite.create({
    data: {
      orgId,
      ...suiteData,
      cases: { create: cases },
    },
    include: { cases: true },
  })
  await audit(orgId, actor, 'EVALUATION_SUITE_CREATED', 'TENANT_EVALUATION_SUITE', suite.id, { afterData: suiteData })
  return suite
}

export async function queueEvaluationRun(orgId: string, suiteId: string, actor: TenantActor) {
  const suite = await db.tenantEvaluationSuite.findFirst({
    where: { id: suiteId, orgId },
    include: { _count: { select: { cases: true } } },
  })
  if (!suite) throw notFound('Evaluation suite not found')
  const run = await db.tenantEvaluationRun.create({
    data: {
      suiteId,
      status: 'QUEUED',
      promptVersion: suite.promptVersion,
      modelVersion: suite.modelVersion,
      totalCases: suite._count.cases,
    },
  })
  await audit(orgId, actor, 'EVALUATION_RUN_QUEUED', 'TENANT_EVALUATION_RUN', run.id, { metadata: { suiteId } })
  return run
}

export async function listSupportAccess(orgId: string) {
  await ensureTenant(orgId)
  return db.tenantSupportAccessSession.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } })
}

export async function createSupportAccess(
  orgId: string,
  input: { reason: string; permissions: string[]; expiresAt: Date },
  actor: TenantActor,
) {
  await ensureTenant(orgId)
  if (input.expiresAt <= new Date()) throw Object.assign(new Error('Support access expiry must be in the future'), { statusCode: 400 })
  const session = await db.tenantSupportAccessSession.create({
    data: { orgId, requestedById: actor.userId, ...input },
  })
  await audit(orgId, actor, 'SUPPORT_ACCESS_REQUESTED', 'TENANT_SUPPORT_ACCESS', session.id, { reason: input.reason, afterData: session })
  return session
}

export async function updateSupportAccess(
  orgId: string,
  sessionId: string,
  input: { action: 'APPROVE' | 'DENY' | 'ACTIVATE' | 'REVOKE'; reason?: string },
  actor: TenantActor,
) {
  const before = await db.tenantSupportAccessSession.findFirst({ where: { id: sessionId, orgId } })
  if (!before) throw notFound('Support access session not found')
  const now = new Date()
  const transitions: Record<string, any> = {
    APPROVE: { status: 'APPROVED', approvedById: actor.userId },
    DENY: { status: 'DENIED', approvedById: actor.userId },
    ACTIVATE: { status: 'ACTIVE', startsAt: now, approvedById: before.approvedById ?? actor.userId },
    REVOKE: { status: 'REVOKED', revokedAt: now, revokedById: actor.userId },
  }
  const session = await db.tenantSupportAccessSession.update({ where: { id: sessionId }, data: transitions[input.action] })
  await audit(orgId, actor, `SUPPORT_ACCESS_${input.action}`, 'TENANT_SUPPORT_ACCESS', session.id, {
    reason: input.reason,
    beforeData: before,
    afterData: session,
  })
  return session
}

async function ensureTenant(orgId: string) {
  const tenant = await db.whiteLabelTenantProfile.findUnique({ where: { orgId } })
  if (!tenant) throw notFound('White-label tenant not found')
  return tenant
}
