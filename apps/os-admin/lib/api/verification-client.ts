/**
 * verification-client.ts
 *
 * Typed API client for the admin contractor verification endpoints.
 * All calls require an authenticated admin/super_admin session.
 *
 * Endpoints:
 *   GET  /admin/verification/queue          — paginated contractor list
 *   GET  /admin/verification/:profileId     — full contractor detail
 *   POST /admin/verification/:profileId/approve
 *   POST /admin/verification/:profileId/reject
 *   POST /admin/verification/:profileId/request-info
 *   POST /admin/verification/:profileId/suspend
 */

import { AdminApiClient } from './admin-client'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type VerificationStatus =
  | 'PENDING'
  | 'NEEDS_INFO'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'

export interface ContractorSummaryRow {
  profileId:          string
  userId:             string
  businessName:       string
  contactName:        string | null
  contactEmail:       string | null
  phone:              string | null
  city:               string | null
  state:              string | null
  specialties:        string[]
  professionalType:   'CONTRACTOR' | 'DESIGN_BUILD'
  verificationStatus: VerificationStatus
  eligibility:        string
  licenseVerified:    boolean
  insuranceVerified:  boolean
  licenseNumber:      string | null
  insuranceCarrier:   string | null
  insuranceExpiration: string | null
  registeredAt:       string
  lastActionAt:       string | null
  lastActionNote:     string | null
  reviewedBy:         string | null
}

export interface VerificationQueueResponse {
  contractors: ContractorSummaryRow[]
  pagination: {
    total:      number
    page:       number
    limit:      number
    totalPages: number
  }
  counts: {
    PENDING:    number
    APPROVED:   number
    REJECTED:   number
    SUSPENDED:  number
    NEEDS_INFO: number
  }
}

export interface VerificationEventRecord {
  eventType:    string
  note:         string | null
  reviewedBy:   string | null
  reviewedById: string | null
  createdAt:    string
}

export interface ContractorDetailResponse extends ContractorSummaryRow {
  user: {
    id:        string
    name:      string
    email:     string
    createdAt: string
  }
  description:   string | null
  serviceAreas:  string[]
  address:       string | null
  zip:           string | null
  website:       string | null
  allLicenses:   string[]
  openWorkItems: Array<{
    id:          string
    type:        string
    title:       string
    description: string | null
    status:      string
    dueAt:       string | null
    createdAt:   string
  }>
  stageTimeline: Array<{
    id:        string
    stageName: string
    enteredAt: string
    notes:     string | null
  }>
  eventHistory:  VerificationEventRecord[]
}

export interface VerificationActionResponse {
  success:            boolean
  verificationStatus: VerificationStatus
}

export interface VerificationQueueParams {
  status?: VerificationStatus
  search?: string
  page?:   number
  limit?:  number
  sort?:   string
  dir?:    'asc' | 'desc'
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class VerificationClient {
  /**
   * GET /admin/verification/queue
   * Paginated list of contractors with status filters.
   */
  static async getQueue(params: VerificationQueueParams = {}): Promise<VerificationQueueResponse> {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.search) qs.set('search', params.search)
    if (params.page)   qs.set('page',   String(params.page))
    if (params.limit)  qs.set('limit',  String(params.limit))
    if (params.sort)   qs.set('sort',   params.sort)
    if (params.dir)    qs.set('dir',    params.dir)

    const query = qs.toString() ? `?${qs.toString()}` : ''
    return (AdminApiClient as any).request<VerificationQueueResponse>(
      `/admin/verification/queue${query}`
    )
  }

  /**
   * GET /admin/verification/:profileId
   * Full contractor detail with timeline, events, and open work items.
   */
  static async getDetail(profileId: string): Promise<ContractorDetailResponse> {
    return (AdminApiClient as any).request<ContractorDetailResponse>(
      `/admin/verification/${profileId}`
    )
  }

  /**
   * POST /admin/verification/:profileId/approve
   */
  static async approve(profileId: string, note?: string): Promise<VerificationActionResponse> {
    return (AdminApiClient as any).request<VerificationActionResponse>(
      `/admin/verification/${profileId}/approve`,
      {
        method: 'POST',
        body:   JSON.stringify({ note }),
      }
    )
  }

  /**
   * POST /admin/verification/:profileId/reject
   * @param note    Required rejection reason
   * @param final   If true, sets INELIGIBLE (permanent ban)
   */
  static async reject(
    profileId: string,
    note:      string,
    final?:    boolean,
  ): Promise<VerificationActionResponse> {
    return (AdminApiClient as any).request<VerificationActionResponse>(
      `/admin/verification/${profileId}/reject`,
      {
        method: 'POST',
        body:   JSON.stringify({ note, final: final ?? false }),
      }
    )
  }

  /**
   * POST /admin/verification/:profileId/request-info
   */
  static async requestInfo(profileId: string, note: string): Promise<VerificationActionResponse> {
    return (AdminApiClient as any).request<VerificationActionResponse>(
      `/admin/verification/${profileId}/request-info`,
      {
        method: 'POST',
        body:   JSON.stringify({ note }),
      }
    )
  }

  /**
   * POST /admin/verification/:profileId/suspend
   * @param note    Required suspension reason
   * @param revert  If true, unsuspends (back to PENDING)
   */
  static async suspend(
    profileId: string,
    note:      string,
    revert?:   boolean,
  ): Promise<VerificationActionResponse> {
    return (AdminApiClient as any).request<VerificationActionResponse>(
      `/admin/verification/${profileId}/suspend`,
      {
        method: 'POST',
        body:   JSON.stringify({ note, revert: revert ?? false }),
      }
    )
  }
}
