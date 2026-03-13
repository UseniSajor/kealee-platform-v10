/**
 * contractor-registration.ts
 *
 * API client for POST /marketplace/contractors/register
 * Public endpoint — no auth token required.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface ContractorRegistrationRequest {
  // Account
  email: string
  password: string
  firstName: string
  lastName: string

  // Business
  companyName: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  website?: string
  description?: string

  // Professional
  tradeSpecialties: string[]
  serviceAreas: string[]
  licenseNumbers: string[]
  insuranceCarrier?: string
  insuranceExpiration?: string
  professionalType?: 'CONTRACTOR' | 'DESIGN_BUILD'
}

export interface ContractorRegistrationResponse {
  success: true
  userId: string
  profileId: string
  session: {
    access_token: string
    refresh_token: string
    expires_at?: number
  }
  nextStep: 'pending-verification'
  message: string
}

export interface ContractorRegistrationError {
  error: string
  details?: Array<{ message: string; path: (string | number)[] }>
}

export async function registerContractor(
  body: ContractorRegistrationRequest,
): Promise<ContractorRegistrationResponse> {
  const res = await fetch(`${API_BASE_URL}/marketplace/contractors/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      professionalType: body.professionalType ?? 'CONTRACTOR',
    }),
  })

  const json = await res.json()

  if (!res.ok) {
    const err = json as ContractorRegistrationError
    throw new RegistrationError(err.error || 'Registration failed', res.status, err.details)
  }

  return json as ContractorRegistrationResponse
}

export class RegistrationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: ContractorRegistrationError['details'],
  ) {
    super(message)
    this.name = 'RegistrationError'
  }

  get isEmailConflict() {
    return this.statusCode === 409
  }

  get isValidationError() {
    return this.statusCode === 400
  }
}
