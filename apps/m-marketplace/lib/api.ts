/**
 * Marketplace API Client
 * Centralized client for backend marketplace endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {}
  try {
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` }
    }
  } catch {
    // Auth not available
  }
  return {}
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const authHeaders = await getAuthHeader()
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }))
      return { success: false, error: err.message || 'Request failed' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

// ============================================================================
// LEADS
// ============================================================================

export async function getLeads(params?: {
  stage?: string
  city?: string
  state?: string
  projectType?: string
  estimatedValueMin?: number
  estimatedValueMax?: number
  limit?: number
  offset?: number
}) {
  const query = new URLSearchParams()
  if (params?.stage) query.set('stage', params.stage)
  if (params?.city) query.set('city', params.city)
  if (params?.state) query.set('state', params.state)
  if (params?.projectType) query.set('projectType', params.projectType)
  if (params?.estimatedValueMin) query.set('estimatedValueMin', String(params.estimatedValueMin))
  if (params?.estimatedValueMax) query.set('estimatedValueMax', String(params.estimatedValueMax))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return apiRequest(`/marketplace/leads${qs ? `?${qs}` : ''}`)
}

export async function getLead(leadId: string) {
  return apiRequest(`/marketplace/leads/${leadId}`)
}

export async function createLead(data: {
  category: string
  description: string
  estimatedValue?: number
  location: string
  city?: string
  state?: string
  projectId?: string
}) {
  return apiRequest('/marketplace/leads', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateLeadStage(leadId: string, stage: string) {
  return apiRequest(`/marketplace/leads/${leadId}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  })
}

export async function distributeLead(leadId: string, count?: number) {
  return apiRequest(`/marketplace/leads/${leadId}/distribute`, {
    method: 'POST',
    body: JSON.stringify({ distributionCount: count || 5 }),
  })
}

export async function assignSalesRep(leadId: string, salesRepId: string) {
  return apiRequest(`/marketplace/leads/${leadId}/assign-sales-rep`, {
    method: 'POST',
    body: JSON.stringify({ salesRepId }),
  })
}

// ============================================================================
// CONTRACTORS
// ============================================================================

export async function getContractors(params?: {
  specialty?: string
  search?: string
  verifiedOnly?: boolean
  minRating?: number
  limit?: number
  offset?: number
}) {
  const query = new URLSearchParams()
  if (params?.specialty) query.set('specialty', params.specialty)
  if (params?.search) query.set('search', params.search)
  if (params?.verifiedOnly) query.set('verifiedOnly', 'true')
  if (params?.minRating) query.set('minRating', String(params.minRating))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return apiRequest(`/marketplace/contractors${qs ? `?${qs}` : ''}`)
}

export async function getContractor(id: string) {
  return apiRequest(`/marketplace/contractors/${id}`)
}

export async function inviteContractor(contractorId: string, projectId: string) {
  return apiRequest(`/marketplace/contractors/${contractorId}/invite?projectId=${projectId}`, {
    method: 'POST',
  })
}

// ============================================================================
// PORTFOLIOS
// ============================================================================

export async function getPortfolios(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return apiRequest(`/marketplace/portfolios${qs ? `?${qs}` : ''}`)
}

export async function createPortfolio(data: { name: string; description?: string }) {
  return apiRequest('/marketplace/portfolios', { method: 'POST', body: JSON.stringify(data) })
}

export async function getPortfolio(id: string) {
  return apiRequest(`/marketplace/portfolios/${id}`)
}

// ============================================================================
// ESTIMATES (Quick Estimate)
// ============================================================================

export async function getQuickEstimate(data: {
  projectType: string
  sqft?: number
  location: string
  qualityTier?: 'low' | 'mid' | 'high'
  description?: string
}) {
  return apiRequest('/api/v1/estimate/quick', { method: 'POST', body: JSON.stringify(data) })
}

export async function getProjectTypes() {
  return apiRequest('/api/v1/scope-analysis/project-types')
}

// ============================================================================
// CONTACT / LEADS (public)
// ============================================================================

export async function submitContactForm(data: {
  name: string
  email: string
  message: string
  company?: string
  phone?: string
}) {
  return apiRequest('/marketplace/leads', {
    method: 'POST',
    body: JSON.stringify({
      category: 'CONTACT_FORM',
      description: `Contact from ${data.name} (${data.email}): ${data.message}`,
      location: data.company || 'Unknown',
    }),
  })
}

// Default export for convenience
export const marketplaceApi = {
  getLeads,
  getLead,
  createLead,
  updateLeadStage,
  distributeLead,
  assignSalesRep,
  getContractors,
  getContractor,
  inviteContractor,
  getPortfolios,
  createPortfolio,
  getPortfolio,
  getQuickEstimate,
  getProjectTypes,
  submitContactForm,
}
