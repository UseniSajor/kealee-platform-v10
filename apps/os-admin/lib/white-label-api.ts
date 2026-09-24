import { apiRequest } from './api'

export interface WhiteLabelTenant extends WhiteLabelBranding {
  id: string
  orgId: string
  companyName: string
  productName?: string | null
  tier?: string
  org?: { id: string; name: string; slug: string; status?: string }
  profile?: WhiteLabelBranding | null
  name?: string
  slug?: string
  status?: string
  clientType?: string
  professional?: boolean
  branding?: WhiteLabelBranding | null
  domains?: WhiteLabelDomain[]
  products?: string[]
  modules?: string[]
  plan?: WhiteLabelPlan | null
  deployment?: WhiteLabelDeployment | null
  usageSummary?: Record<string, number>
  evaluationSummary?: Record<string, number>
}

export interface WhiteLabelBranding {
  companyName?: string
  productName?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  emailFromName?: string | null
  emailFromAddress?: string | null
  emailReplyToAddress?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
  reportHeader?: string | null
  reportFooter?: string | null
  legalDisclaimer?: string | null
}

export interface WhiteLabelDomain {
  id: string
  hostname?: string
  domain?: string
  status?: string
  verifiedAt?: string | null
  isPrimary?: boolean
  verificationRecords?: unknown
  certificateStatus?: string | null
}

export interface WhiteLabelPlan {
  planKey?: string
  planName?: string
  baseMonthlyAmountCents?: number
  billingStatus?: string
  status?: string
  billingMode?: string
  includedUsage?: Record<string, number>
  supportTier?: string
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}

export interface WhiteLabelDeployment {
  mode?: string
  environmentKey?: string
  serviceLevel?: string
  region?: string | null
  version?: string | null
  lastDeployedAt?: string | null
}

export interface WhiteLabelProduct {
  key: string
  name: string
  description?: string
  enabledModuleKeys?: string[]
}

export interface WhiteLabelUsage {
  periodStart?: string
  periodEnd?: string
  summary?: Array<{ metric: string; unit: string; _sum: { quantity: number | null; unitCostCents: number | null } }>
  items?: Array<{ metric: string; quantity: number; unit?: string; estimatedCost?: number }>
}

export interface WhiteLabelEvaluation {
  id: string
  name: string
  status?: string
  lastRunAt?: string | null
  passingRate?: number | null
}

export interface WhiteLabelSupportSession {
  id: string
  actorId?: string
  reason: string
  status?: string
  expiresAt?: string
  createdAt?: string
  permissions?: string[]
}

type Collection<T> = T[] | Record<string, unknown>

export function extractCollection<T>(value: Collection<T>, keys: string[]): T[] {
  if (Array.isArray(value)) return value
  for (const key of keys) {
    const candidate = value[key]
    if (Array.isArray(candidate)) return candidate as T[]
  }
  return []
}

export function extractObject<T>(value: T | Record<string, unknown>, keys: string[]): T {
  if (value && typeof value === 'object') {
    for (const key of keys) {
      const candidate = (value as Record<string, unknown>)[key]
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) return candidate as T
    }
  }
  return value as T
}

const path = (orgId: string) => `/white-label/tenants/${encodeURIComponent(orgId)}`

export const whiteLabelApi = {
  listTenants: () => apiRequest<Collection<WhiteLabelTenant>>('/white-label/tenants'),
  createTenant: (data: { orgId: string; companyName: string; tier?: string; productKeys?: string[] }) =>
    apiRequest<{ tenant: { profile: WhiteLabelTenant } }>('/white-label/tenants', { method: 'POST', body: data }),
  getTenant: (orgId: string) => apiRequest<{ tenant: { profile: WhiteLabelTenant; domains: WhiteLabelDomain[]; products: WhiteLabelProductAssignment[]; plan: WhiteLabelPlan | null; deployment: WhiteLabelDeployment | null } }>(path(orgId)),
  updateProfile: (orgId: string, data: WhiteLabelBranding) =>
    apiRequest(path(orgId) + '/profile', { method: 'PATCH', body: data }),
  getDomains: (orgId: string) => apiRequest<Collection<WhiteLabelDomain>>(path(orgId) + '/domains'),
  addDomain: (orgId: string, hostname: string) =>
    apiRequest(path(orgId) + '/domains', { method: 'POST', body: { hostname } }),
  updateDomain: (orgId: string, domainId: string, data: { isPrimary?: boolean }) =>
    apiRequest(path(orgId) + `/domains/${encodeURIComponent(domainId)}`, { method: 'PATCH', body: data }),
  removeDomain: (orgId: string, domainId: string) =>
    apiRequest(path(orgId) + `/domains/${encodeURIComponent(domainId)}`, { method: 'DELETE' }),
  provisionDomain: (orgId: string, domainId: string) =>
    apiRequest(path(orgId) + `/domains/${encodeURIComponent(domainId)}/provision`, { method: 'POST' }),
  verifyDomain: (orgId: string, domainId: string) =>
    apiRequest(path(orgId) + `/domains/${encodeURIComponent(domainId)}/verify`, { method: 'POST' }),
  getProductCatalog: () => apiRequest<Collection<WhiteLabelProduct>>('/white-label/products'),
  getProducts: (orgId: string) => apiRequest<{ tenant: { products: WhiteLabelProductAssignment[] } }>(path(orgId)),
  updateProducts: (orgId: string, productKeys: string[]) =>
    apiRequest(path(orgId) + '/products', { method: 'PUT', body: { products: productKeys.map(productKey => ({ productKey, enabled: true })) } }),
  getPlan: (orgId: string) => apiRequest<WhiteLabelPlan | { plan: WhiteLabelPlan }>(path(orgId) + '/plan'),
  updatePlan: (orgId: string, data: WhiteLabelPlan) =>
    apiRequest(path(orgId) + '/plan', { method: 'PATCH', body: data }),
  getUsage: (orgId: string) => apiRequest<WhiteLabelUsage | { usage: WhiteLabelUsage }>(path(orgId) + '/usage'),
  getEvaluations: (orgId: string) => apiRequest<Collection<WhiteLabelEvaluation>>(path(orgId) + '/evaluations'),
  createEvaluation: (orgId: string, name: string) =>
    apiRequest(path(orgId) + '/evaluations', { method: 'POST', body: { name } }),
  runEvaluation: (orgId: string, suiteId: string) =>
    apiRequest(path(orgId) + `/evaluations/${encodeURIComponent(suiteId)}/runs`, { method: 'POST' }),
  getSupportAccess: (orgId: string) => apiRequest<Collection<WhiteLabelSupportSession>>(path(orgId) + '/support-access'),
  requestSupportAccess: (orgId: string, reason: string, permissions: string[], expiresAt: string) =>
    apiRequest(path(orgId) + '/support-access', { method: 'POST', body: { reason, permissions, expiresAt } }),
  closeSupportAccess: (orgId: string, sessionId: string) =>
    apiRequest(path(orgId) + `/support-access/${encodeURIComponent(sessionId)}`, { method: 'PATCH', body: { action: 'REVOKE' } }),
  getDeployment: (orgId: string) => apiRequest<WhiteLabelDeployment | { deployment: WhiteLabelDeployment }>(path(orgId) + '/deployment'),
  updateDeployment: (orgId: string, data: WhiteLabelDeployment) =>
    apiRequest(path(orgId) + '/deployment', { method: 'PATCH', body: data }),
}

export interface WhiteLabelProductAssignment {
  productKey?: string
  enabled?: boolean
  productTemplate?: WhiteLabelProduct
}
