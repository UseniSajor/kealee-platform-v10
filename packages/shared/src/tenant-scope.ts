export type TenantAudience = 'PLATFORM' | 'PROFESSIONAL' | 'HOMEOWNER' | 'SERVICE'

export interface TenantExecutionContext {
  orgId: string
  actorUserId?: string
  audience: TenantAudience
  correlationId: string
  projectId?: string
  supportAccessSessionId?: string
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/

function safeSegment(value: string, label: string): string {
  if (!SAFE_ID.test(value)) throw new Error(`Invalid ${label}`)
  return value
}

export function requireTenantExecutionContext(value: Partial<TenantExecutionContext>): TenantExecutionContext {
  if (!value.orgId || !value.audience || !value.correlationId) throw new Error('Tenant execution context is incomplete')
  if (value.audience === 'HOMEOWNER' && !value.projectId) throw new Error('Homeowner tenant context requires project scope')
  safeSegment(value.orgId, 'tenant organization ID')
  safeSegment(value.correlationId, 'tenant correlation ID')
  if (value.projectId) safeSegment(value.projectId, 'tenant project ID')
  return value as TenantExecutionContext
}

export function tenantStorageKey(context: TenantExecutionContext, relativeKey: string): string {
  requireTenantExecutionContext(context)
  const clean = relativeKey.replace(/^\/+/, '')
  if (!clean || clean.split('/').some((part) => !part || part === '.' || part === '..')) throw new Error('Invalid tenant storage key')
  return `tenants/${context.orgId}/${clean}`
}

export function tenantQueueName(context: TenantExecutionContext, workload: string): string {
  requireTenantExecutionContext(context)
  return `tenant:${context.orgId}:${safeSegment(workload, 'tenant workload')}`
}

export function tenantVectorNamespace(context: TenantExecutionContext, collection = 'knowledge'): string {
  requireTenantExecutionContext(context)
  return `tenant_${context.orgId.replace(/-/g, '_')}__${safeSegment(collection, 'vector collection')}`
}

export function tenantCacheKey(context: TenantExecutionContext, resource: string, id: string): string {
  requireTenantExecutionContext(context)
  return `tenant:${context.orgId}:cache:${safeSegment(resource, 'cache resource')}:${safeSegment(id, 'cache resource ID')}`
}

export function tenantJobPayload<T extends Record<string, unknown>>(context: TenantExecutionContext, payload: T) {
  const verified = requireTenantExecutionContext(context)
  if ('orgId' in payload && payload.orgId !== verified.orgId) throw new Error('Conflicting tenant ID in job payload')
  return Object.freeze({ ...payload, tenantContext: Object.freeze({ ...verified }) })
}
