/** Tenant selectors are untrusted until matched to an authenticated membership. */
export function getRequestedOrgId(request: {
  headers?: Record<string, unknown>; params?: unknown; query?: unknown; body?: unknown
}): string | undefined {
  const values: unknown[] = [request.headers?.['x-kealee-org-id']]
  for (const source of [request.params, request.query, request.body]) {
    if (source && typeof source === 'object') {
      const record = source as Record<string, unknown>
      values.push(record.orgId, record.org_id)
    }
  }
  const selectors = values.filter(value => value !== undefined && value !== null)
  if (selectors.some(value => typeof value !== 'string' || !value.trim() || value.length > 200)) {
    throw Object.assign(new Error('Invalid organization selector'), { statusCode: 400 })
  }
  const unique = new Set((selectors as string[]).map(value => value.trim()))
  if (unique.size > 1) {
    throw Object.assign(new Error('Conflicting organization selectors'), { statusCode: 400 })
  }
  return unique.values().next().value
}

export function isHomeownerRole(role?: string | null): boolean {
  return ['HOMEOWNER', 'HOME_OWNER', 'CLIENT', 'CUSTOMER'].includes((role || '').toUpperCase())
}

export function isPlatformRole(role?: string | null): boolean {
  return ['PLATFORM_OWNER', 'SUPER_ADMIN', 'OPS_ADMIN'].includes((role || '').toUpperCase())
}

export function resolveOrganizationMembership<T extends {
  orgId: string; roleKey: string; org?: { id: string; status?: string | null }
}>(user: { role?: string | null; orgMemberships?: T[] }, orgId?: string): T | undefined {
  if (!orgId) return undefined
  if (isHomeownerRole(user.role)) {
    throw Object.assign(new Error('Homeowner access is limited to shared projects'), { statusCode: 403 })
  }
  const membership = user.orgMemberships?.find(candidate => candidate.orgId === orgId)
  if (!membership || (membership.org?.status && membership.org.status !== 'ACTIVE')) {
    throw Object.assign(new Error('Organization membership required'), { statusCode: 403 })
  }
  return membership
}
