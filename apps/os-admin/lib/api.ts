import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  headers?: Record<string, string>
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch {
    return null
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = await getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.error?.message || error.message || 'Request failed')
  }

  return response.json()
}

// API methods (rest of the file remains the same)
export const api = {
  // Auth
  getMe: () => apiRequest<{ user: any }>('/auth/me'),
  signup: (data: { email: string; password: string; name: string }) =>
    apiRequest<{ user: any; session: any }>('/auth/signup', { method: 'POST', body: data }),

  // Users
  getUsers: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.status) query.append('status', params.status)
    if (params?.search) query.append('search', params.search)
    return apiRequest<{ users: any[]; pagination: any }>(`/users?${query.toString()}`)
  },
  getUser: (id: string) => apiRequest<{ user: any }>(`/users/${id}`),
  getUserOrgs: (id: string) => apiRequest<{ orgs: any[] }>(`/users/${id}/orgs`),

  // Organizations
  getOrgs: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.status) query.append('status', params.status)
    if (params?.search) query.append('search', params.search)
    return apiRequest<{ orgs: any[]; pagination: any }>(`/orgs?${query.toString()}`)
  },
  getOrg: (id: string) => apiRequest<{ org: any }>(`/orgs/${id}`),
  createOrg: (data: { name: string; slug: string; description?: string; logo?: string }) =>
    apiRequest<{ org: any }>('/orgs', { method: 'POST', body: data }),
  updateOrg: (id: string, data: { name?: string; description?: string; logo?: string }) =>
    apiRequest<{ org: any }>(`/orgs/${id}`, { method: 'PUT', body: data }),
  addOrgMember: (orgId: string, data: { userId: string; roleKey: string }) =>
    apiRequest<{ member: any }>(`/orgs/${orgId}/members`, { method: 'POST', body: data }),
  updateOrgMemberRole: (orgId: string, userId: string, roleKey: string) =>
    apiRequest<{ member: any }>(`/orgs/${orgId}/members/${userId}`, { method: 'PUT', body: { roleKey } }),
  removeOrgMember: (orgId: string, userId: string) =>
    apiRequest(`/orgs/${orgId}/members/${userId}`, { method: 'DELETE' }),

  // Projects
  getProjects: (params?: { limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.limit) query.append('limit', params.limit.toString())
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiRequest<{ projects: any[] }>(`/projects${suffix}`)
  },

  // Module Entitlements
  getOrgEntitlements: (orgId: string) =>
    apiRequest<{ entitlements: any[] }>(`/entitlements/orgs/${orgId}`),
  getEnabledModules: (orgId: string) =>
    apiRequest<{ modules: string[] }>(`/entitlements/orgs/${orgId}/enabled`),
  enableModule: (orgId: string, moduleKey: string, expiresAt?: string) =>
    apiRequest<{ entitlement: any }>(`/entitlements/orgs/${orgId}/modules/${moduleKey}/enable`, {
      method: 'POST',
      body: expiresAt ? { expiresAt } : {},
    }),
  disableModule: (orgId: string, moduleKey: string) =>
    apiRequest<{ entitlement: any }>(`/entitlements/orgs/${orgId}/modules/${moduleKey}/disable`, {
      method: 'POST',
    }),
  getModuleEntitlement: (orgId: string, moduleKey: string) =>
    apiRequest<{ entitlement: any }>(`/entitlements/orgs/${orgId}/modules/${moduleKey}`),

  // RBAC
  getRoles: () => apiRequest<{ roles: any[] }>('/rbac/roles'),
  getRole: (key: string) => apiRequest<{ role: any }>(`/rbac/roles/${key}`),
  getRolePermissions: (key: string) => apiRequest<{ permissions: any[] }>(`/rbac/roles/${key}/permissions`),
  getPermissions: () => apiRequest<{ permissions: any[] }>('/rbac/permissions'),
  createRole: (data: { key: string; name: string; description?: string }) =>
    apiRequest<{ role: any }>('/rbac/roles', { method: 'POST', body: data }),
  createPermission: (data: { key: string; name: string; description?: string }) =>
    apiRequest<{ permission: any }>('/rbac/permissions', { method: 'POST', body: data }),

  // Audit Logs
  getAuditLogs: (params?: { page?: number; limit?: number; action?: string; entityType?: string; entityId?: string; userId?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.action) query.append('action', params.action)
    if (params?.entityType) query.append('entityType', params.entityType)
    if (params?.entityId) query.append('entityId', params.entityId)
    if (params?.userId) query.append('userId', params.userId)
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    return apiRequest<{ auditLogs: any[]; pagination: any }>(`/audit?${query.toString()}`)
  },
  getAuditLog: (id: string) => apiRequest<{ auditLog: any }>(`/audit/${id}`),

  // Events
  getRecentEvents: (limit?: number) => {
    const query = new URLSearchParams()
    if (limit) query.append('limit', limit.toString())
    return apiRequest<{ events: any[] }>(`/events/recent?${query.toString()}`)
  },
  getEvents: (params?: { type?: string; entityType?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.type) query.append('type', params.type)
    if (params?.entityType) query.append('entityType', params.entityType)
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    return apiRequest<{ events: any[]; pagination: any }>(`/events?${query.toString()}`)
  },

  // Readiness templates (Stage 4)
  getReadinessTemplates: (params?: { orgId?: string; category?: string; activeOnly?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.orgId) query.append('orgId', params.orgId)
    if (params?.category) query.append('category', params.category)
    if (params?.activeOnly !== undefined) query.append('activeOnly', String(params.activeOnly))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiRequest<{ templates: any[] }>(`/readiness/templates${suffix}`)
  },
  createReadinessTemplate: (data: { orgId?: string | null; name: string; category?: string | null; isActive?: boolean }) =>
    apiRequest<{ template: any }>(`/readiness/templates`, { method: 'POST', body: data }),
  addReadinessTemplateItem: (templateId: string, data: any) =>
    apiRequest<{ item: any }>(`/readiness/templates/${templateId}/items`, { method: 'POST', body: data }),

  // Contract templates (Prompt 2.1)
  getContractTemplates: (params?: { orgId?: string; activeOnly?: boolean; name?: string }) => {
    const query = new URLSearchParams()
    if (params?.orgId) query.append('orgId', params.orgId)
    if (params?.activeOnly !== undefined) query.append('activeOnly', String(params.activeOnly))
    if (params?.name) query.append('name', params.name)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiRequest<{ templates: any[] }>(`/contracts/templates${suffix}`)
  },
  getContractTemplate: (id: string) => apiRequest<{ template: any }>(`/contracts/templates/${id}`),
  createContractTemplate: (data: {
    orgId?: string | null
    name: string
    body: string
    variables?: Array<{ key: string; label: string; description?: string; defaultValue?: string }>
    isActive?: boolean
  }) => apiRequest<{ template: any }>(`/contracts/templates`, { method: 'POST', body: data }),
  updateContractTemplate: (id: string, data: {
    name?: string
    body?: string
    variables?: Array<{ key: string; label: string; description?: string; defaultValue?: string }>
    isActive?: boolean
  }) => apiRequest<{ template: any }>(`/contracts/templates/${id}`, { method: 'PATCH', body: data }),
  deleteContractTemplate: (id: string) => apiRequest<{ template: any }>(`/contracts/templates/${id}`, { method: 'DELETE' }),
  previewContractTemplate: (id: string, data?: { projectId?: string; variables?: Record<string, string> }) =>
    apiRequest<{ preview: any }>(`/contracts/templates/${id}/preview`, { method: 'POST', body: data }),
}
