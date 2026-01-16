import type {
  Lead,
  LeadStage,
  ListLeadsQuery,
  ListLeadsResponse,
  GetLeadResponse,
  UpdateLeadStageRequest,
  UpdateLeadStageResponse,
  AssignSalesRepRequest,
  AssignSalesRepResponse,
  AwardContractorRequest,
  AwardContractorResponse,
  CloseLostRequest,
  CloseLostResponse,
  DistributeLeadRequest,
  DistributeLeadResponse,
} from "@kealee/types"

export interface ApiClientConfig {
  baseUrl: string
  getAuthToken?: () => Promise<string | null>
}

export class ApiClient {
  private baseUrl: string
  private getAuthToken?: () => Promise<string | null>

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "") // Remove trailing slash
    this.getAuthToken = config.getAuthToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken ? await this.getAuthToken() : null

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }

    // Only set JSON content-type when body is not FormData
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as {
        message?: string
        error?: string
      }
      throw new Error(error.message || error.error || "API request failed")
    }

    return response.json()
  }

  // ============================================================================
  // LEAD API METHODS
  // ============================================================================

  /**
   * List leads with filtering
   */
  async listLeads(query?: ListLeadsQuery): Promise<ListLeadsResponse> {
    const params = new URLSearchParams()
    if (query?.stage) params.set("stage", query.stage)
    if (query?.estimatedValueMin !== undefined)
      params.set("estimatedValueMin", String(query.estimatedValueMin))
    if (query?.estimatedValueMax !== undefined)
      params.set("estimatedValueMax", String(query.estimatedValueMax))
    if (query?.city) params.set("city", query.city)
    if (query?.state) params.set("state", query.state)
    if (query?.projectType) params.set("projectType", query.projectType)
    if (query?.assignedSalesRepId)
      params.set("assignedSalesRepId", query.assignedSalesRepId)
    if (query?.limit !== undefined) params.set("limit", String(query.limit))
    if (query?.offset !== undefined) params.set("offset", String(query.offset))
    const qs = params.toString()
    return this.request<ListLeadsResponse>(
      `/marketplace/leads${qs ? `?${qs}` : ""}`
    )
  }

  /**
   * Get lead by ID
   */
  async getLead(leadId: string): Promise<GetLeadResponse> {
    return this.request<GetLeadResponse>(`/marketplace/leads/${leadId}`)
  }

  /**
   * Update lead stage
   */
  async updateLeadStage(
    leadId: string,
    stage: LeadStage
  ): Promise<UpdateLeadStageResponse> {
    return this.request<UpdateLeadStageResponse>(
      `/marketplace/leads/${leadId}/stage`,
      {
        method: "PATCH",
        body: JSON.stringify({ stage } as UpdateLeadStageRequest),
      }
    )
  }

  /**
   * Assign sales rep to lead
   */
  async assignSalesRep(
    leadId: string,
    salesRepId: string
  ): Promise<AssignSalesRepResponse> {
    return this.request<AssignSalesRepResponse>(
      `/marketplace/leads/${leadId}/assign-sales-rep`,
      {
        method: "POST",
        body: JSON.stringify({ salesRepId } as AssignSalesRepRequest),
      }
    )
  }

  /**
   * Award contractor to lead
   */
  async awardContractor(
    leadId: string,
    profileId: string
  ): Promise<AwardContractorResponse> {
    return this.request<AwardContractorResponse>(
      `/marketplace/leads/${leadId}/award-contractor`,
      {
        method: "POST",
        body: JSON.stringify({ profileId } as AwardContractorRequest),
      }
    )
  }

  /**
   * Close lead as lost
   */
  async closeLost(leadId: string, reason: string): Promise<CloseLostResponse> {
    return this.request<CloseLostResponse>(
      `/marketplace/leads/${leadId}/close-lost`,
      {
        method: "POST",
        body: JSON.stringify({ reason } as CloseLostRequest),
      }
    )
  }

  /**
   * Distribute lead to contractors
   */
  async distributeLead(
    leadId: string,
    distributionCount?: number
  ): Promise<DistributeLeadResponse> {
    return this.request<DistributeLeadResponse>(
      `/marketplace/leads/${leadId}/distribute`,
      {
        method: "POST",
        body: JSON.stringify({
          distributionCount,
        } as DistributeLeadRequest),
      }
    )
  }
}

/**
 * Create an API client instance
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config)
}
