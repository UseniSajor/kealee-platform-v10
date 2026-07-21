/**
 * contractor-leads.ts
 *
 * Typed API client for contractor lead dashboard endpoints.
 * Requires an authenticated Supabase session (Bearer token).
 *
 *   GET  /marketplace/contractors/leads           — list own assignments
 *   POST /marketplace/assignments/:id/accept      — accept an offer
 *   POST /marketplace/assignments/:id/decline     — decline an offer
 */

import { createBrowserClient } from '@supabase/ssr'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

let _supabase: ReturnType<typeof createBrowserClient> | null = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return _supabase
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const { data: { session } } = await getSupabase().auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()
  if (!token) throw new LeadsApiError('Not authenticated. Please sign in.', 401)

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: 'include',
  })

  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))

  if (!res.ok) {
    throw new LeadsApiError(
      json.error || `HTTP ${res.status}`,
      res.status,
      json.details,
    )
  }

  return json as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'FORFEITED'

export interface LeadAssignment {
  // Assignment
  assignmentId:     string
  status:           AssignmentStatus
  professionalType: string
  sourceType:       string
  assignedAt:       string   // ISO date
  acceptDeadline:   string   // ISO date
  respondedAt:      string | null
  forwardedAt:      string | null
  declineReason:    string | null
  adminOverride:    boolean

  // Lead
  leadId:         string | null
  category:       string | null
  description:    string | null
  location:       string | null
  city:           string | null
  state:          string | null
  projectType:    string | null
  sqft:           number | null
  qualityTier:    'low' | 'mid' | 'high' | null
  estimatedValue: number | null
  budget:         number | null
  leadStage:      string | null

  // Project
  projectId:             string | null
  projectName:           string | null
  projectCity:           string | null
  projectState:          string | null
  constructionReadiness: string | null

  // Derived
  isActive:  boolean
  isExpired: boolean
}

export interface LeadCounts {
  pending:  number
  accepted: number
  active:   number
  history:  number
  total:    number
}

export interface LeadsResponse {
  assignments:          LeadAssignment[]
  counts:               LeadCounts
  profileExists:        boolean
  marketplaceProfileId: string | null
}

export interface AcceptResponse {
  success:    boolean
  assignment: Record<string, unknown>
}

export interface DeclineResponse {
  success:         boolean
  message:         string
  nextAssignment:  Record<string, unknown> | null
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getMyLeads(params: {
  tab?:    'active' | 'history' | 'all'
  cursor?: string
  limit?:  number
} = {}): Promise<LeadsResponse> {
  const qs = new URLSearchParams()
  if (params.tab)    qs.set('tab',    params.tab)
  if (params.cursor) qs.set('cursor', params.cursor)
  if (params.limit)  qs.set('limit',  String(params.limit))
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return request<LeadsResponse>(`/marketplace/contractors/leads${query}`)
}

export async function acceptAssignment(assignmentId: string): Promise<AcceptResponse> {
  return request<AcceptResponse>(`/marketplace/assignments/${assignmentId}/accept`, {
    method: 'POST',
  })
}

export async function declineAssignment(
  assignmentId: string,
  reason?: string,
): Promise<DeclineResponse> {
  return request<DeclineResponse>(`/marketplace/assignments/${assignmentId}/decline`, {
    method: 'POST',
    body:   JSON.stringify({ reason }),
  })
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class LeadsApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: Array<{ message: string; path: (string | number)[] }>,
  ) {
    super(message)
    this.name = 'LeadsApiError'
  }

  get isUnauthenticated() { return this.statusCode === 401 }
  get isNotFound()        { return this.statusCode === 404 }
  get isConflict()        { return this.statusCode === 409 }
}
