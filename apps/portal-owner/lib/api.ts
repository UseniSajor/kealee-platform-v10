/**
 * Portal-Owner real API client.
 * Mirrors the proven pattern from m-project-owner/lib/api.ts:
 *   – reads NEXT_PUBLIC_API_URL (falls back to localhost:3001)
 *   – attaches Supabase JWT via getAuthToken()
 *   – typed request helper + named api object
 */

import { getAuthToken } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = await getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) headers.Authorization = `Bearer ${token}`

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

// ─── Type definitions ────────────────────────────────────────────────────────

export type ProjectCategory =
  | 'KITCHEN'
  | 'BATHROOM'
  | 'ADDITION'
  | 'NEW_CONSTRUCTION'
  | 'RENOVATION'
  | 'OTHER'

export type ProjectStatus =
  | 'DRAFT'
  | 'READINESS'
  | 'CONTRACTING'
  | 'ACTIVE'
  | 'CLOSEOUT'
  | 'COMPLETED'
  | 'CANCELLED'

export type ProjectSummary = {
  id: string
  name: string
  description: string | null
  category: ProjectCategory
  propertyId: string | null
  status?: ProjectStatus
  budgetTotal?: number | null
  startDate?: string | null
  endDate?: string | null
  createdAt?: string
}

export type Milestone = {
  id: string
  name: string
  description: string | null
  amount: number
  status: 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PAID' | 'REJECTED'
  dueDate?: string | null
  paidAt?: string | null
}

export type Contract = {
  id: string
  projectId: string
  templateId: string | null
  contractorId: string | null
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'ACTIVE' | 'CANCELLED' | 'ARCHIVED'
  terms: string | null
  totalAmount: number | null
  milestones?: Milestone[]
}

// ─── API methods ─────────────────────────────────────────────────────────────

export const api = {
  // ── Projects ──────────────────────────────────────────────────────────────
  createProject: (data: {
    name: string
    description?: string
    category: ProjectCategory
    categoryMetadata?: Record<string, unknown>
  }) =>
    apiRequest<{ project: ProjectSummary }>('/projects', { method: 'POST', body: data }),

  getProject: (id: string) =>
    apiRequest<{ project: Record<string, unknown> }>(`/projects/${id}`),

  listMyProjects: () =>
    apiRequest<{ projects: ProjectSummary[] }>('/projects'),

  updateProject: (id: string, data: Record<string, unknown>) =>
    apiRequest<{ project: ProjectSummary }>(`/projects/${id}`, { method: 'PATCH', body: data }),

  // ── Properties ────────────────────────────────────────────────────────────
  createProperty: (data: {
    address: string
    city: string
    state: string
    zip: string
    country?: string
  }) =>
    apiRequest<{ property: { id: string }; created: boolean }>('/properties', { method: 'POST', body: data }),

  // ── Contracts & Milestones ────────────────────────────────────────────────
  listProjectContracts: (projectId: string) =>
    apiRequest<{ contracts: Contract[] }>(`/contracts/projects/${projectId}`),

  getContractMilestones: (contractId: string) =>
    apiRequest<{
      milestones: Milestone[]
      statistics: {
        total: number
        completed: number
        submitted: number
        underReview: number
        pending: number
        totalAmount: number
        paidAmount: number
        progressPercentage: number
        paymentProgress: number
        upcomingMilestones: Array<{ id: string; name: string; dueDate: string; daysUntilDue: number | null }>
      }
    }>(`/milestones/contracts/${contractId}/milestones`),

  approveMilestone: (milestoneId: string, notes?: string) =>
    apiRequest<{ milestone: Milestone }>(`/milestones/${milestoneId}/approve`, {
      method: 'POST',
      body: { notes },
    }),

  // ── Payments ──────────────────────────────────────────────────────────────
  getEscrowAgreement: (projectId: string) =>
    apiRequest<{
      escrow: {
        id: string
        projectId: string
        contractId: string | null
        currentBalance: number
        status: string
        holdbackPercentage: number
        transactions?: Array<{
          id: string
          type: string
          amount: number
          status: string
          createdAt: string
        }>
      }
    }>(`/payments/projects/${projectId}/escrow`),

  getPaymentHistory: (projectId: string) =>
    apiRequest<{
      transactions: Array<{
        id: string
        type: string
        amount: number
        status: string
        createdAt: string
        milestone?: { id: string; name: string; amount: number }
      }>
      escrow: { id: string; currentBalance: number; status: string } | null
    }>(`/payments/projects/${projectId}/payments`),

  canReleasePayment: (milestoneId: string) =>
    apiRequest<{ canRelease: boolean; reasons: string[] }>(`/payments/milestones/${milestoneId}/can-release`),

  releasePayment: (milestoneId: string, options?: { skipHoldback?: boolean; notes?: string }) =>
    apiRequest<{
      success: boolean
      transaction: { id: string; amount: number; status: string }
      releaseAmount: number
      holdbackAmount: number
      balanceAfter: number
    }>(`/payments/milestones/${milestoneId}/release-payment`, {
      method: 'POST',
      body: options || {},
    }),

  // ── Documents / Permits ───────────────────────────────────────────────────
  getPermitStatusSummary: (projectId: string) =>
    apiRequest<{
      totalPermits: number
      activePermits: number
      expiredPermits: number
      invalidPermits: number
      permits: Array<{
        id: string
        permitNumber: string
        type: string
        status: string
        expiresAt: string | null
        isExpired: boolean
        isValid: boolean
      }>
    }>(`/permits/projects/${projectId}/status`),

  listProjectDocuments: (projectId: string) =>
    apiRequest<{
      documents: Array<{
        id: string
        title: string
        fileName: string | null
        url: string | null
        documentType: string
        status: string
        createdAt: string
        sizeBytes: number | null
      }>
    }>(`/projects/${projectId}/documents`),

  // ── Messages ──────────────────────────────────────────────────────────────
  listProjectMessages: (projectId: string) =>
    apiRequest<{
      messages: Array<{
        id: string
        content: string
        createdAt: string
        sender: { id: string; name: string; email: string }
      }>
    }>(`/projects/${projectId}/messages`),

  sendProjectMessage: (projectId: string, content: string) =>
    apiRequest<{
      message: { id: string; content: string; createdAt: string }
    }>(`/projects/${projectId}/messages`, {
      method: 'POST',
      body: { content },
    }),

  // ── KeaBot / AI ───────────────────────────────────────────────────────────
  chatWithKeaBot: (message: string, projectId?: string) =>
    apiRequest<{
      reply: string
      conversationId?: string
    }>('/ai/chat', {
      method: 'POST',
      body: { message, projectId, bot: 'owner' },
    }),

  // ── User ──────────────────────────────────────────────────────────────────
  getMe: () =>
    apiRequest<{
      user: {
        id: string
        name: string
        email: string
        role: string
      }
    }>('/users/me'),
}
