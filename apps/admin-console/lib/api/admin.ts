/**
 * admin-console/lib/api/admin.ts
 * Typed wrappers for admin-facing API endpoints.
 */

import { apiFetch } from './client'

// ── Users ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  orgName?: string | null
  projectCount?: number
  createdAt: string
  lastLoginAt?: string | null
}

export interface UsersResponse {
  users: AdminUser[]
  total: number
}

export async function listUsers(params: {
  limit?: number
  offset?: number
  search?: string
  role?: string
} = {}): Promise<UsersResponse> {
  const qs = new URLSearchParams()
  if (params.limit)  qs.set('limit',  String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  if (params.search) qs.set('search', params.search)
  if (params.role && params.role !== 'all') qs.set('role', params.role)
  return apiFetch<UsersResponse>(`/users?${qs}`)
}

export async function suspendUser(userId: string): Promise<{ success: boolean }> {
  return apiFetch(`/users/${userId}/suspend`, { method: 'POST' })
}

export async function activateUser(userId: string): Promise<{ success: boolean }> {
  return apiFetch(`/users/${userId}/activate`, { method: 'POST' })
}

// ── Contractor Verification ───────────────────────────────────────────────────

export interface VerificationItem {
  id: string
  contractorId: string
  businessName: string
  email: string
  status: string
  documentCount: number
  submittedAt: string
  licenseNumber?: string | null
  insuranceExpiration?: string | null
}

export interface VerificationQueueResponse {
  items: VerificationItem[]
  total: number
  pendingCount: number
}

export async function getVerificationQueue(): Promise<VerificationQueueResponse> {
  return apiFetch<VerificationQueueResponse>('/admin/verification/queue')
}

export async function approveContractor(
  contractorId: string,
): Promise<{ success: boolean }> {
  return apiFetch(`/admin/verification/${contractorId}/approve`, { method: 'POST' })
}

export async function rejectContractor(
  contractorId: string,
  reason: string,
): Promise<{ success: boolean }> {
  return apiFetch(`/admin/verification/${contractorId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}
