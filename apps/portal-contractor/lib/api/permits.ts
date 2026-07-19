/**
 * portal-contractor/lib/api/permits.ts
 *
 * Typed wrappers for the contractor-facing permit endpoints.
 *
 * Backed by services/api/src/routes/permit.routes.ts, registered at
 * prefix /api/permits (services/api/src/index.ts). This is the ONLY
 * permit-CRUD surface that is (a) backed by a real Prisma model that
 * exists in the schema, (b) properly authenticated, and (c) scoped to
 * the calling user (`applicantId: user.id`).
 *
 * Two other permit-sounding endpoint families were investigated and
 * rejected as backing for this UI:
 *   - services/api/src/modules/permits/permit-application.routes.ts
 *     (prefix /permits, paths /applications*) calls
 *     `prismaAny.permitApplication.*`, but no `PermitApplication` model
 *     exists anywhere in packages/database — every call 500s.
 *   - services/api/src/modules/permits-api/permits-api.routes.ts
 *     (`/api/v1/permits`) writes straight to Supabase with a body schema
 *     that omits several NOT NULL columns on `Permit` (projectId,
 *     clientId, pmUserId, applicantName/Email/Phone, applicantType) —
 *     inserts fail.
 *
 *   GET  /api/permits              — list current user's permits
 *   GET  /api/permits/:id          — get one permit (scoped to applicantId)
 *   POST /api/permits              — create a permit (requires a real projectId)
 *   GET  /permits/jurisdictions    — list jurisdictions for the picker
 */

import { apiFetch } from './client'

export type PermitStatus =
  | 'DRAFT'
  | 'AI_PRE_REVIEW'
  | 'READY_TO_SUBMIT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTIONS_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'ISSUED'
  | 'ACTIVE'
  | 'INSPECTION_HOLD'
  | 'EXPIRED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'

export type PermitTypeInput = 'building' | 'electrical' | 'plumbing' | 'mechanical'

export interface PermitJurisdiction {
  id: string
  name: string
  code: string
  state: string
  county?: string | null
  city?: string | null
}

export interface Permit {
  id: string
  permitNumber: string | null
  permitType: string
  status: PermitStatus
  kealeeStatus: PermitStatus
  address: string
  scope: string
  valuation: number | string | null
  squareFootage: number | null
  jurisdictionId: string
  jurisdiction?: PermitJurisdiction
  jurisdictionRefNumber: string | null
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  readyToSubmit: boolean
  submittedAt: string | null
  approvedAt: string | null
  issuedAt: string | null
  expiresAt: string | null
  completedAt: string | null
  plans: string[]
  calculations: string[]
  reports: string[]
  otherDocuments: string[]
  aiReviews?: Array<{
    id: string
    overallScore?: number
    score?: number
    reviewedAt: string
  }>
  createdAt: string
  updatedAt: string
}

export async function getContractorPermits(): Promise<{ permits: Permit[] }> {
  return apiFetch<{ permits: Permit[] }>('/api/permits')
}

export async function getPermit(id: string): Promise<{ permit: Permit }> {
  return apiFetch<{ permit: Permit }>(`/api/permits/${id}`)
}

export interface CreatePermitInput {
  address: string
  jurisdiction: string // jurisdictionId
  permitTypes: PermitTypeInput[]
  projectDetails: {
    projectId: string
    scope: string
  }
  applicantInfo: {
    name: string
    licenseNumber?: string
    contactInfo: { email: string; phone: string }
  }
}

export async function createPermit(data: CreatePermitInput): Promise<{ permit: Permit }> {
  return apiFetch<{ permit: Permit }>('/api/permits', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getJurisdictions(
  params: { search?: string; state?: string } = {},
): Promise<{ jurisdictions: PermitJurisdiction[] }> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.state) qs.set('state', params.state)
  const query = qs.toString() ? `?${qs}` : ''
  return apiFetch<{ jurisdictions: PermitJurisdiction[] }>(`/permits/jurisdictions${query}`)
}
