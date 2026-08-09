import {
  BLOCKED_BUCKET_PREFIXES,
  BLOCKED_FIELD_NAMES,
  EMAIL_PATTERN,
  PARCEL_ID_PATTERN,
  PERMIT_NUMBER_PATTERN,
  PHONE_PATTERN,
  STREET_ADDRESS_PATTERN,
  TAX_ID_PATTERN,
} from './pii-patterns'

const REDACTED = '[REDACTED]'

function redactString(value: string): string {
  return value
    .replace(EMAIL_PATTERN, REDACTED)
    .replace(PHONE_PATTERN, REDACTED)
    .replace(STREET_ADDRESS_PATTERN, REDACTED)
    .replace(PERMIT_NUMBER_PATTERN, REDACTED)
    .replace(PARCEL_ID_PATTERN, REDACTED)
    .replace(TAX_ID_PATTERN, REDACTED)
}

function isBlockedStorageUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return BLOCKED_BUCKET_PREFIXES.some((prefix) => lower.includes(prefix))
}

export function sanitizeMarketingExport<T>(data: T, depth = 0): T {
  if (depth > 12) return data
  if (data === null || data === undefined) return data

  if (typeof data === 'string') {
    if (isBlockedStorageUrl(data)) return REDACTED as T
    return redactString(data) as T
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeMarketingExport(item, depth + 1)) as T
  }

  if (typeof data === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (BLOCKED_FIELD_NAMES.has(key)) continue
      if (key === 'metadata' && depth === 0) {
        out[key] = {}
        continue
      }
      out[key] = sanitizeMarketingExport(value, depth + 1)
    }
    return out as T
  }

  return data
}

export function assertPublicSafeAsset(asset: {
  public_safe?: boolean
  contains_customer_data?: boolean
  approval_status?: string
}): void {
  if (asset.contains_customer_data) {
    throw new Error('Asset contains customer data and cannot be exported')
  }
  if (!asset.public_safe && asset.approval_status !== 'approved' && asset.approval_status !== 'published') {
    throw new Error('Asset is not approved for public export')
  }
}
