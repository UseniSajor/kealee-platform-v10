/**
 * Presentation-only branding used by email, report, and document renderers.
 *
 * Sender addresses are configuration values only. API keys, provider tokens,
 * and other delivery credentials must never be placed in this object.
 */
export interface TenantOutboundBrandingInput {
  companyName?: string | null
  productName?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  supportName?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
  supportUrl?: string | null
  appUrl?: string | null
  privacyUrl?: string | null
  unsubscribeUrl?: string | null
  emailSenderName?: string | null
  emailFrom?: string | null
  emailReplyTo?: string | null
  reportHeader?: string | null
  reportFooter?: string | null
  legalDisclaimer?: string | null
  kealeeBrandingVisible?: boolean | null
}

export interface ResolvedTenantOutboundBranding {
  companyName: string
  productName: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  supportName: string | null
  supportEmail: string | null
  supportPhone: string | null
  supportUrl: string | null
  appUrl: string | null
  privacyUrl: string | null
  unsubscribeUrl: string | null
  emailSenderName: string | null
  emailFrom: string | null
  emailReplyTo: string | null
  reportHeader: string
  reportFooter: string | null
  legalDisclaimer: string | null
  kealeeBrandingVisible: boolean
  attributionText: string | null
}

export interface BrandedOutputMetadata {
  companyName: string
  productName: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  headerText: string
  footerText: string | null
  legalDisclaimer: string | null
  attributionText: string | null
}

const DEFAULT_COMPANY = 'Kealee'
const DEFAULT_PRODUCT = 'Kealee Platform'
const DEFAULT_PRIMARY = '#1e293b'
const DEFAULT_SECONDARY = '#475569'
const DEFAULT_ACCENT = '#2563eb'
const DEFAULT_APP_URL = 'https://app.kealee.com'
const DEFAULT_SUPPORT_EMAIL = 'support@kealee.com'
const DEFAULT_FROM = 'Kealee <noreply@kealee.com>'
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g
const MAILBOX = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/
const NAMED_MAILBOX = /^([^<>]+)\s*<([^<>]+)>$/
const HEX_COLOR = /^#[0-9a-f]{6}$/i

function cleanText(value: string | null | undefined, maximumLength = 500): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(CONTROL_CHARACTERS, ' ').trim().slice(0, maximumLength)
  return cleaned || null
}

export function sanitizeBrandColor(value: string | null | undefined, fallback: string): string {
  const candidate = cleanText(value, 7)
  return candidate && HEX_COLOR.test(candidate) ? candidate.toLowerCase() : fallback
}

export function sanitizeBrandUrl(value: string | null | undefined): string | null {
  const candidate = cleanText(value, 2_048)
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export function sanitizeEmailAddress(value: string | null | undefined): string | null {
  const candidate = cleanText(value, 320)
  if (!candidate) return null
  const match = candidate.match(NAMED_MAILBOX)
  if (match) {
    const name = cleanText(match[1], 100)
    const address = match[2]?.trim()
    return name && address && MAILBOX.test(address) ? `${name} <${address}>` : null
  }
  return MAILBOX.test(candidate) ? candidate : null
}

/** Escape untrusted text before inserting it into an HTML string. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function resolveTenantOutboundBranding(
  input: TenantOutboundBrandingInput | null | undefined,
): ResolvedTenantOutboundBranding {
  const showKealee = input?.kealeeBrandingVisible !== false
  const companyName = cleanText(input?.companyName, 120)
    ?? cleanText(input?.productName, 120)
    ?? (showKealee ? DEFAULT_COMPANY : 'Service Portal')
  const productName = cleanText(input?.productName, 120)
    ?? (showKealee ? DEFAULT_PRODUCT : companyName)

  return {
    companyName,
    productName,
    logoUrl: sanitizeBrandUrl(input?.logoUrl),
    primaryColor: sanitizeBrandColor(input?.primaryColor, DEFAULT_PRIMARY),
    secondaryColor: sanitizeBrandColor(input?.secondaryColor, DEFAULT_SECONDARY),
    accentColor: sanitizeBrandColor(input?.accentColor, DEFAULT_ACCENT),
    supportName: cleanText(input?.supportName, 120) ?? (showKealee ? 'Kealee Support' : null),
    supportEmail: sanitizeEmailAddress(input?.supportEmail) ?? (showKealee ? DEFAULT_SUPPORT_EMAIL : null),
    supportPhone: cleanText(input?.supportPhone, 50),
    supportUrl: sanitizeBrandUrl(input?.supportUrl),
    appUrl: sanitizeBrandUrl(input?.appUrl) ?? (showKealee ? DEFAULT_APP_URL : null),
    privacyUrl: sanitizeBrandUrl(input?.privacyUrl)
      ?? (showKealee ? `${DEFAULT_APP_URL}/privacy` : null),
    unsubscribeUrl: sanitizeBrandUrl(input?.unsubscribeUrl)
      ?? (showKealee ? `${DEFAULT_APP_URL}/unsubscribe` : null),
    emailSenderName: cleanText(input?.emailSenderName, 100) ?? companyName,
    emailFrom: sanitizeEmailAddress(input?.emailFrom) ?? (showKealee ? DEFAULT_FROM : null),
    emailReplyTo: sanitizeEmailAddress(input?.emailReplyTo)
      ?? sanitizeEmailAddress(input?.supportEmail)
      ?? (showKealee ? DEFAULT_SUPPORT_EMAIL : null),
    reportHeader: cleanText(input?.reportHeader, 300) ?? companyName,
    reportFooter: cleanText(input?.reportFooter, 500),
    legalDisclaimer: cleanText(input?.legalDisclaimer, 2_000),
    kealeeBrandingVisible: showKealee,
    attributionText: showKealee ? 'Powered by Kealee' : null,
  }
}

/** Shared, renderer-neutral metadata for PDFs, reports, and generated documents. */
export function createBrandedOutputMetadata(
  input?: TenantOutboundBrandingInput | null,
): BrandedOutputMetadata {
  const brand = resolveTenantOutboundBranding(input)
  return {
    companyName: brand.companyName,
    productName: brand.productName,
    logoUrl: brand.logoUrl,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
    headerText: brand.reportHeader,
    footerText: brand.reportFooter,
    legalDisclaimer: brand.legalDisclaimer,
    attributionText: brand.attributionText,
  }
}
