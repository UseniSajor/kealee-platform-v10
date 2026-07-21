export interface NormalizedContactIdentity {
  email: string | null
  phone: string | null
  domain: string | null
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`
  return null
}

export function normalizeDomain(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim().toLowerCase()
  if (!raw) return null
  try {
    const hostname = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname
      .replace(/^www\./, '')
    return hostname.includes('.') ? hostname : null
  } catch {
    return null
  }
}

export function normalizeContactIdentity(input: {
  email?: unknown
  phone?: unknown
  companyDomain?: unknown
}): NormalizedContactIdentity {
  const email = normalizeEmail(input.email)
  return {
    email,
    phone: normalizePhone(input.phone),
    domain: normalizeDomain(input.companyDomain ?? email?.split('@')[1]),
  }
}

export function contactIdentityKey(organizationId: string, identity: NormalizedContactIdentity): string {
  const discriminator = identity.email ?? identity.phone
  if (!discriminator) throw new Error('A normalized email or phone is required')
  return `${organizationId}:${discriminator}`
}

