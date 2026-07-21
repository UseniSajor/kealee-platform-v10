/**
 * contractor-profile.ts
 *
 * Typed API client for contractor profile endpoints.
 * Requires an authenticated Supabase session (Bearer token).
 *
 *   GET  /marketplace/contractors/profile  — load own profile
 *   PATCH /marketplace/contractors/profile — update profile
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
  if (!token) throw new ProfileApiError('Not authenticated. Please sign in.', 401)

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
    throw new ProfileApiError(
      json.error || `HTTP ${res.status}`,
      res.status,
      json.details,
    )
  }

  return json as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContractorProfile {
  contractorProfileId:  string
  marketplaceProfileId: string | null
  userId:               string

  // Business
  businessName:     string
  description:      string | null
  phone:            string | null
  email:            string
  website:          string | null
  yearsInBusiness:  number | null
  teamSize:         number | null
  emergencyServices: boolean

  // Services
  tradeSpecialties:      string[]
  serviceCategories:     string[]
  commercialFocus:       boolean
  residentialFocus:      boolean
  preferredProjectSizes: string[]

  // Coverage
  serviceRadius: number | null
  serviceStates: string[]
  serviceCities: string[]

  // Address (read-only)
  address: string | null
  city:    string | null
  state:   string | null
  zip:     string | null

  // Credentials
  licenseNumber:       string | null
  allLicenses:         string[]
  insuranceCarrier:    string | null
  insuranceExpiration: string | null

  // Status
  isVerified:         boolean
  acceptingBids:      boolean
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  eligibility:        string
  licenseVerified:    boolean
  insuranceVerified:  boolean

  // Marketplace
  acceptingLeads:    boolean
  rating:            number
  reviewCount:       number
  projectsCompleted: number
}

export interface ProfileUpdateRequest {
  businessName:     string
  description?:     string
  phone?:           string
  email?:           string
  website?:         string
  yearsInBusiness?: number
  teamSize?:        number
  emergencyServices?: boolean

  tradeSpecialties:      string[]
  serviceCategories?:    string[]
  commercialFocus?:      boolean
  residentialFocus?:     boolean
  preferredProjectSizes?: string[]

  serviceRadius?: number
  serviceStates?: string[]
  serviceCities?: string[]

  licenseNumber?:       string
  allLicenses?:         string[]
  insuranceCarrier?:    string
  insuranceExpiration?: string

  acceptingLeads?: boolean
}

export interface ProfileUpdateResponse {
  success:                boolean
  requiresReverification: boolean
  profile:                ContractorProfile
  message:                string
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getMyProfile(): Promise<ContractorProfile> {
  return request<ContractorProfile>('/marketplace/contractors/profile')
}

export async function updateMyProfile(
  body: ProfileUpdateRequest,
): Promise<ProfileUpdateResponse> {
  return request<ProfileUpdateResponse>('/marketplace/contractors/profile', {
    method: 'PATCH',
    body:   JSON.stringify(body),
  })
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class ProfileApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: Array<{ message: string; path: (string | number)[] }>,
  ) {
    super(message)
    this.name = 'ProfileApiError'
  }

  get isUnauthenticated() { return this.statusCode === 401 }
  get isNotFound()        { return this.statusCode === 404 }
  get isValidation()      { return this.statusCode === 400 }
}
