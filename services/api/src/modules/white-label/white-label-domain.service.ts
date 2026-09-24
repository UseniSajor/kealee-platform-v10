import { prisma } from '../../lib/prisma'
import type { TenantActor } from './white-label.service'

const db = prisma as any

function vercelConfiguration() {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.WHITE_LABEL_VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID
  if (!token || !projectId) {
    throw Object.assign(new Error('Vercel domain provisioning is not configured'), { statusCode: 503 })
  }
  return { token, projectId, teamId }
}

async function vercelRequest(path: string, init: RequestInit = {}) {
  const { token, teamId } = vercelConfiguration()
  const url = new URL(`https://api.vercel.com${path}`)
  if (teamId) url.searchParams.set('teamId', teamId)
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const payload: any = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `Vercel domain request failed (${response.status})`
    throw Object.assign(new Error(message), { statusCode: response.status >= 500 ? 502 : 409, providerStatus: response.status })
  }
  return payload
}

async function domainForTenant(orgId: string, domainId: string) {
  const domain = await db.tenantDomain.findFirst({ where: { id: domainId, orgId } })
  if (!domain) throw Object.assign(new Error('Tenant domain not found'), { statusCode: 404 })
  return domain
}

async function writeAudit(orgId: string, actor: TenantActor, action: string, domain: any, metadata?: unknown) {
  await db.tenantAuditEvent.create({ data: {
    orgId,
    actorUserId: actor.userId,
    actorType: 'PLATFORM_ADMIN',
    action,
    resourceType: 'TENANT_DOMAIN',
    resourceId: domain.id,
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
    metadata,
  } })
}

export async function provisionTenantDomain(orgId: string, domainId: string, actor: TenantActor) {
  const domain = await domainForTenant(orgId, domainId)
  const { projectId } = vercelConfiguration()
  let result: any
  try {
    result = await vercelRequest(`/v9/projects/${encodeURIComponent(projectId)}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: domain.hostname }),
    })
  } catch (error: any) {
    // A domain already attached to this project is safe to reconcile through GET.
    if (error.providerStatus !== 409) throw error
    result = await vercelRequest(`/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain.hostname)}`)
  }
  const updated = await db.tenantDomain.update({
    where: { id: domain.id },
    data: {
      status: result.verified ? 'ACTIVE' : 'VERIFYING',
      provider: 'VERCEL',
      providerProjectId: projectId,
      verificationRecords: result.verification ?? null,
      certificateStatus: result.verified ? 'PROVISIONING' : 'WAITING_FOR_DNS',
      verifiedAt: result.verified ? new Date() : null,
      lastCheckedAt: new Date(),
      lastProvisionedAt: new Date(),
      failureReason: null,
    },
  })
  await writeAudit(orgId, actor, 'TENANT_DOMAIN_PROVISIONED', updated, { verified: Boolean(result.verified) })
  return updated
}

export async function verifyProvisionedTenantDomain(orgId: string, domainId: string, actor: TenantActor) {
  const domain = await domainForTenant(orgId, domainId)
  const { projectId } = vercelConfiguration()
  try {
    const result = await vercelRequest(`/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain.hostname)}/verify`, { method: 'POST' })
    const updated = await db.tenantDomain.update({
      where: { id: domain.id },
      data: {
        status: result.verified ? 'ACTIVE' : 'VERIFYING',
        verificationRecords: result.verification ?? domain.verificationRecords,
        certificateStatus: result.verified ? 'ACTIVE' : 'WAITING_FOR_DNS',
        verifiedAt: result.verified ? new Date() : null,
        lastCheckedAt: new Date(),
        failureReason: null,
      },
    })
    await writeAudit(orgId, actor, 'TENANT_DOMAIN_VERIFIED', updated, { verified: Boolean(result.verified) })
    return updated
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db.tenantDomain.update({ where: { id: domain.id }, data: { status: 'FAILED', lastCheckedAt: new Date(), failureReason: message } })
    throw error
  }
}

export async function deprovisionTenantDomain(orgId: string, domainId: string, actor: TenantActor) {
  const domain = await domainForTenant(orgId, domainId)
  if (domain.providerProjectId && process.env.VERCEL_TOKEN) {
    await vercelRequest(`/v9/projects/${encodeURIComponent(domain.providerProjectId)}/domains/${encodeURIComponent(domain.hostname)}`, { method: 'DELETE' })
  }
  await writeAudit(orgId, actor, 'TENANT_DOMAIN_DEPROVISIONED', domain)
  return domain
}
