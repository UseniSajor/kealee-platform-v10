/**
 * portal-contractor/lib/api/contractor.ts
 *
 * Typed wrappers for contractor-facing API endpoints:
 *   GET /marketplace/contractors/profile
 *   PATCH /marketplace/contractors/profile
 *   GET /marketplace/contractors/leads
 *   POST /marketplace/assignments/:id/accept
 *   POST /marketplace/assignments/:id/decline
 *   GET /verification/documents
 */

import { apiFetch } from './client'

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface ContractorProfile {
  id: string
  userId: string
  businessName: string
  businessType: string | null
  yearsInBusiness: number | null
  serviceArea: string | null
  csiDivisions: string[]
  licenseNumber: string | null
  allLicenses: string[]
  insuranceCarrier: string | null
  insuranceExpiration: string | null
  insuranceCoverageAmount: number | null
  bio: string | null
  website: string | null
  rating: number | null
  completedProjects: number
  verificationStatus: string
  requiresReverification: boolean
  profileExists: boolean
}

export async function getContractorProfile(): Promise<ContractorProfile> {
  const data = await apiFetch<{ contractor: ContractorProfile; profileExists: boolean }>(
    '/marketplace/contractors/profile',
  )
  return { ...data.contractor, profileExists: data.profileExists }
}

export async function updateContractorProfile(
  updates: Partial<ContractorProfile>,
): Promise<ContractorProfile> {
  const data = await apiFetch<{ contractor: ContractorProfile }>(
    '/marketplace/contractors/profile',
    { method: 'PATCH', body: JSON.stringify(updates) },
  )
  return data.contractor
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export type LeadTab = 'active' | 'history' | 'all'

export interface Lead {
  id: string
  status: string
  assignedAt: string
  acceptDeadline: string | null
  respondedAt: string | null
  isExpired: boolean
  lead: {
    id: string
    projectId: string | null
    title: string
    description: string | null
    location: string | null
    budget: number | null
    budgetMax: number | null
    twinTier: string | null
    projectType: string | null
    lifecyclePhase: string | null
    csiDivisions: string[]
    createdAt: string
    project: {
      id: string
      name: string
      category: string | null
    } | null
  } | null
}

export interface LeadCounts {
  pending: number
  accepted: number
  active: number
  history: number
  total: number
}

export interface LeadsResponse {
  assignments: Lead[]
  counts: LeadCounts
  profileExists: boolean
}

export async function getContractorLeads(
  tab: LeadTab = 'active',
  limit = 50,
): Promise<LeadsResponse> {
  return apiFetch<LeadsResponse>(
    `/marketplace/contractors/leads?tab=${tab}&limit=${limit}`,
  )
}

export async function acceptAssignment(assignmentId: string): Promise<void> {
  await apiFetch(`/marketplace/assignments/${assignmentId}/accept`, { method: 'POST' })
}

export async function declineAssignment(
  assignmentId: string,
  reason?: string,
): Promise<void> {
  await apiFetch(`/marketplace/assignments/${assignmentId}/decline`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// ─── Verification Documents ───────────────────────────────────────────────────

export type DocumentType = 'LICENSE' | 'INSURANCE' | 'BOND' | 'CERTIFICATION' | 'OTHER'
export type DocumentStatus =
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ARCHIVED'

export interface VerificationDocument {
  id: string
  documentType: DocumentType
  effectiveStatus: DocumentStatus
  version: number
  fileName: string
  mimeType: string
  fileSize: number
  description: string | null
  issuerName: string | null
  documentNumber: string | null
  expiresAt: string | null
  reviewNote: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface DocumentsResponse {
  documents: VerificationDocument[]
  counts: Record<string, number>
  profileExists: boolean
}

export async function getVerificationDocuments(
  params: { documentType?: DocumentType; includeArchived?: boolean } = {},
): Promise<DocumentsResponse> {
  const qs = new URLSearchParams()
  if (params.documentType) qs.set('documentType', params.documentType)
  if (params.includeArchived) qs.set('includeArchived', 'true')
  const query = qs.toString() ? `?${qs}` : ''
  return apiFetch<DocumentsResponse>(`/verification/documents${query}`)
}

export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<{ url: string; expiresAt: string }> {
  return apiFetch<{ url: string; expiresAt: string }>(
    `/verification/documents/${documentId}/download`,
  )
}
