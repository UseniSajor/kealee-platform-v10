/** Pure de-identification helpers shared by the exporter and its tests. */
const DROP_KEY = /^(address|projectAddress|streetAddress|email|phone|contactPhone|clientName|name|firstName|lastName|intakeLeadId|userId|ownerId|stripe.*|payment.*)$/i
const STREET = /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?[A-Z][A-Za-z']+(?:\s[A-Z][A-Za-z']+)*\s(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Blvd|Way|Pl|Place|Ter|Terrace|Cir|Pkwy|Hwy)\b\.?/g
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE = /(?<!\d)(?:\+?1[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]\d{3}[ .-]\d{4}(?!\d)/g

export function scrub<T>(value: T): T {
  if (typeof value === 'string') return value.replace(EMAIL, '[email]').replace(PHONE, '[phone]').replace(STREET, '[address]') as T
  if (Array.isArray(value)) return value.map(scrub) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !DROP_KEY.test(key))
      .map(([key, nested]) => [key, scrub(nested)])) as T
  }
  return value
}
